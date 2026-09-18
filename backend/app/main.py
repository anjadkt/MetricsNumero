from fastapi import FastAPI

app = FastAPI(
    title="MetricsNumero API",
    description="AI-Powered Pharmaceutical Quality Intelligence & Compliance Platform",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "MetricsNumero API",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }