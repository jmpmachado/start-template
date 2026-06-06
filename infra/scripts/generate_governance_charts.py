"""
generate_governance_charts.py
Generates governance dashboards for active Design Docs using Plotly.

Outputs:
  - governance_dashboard.png  — governance score + risk score per RFC
  - tech_debt_heatmap.png     — technical debt heatmap (RFC × dimension)
  - tradeoff_simulator.png    — architecture trade-off comparison

Usage: python generate_governance_charts.py
Dependencies: plotly, numpy (pip install plotly numpy kaleido)
"""

import plotly.io as pio
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import json
import numpy as np

# ─────────────────────────────────────────────────────────────
# DASHBOARD 1: Governance Score per Design Doc
# Replace sample RFCs and scores with project-specific values.
# ─────────────────────────────────────────────────────────────

docs = [
    "RFC-042\nJob Broker",
    "RFC-038\nAuth Service",
    "RFC-035\nData Pipeline",
    "RFC-031\nCluster v1",
    "RFC-029\nAPI Gateway",
    "RFC-025\nCache Layer",
    "RFC-019\nDB Migration",
]

# Scores per dimension (0-10): completeness, security, testability, rollback, observability, ownership
completeness  = [9, 8, 5, 7, 9, 4, 6]
security      = [8, 9, 4, 6, 8, 3, 5]
testability   = [9, 7, 6, 5, 7, 4, 5]
rollback      = [9, 8, 3, 6, 7, 2, 4]
observability = [8, 8, 5, 6, 8, 3, 5]
ownership     = [10, 9, 6, 8, 9, 5, 7]

dims = [completeness, security, testability, rollback, observability, ownership]
weights = [0.20, 0.25, 0.15, 0.20, 0.10, 0.10]

scores_total = []
for i in range(len(docs)):
    s = sum(dims[d][i] * weights[d] for d in range(len(dims)))
    scores_total.append(round(s, 1))

risk_score = [round((10 - s) * 10, 0) for s in scores_total]


def risk_color(r):
    """Return a hex colour string for a risk score: green < 20, yellow < 40, orange < 60, red ≥ 60."""
    if r < 20:  return "#4CAF50"
    elif r < 40: return "#FFC107"
    elif r < 60: return "#FF9800"
    else:        return "#F44336"


colors_risk = [risk_color(r) for r in risk_score]
labels_clean = [d.replace("\n", " ") for d in docs]

fig1 = make_subplots(
    rows=1, cols=2,
    subplot_titles=("Governance Score per RFC (0–10)", "Risk Score per RFC (0–100)"),
    horizontal_spacing=0.12
)

fig1.add_trace(go.Bar(
    x=labels_clean, y=scores_total,
    marker_color=["#4CAF50" if s >= 7 else "#FFC107" if s >= 5 else "#F44336" for s in scores_total],
    text=scores_total, textposition="outside",
    name="Governance"
), row=1, col=1)

fig1.add_trace(go.Bar(
    x=labels_clean, y=risk_score,
    marker_color=colors_risk,
    text=risk_score, textposition="outside",
    name="Risk"
), row=1, col=2)

fig1.update_layout(
    title={"text": "Governance Dashboard — Design Docs<br>"
           "<span style='font-size:16px;font-weight:normal;'>"
           "Weighted: Completeness×0.2 | Security×0.25 | Rollback×0.2 | Testability×0.15 | Observ.×0.1 | Owner×0.1"
           "</span>"},
    showlegend=False,
)
fig1.update_xaxes(tickangle=-30, tickfont=dict(size=10))
fig1.update_yaxes(range=[0, 11], row=1, col=1)
fig1.update_yaxes(range=[0, 110], row=1, col=2)

fig1.write_image("governance_dashboard.png")
with open("governance_dashboard.png.meta.json", "w") as f:
    json.dump({
        "caption": "Governance Dashboard — Governance Score and Risk Score per RFC",
        "description": "Two bar charts: weighted governance score (0–10) and derived risk score (0–100) for active RFCs."
    }, f)

# ─────────────────────────────────────────────────────────────
# DASHBOARD 2: Technical Debt Heatmap — RFC × Dimension
# ─────────────────────────────────────────────────────────────
rfcs_short = ["RFC-042", "RFC-038", "RFC-035", "RFC-031", "RFC-029", "RFC-025", "RFC-019"]
dims_labels = ["Completeness", "Security", "Testability", "Rollback", "Observ.", "Ownership"]

matrix = np.array([completeness, security, testability, rollback, observability, ownership])

fig2 = go.Figure(go.Heatmap(
    z=matrix,
    x=rfcs_short,
    y=dims_labels,
    colorscale=[[0, "#ef4444"], [0.4, "#f97316"], [0.6, "#f59e0b"], [0.8, "#84cc16"], [1.0, "#22c55e"]],
    zmin=0, zmax=10,
    text=matrix,
    texttemplate="%{text}",
    textfont=dict(size=15, color="white"),
    colorbar=dict(
        title="Score (0–10)",
        tickfont=dict(color="white"),
        titlefont=dict(color="white"),
    ),
))

fig2.update_layout(
    title=dict(
        text="Technical Debt Tracking by Dimension<br>"
             "<span style='font-size:15px;font-weight:normal;'>"
             "Red = high risk · Green = healthy | Heatmap RFC × Dimension"
             "</span>",
        font=dict(size=19),
    ),
    paper_bgcolor="#1e1e2e",
    plot_bgcolor="#1e1e2e",
    font=dict(color="white", size=13),
    xaxis=dict(tickfont=dict(color="white", size=13), side="bottom"),
    yaxis=dict(tickfont=dict(color="white", size=13)),
    height=480,
)

fig2.write_image("tech_debt_heatmap.png")
with open("tech_debt_heatmap.png.meta.json", "w") as f:
    json.dump({
        "caption": "Technical Debt Tracking — Heatmap RFC × Governance Dimension",
        "description": "Heatmap showing scores 0–10 for each RFC across 6 documentation quality dimensions."
    }, f)

# ─────────────────────────────────────────────────────────────
# DASHBOARD 3: Architecture Trade-off Simulator — Latency × Cost × Security
# ─────────────────────────────────────────────────────────────

arch_labels = ["Microservices\n+Kafka", "Modular\nMonolith", "Serverless\nEvent-driven", "BFF+\nGraphQL", "Hexagonal\n+gRPC"]
arch_clean = [a.replace("\n", " ") for a in arch_labels]

latency_p99_ms = [45, 12, 120, 35, 22]
cost_relative  = [100, 40, 65, 80, 70]
security_score = [7, 8, 6, 7, 9]


def lat_c(v):  # green ≤30ms, yellow ≤70ms, red >70ms
    """Return colour for latency score."""
    return "#22c55e" if v <= 30 else "#f59e0b" if v <= 70 else "#ef4444"

def cost_c(v):  # green ≤50, yellow ≤80, red >80
    """Return colour for cost score."""
    return "#22c55e" if v <= 50 else "#f59e0b" if v <= 80 else "#ef4444"

def sec_c(v):  # green ≥8, yellow ≥6, red <6
    """Return colour for security score."""
    return "#22c55e" if v >= 8 else "#f59e0b" if v >= 6 else "#ef4444"


fig3 = make_subplots(
    rows=1, cols=3,
    subplot_titles=["P99 Latency (ms)\nlower = better", "Relative Operational Cost\nlower = better", "Security Score (0–10)\nhigher = better"],
    horizontal_spacing=0.09,
)

for trace_data, colors_fn, row_col, yrange in [
    (latency_p99_ms, lat_c,  (1, 1), [0, 160]),
    (cost_relative,  cost_c, (1, 2), [0, 130]),
    (security_score, sec_c,  (1, 3), [0, 12]),
]:
    fig3.add_trace(go.Bar(
        x=arch_clean, y=trace_data,
        marker_color=[colors_fn(v) for v in trace_data],
        text=trace_data, textposition="outside",
        textfont=dict(color="white", size=13),
        width=0.55,
    ), row=row_col[0], col=row_col[1])

fig3.update_layout(
    title=dict(
        text="Architecture Trade-off Simulator<br>"
             "<span style='font-size:15px;font-weight:normal;'>"
             "Compare before coding | Green = optimal · Yellow = acceptable · Red = risk"
             "</span>",
        font=dict(size=19, color="white"),
    ),
    showlegend=False,
    paper_bgcolor="#1e1e2e",
    plot_bgcolor="#1e1e2e",
    font=dict(color="white", size=12),
    height=520,
)

fig3.write_image("tradeoff_simulator.png")
with open("tradeoff_simulator.png.meta.json", "w") as f:
    json.dump({
        "caption": "Trade-off Simulator — 5 Architectures × Latency, Cost and Security",
        "description": "Three bar charts comparing architectural patterns on P99 latency, cost, and security score."
    }, f)

print("All charts generated.")
