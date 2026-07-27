from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time
import os

app = FastAPI(
    title="Quantora AI Service",
    description="AI-powered investment intelligence engine",
    version="0.0.1",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://localhost:80",
        "http://localhost:3000",
        "https://quantora.vercel.app",
        "https://quantora-web.vercel.app",
        "https://quantora-ih3a.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

start_time = time.time()


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "quantora-ai",
        "version": "0.0.1",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": round(time.time() - start_time, 2),
    }


@app.get("/")
async def root():
    return {
        "name": "Quantora AI Service",
        "version": "0.0.1",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/v1/status")
async def api_status():
    return {
        "service": "ai-fastapi",
        "status": "operational",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }
