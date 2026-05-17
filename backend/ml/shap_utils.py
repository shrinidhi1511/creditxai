import shap
import numpy as np
from backend.ml.train import FEATURE_NAMES


def get_shap_values(model, scaler, X_train_scaled, input_features: list[float]) -> dict:
    """
    Compute SHAP values for a single prediction using TreeExplainer.
    Returns a dict of {feature_name: shap_value}.
    """
    X_input = np.array(input_features).reshape(1, -1)
    X_scaled = scaler.transform(X_input)

    explainer = shap.TreeExplainer(model, X_train_scaled[:500])  # use subset for speed
    shap_vals = explainer.shap_values(X_scaled)

    # shap_vals shape: (2, n_samples, n_features) for binary; pick class 1
    if isinstance(shap_vals, list):
        vals = shap_vals[1][0]
    else:
        vals = shap_vals[0]

    return {
    name: float(val[0] if hasattr(val, "__len__") else val)
    for name, val in zip(FEATURE_NAMES, vals)
}
