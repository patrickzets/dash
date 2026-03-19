from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import io
import json
from typing import Optional, List
import traceback

app = FastAPI(title="Data Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for uploaded dataset
dataset_store = {"df": None, "filename": None}


def detect_column_type(series: pd.Series) -> str:
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    # Try parsing as date
    if series.dtype == object:
        try:
            pd.to_datetime(series.dropna().head(10), format="mixed")
            return "date"
        except:
            pass
    return "text"


def safe_json(obj):
    """Convert numpy/pandas types to Python native for JSON serialization."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.Timestamp):
        return str(obj)
    if pd.isna(obj):
        return None
    return obj


@app.get("/")
def root():
    return {"message": "Data Dashboard API running"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload Excel or CSV file and return column info."""
    filename = file.filename or ""
    if not filename.endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(status_code=400, detail="Only .xlsx, .xls, and .csv files are allowed.")

    content = await file.read()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    # Clean column names
    df.columns = [str(c).strip() for c in df.columns]
    # Drop fully empty columns
    df = df.dropna(axis=1, how="all")
    # Convert date-like columns
    for col in df.columns:
        if df[col].dtype == object:
            try:
                parsed = pd.to_datetime(df[col], format="mixed")
                df[col] = parsed
            except:
                pass

    dataset_store["df"] = df
    dataset_store["filename"] = filename

    columns = []
    for col in df.columns:
        col_type = detect_column_type(df[col])
        unique_count = int(df[col].nunique())
        columns.append({
            "name": col,
            "type": col_type,
            "unique_count": unique_count,
            "null_count": int(df[col].isna().sum()),
        })

    return {
        "filename": filename,
        "rows": len(df),
        "columns": columns,
        "preview": json.loads(df.head(5).to_json(orient="records", date_format="iso", default_handler=str)),
    }


@app.get("/columns")
def get_columns():
    """List columns with metadata."""
    df = dataset_store["df"]
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded. Please upload a file first.")
    columns = []
    for col in df.columns:
        col_type = detect_column_type(df[col])
        columns.append({"name": col, "type": col_type, "unique_count": int(df[col].nunique())})
    return {"columns": columns, "rows": len(df)}


@app.get("/aggregate")
def aggregate_data(
    group_by: str = Query(..., description="Column to group by (x-axis)"),
    value_col: Optional[str] = Query(None, description="Column to aggregate (y-axis)"),
    agg_func: str = Query("count", description="Aggregation: count, sum, mean, min, max"),
    filter_col: Optional[str] = Query(None),
    filter_val: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
):
    """Return aggregated data for chart rendering."""
    df = dataset_store["df"]
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded.")

    if group_by not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{group_by}' not found.")

    # Apply filter
    if filter_col and filter_val and filter_col in df.columns:
        df = df[df[filter_col].astype(str).str.contains(filter_val, case=False, na=False)]

    # Aggregate
    try:
        if value_col and value_col in df.columns and agg_func != "count":
            agg_map = {"sum": "sum", "mean": "mean", "min": "min", "max": "max"}
            func = agg_map.get(agg_func, "sum")
            result = df.groupby(group_by)[value_col].agg(func).reset_index()
            result.columns = ["label", "value"]
        else:
            result = df[group_by].value_counts().reset_index()
            result.columns = ["label", "value"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Aggregation error: {str(e)}")

    result = result.head(limit)
    result["label"] = result["label"].apply(lambda x: str(x)[:50])
    result["value"] = result["value"].apply(lambda x: safe_json(x))

    return {
        "labels": result["label"].tolist(),
        "values": result["value"].tolist(),
        "group_by": group_by,
        "value_col": value_col,
        "agg_func": agg_func,
        "total_groups": int(df[group_by].nunique()),
    }


@app.get("/preview")
def preview_data(limit: int = Query(100, ge=1, le=1000)):
    """Return first N rows of dataset."""
    df = dataset_store["df"]
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded.")
    preview_df = df.head(limit)
    return {
        "rows": json.loads(preview_df.to_json(orient="records", date_format="iso", default_handler=str)),
        "columns": list(df.columns),
        "total_rows": len(df),
    }


@app.get("/suggestions")
def get_suggestions():
    """Auto-suggest chart configurations based on data types."""
    df = dataset_store["df"]
    if df is None:
        raise HTTPException(status_code=404, detail="No dataset loaded.")

    suggestions = []
    text_cols = [c for c in df.columns if detect_column_type(df[c]) == "text"]
    num_cols = [c for c in df.columns if detect_column_type(df[c]) == "numeric"]
    date_cols = [c for c in df.columns if detect_column_type(df[c]) == "date"]

    if text_cols:
        col = text_cols[0]
        unique = int(df[col].nunique())
        if unique <= 20:
            suggestions.append({
                "title": f"Distribution of {col}",
                "chart_type": "pie" if unique <= 8 else "bar",
                "group_by": col,
                "value_col": None,
                "agg_func": "count",
            })

    if text_cols and num_cols:
        suggestions.append({
            "title": f"{num_cols[0]} by {text_cols[0]}",
            "chart_type": "bar",
            "group_by": text_cols[0],
            "value_col": num_cols[0],
            "agg_func": "sum",
        })

    if date_cols and num_cols:
        suggestions.append({
            "title": f"{num_cols[0]} over time",
            "chart_type": "line",
            "group_by": date_cols[0],
            "value_col": num_cols[0],
            "agg_func": "sum",
        })

    if len(num_cols) >= 2:
        suggestions.append({
            "title": f"Average {num_cols[1]} by {text_cols[0] if text_cols else num_cols[0]}",
            "chart_type": "bar",
            "group_by": text_cols[0] if text_cols else num_cols[0],
            "value_col": num_cols[1],
            "agg_func": "mean",
        })

    return {"suggestions": suggestions}


if __name__ == "__main__":
    import uvicorn
    import os
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=[backend_dir])
