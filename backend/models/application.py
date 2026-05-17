from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.dialects.sqlite import TEXT
from datetime import datetime, timezone
import uuid
from backend.database.db import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(TEXT, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(TEXT, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), default="PENDING")  # PENDING / APPROVED / REJECTED

    # Applicant fields
    age = Column(Integer)
    employment_years = Column(Float)
    annual_income = Column(Float)
    credit_score = Column(Integer)
    debt_to_income = Column(Float)
    num_credit_lines = Column(Integer)
    loan_amount = Column(Float)
    loan_term = Column(Integer)
    loan_purpose = Column(String(20))

    # ML results
    decision = Column(String(20))
    approval_probability = Column(Float)
    risk_score = Column(Float)
    shap_values = Column(Text)   # JSON string
    lime_values = Column(Text)   # JSON string

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
