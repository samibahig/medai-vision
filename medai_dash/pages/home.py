"""Home / overview page — KPIs, priority distribution, top drugs by reported cases."""

from __future__ import annotations

import dash
import plotly.graph_objects as go
from dash import dcc, html

from utils.data import get_signals, get_summary_kpis

dash.register_page(__name__, path="/", name="Overview", title="MedAI Vision — Overview")

PRIORITY_COLORS = {"high": "#dc2626", "medium": "#f97316", "low": "#16a34a"}


def _kpi_card(label: str, value: str) -> html.Div:
    return html.Div(
        [
            html.Div(label, className="kpi-label"),
            html.Div(value, className="kpi-value"),
        ],
        className="kpi-card",
    )


def _priority_pie() -> go.Figure:
    df = get_signals()
    counts = df["priority"].value_counts().reindex(["high", "medium", "low"]).fillna(0)
    fig = go.Figure(
        go.Pie(
            labels=counts.index,
            values=counts.values,
            marker=dict(colors=[PRIORITY_COLORS[p] for p in counts.index]),
            hole=0.35,
            textinfo="label+percent",
        )
    )
    fig.update_layout(
        title="Répartition des signaux par priorité",
        margin=dict(t=50, b=20, l=20, r=20),
        height=380,
        paper_bgcolor="white",
    )
    return fig


def _top_drugs_bar() -> go.Figure:
    """Stacked bar of reported cases by drug, broken out by priority."""
    df = get_signals()
    agg = (
        df.groupby(["drug", "priority"])["n_cases"]
        .sum()
        .unstack(fill_value=0)
        .reindex(columns=["high", "medium", "low"], fill_value=0)
    )
    agg["total"] = agg.sum(axis=1)
    agg = agg.sort_values("total", ascending=True).tail(10)

    fig = go.Figure()
    for priority in ["high", "medium", "low"]:
        fig.add_bar(
            y=agg.index,
            x=agg[priority],
            name=f"Priorité {priority}",
            orientation="h",
            marker_color=PRIORITY_COLORS[priority],
        )
    fig.update_layout(
        title="Top 10 médicaments par cas rapportés (empilés par priorité)",
        barmode="stack",
        xaxis_title="Nombre de cas rapportés",
        yaxis_title="Médicament",
        height=420,
        margin=dict(t=60, b=50, l=110, r=30),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        paper_bgcolor="white",
        plot_bgcolor="#fafafa",
    )
    return fig


def layout() -> html.Div:
    k = get_summary_kpis()
    return html.Div(
        [
            html.H2("Vue d'ensemble"),
            html.P(
                "Indicateurs clés et répartition des signaux de pharmacovigilance.",
                className="page-subtitle",
            ),
            html.Div(
                [
                    _kpi_card("Total signaux (cas)", f"{k['total_signals']:,}".replace(",", " ")),
                    _kpi_card("Priorité haute", str(k["high_priority"])),
                    _kpi_card("Médicaments suivis", str(k["drugs_monitored"])),
                    _kpi_card("Effets indésirables", str(k["adverse_events"])),
                    _kpi_card("AUC du modèle", f"{k['model_auc']:.3f}"),
                    _kpi_card("Rapports analysés", f"{k['reports_analyzed']:,}".replace(",", " ")),
                    _kpi_card("Nouveaux signaux (mois)", str(k["new_signals_month"])),
                    _kpi_card("Taux de détection", f"{k['detection_rate'] * 100:.1f}%"),
                ],
                className="kpi-grid",
            ),
            html.Div(
                [
                    dcc.Graph(figure=_priority_pie()),
                    dcc.Graph(figure=_top_drugs_bar()),
                ],
                className="chart-grid",
            ),
        ]
    )
