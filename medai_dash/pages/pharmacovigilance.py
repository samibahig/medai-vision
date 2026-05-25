"""Pharmacovigilance page — disproportionality heatmap + signals table."""

from __future__ import annotations

import dash
import plotly.graph_objects as go
from dash import dash_table, dcc, html

from utils.data import get_heatmap, get_signals

dash.register_page(
    __name__, path="/pharmacovigilance", name="Pharmacovigilance",
    title="MedAI Vision — Pharmacovigilance",
)


def _heatmap_figure() -> go.Figure:
    drugs, adrs, matrix = get_heatmap()
    fig = go.Figure(
        go.Heatmap(
            z=matrix,
            x=adrs,
            y=drugs,
            colorscale="RdBu_r",
            zmid=1.0,
            colorbar=dict(title="ROR"),
            hovertemplate="<b>%{y}</b> × <b>%{x}</b><br>ROR: %{z:.2f}<extra></extra>",
        )
    )
    fig.update_layout(
        title="Heatmap des Reporting Odds Ratios (ROR) — médicament × effet indésirable",
        xaxis_title="Effet indésirable (ADR)",
        yaxis_title="Médicament",
        height=520,
        margin=dict(t=60, b=80, l=120, r=40),
        paper_bgcolor="white",
    )
    fig.update_xaxes(tickangle=-30)
    return fig


def layout() -> html.Div:
    df = get_signals().copy()
    df = df.sort_values("ror", ascending=False)
    display_cols = ["drug", "adr", "prr", "ror", "ic", "ebgm", "n_cases", "p_value", "priority", "status"]

    return html.Div(
        [
            html.H2("Pharmacovigilance — détection de signaux"),
            html.P(
                "Mesures standards de disproportionnalité (PRR, ROR, IC, EBGM) calculées sur "
                "l'ensemble des couples médicament × effet indésirable.",
                className="page-subtitle",
            ),
            dcc.Graph(figure=_heatmap_figure()),
            html.H3("Table des signaux (triée par ROR décroissant)"),
            dash_table.DataTable(
                data=df[display_cols].to_dict("records"),
                columns=[{"name": c.upper(), "id": c} for c in display_cols],
                page_size=15,
                style_table={"overflowX": "auto"},
                style_cell={"padding": "8px", "fontFamily": "system-ui", "fontSize": 13},
                style_header={"backgroundColor": "#f3f4f6", "fontWeight": "bold"},
                style_data_conditional=[
                    {"if": {"filter_query": '{priority} = "high"'}, "backgroundColor": "#fef2f2"},
                    {"if": {"filter_query": '{priority} = "medium"'}, "backgroundColor": "#fff7ed"},
                ],
                filter_action="native",
                sort_action="native",
            ),
        ]
    )
