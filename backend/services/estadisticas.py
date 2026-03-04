
N = 5  # Cantidad de grupos


def calcular_stats_grupos(n_maquinas, tiempo_sim_min, t_ocupado, suma_espera, n_atendidos, area_cola):
    """
    Calcula las estadísticas finales de cada grupo al terminar una réplica.
    """
    grupos_stats = []
    for g in range(N):
        cap = n_maquinas[g] * tiempo_sim_min
        grupos_stats.append({
            "id":              g + 1,
            "maquinas":        n_maquinas[g],
            "utilizacion":     round(min((t_ocupado[g] / cap * 100) if cap > 0 else 0, 100.0), 2),
            "espera_promedio": round((suma_espera[g] / n_atendidos[g]) if n_atendidos[g] > 0 else 0, 2),
            "cola_promedio":   round((area_cola[g] / tiempo_sim_min) if tiempo_sim_min > 0 else 0, 3),
        })
    return grupos_stats


def calcular_throughput(completados, tiempo_sim_min):
    """
    Calcula el throughput: trabajos completados por hora.
    """
    return round(completados / (tiempo_sim_min / 60.0), 2)


def promediar_replicas(resultados):
    """
    Promedia los resultados de múltiples réplicas en un único resultado representativo.
    """
    n = len(resultados)
    grupos = []
    for g in range(N):
        grupos.append({
            "id":              g + 1,
            "maquinas":        resultados[0]["grupos"][g]["maquinas"],
            "utilizacion":     round(sum(r["grupos"][g]["utilizacion"]     for r in resultados) / n, 2),
            "espera_promedio": round(sum(r["grupos"][g]["espera_promedio"] for r in resultados) / n, 2),
            "cola_promedio":   round(sum(r["grupos"][g]["cola_promedio"]   for r in resultados) / n, 3),
        })
    return {
        "throughput": round(sum(r["throughput"] for r in resultados) / n, 2),
        "grupos":     grupos,
    }


def calcular_mejora_pct(throughput_alt, throughput_base):
    """
    Calcula el porcentaje de mejora del throughput de un escenario alternativo
    respecto al escenario base.
    """
    if throughput_base > 0:
        return round((throughput_alt - throughput_base) / throughput_base * 100, 1)
    return 0.0
