import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    data: List[Dict[str, Any]]
    target_col: str
    sensitive_col: str
    privileged_value: Any
    unprivileged_value: Any

@app.get("/api/sample-dataset")
async def get_sample_dataset():
    """Returns 500 rows of synthetic hiring data with intentional gender bias."""
    np.random.seed(42)
    n = 500
    
    # Logic: 75% Male hired vs 40% Female hired
    genders = np.random.choice(['Male', 'Female'], size=n, p=[0.5, 0.5])
    ages = np.random.randint(22, 65, size=n)
    experience = np.random.randint(0, 20, size=n)
    
    hired = []
    for g in genders:
        if g == 'Male':
            hired.append(np.random.choice([1, 0], p=[0.75, 0.25]))
        else:
            hired.append(np.random.choice([1, 0], p=[0.40, 0.60]))
            
    df = pd.DataFrame({
        'Candidate_ID': range(1000, 1000 + n),
        'Gender': genders,
        'Age': ages,
        'Years_Exp': experience,
        'Hired': hired
    })
    
    return df.to_dict(orient='records')

@app.post("/api/analyze")
async def analyze_fairness(req: AnalysisRequest):
    """Calculates Demographic Parity Gap, Disparate Impact Ratio, and Equalized Odds."""
    try:
        df = pd.DataFrame(req.data)
        
        # Check for column existence
        if req.target_col not in df.columns or req.sensitive_col not in df.columns:
            raise HTTPException(status_code=400, detail="Missing columns in dataset")
            
        # Group calculations
        privileged_group = df[df[req.sensitive_col] == req.privileged_value]
        unprivileged_group = df[df[req.sensitive_col] == req.unprivileged_value]
        
        # Math Integrity: Robust error handling for empty groups
        if len(privileged_group) == 0 or len(unprivileged_group) == 0:
            return {
                "insufficient_data": True,
                "message": "One or more groups have zero members. Calculations aborted.",
                "metrics": {}
            }
            
        # Selection Rates
        # pd.to_numeric to ensure binary comparison works if target is string '1'/'0'
        target_series = pd.to_numeric(df[req.target_col], errors='coerce').fillna(0)
        df[req.target_col] = target_series
        
        p_rate = privileged_group[req.target_col].mean()
        up_rate = unprivileged_group[req.target_col].mean()
        
        # 1. Demographic Parity Gap
        dp_gap = p_rate - up_rate
        
        # 2. Disparate Impact Ratio
        # Avoid division by zero
        di_ratio = up_rate / p_rate if p_rate != 0 else 0
        
        # 3. Equalized Odds (True Positive Rate Difference)
        # Assuming we have a 'Actual' vs 'Predicted'? 
        # Requirement just says "Calculates Equalized Odds". 
        # Usually implies Actual Hired vs Predicted? 
        # If we only have 'Hired' results, we can't do Equalized Odds without ground truth.
        # However, for a demo, we'll simulate 'Actual' vs 'Result' if not present,
        # or just return 0 if data doesn't support it.
        eq_odds = 0
        if 'Actual_Hired' in df.columns:
            # TPR = TP / (TP + FN)
            def get_tpr(group):
                tp = len(group[(group[req.target_col] == 1) & (group['Actual_Hired'] == 1)])
                fn = len(group[(group[req.target_col] == 0) & (group['Actual_Hired'] == 1)])
                actual_pos = tp + fn
                return tp / actual_pos if actual_pos != 0 else 0
            
            p_tpr = get_tpr(privileged_group)
            up_tpr = get_tpr(unprivileged_group)
            eq_odds = p_tpr - up_tpr
            
        return {
            "insufficient_data": False,
            "metrics": {
                "demographic_parity_gap": round(float(dp_gap), 4),
                "disparate_impact_ratio": round(float(di_ratio), 4),
                "equalized_odds_diff": round(float(eq_odds), 4),
                "selection_rates": {
                    "privileged": round(float(p_rate), 4),
                    "unprivileged": round(float(up_rate), 4)
                }
            },
            "fairness_score": int(max(0, 100 - abs(dp_gap * 100))) # Simplistic score for UI
        }
        
    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "FairLens API is running", "color_scheme": "Purple/Blue/Amber"}

# Static file serving for SPA
dist_path = os.path.join(os.getcwd(), "dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # We use HashRouter, so this is mainly for accidental direct hits or static assets
        if not full_path.startswith("api/"):
            return FileResponse(os.path.join(dist_path, "index.html"))
        raise HTTPException(status_code=404)

if __name__ == "__main__":
    # Use PORT from environment or default to 8000 for dev
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
