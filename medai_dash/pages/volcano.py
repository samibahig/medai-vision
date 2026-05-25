"""Volcano plot page — drug–ADR association significance vs. effect size."""

from __future__ import annotations

import dash
import plotly.graph_objects as go
from dash import dcc, html

from utils.data import get_volcano_data

dash.register_page(__name__, path="/volcano", name="Volcano Plot",
                   title="MedAI Vision — Volcano Plot")

COLOR_NON_SIG     = "#3b82f6"  # blue
COLOR_SIGNIFICANT = "#dc2626"  # red
COLOR_HIGH        = "#f97316"  # orange


def _hover(row) -> str:
    return (
        f"<b>{row.drug} → {row.adr}</b><br>"
        f"ROR: {row.ror:.2f}<br>"
        f"p-value: {row.p_value:.2e}<br>"
        f"Cases: {row.n_cases}<br>"
        f"Priority: {row.priority}"
    )


def _volcano_figure() -> go.Figure:
    df = get_volcano_data()

    groups = [
        ("non-significatif",      df[(df["priority"] != "high") & (~df["significant"])], COLOR_NON_SIG),
        ("Significatif (p<0.05)", df[(df["priority"] != "high") & (df["significant"])],  COLOR_SIGNIFICANT),
        ("Priorité haute",        df[df["priority"] == "high"],                          COLOR_HIGH),
    ]

    fig = go.Figure()
    for name, sub, color in groups:
        if sub.empty:
            continue
        fig.add_scatter(
            x=sub["log_ror"], y=sub["neg_log_p"],
            mode="markers", name=name,
            marker=dict(size=10, color=color, opacity=0.78,
                        line=dict(width=0.5, color="white")),
            text=[_hover(r) for r in sub.itertuples()],
            hoverinfo="text",
        )

    # Threshold lines
    fig.add_vline(x=1.0,    line=dict(dash="dash", color="#71717a", width=1),
                  annotation_text="ROR = 2", annotation_position="top right")
    fig.add_hline(y=1.301,  line=dict(dash="dash", color="#71717a", width=1),
                  annotation_text="p = 0.05", annotation_position="top left")

    fig.update_layout(
        title="Volcano Plot — détection de signaux médicament × effet indésirable",
        xaxis=dict(
            title="<b>log₂(ROR)</b> — Force & direction de l'association"
                  "<br><sub>Valeurs positives = médicament plus associé à l'effet indésirable</sub>",
            zeroline=True, zerolinecolor="#e5e5e5",
        ),
        yaxis=dict(
            title="<b>−log₁₀(p-value)</b> — Significativité statistique"
                  "<br><sub>Plus haut = plus de confiance que l'association n'est pas due au hasard</sub>",
        ),
        height=560,
        margin=dict(t=60, b=90, l=100, r=40),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        paper_bgcolor="white",
        plot_bgcolor="#fafafa",
    )
    return fig


def layout() -> html.Div:
    return html.Div(
        [
            html.H2("Volcano Plot"),
            html.P(
                "Chaque point représente un couple médicament–effet indésirable. "
                "Les points en haut à droite (ROR élevé + forte significativité) sont des "
                "signaux d'alerte potentiels. Les lignes en pointillés marquent les seuils "
                "classiques de la pharmacovigilance : ROR > 2 (axe X) et p < 0.05 (axe Y).",
                className="page-subtitle",
            ),
            dcc.Graph(figure=_volcano_figure()),
        ]
    )
