from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import simulacion

app = FastAPI(title="TP Simulación - Fábrica de Manufacturas", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulacion.router, prefix="/api")


@app.get("/api/health")
def health():
    """Endpoint de comprobación de conexión."""
    return {"status": "ok", "mensaje": "Backend de simulación activo"}
