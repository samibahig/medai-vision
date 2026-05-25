# MedAI Vision — Dash edition

Python Dash port of the MedAI Vision pharmacovigilance dashboard, built for the
Plotly ecosystem (Dash, Plotly.py). The React + Vite version remains the
canonical app; this folder is a self-contained alternative.

## Pages

- **Vue d'ensemble** — KPIs + top 10 médicaments par cas rapportés (empilés par priorité)
- **Pharmacovigilance** — heatmap ROR + table interactive triable/filtrable
- **Volcano Plot** — axes annotés, seuils de significativité, légende couleurs
- **Explicabilité ML** — feature importance, ROC, matrice de confusion

## Run locally

```bash
cd medai_dash
pip install -r requirements.txt
python app.py
```

Open http://localhost:8050.

## Deploy

The `Procfile` exposes `app:server` via gunicorn. Compatible with:

- **Render** (free tier) — connect repo, set root to `medai_dash/`
- **Railway / Fly.io** — `Procfile` is auto-detected
- **HuggingFace Spaces (Docker SDK)** — wrap in a small Dockerfile
- **Dash Enterprise / Dash Cloud** — paid, but accepts this layout directly

> Note: Plotly does not currently offer a free hosting tier for Dash apps.
> Dash Enterprise is paid. The free options above are recommended.

## Architecture

```
medai_dash/
├── app.py              # Dash app + multi-page registration
├── pages/              # one file per page (dash.register_page)
├── utils/data.py       # synthetic ADR data generator (matches the API server)
├── assets/style.css    # shared styles
├── requirements.txt
└── Procfile
```

Data lives in `utils/data.py` — the same seeded RNG as the TypeScript backend,
so figures stay numerically identical across both stacks.
