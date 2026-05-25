"""MedAI Vision — Plotly Dash multi-page application.

Run locally:
    pip install -r requirements.txt
    python app.py

Deploy:
    Procfile uses gunicorn against `server` exposed below.
"""

from __future__ import annotations

import os

import dash
from dash import dcc, html

app = dash.Dash(
    __name__,
    use_pages=True,
    suppress_callback_exceptions=True,
    title="MedAI Vision",
    update_title=None,
)
server = app.server  # exposed for gunicorn / Plotly Cloud

# ── Layout ────────────────────────────────────────────────────────────────────

NAV_ITEMS = [
    ("Vue d'ensemble", "/"),
    ("Pharmacovigilance", "/pharmacovigilance"),
    ("Volcano Plot", "/volcano"),
    ("Explicabilité ML", "/explainability"),
]


def _nav() -> html.Nav:
    return html.Nav(
        [
            html.Div("MedAI Vision", className="brand"),
            html.Div(
                [
                    dcc.Link(label, href=path, className="nav-link")
                    for label, path in NAV_ITEMS
                ],
                className="nav-links",
            ),
        ],
        className="nav",
    )


app.layout = html.Div(
    [
        _nav(),
        html.Main(dash.page_container, className="page-container"),
        html.Footer(
            "MedAI Vision · démo pédagogique · données synthétiques · "
            "non destiné à un usage clinique",
            className="footer",
        ),
    ]
)

# ── Inline styles served via assets/style.css ─────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8050))
    app.run(host="0.0.0.0", port=port, debug=False)
