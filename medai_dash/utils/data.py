"""Synthetic pharmacovigilance data — Python port of the TypeScript backend.

Generates a deterministic 10×10 grid of drug × ADR signals with PRR/ROR/IC/EBGM
metrics matching the React app's API server, so the Dash UI shows identical
numbers.
"""

from __future__ import annotations

import math
from functools import lru_cache

import numpy as np
import pandas as pd

DRUGS = [
    "Atorvastatin", "Metformin", "Amiodarone", "Warfarin", "Ibuprofen",
    "Clopidogrel", "Lisinopril", "Omeprazole", "Metoprolol", "Amlodipine",
]

ADRS = [
    "Hepatotoxicity", "Rhabdomyolysis", "QT Prolongation", "GI Bleeding",
    "Renal Failure", "Thrombocytopenia", "Anaphylaxis", "Stevens-Johnson",
    "Hyponatremia", "Agranulocytosis",
]

STATUSES = ["confirmed", "potential", "under_review", "closed"]


def _seeded(seed: int) -> float:
    """Mirror the JS `Math.sin(seed) * 10000` seeded PRNG for parity."""
    x = math.sin(seed) * 10000.0
    return x - math.floor(x)


@lru_cache(maxsize=1)
def get_signals() -> pd.DataFrame:
    """Generate the full 100-row drug × ADR signal table."""
    rows: list[dict] = []
    sid = 1
    for drug in DRUGS:
        for adr in ADRS:
            s  = _seeded(sid * 17 + 3)
            s2 = _seeded(sid * 31 + 7)
            s3 = _seeded(sid * 13 + 11)
            s4 = _seeded(sid * 7 + 5)

            n_cases = int(s * 180) + 10
            ror = round(0.8 + s2 * 8, 2)
            prr = round(0.7 + s3 * 7, 2)
            ic  = round(-1.5 + s * 5, 2)
            ebgm = round(0.5 + s2 * 6, 2)
            p_value = round(s4 * 0.2, 4)

            priority = "high" if (ror > 4 and n_cases > 50) else "medium" if ror > 2 else "low"
            status = STATUSES[int(s3 * 4)]

            rows.append({
                "id": sid,
                "drug": drug,
                "adr": adr,
                "prr": prr,
                "prr_lower": round(prr * 0.78, 2),
                "prr_upper": round(prr * 1.28, 2),
                "ror": ror,
                "ror_lower": round(ror * 0.75, 2),
                "ror_upper": round(ror * 1.35, 2),
                "ic": ic,
                "ic025": round(ic - 0.8, 2),
                "ebgm": ebgm,
                "eb05": round(ebgm * 0.7, 2),
                "n_cases": n_cases,
                "p_value": p_value,
                "priority": priority,
                "status": status,
            })
            sid += 1
    return pd.DataFrame(rows)


def get_volcano_data() -> pd.DataFrame:
    """Return signals with log2(ROR) and -log10(p-value) for the volcano plot."""
    df = get_signals().copy()
    df["log_ror"] = np.log2(df["ror"].clip(lower=0.001))
    df["neg_log_p"] = -np.log10(df["p_value"].clip(lower=0.0001) + 0.0001)
    df["significant"] = (df["ror"] > 2) & (df["p_value"] < 0.05)
    return df


def get_heatmap() -> tuple[list[str], list[str], np.ndarray]:
    """Return (drugs, adrs, ROR matrix) for the disproportionality heatmap."""
    df = get_signals()
    pivot = df.pivot(index="drug", columns="adr", values="ror").reindex(
        index=DRUGS, columns=ADRS,
    )
    return DRUGS, ADRS, pivot.values


def get_summary_kpis() -> dict:
    """High-level KPIs shown on the home page."""
    df = get_signals()
    return {
        "total_signals": int(df["n_cases"].sum()),
        "high_priority": int((df["priority"] == "high").sum()),
        "drugs_monitored": int(df["drug"].nunique()),
        "adverse_events": int(df["adr"].nunique()),
        "model_auc": 0.931,
        "reports_analyzed": 124_872,
        "new_signals_month": 12,
        "detection_rate": 0.867,
    }


def get_temporal_trend() -> pd.DataFrame:
    """Quarterly reporting trend (2021Q1 → 2024Q4) per top-3 drug."""
    top_drugs = DRUGS[:3]
    quarters = pd.period_range("2021Q1", "2024Q4", freq="Q").astype(str)
    rows = []
    for di, drug in enumerate(top_drugs):
        for qi, q in enumerate(quarters):
            s = _seeded(di * 7 + qi * 3 + 1)
            base = 40 + di * 15
            seasonal = 10 * math.sin(qi / 2.0)
            value = int(base + seasonal + s * 25)
            rows.append({"quarter": q, "drug": drug, "reports": value})
    return pd.DataFrame(rows)


# ── ML explainability synthetic data ──────────────────────────────────────────

def get_feature_importance() -> pd.DataFrame:
    features = [
        ("Age", 0.24), ("Dose (mg/day)", 0.19), ("Duration of exposure", 0.15),
        ("Concomitant medications", 0.12), ("Sex", 0.09), ("Renal function (eGFR)", 0.08),
        ("Hepatic function (ALT)", 0.06), ("Body weight", 0.04),
        ("Smoking status", 0.02), ("Alcohol intake", 0.01),
    ]
    return pd.DataFrame(features, columns=["feature", "importance"])


def get_roc_curve() -> pd.DataFrame:
    """Idealised ROC curve hitting AUC ≈ 0.93."""
    fpr = np.linspace(0, 1, 100)
    tpr = np.power(fpr, 0.18)
    return pd.DataFrame({"fpr": fpr, "tpr": tpr})


def get_confusion_matrix() -> np.ndarray:
    return np.array([[842, 58], [49, 251]])
