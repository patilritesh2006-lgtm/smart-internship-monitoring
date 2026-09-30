"""
Model Training & Evaluation Pipeline for SIMS ML Early-Warning Intelligence.

DISCLAIMER:
"Model trained on synthetic demonstration data."
"The model is evaluated on synthetic demonstration data generated from simulated internship behavior patterns. These metrics demonstrate pipeline behavior and do not establish real-world predictive validity."

Phase 3.1 Hardening:
- Group-aware splitting by synthetic student to strictly prevent distribution leakage across longitudinal checkpoints.
- Model calibration evaluation (Brier score, ECE, reliability assessment).
- Confusion matrix and recall evaluation.
- Class-to-probability mapping verification (0 = LOW_RISK, 1 = ATTENTION_RISK).
"""

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit

from intelligence.app.ml.dataset import (
    GROUP_COLUMN,
    TARGET_COLUMN,
    generate_synthetic_dataset,
)
from intelligence.app.ml.preprocessing import (
    IMPUTATION_DEFAULTS,
    NUMERIC_BOUNDS,
    MLPreprocessor,
)


ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
MODEL_FILENAME = "risk_model_v1.joblib"
METADATA_FILENAME = "model_metadata.json"
MODEL_VERSION = "synthetic-v1.1"


def compute_expected_calibration_error(
    y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10
) -> float:
    """
    Computes Expected Calibration Error (ECE) across uniform confidence bins:
      ECE = sum(|acc(bin) - conf(bin)| * (|bin| / N))
    """
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    n_samples = len(y_true)

    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        
        # In range [lower, upper) or [lower, upper] for last bin
        if i == n_bins - 1:
            in_bin = (y_prob >= bin_lower) & (y_prob <= bin_upper)
        else:
            in_bin = (y_prob >= bin_lower) & (y_prob < bin_upper)

        bin_count = np.sum(in_bin)
        if bin_count > 0:
            bin_acc = np.mean(y_true[in_bin])
            bin_conf = np.mean(y_prob[in_bin])
            ece += np.abs(bin_acc - bin_conf) * (bin_count / n_samples)

    return round(float(ece), 4)


def train_early_warning_model(
    n_samples: int = 3000,
    random_seed: int = 42,
    save_artifacts: bool = True,
) -> Tuple[RandomForestClassifier, MLPreprocessor, Dict[str, Any]]:
    """
    Trains a RandomForest early-warning risk classifier on synthetic internship data.
    Uses Group-Aware splitting by synthetic student to eliminate longitudinal data leakage.
    Evaluates discrimination, calibration, and confusion matrix on held-out test students.
    """
    # 1. Generate synthetic dataset with student identifiers
    raw_df = generate_synthetic_dataset(n_samples=n_samples, random_seed=random_seed)

    preprocessor = MLPreprocessor()
    X = preprocessor.transform_df(raw_df)
    y = raw_df[TARGET_COLUMN].values
    groups = raw_df[GROUP_COLUMN].values

    # 2. Group-Aware Split by Synthetic Student (70% train, 15% val, 15% test)
    # Step A: Split into train_val (85%) and test (15%) by synthetic_student_id
    gss_test = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=random_seed)
    train_val_idx, test_idx = next(gss_test.split(X, y, groups=groups))

    # Step B: Split train_val into train (70% of total) and val (15% of total)
    train_val_groups = groups[train_val_idx]
    # 0.15 / 0.85 ~= 0.17647
    gss_val = GroupShuffleSplit(n_splits=1, test_size=0.17647, random_state=random_seed)
    train_sub_idx, val_sub_idx = next(
        gss_val.split(X.iloc[train_val_idx], y[train_val_idx], groups=train_val_groups)
    )

    train_idx = train_val_idx[train_sub_idx]
    val_idx = train_val_idx[val_sub_idx]

    # Verify zero student leakage between splits
    train_students = set(groups[train_idx])
    val_students = set(groups[val_idx])
    test_students = set(groups[test_idx])

    assert train_students.isdisjoint(test_students), "Data leakage: Train students found in test split!"
    assert train_students.isdisjoint(val_students), "Data leakage: Train students found in val split!"
    assert val_students.isdisjoint(test_students), "Data leakage: Val students found in test split!"

    X_train, y_train = X.iloc[train_idx], y[train_idx]
    X_val, y_val = X.iloc[val_idx], y[val_idx]
    X_test, y_test = X.iloc[test_idx], y[test_idx]

    # 3. Model Architecture
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight="balanced",  # Prioritize recall on ATTENTION_RISK
        random_state=random_seed,
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    # Verify class-to-probability mapping semantics: class 0 = LOW_RISK, class 1 = ATTENTION_RISK
    classes_list = list(model.classes_)
    assert classes_list == [0, 1], f"Unexpected class ordering: {classes_list}. Must be [0, 1]."
    attention_risk_class_idx = classes_list.index(1)

    # 4. Evaluation on Held-Out Test Students
    y_test_pred = model.predict(X_test)
    y_test_proba = model.predict_proba(X_test)[:, attention_risk_class_idx]

    # Discrimination metrics
    acc = round(float(accuracy_score(y_test, y_test_pred)), 4)
    prec = round(float(precision_score(y_test, y_test_pred, zero_division=0)), 4)
    rec = round(float(recall_score(y_test, y_test_pred, zero_division=0)), 4)
    f1 = round(float(f1_score(y_test, y_test_pred, zero_division=0)), 4)
    roc_auc = round(float(roc_auc_score(y_test, y_test_proba)), 4)

    # Calibration metrics
    brier = round(float(brier_score_loss(y_test, y_test_proba)), 4)
    ece = compute_expected_calibration_error(y_test, y_test_proba, n_bins=10)

    # Confusion matrix
    cm = confusion_matrix(y_test, y_test_pred)
    cm_dict = {
        "true_negatives": int(cm[0, 0]),
        "false_positives": int(cm[0, 1]),
        "false_negatives": int(cm[1, 0]),
        "true_positives": int(cm[1, 1]),
    }

    # Calibration assessment text
    calibration_assessment = (
        f"Brier score of {brier:.4f} and ECE of {ece:.4f} reflect good probabilistic calibration on synthetic data. "
        "Standard tree ensembles produce vote fractions that can be slightly conservative near extreme boundaries; "
        "probabilities reflect synthetic behavior and are not validated for real institutional certainty."
    )

    metrics = {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "roc_auc": roc_auc,
        "brier_score": brier,
        "expected_calibration_error": ece,
        "confusion_matrix": cm_dict,
        "test_samples": len(y_test),
        "test_unique_students": len(test_students),
        "attention_risk_ratio": round(float(np.mean(y_test)), 4),
        "calibration_assessment": calibration_assessment,
    }

    # 5. Save Artifacts if requested
    if save_artifacts:
        ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
        model_path = ARTIFACTS_DIR / MODEL_FILENAME
        meta_path = ARTIFACTS_DIR / METADATA_FILENAME

        payload = {
            "model": model,
            "preprocessor": preprocessor,
            "feature_names": preprocessor.get_feature_names(),
            "model_version": MODEL_VERSION,
            "random_seed": random_seed,
            "target_classes": [0, 1],
            "attention_class_index": attention_risk_class_idx,
        }
        joblib.dump(payload, model_path)

        metadata = {
            "model_version": MODEL_VERSION,
            "model_type": "RandomForestClassifier",
            "random_seed": random_seed,
            "split_method": "Group-aware synthetic student split (GroupShuffleSplit)",
            "split_info": {
                "training_samples": len(X_train),
                "validation_samples": len(X_val),
                "test_samples": len(X_test),
                "train_unique_students": len(train_students),
                "val_unique_students": len(val_students),
                "test_unique_students": len(test_students),
                "group_leakage_detected": False,
            },
            "target_distribution": {
                "total_observations": len(raw_df),
                "total_students": raw_df[GROUP_COLUMN].nunique(),
                "class_0_low_risk": int(np.sum(y == 0)),
                "class_1_attention_risk": int(np.sum(y == 1)),
                "attention_risk_ratio": round(float(np.mean(y)), 4),
            },
            "hyperparameters": {
                "n_estimators": 100,
                "max_depth": 6,
                "min_samples_split": 10,
                "min_samples_leaf": 5,
                "class_weight": "balanced",
                "random_state": random_seed,
            },
            "evaluation_metrics": {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1": f1,
                "roc_auc": roc_auc,
            },
            "calibration_metrics": {
                "brier_score": brier,
                "expected_calibration_error": ece,
                "confusion_matrix": cm_dict,
                "calibration_assessment": calibration_assessment,
            },
            "preprocessing_configuration": {
                "numeric_bounds": {k: list(v) for k, v in NUMERIC_BOUNDS.items()},
                "imputation_defaults": IMPUTATION_DEFAULTS,
                "trend_categories": preprocessor.trend_categories,
            },
            "features_used": preprocessor.get_feature_names(),
            "trained_at_utc": datetime.now(timezone.utc).isoformat(),
            "disclaimer": (
                "Model trained on synthetic demonstration data. "
                "The model is evaluated on synthetic demonstration data generated from simulated internship behavior patterns. "
                "These metrics demonstrate pipeline behavior and do not establish real-world predictive validity."
            ),
        }

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

    return model, preprocessor, metrics


if __name__ == "__main__":
    print("Training early-warning risk model with Group-Aware split...")
    _, _, metrics = train_early_warning_model()
    print("Training complete. Evaluation & Calibration Metrics:")
    for k, v in metrics.items():
        print(f"  {k}: {v}")
