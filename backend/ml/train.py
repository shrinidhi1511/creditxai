import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")
TRAIN_DATA_PATH = os.path.join(os.path.dirname(__file__), "train_data.pkl")

FEATURE_NAMES = [
    "age", "employment_years", "annual_income", "credit_score",
    "debt_to_income", "num_credit_lines", "loan_amount", "loan_term", "loan_purpose"
]

PURPOSE_MAP = {"personal": 0, "home": 1, "auto": 2, "business": 3, "education": 4}


def generate_synthetic_data(n=10000, seed=42):
    rng = np.random.default_rng(seed)

    age = rng.integers(18, 71, n).astype(float)
    employment_years = rng.uniform(0, 40, n)
    annual_income = rng.uniform(20000, 200000, n)
    credit_score = rng.integers(300, 851, n).astype(float)
    debt_to_income = rng.uniform(0.1, 0.9, n)
    num_credit_lines = rng.integers(1, 21, n).astype(float)
    loan_amount = rng.uniform(1000, 50000, n)
    loan_term = rng.integers(6, 61, n).astype(float)
    loan_purpose = rng.integers(0, 5, n).astype(float)

    # Label logic
    approved = (
        (credit_score > 650) &
        (debt_to_income < 0.4) &
        (annual_income > 40000)
    ).astype(int)

    # Add noise: flip ~10% of labels
    noise_mask = rng.random(n) < 0.10
    approved[noise_mask] = 1 - approved[noise_mask]

    df = pd.DataFrame({
        "age": age,
        "employment_years": employment_years,
        "annual_income": annual_income,
        "credit_score": credit_score,
        "debt_to_income": debt_to_income,
        "num_credit_lines": num_credit_lines,
        "loan_amount": loan_amount,
        "loan_term": loan_term,
        "loan_purpose": loan_purpose,
        "label": approved,
    })
    return df


def train_model():
    print("[ML] Generating synthetic training data...")
    df = generate_synthetic_data(10000)

    X = df[FEATURE_NAMES].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    print("[ML] Training RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    clf.fit(X_train_scaled, y_train)

    acc = clf.score(scaler.transform(X_test), y_test)
    print(f"[ML] Test accuracy: {acc:.4f}")

    joblib.dump(clf, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(X_train_scaled, TRAIN_DATA_PATH)
    print(f"[ML] Model saved to {MODEL_PATH}")
    return clf, scaler, X_train_scaled


def load_or_train():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH) and os.path.exists(TRAIN_DATA_PATH):
        print("[ML] Loading existing model...")
        clf = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        X_train = joblib.load(TRAIN_DATA_PATH)
        return clf, scaler, X_train
    return train_model()


if __name__ == "__main__":
    train_model()
