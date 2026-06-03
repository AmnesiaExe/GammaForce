from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json

app = FastAPI(title="Cyber Risk Prioritisation Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# SAMPLE THREAT DATA
# ---------------------------------------------------------------------------

THREATS: List[dict] = [
    {
        "id": "CVE-2026-1001",
        "name": "VPN Remote Code Execution",
        # A. Exploitability
        "cvss": 9.8,
        "exploit_available": 1,
        "active_exploitation": 1,
        "attack_complexity": 0.2,
        "privileges_required": 0.0,
        "user_interaction": 0.0,
        # B. Exposure
        "internet_facing": 1,
        "public_service": 1,
        "auth_strength": 0.3,
        "network_segmentation": 0.2,
        "remote_access": 1,
        # C. Asset Criticality
        "critical_service": 1,
        "data_sensitivity": 0.9,
        "citizen_impact": 1,
        "dependency_count": 0.8,
        "uptime_importance": 1,
        # D. Threat Intelligence
        "asd_match": 1,
        "vendor_advisory": 1,
        "source_count": 4,
        "source_quality": 0.9,
        "recency": 0.95,
        # E. Vulnerability Context
        "patch_available": 1,
        "workaround_exists": 1,
        "version_prevalence": 0.7,
        "historical_exploitation": 0.8,
    },
    {
        "id": "CVE-2026-2002",
        "name": "Web App SQL Injection",
        "cvss": 8.6,
        "exploit_available": 1,
        "active_exploitation": 0,
        "attack_complexity": 0.5,
        "privileges_required": 0.3,
        "user_interaction": 0.0,
        "internet_facing": 1,
        "public_service": 0,
        "auth_strength": 0.6,
        "network_segmentation": 0.5,
        "remote_access": 0.5,
        "critical_service": 0.7,
        "data_sensitivity": 0.6,
        "citizen_impact": 0.6,
        "dependency_count": 0.5,
        "uptime_importance": 0.6,
        "asd_match": 0,
        "vendor_advisory": 1,
        "source_count": 2,
        "source_quality": 0.6,
        "recency": 0.7,
        "patch_available": 1,
        "workaround_exists": 1,
        "version_prevalence": 0.6,
        "historical_exploitation": 0.4,
    },
]


# ---------------------------------------------------------------------------
# SCORING ENGINE  (25 signals → 5 domains → 1 final score)
# ---------------------------------------------------------------------------

def score_vulnerability(v: dict) -> dict:
    """
    Convert 25 normalised signals into 5 weighted domain scores,
    then aggregate into a final 0-100 priority score.
    """

    # Domain A — Exploitability  (weight 0.30)
    exploitability = (
        (v["cvss"] / 10) * 0.35
        + v["exploit_available"] * 0.20
        + v["active_exploitation"] * 0.25
        + (1 - v["attack_complexity"]) * 0.10
        + (1 - v["privileges_required"]) * 0.05
        + (1 - v["user_interaction"]) * 0.05
    )

    # Domain B — Exposure  (weight 0.25)
    exposure = (
        v["internet_facing"] * 0.35
        + v["public_service"] * 0.20
        + (1 - v["auth_strength"]) * 0.20
        + (1 - v["network_segmentation"]) * 0.10
        + v["remote_access"] * 0.15
    )

    # Domain C — Asset Impact  (weight 0.25)
    asset_impact = (
        v["critical_service"] * 0.30
        + v["data_sensitivity"] * 0.25
        + v["citizen_impact"] * 0.25
        + v["dependency_count"] * 0.10
        + v["uptime_importance"] * 0.10
    )

    # Domain D — Intelligence Confidence  (weight 0.15)
    intel_confidence = (
        v["asd_match"] * 0.30
        + v["vendor_advisory"] * 0.10
        + min(v["source_count"] / 5, 1.0) * 0.30
        + v["source_quality"] * 0.15
        + v["recency"] * 0.15
    )

    # Domain E — Remediation Context  (weight 0.05)
    #   Higher patch/workaround availability = slightly lower urgency
    remediation = (
        v["patch_available"] * 0.40
        + v["workaround_exists"] * 0.30
        + v["version_prevalence"] * 0.15
        + v["historical_exploitation"] * 0.15
    )

    final = (
        exploitability * 0.30
        + exposure * 0.25
        + asset_impact * 0.25
        + intel_confidence * 0.15
        + remediation * 0.05
    )

    return {
        "exploitability": round(exploitability * 100, 1),
        "exposure": round(exposure * 100, 1),
        "asset_impact": round(asset_impact * 100, 1),
        "intel_confidence": round(intel_confidence * 100, 1),
        "remediation": round(remediation * 100, 1),
        "final_score": round(final * 100, 2),
    }


def risk_level(score: float) -> str:
    if score >= 85:
        return "CRITICAL"
    elif score >= 70:
        return "HIGH"
    elif score >= 50:
        return "MEDIUM"
    return "LOW"


# ---------------------------------------------------------------------------
# AI EXPLANATION ENGINE
# ---------------------------------------------------------------------------

def explain(v: dict, scores: dict) -> dict:
    reasons = []

    if v["active_exploitation"]:
        reasons.append("Active exploitation confirmed in the wild")
    if v["internet_facing"]:
        reasons.append("System is directly internet-facing")
    if v["asd_match"]:
        reasons.append("Validated by Australian Signals Directorate advisory")
    if v["source_count"] >= 3:
        reasons.append(f"{v['source_count']} independent threat intelligence sources confirm this risk")
    if v["critical_service"]:
        reasons.append("Impacts a critical government service")
    if v["data_sensitivity"] >= 0.8:
        reasons.append("Affects high-sensitivity data (PII / financial / classified)")
    if v["citizen_impact"] >= 0.8:
        reasons.append("Direct citizen-facing impact if exploited")
    if v["cvss"] >= 9.0:
        reasons.append(f"Extremely high CVSS base score ({v['cvss']})")

    mitigations = []
    if v["patch_available"]:
        mitigations.append("Patch is available — immediate deployment recommended")
    if v["workaround_exists"]:
        mitigations.append("Temporary workaround available while patching is staged")

    priority = "IMMEDIATE" if scores["final_score"] >= 85 else "URGENT" if scores["final_score"] >= 70 else "SCHEDULED"

    return {
        "summary": (
            f"This vulnerability scores {scores['final_score']}/100 ({risk_level(scores['final_score'])}) "
            f"driven primarily by {_top_domain(scores)}."
        ),
        "reasons": reasons,
        "mitigations": mitigations,
        "recommendation": f"Priority: {priority}. Patch and reduce exposure within "
                          f"{'4 hours' if priority == 'IMMEDIATE' else '24 hours' if priority == 'URGENT' else '72 hours'}.",
    }


def _top_domain(scores: dict) -> str:
    domains = {
        "exploitability": scores["exploitability"],
        "exposure": scores["exposure"],
        "asset impact": scores["asset_impact"],
        "intelligence confidence": scores["intel_confidence"],
    }
    return max(domains, key=domains.get)


# ---------------------------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------------------------

@app.get("/threats")
def get_threats():
    """Return all threats sorted by priority score (highest first)."""
    results = []
    for t in THREATS:
        s = score_vulnerability(t)
        results.append({
            "id": t["id"],
            "name": t["name"],
            "score": s["final_score"],
            "risk_level": risk_level(s["final_score"]),
            "domain_scores": s,
        })
    return sorted(results, key=lambda x: x["score"], reverse=True)


@app.get("/analyse/{threat_id}")
def analyse(threat_id: str):
    """Full analysis for a single threat including AI explanation."""
    threat = next((t for t in THREATS if t["id"] == threat_id), None)
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")

    scores = score_vulnerability(threat)
    return {
        "id": threat["id"],
        "name": threat["name"],
        "risk_score": scores["final_score"],
        "risk_level": risk_level(scores["final_score"]),
        "domain_scores": scores,
        "raw_signals": threat,
        "explanation": explain(threat, scores),
    }


@app.post("/upload")
def upload(file: UploadFile = File(...)):
    """Accept a threat intelligence file and return simulated extraction results."""
    return {
        "message": "File processed and intelligence extracted successfully",
        "filename": file.filename,
        "threats_detected": len(THREATS),
        "threats": [{"id": t["id"], "name": t["name"]} for t in THREATS],
    }


@app.get("/executive-summary")
def executive_summary():
    """Aggregated risk posture for leadership reporting."""
    all_scores = [score_vulnerability(t)["final_score"] for t in THREATS]
    levels = [risk_level(s) for s in all_scores]

    return {
        "total_threats": len(all_scores),
        "by_level": {
            "critical": levels.count("CRITICAL"),
            "high": levels.count("HIGH"),
            "medium": levels.count("MEDIUM"),
            "low": levels.count("LOW"),
        },
        "average_risk_score": round(sum(all_scores) / len(all_scores), 2),
        "system_status": "ELEVATED RISK" if any(s >= 70 for s in all_scores) else "NORMAL",
        "recommendation": (
            "Immediate remediation required for CRITICAL vulnerabilities. "
            "Expected risk reduction: 82% if patched within 24 hours."
        ),
    }


@app.get("/simulate")
def simulate_attack():
    """Simulated breach scenario for the highest-scored threat."""
    top = max(THREATS, key=lambda t: score_vulnerability(t)["final_score"])
    return {
        "threat_id": top["id"],
        "attack_path": [
            "Internet-facing VPN compromised via RCE exploit",
            "Attacker establishes reverse shell, enumerates network",
            "Lateral movement to internal domain controller",
            "Privilege escalation to Domain Admin",
            "Ransomware deployed across critical government systems",
            "Access to citizen PII database exfiltrated",
        ],
        "risk_progression": [
            {"stage": "Initial access", "score": 60},
            {"stage": "Lateral movement", "score": 72},
            {"stage": "Privilege escalation", "score": 85},
            {"stage": "Data exfiltration", "score": 96},
        ],
        "time_to_full_compromise": "4-6 hours",
        "outcome": "HIGH PROBABILITY OF DATA BREACH IF UNMITIGATED",
    }
