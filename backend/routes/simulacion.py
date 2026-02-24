from fastapi import APIRouter
from pydantic import BaseModel
from services import simulador
from services import generadorNumeros

router = APIRouter()


# ── Modelos ────────────────────────────────────────────────────────────────────

class ParametrosSimulacion(BaseModel):
    replicaciones: int = 10
    tiempo_simulacion: float = 480   # minutos
    tasa_llegada: float = 20         # minutos entre llegadas (media exponencial)
    semilla: int = 42


class ResultadoGrupo(BaseModel):
    id: int
    maquinas: int
    utilizacion: float        # porcentaje 0-100
    espera_promedio: float    # minutos
    cola_promedio: float


class ResultadoSimulacion(BaseModel):
    throughput: float
    tiempo_total: float
    grupos: list[ResultadoGrupo]
    comparativa: list[dict]


class ParametrosGenerador(BaseModel):
    semilla: int
    cantidad: int
    modulo: int
    multiplicador: int
    incremento: int


# ── Simulación ─────────────────────────────────────────────────────────────────

@router.post("/simular", response_model=ResultadoSimulacion)
def simular(params: ParametrosSimulacion):
    """Ejecuta la simulación con los parámetros dados."""
    resultado = simulador.ejecutar(params)
    return resultado


# ── Generador LCG ──────────────────────────────────────────────────────────────

@router.post("/generar")
def generar(params: ParametrosGenerador):
    """
    Genera una secuencia de números pseudoaleatorios con el LCG.
    Devuelve los valores crudos [0, modulo) y normalizados [0, 1).
    """
    numeros = generadorNumeros.generar_numeros_congurencia_lineal(
        params.semilla,
        params.cantidad,
        params.modulo,
        params.multiplicador,
        params.incremento,
    )
    normalizados = [n / params.modulo for n in numeros]
    return {
        "numeros_crudos": numeros,
        "numeros_normalizados": normalizados,
        "cantidad": len(numeros),
    }


@router.post("/verificar-parametros")
def verificar_parametros(params: ParametrosGenerador):
    """
    Verifica si los parámetros del LCG cumplen las condiciones de Hull-Dobell.
    Retorna confirmación o lanza un error 422 con descripción del problema.
    """
    resultado = generadorNumeros.verificador_parametros_generador(
        params.semilla,
        params.cantidad,
        params.modulo,
        params.multiplicador,
        params.incremento,
    )
    return resultado


@router.get("/generar-parametros/{cantidad}")
def generar_parametros(cantidad: int):
    """
    Dado solo la cantidad de números deseados, calcula y devuelve
    parámetros LCG válidos automáticamente.
    """
    return generadorNumeros.generar_parametros_apartir_de_cantidad(cantidad)
