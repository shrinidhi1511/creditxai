import numpy as np
from lime.lime_tabular import LimeTabularExplainer
from backend.ml.train import FEATURE_NAMES


def get_lime_values(model, scaler, X_train_scaled, input_features: list[float]) -> list[dict]:
    """
    Compute LIME local explanation for a single prediction.
    Returns a list of {feature, condition, value} dicts.
    """
    def predict_fn(X):
        return model.predict_proba(X)

    explainer = LimeTabularExplainer(
        training_data=X_train_scaled,
        feature_names=FEATURE_NAMES,
        mode="classification",
        discretize_continuous=True,
        random_state=42,
    )

    X_input = np.array(input_features).reshape(1, -1)
    X_scaled = scaler.transform(X_input)[0]

    explanation = explainer.explain_instance(
        data_row=X_scaled,
        predict_fn=predict_fn,
        num_features=len(FEATURE_NAMES),
        top_labels=1,
    )

    label = list(explanation.available_labels())[0]
    exp_list = explanation.as_list(label=label)

    result = []
    for condition, value in exp_list:
        # Parse feature name from condition string
        feat_name = _parse_feature_name(condition, FEATURE_NAMES)
        result.append({
            "feature": feat_name,
            "condition": condition,
            "value": float(value),
        })
    return result


def _parse_feature_name(condition: str, feature_names: list[str]) -> str:
    """Extract the feature name from a LIME condition string."""
    for name in feature_names:
        if name in condition:
            return name
    return condition.split()[0]
