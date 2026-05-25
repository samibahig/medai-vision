"""ML explainability page — feature importance, ROC curve, confusion matrix."""

from __future__ import annotations

import dash
import plotly.graph_objects as go
from dash import dcc, html

from utils.data import get_confusion_matrix, get_feature_importance, get_roc_curve

dash.register_page(__name__, path="/explainability", name="ML Explainability",
                   title="MedAI Vision — Explainability")


def _feature_importance_fig() -> go.Figure:
    df = get_feature_importance().sort_values("importance")
    fig = go.Figure(go.Bar(
        x=df["importance"], y=df["feature"], orientation="h",
        marker_color="#6366f1",
        text=[f"{v:.2f}" for v in df["importance"]], textposition="outside",
    ))
    fig.update_layout(
        title="Importance des features (XGBoost)",
        xaxis_title="Importance relative", yaxis_title="Variable clinique",
        height=440, margin=dict(t=60, b=50, l=180, r=60),
        paper_bgcolor="white", plot_bgcolor="#fafafa",
    )
    return fig


def _roc_fig() -> go.Figure:
    df = get_roc_curve()
    fig = go.Figure()
    fig.add_scatter(x=df["fpr"], y=df["tpr"], mode="lines",
                    name="Modèle (AUC = 0.93)",
                    line=dict(color="#dc2626", width=3))
    fig.add_scatter(x=[0, 1], y=[0, 1], mode="lines", name="Hasard (AUC = 0.50)",
                    line=dict(color="#9ca3af", dash="dash"))
    fig.update_layout(
        title="Courbe ROC — performance du classifieur",
        xaxis_title="Taux de faux positifs (1 − spécificité)",
        yaxis_title="Taux de vrais positifs (sensibilité)",
        height=440, margin=dict(t=60, b=50, l=70, r=40),
        legend=dict(yanchor="bottom", y=0.05, xanchor="right", x=0.95),
        paper_bgcolor="white", plot_bgcolor="#fafafa",
    )
    return fig


def _confusion_fig() -> go.Figure:
    cm = get_confusion_matrix()
    fig = go.Figure(go.Heatmap(
        z=cm,
        x=["Prédit : pas de signal", "Prédit : signal"],
        y=["Réel : pas de signal", "Réel : signal"],
        colorscale="Blues",
        text=cm, texttemplate="%{text}",
        showscale=False,
    ))
    fig.update_layout(
        title="Matrice de confusion (jeu de test)",
        height=380, margin=dict(t=60, b=80, l=140, r=40),
        paper_bgcolor="white",
    )
    return fig


def layout() -> html.Div:
    return html.Div(
        [
            html.H2("Explicabilité du modèle ML"),
            html.P(
                "Le classifieur XGBoost identifie les signaux de pharmacovigilance "
                "à partir de variables cliniques. Les visualisations ci-dessous expliquent "
                "comment il prend ses décisions et avec quelle performance.",
                className="page-subtitle",
            ),
            dcc.Graph(figure=_feature_importance_fig()),
            html.Div(
                [
                    dcc.Graph(figure=_roc_fig()),
                    dcc.Graph(figure=_confusion_fig()),
                ],
                className="chart-grid",
            ),
        ]
    )
