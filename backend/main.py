from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import simulacion

app = FastAPI(title="TP Simulación - Fábrica de Manufacturas", version="1.0.0")

# ── CORS ───────────────────────────────────────────────────────────────────────
# Permite que el frontend (Vite en :5173) se comunique con el backend (:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(simulacion.router, prefix="/api")


@app.get("/api/health")
def health():
    """Endpoint de comprobación de conexión."""
    return {"status": "ok", "mensaje": "Backend de simulación activo"}
