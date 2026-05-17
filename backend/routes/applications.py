import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user
from backend.database.db import get_db
from backend.models.application import Application
from backend.models.user import User

router = APIRouter(prefix="/api", tags=["applications"])


class ApplyRequest(BaseModel):
    age: int
    employment_years: float
    annual_income: float
    credit_score: int
    debt_to_income: float
    num_credit_lines: int
    loan_amount: float
    loan_term: int
    loan_purpose: str


@router.post("/apply")
async def apply_loan(
    body: ApplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from backend.ml.train import load_or_train, PURPOSE_MAP
    from backend.ml.shap_utils import get_shap_values
    from backend.ml.lime_utils import get_lime_values

    import numpy as np

    # Load ML artifacts
    model, scaler, X_train = load_or_train()

    # Encode loan purpose
    purpose_enc = PURPOSE_MAP.get(body.loan_purpose.lower(), 0)

    # Build feature vector
    features = [
        body.age,
        body.employment_years,
        body.annual_income,
        body.credit_score,
        body.debt_to_income,
        body.num_credit_lines,
        body.loan_amount,
        body.loan_term,
        purpose_enc,
    ]

    # Scale features
    X_scaled = scaler.transform(np.array(features).reshape(1, -1))

    # Prediction
    proba = model.predict_proba(X_scaled)[0]
    approval_prob = float(proba[1])

    decision = "APPROVED" if approval_prob >= 0.5 else "REJECTED"
    risk_score = round((1 - approval_prob) * 100, 2)

    # Explainability
    shap_vals = get_shap_values(model, scaler, X_train, features)
    lime_vals = get_lime_values(model, scaler, X_train, features)

    # Save application
    app = Application(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        status=decision,
        age=body.age,
        employment_years=body.employment_years,
        annual_income=body.annual_income,
        credit_score=body.credit_score,
        debt_to_income=body.debt_to_income,
        num_credit_lines=body.num_credit_lines,
        loan_amount=body.loan_amount,
        loan_term=body.loan_term,
        loan_purpose=body.loan_purpose,
        decision=decision,
        approval_probability=round(approval_prob * 100, 2),
        risk_score=risk_score,
        shap_values=json.dumps(shap_vals),
        lime_values=json.dumps(lime_vals),
    )

    db.add(app)
    await db.commit()
    await db.refresh(app)

    return {
        "application_id": app.id,
        "decision": decision,
        "probability": round(approval_prob * 100, 2),
        "risk_score": risk_score,
        "shap_values": shap_vals,
        "lime_values": lime_vals,
    }


@router.get("/application/{app_id}")
async def get_application(
    app_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Application).where(Application.id == app_id)
    )

    app = result.scalar_one_or_none()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return _serialize_app(app, current_user)


@router.get("/dashboard")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Application)
        .where(Application.user_id == current_user.id)
        .order_by(Application.created_at.desc())
    )

    apps = result.scalars().all()

    total = len(apps)
    approved = sum(1 for a in apps if a.status == "APPROVED")
    pending = sum(1 for a in apps if a.status == "PENDING")
    rejected = sum(1 for a in apps if a.status == "REJECTED")

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
        },
        "stats": {
            "total": total,
            "approved": approved,
            "pending": pending,
            "rejected": rejected,
        },
        "applications": [
            _serialize_app(a, current_user)
            for a in apps
        ],
    }


def _serialize_app(app: Application, user: User) -> dict:
    return {
        "id": app.id,
        "status": app.status,
        "decision": app.decision,
        "approval_probability": app.approval_probability,
        "risk_score": app.risk_score,
        "loan_amount": app.loan_amount,
        "loan_term": app.loan_term,
        "loan_purpose": app.loan_purpose,
        "age": app.age,
        "employment_years": app.employment_years,
        "annual_income": app.annual_income,
        "credit_score": app.credit_score,
        "debt_to_income": app.debt_to_income,
        "num_credit_lines": app.num_credit_lines,
        "created_at": app.created_at.isoformat() if app.created_at else None,
        "applicant_name": user.name,
        "applicant_email": user.email,
        "shap_values": json.loads(app.shap_values) if app.shap_values else {},
        "lime_values": json.loads(app.lime_values) if app.lime_values else [],
    }