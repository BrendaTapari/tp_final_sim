"""
Servicio de simulación - Fábrica de Manufacturas
=================================================
Acá va toda la lógica de la simulación de eventos discretos.

DATOS DEL SISTEMA:
------------------
  Grupos de máquinas: 5 grupos con [3, 2, 4, 3, 1] máquinas respectivamente.
  Tasa de llegada: exponencial con media 20 min.

  Tipos de manufactura:
    Tipo 1 (prob 0.3): secuencia grupos [3,1,2]      tiempos [0.5, 0.8, 0.8] hs
    Tipo 2 (prob 0.4): secuencia grupos [4,1,3]      tiempos [1.1, 0.8, 0.75] hs
    Tipo 3 (prob 0.1): secuencia grupos [2,5,1,4,3]  tiempos [1.9, 0.25, 0.7, 0.9, 1.0] hs
    Tipo 4 (prob 0.2): secuencia grupos [1,5,4]      tiempos [1.4, 1.8, 0.4] hs

TODO: Implementar simulación de eventos discretos aquí.
"""

# ── Datos del sistema ──────────────────────────────────────────────────────────

GRUPOS = [
    {"id": 1, "maquinas": 3},
    {"id": 2, "maquinas": 2},
    {"id": 3, "maquinas": 4},
    {"id": 4, "maquinas": 3},
    {"id": 5, "maquinas": 1},
]

MANUFACTURAS = [
    {"id": 1, "prob": 0.3, "secuencia": [3, 1, 2], "tiempos": [0.5, 0.8, 0.8]},
    {"id": 2, "prob": 0.4, "secuencia": [4, 1, 3], "tiempos": [1.1, 0.8, 0.75]},
    {"id": 3, "prob": 0.1, "secuencia": [2, 5, 1, 4, 3], "tiempos": [1.9, 0.25, 0.7, 0.9, 1.0]},
    {"id": 4, "prob": 0.2, "secuencia": [1, 5, 4], "tiempos": [1.4, 1.8, 0.4]},
]


# ── Función principal ──────────────────────────────────────────────────────────

def ejecutar(params):
    """
    Ejecuta la simulación y retorna los resultados.

    Args:
        params: ParametrosSimulacion con replicaciones, tiempo_simulacion,
                tasa_llegada y semilla.

    Returns:
        dict compatible con ResultadoSimulacion.

    TODO: Reemplazar los datos de ejemplo por la simulación real.
    """

    # ── DATOS DE EJEMPLO (placeholder hasta implementar la lógica real) ────────
    grupos_resultado = [
        {"id": 1, "maquinas": 3, "utilizacion": 87.0, "espera_promedio": 14.2, "cola_promedio": 2.1},
        {"id": 2, "maquinas": 2, "utilizacion": 72.0, "espera_promedio": 6.8,  "cola_promedio": 0.8},
        {"id": 3, "maquinas": 4, "utilizacion": 61.0, "espera_promedio": 3.1,  "cola_promedio": 0.4},
        {"id": 4, "maquinas": 3, "utilizacion": 78.0, "espera_promedio": 9.5,  "cola_promedio": 1.2},
        {"id": 5, "maquinas": 1, "utilizacion": 95.0, "espera_promedio": 41.3, "cola_promedio": 3.9},
    ]

    comparativa = [
        {"grupo": 1, "throughput": 22.7, "mejora_pct": 1.3,  "espera_g5": 40.1},
        {"grupo": 2, "throughput": 23.0, "mejora_pct": 2.7,  "espera_g5": 39.8},
        {"grupo": 3, "throughput": 22.5, "mejora_pct": 0.4,  "espera_g5": 41.0},
        {"grupo": 4, "throughput": 23.2, "mejora_pct": 3.6,  "espera_g5": 40.5},
        {"grupo": 5, "throughput": 25.8, "mejora_pct": 15.2, "espera_g5": 12.6},
    ]

    return {
        "throughput": 22.4,
        "tiempo_total": params.tiempo_simulacion,
        "grupos": grupos_resultado,
        "comparativa": comparativa,
    }
