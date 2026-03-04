
import heapq
from services import generadorNumeros, distribuciones, probabilidades, estadisticas
from services.estados import EstadoTrabajo, EstadoMaquina

GRUPOS = [
    {"id": 1, "maquinas": 3},
    {"id": 2, "maquinas": 2},
    {"id": 3, "maquinas": 4},
    {"id": 4, "maquinas": 3},
    {"id": 5, "maquinas": 1},
]

HS_A_MIN  = 60.0
POOL_SIZE = 4000
N         = 5


def _generar_pool(semilla_base, cantidad, offset=0):
    params = generadorNumeros.generar_parametros_apartir_de_cantidad(cantidad)
    semilla_efectiva = (semilla_base + offset) % params["modulo"]
    crudos = generadorNumeros.generar_numeros_congurencia_lineal(
        semilla_efectiva, cantidad,
        params["modulo"], params["multiplicador"], params["incremento"],
    )
    return [c / params["modulo"] for c in crudos]


def _simular_replica(n_maquinas, tiempo_sim_min, tasa_llegada_min, pool, registrar_log=False):
    """
    Simula una corrida.
    """
    cursor      = [0]
    log         = []
    n_trabajo   = [0]

    def rand():
        if cursor[0] >= len(pool):
            raise RuntimeError("Pool agotado.")
        v = pool[cursor[0]]; cursor[0] += 1; return v

    maq_libres = list(n_maquinas)      
    colas      = [[] for _ in range(N)]

    t_ocupado   = [0.0] * N
    suma_espera = [0.0] * N
    n_atendidos = [0]   * N
    area_cola   = [0.0] * N
    t_ultimo_ev = [0.0] * N
    completados = [0]

    estado_trabajos = {}

    estado_maquinas = {
        g: [EstadoMaquina.LIBRE] * n_maquinas[g]
        for g in range(N)
    }

    def _ocupar_maquina(g):
        """Marca la primera máquina LIBRE del grupo como OCUPADA."""
        for i, est in enumerate(estado_maquinas[g]):
            if est == EstadoMaquina.LIBRE:
                estado_maquinas[g][i] = EstadoMaquina.OCUPADA
                return

    def _liberar_maquina(g):
        """Marca la primera máquina OCUPADA del grupo como LIBRE."""
        for i, est in enumerate(estado_maquinas[g]):
            if est == EstadoMaquina.OCUPADA:
                estado_maquinas[g][i] = EstadoMaquina.LIBRE
                return

    def actualizar_area(g, t):
        dt = t - t_ultimo_ev[g]
        area_cola[g] += len(colas[g]) * dt
        t_ultimo_ev[g] = t

    def snapshot_grupos():
        tiempos_fin = {g: [] for g in range(N)}
        for evt in eventos:
            if evt[1] == 1:
                tiempos_fin[evt[2]["g"]].append(round(evt[0], 2))
        for g in range(N):
            tiempos_fin[g].sort()

        return [
            {
                "g": g + 1,
                "maq_libres": maq_libres[g],
                "cola": len(colas[g]),
                "fin_servicio": tiempos_fin[g]
            }
            for g in range(N)
        ]

    def _log(reloj, evento, descripcion,
             random_tipo=None, random_usado=None,
             tiempo_calculado=None, tiempo_fin=None,
             trabajo_id=None, grupo=None,
             tipo_manufactura=None, paso=None, total_pasos=None,
             secuencia=None,
             prox_llegada_rnd=None, prox_llegada_t_calc=None, prox_llegada_reloj=None):

        if registrar_log:
            log.append({
                "reloj":            round(reloj, 4),
                "trabajo_id":       trabajo_id,
                "evento":           evento,
                "descripcion":      descripcion,
                "grupo":            grupo,
                "random_tipo":      round(random_tipo,  6) if random_tipo  is not None else None,
                "random_usado":     round(random_usado, 6) if random_usado is not None else None,
                "tiempo_calculado": round(tiempo_calculado, 4) if tiempo_calculado is not None else None,
                "tiempo_fin":       round(tiempo_fin,       4) if tiempo_fin       is not None else None,
                "tipo_manufactura": tipo_manufactura,
                "paso":             paso,
                "total_pasos":      total_pasos,
                "secuencia":        secuencia,
                # Próxima llegada programada
                "prox_llegada_rnd":    round(prox_llegada_rnd,    6) if prox_llegada_rnd    is not None else None,
                "prox_llegada_t_calc": round(prox_llegada_t_calc, 4) if prox_llegada_t_calc is not None else None,
                "prox_llegada_reloj":  round(prox_llegada_reloj,  4) if prox_llegada_reloj  is not None else None,
                # Estado de todos los grupos en este momento
                "estado_grupos":    snapshot_grupos(),
                # Estado por trabajo: {id → 'En grupo N' | 'Esperando atención' | 'Completado'}
                "estado_trabajos":  dict(estado_trabajos),
                # Estado por máquina individual: {g_idx+1 → ['Libre','Ocupada',...]}
                "estado_maquinas":  {
                    g + 1: list(estado_maquinas[g])
                    for g in range(N)
                },
            })

    def _intentar_asignar(g, trabajo, t):
        """Intenta darle servicio. Si hay máquina libre, la ocupa y programa fin.
        NO registra log (lo hace el llamador)."""
        actualizar_area(g, t)
        paso = trabajo["paso"]
        if maq_libres[g] > 0:
            maq_libres[g] -= 1
            n_atendidos[g] += 1
            r_serv    = rand()
            media_min = trabajo["tipo"]["tiempos"][paso] * HS_A_MIN
            ts = distribuciones.generar_numeros_exponenciales([r_serv], media_min)[0]
            t_pos = trabajo["tipo"]["tiempos"][paso]
            t_ocupado[g] += ts
            heapq.heappush(eventos, (t + ts, 1, {"g": g, "trabajo": trabajo}))
            # Actualizar estados
            _ocupar_maquina(g)
            estado_trabajos[trabajo["id"]] = EstadoTrabajo.en_grupo(g + 1)
            return "inicio", r_serv, ts, t_pos
        else:
            trabajo["t_cola"] = t
            colas[g].append(trabajo)
            # El trabajo queda esperando en cola
            estado_trabajos[trabajo["id"]] = EstadoTrabajo.ESPERANDO_ATENCION
            return "cola", None, None, None

    eventos = []

    # Primera llegada
    r_llegada = rand()
    t0 = distribuciones.generar_numeros_exponenciales([r_llegada], tasa_llegada_min)[0]
    heapq.heappush(eventos, (t0, 0, {}))
    _log(0,
         evento="Inicio simulación",
         descripcion=f"Primera llegada programada en t={round(t0,2)} min. r={round(r_llegada,6)}.",
         prox_llegada_rnd=r_llegada, prox_llegada_t_calc=t0, prox_llegada_reloj=t0)

    while eventos:
        t, tipo, datos = heapq.heappop(eventos)
        if t > tiempo_sim_min:
            break

        # LLEGADA
        if tipo == 0:
            n_trabajo[0] += 1
            tid = n_trabajo[0]

            # Próxima llegada
            r_prox = rand()
            t_sig  = t + distribuciones.generar_numeros_exponenciales([r_prox], tasa_llegada_min)[0]
            if t_sig <= tiempo_sim_min:
                heapq.heappush(eventos, (t_sig, 0, {}))

            # Tipo manufactura
            r_tipo   = rand()
            tipo_mfg = probabilidades.obtener_tipo_manufactura(r_tipo)
            if tipo_mfg is None:
                continue

            tipo_nombre = "Tipo ?"
            for k, v in probabilidades.MANUFACTURA.items():
                if v is tipo_mfg:
                    tipo_nombre = k.replace("_", " ").title()
                    break

            g0      = tipo_mfg["secuencia"][0] - 1
            t_entre = round(t_sig - t, 4)
            sec_str = "→G".join(str(s) for s in tipo_mfg["secuencia"])
            trabajo = {"tipo": tipo_mfg, "paso": 0, "t_llegada": t, "id": tid, "tipo_nombre": tipo_nombre}

            res, r_serv, ts, t_pos = _intentar_asignar(g0, trabajo, t)

            if res == "inicio":
                _log(t,
                     evento=f"Llegada T#{tid}",
                     descripcion=(
                         f"T#{tid} llega. Tipo={tipo_nombre}. Secuencia: G{sec_str}. "
                         f"r_tipo={round(r_tipo,6)} → {tipo_nombre}. "
                         f"G{g0+1} tiene máquina libre → inicia servicio. "
                         f"Media={t_pos}hs={round(t_pos*HS_A_MIN,1)}min. "
                         f"Sorteado={round(ts,2)}min. Finaliza en t={round(t+ts,2)}. "
                         f"Próxima llegada en {t_entre}min (r={round(r_prox,6)})."
                     ),
                     random_tipo=r_tipo, random_usado=r_serv,
                     tiempo_calculado=ts, tiempo_fin=t+ts,
                     trabajo_id=tid, grupo=g0+1,
                     tipo_manufactura=tipo_nombre,
                     total_pasos=len(tipo_mfg["secuencia"]),
                     secuencia=tipo_mfg["secuencia"],
                     paso=1,
                     prox_llegada_rnd=r_prox, prox_llegada_t_calc=t_entre, prox_llegada_reloj=t_sig)
            else:
                _log(t,
                     evento=f"Llegada T#{tid} → espera",
                     descripcion=(
                         f"T#{tid} llega. Tipo={tipo_nombre}. Secuencia: G{sec_str}. "
                         f"r_tipo={round(r_tipo,6)} → {tipo_nombre}. "
                         f"G{g0+1} sin máquinas libres → pasa a cola (cola={len(colas[g0])}). "
                         f"Próxima llegada en {t_entre}min (r={round(r_prox,6)})."
                     ),
                     random_tipo=r_tipo, random_usado=r_prox,
                     tiempo_calculado=t_entre, tiempo_fin=t_sig,
                     trabajo_id=tid, grupo=g0+1,
                     tipo_manufactura=tipo_nombre,
                     total_pasos=len(tipo_mfg["secuencia"]),
                     secuencia=tipo_mfg["secuencia"],
                     paso=1,
                     prox_llegada_rnd=r_prox, prox_llegada_t_calc=t_entre, prox_llegada_reloj=t_sig)
        # Fin servicio
        elif tipo == 1:
            g       = datos["g"]
            trabajo = datos["trabajo"]

            actualizar_area(g, t)
            maq_libres[g] += 1
            _liberar_maquina(g)

            # Si hay trabajo esperando en cola → sacarlo y asignarle servicio
            if colas[g]:
                sig = colas[g].pop(0)
                actualizar_area(g, t)
                espera = t - sig["t_cola"]
                suma_espera[g] += espera
                n_atendidos[g] += 1
                maq_libres[g]  -= 1

                r_serv_cola   = rand()
                media_min_cola = sig["tipo"]["tiempos"][sig["paso"]] * HS_A_MIN
                ts_cola = distribuciones.generar_numeros_exponenciales([r_serv_cola], media_min_cola)[0]
                t_pos_cola = sig["tipo"]["tiempos"][sig["paso"]]
                t_ocupado[g] += ts_cola
                heapq.heappush(eventos, (t + ts_cola, 1, {"g": g, "trabajo": sig}))

                # Fila propia para T#sig (job diferente, tiene sentido separado)
                _log(t,
                     evento=f"T#{sig['id']} sale cola → inicia en G{g+1}",
                     descripcion=(
                         f"T#{trabajo['id']} liberó G{g+1}. "
                         f"T#{sig['id']} estaba en cola (esperó {round(espera,2)}min) → entra en servicio. "
                         f"Paso {sig['paso']+1}/{len(sig['tipo']['secuencia'])}. "
                         f"Media={t_pos_cola}hs={round(t_pos_cola*HS_A_MIN,1)}min. "
                         f"Sorteado={round(ts_cola,2)}min. Finaliza en t={round(t+ts_cola,2)}."
                     ),
                     random_usado=r_serv_cola, tiempo_calculado=ts_cola, tiempo_fin=t+ts_cola,
                     trabajo_id=sig["id"], grupo=g+1,
                     tipo_manufactura=sig.get("tipo_nombre"),
                     paso=sig["paso"]+1, total_pasos=len(sig["tipo"]["secuencia"]),
                     secuencia=sig["tipo"]["secuencia"])

            # Avanzar T#trabajo → UNA SOLA fila (sin el "termina" intermedio)
            secuencia = trabajo["tipo"]["secuencia"]
            paso_sig  = trabajo["paso"] + 1
            if paso_sig < len(secuencia):
                trabajo["paso"] = paso_sig
                g_sig = secuencia[paso_sig] - 1
                res, r_serv2, ts2, t_pos2 = _intentar_asignar(g_sig, trabajo, t)

                if res == "inicio":
                    _log(t,
                         evento=f"T#{trabajo['id']} avanza → inicia (paso {paso_sig+1})",
                         descripcion=(
                             f"T#{trabajo['id']} termina en G{g+1}. "
                             f"Avanza a G{g_sig+1} (paso {paso_sig+1}/{len(secuencia)}). Máquina libre → inicia. "
                             f"Media={t_pos2}hs={round(t_pos2*HS_A_MIN,1)}min. "
                             f"Sorteado={round(ts2,2)}min. Finaliza en t={round(t+ts2,2)}."
                         ),
                         random_usado=r_serv2, tiempo_calculado=ts2, tiempo_fin=t+ts2,
                         trabajo_id=trabajo["id"], grupo=g_sig+1,
                         tipo_manufactura=trabajo.get("tipo_nombre"),
                         paso=paso_sig+1, total_pasos=len(secuencia),
                         secuencia=secuencia)
                else:
                    _log(t,
                         evento=f"T#{trabajo['id']} avanza → espera (paso {paso_sig+1})",
                         descripcion=(
                             f"T#{trabajo['id']} termina en G{g+1}. "
                             f"Avanza a G{g_sig+1} (paso {paso_sig+1}/{len(secuencia)}). "
                             f"Sin máquinas libres → pasa a cola (cola={len(colas[g_sig])})."
                         ),
                         trabajo_id=trabajo["id"], grupo=g_sig+1,
                         tipo_manufactura=trabajo.get("tipo_nombre"),
                         paso=paso_sig+1, total_pasos=len(secuencia),
                         secuencia=secuencia)
            else:
                completados[0] += 1
                dur_total = round(t - trabajo["t_llegada"], 2)
                sec_list  = trabajo["tipo"]["secuencia"]
                # El trabajo completó su ciclo
                estado_trabajos[trabajo["id"]] = EstadoTrabajo.COMPLETADO
                _log(t,
                     evento=f"T#{trabajo['id']} COMPLETADO",
                     descripcion=(
                         f"T#{trabajo['id']} ({trabajo.get('tipo_nombre','?')}) completó todos sus pasos. "
                         f"Terminó en G{g+1}. Recorrido: G{'→G'.join(str(s) for s in sec_list)}. "
                         f"Tiempo total en sistema: {dur_total} min."
                     ),
                     trabajo_id=trabajo["id"],
                     tipo_manufactura=trabajo.get("tipo_nombre"),
                     grupo=sec_list[-1],
                     total_pasos=len(sec_list),
                     secuencia=sec_list)

    grupos_stats = estadisticas.calcular_stats_grupos(
        n_maquinas, tiempo_sim_min,
        t_ocupado, suma_espera, n_atendidos, area_cola
    )
    throughput = estadisticas.calcular_throughput(completados[0], tiempo_sim_min)

    return {
        "grupos":     grupos_stats,
        "throughput": throughput,
        "log":        log,
    }





def ejecutar(params):
    n_base = [g["maquinas"] for g in GRUPOS]
    replicas_base = []
    log_primera   = []

    for rep in range(params.replicaciones):
        pool   = _generar_pool(params.semilla, POOL_SIZE, offset=rep * 31)
        grabar = (rep == 0)
        r = _simular_replica(n_base, params.tiempo_simulacion, params.tasa_llegada, pool,
                             registrar_log=grabar)
        replicas_base.append(r)
        if grabar:
            log_primera = r["log"]

    base = estadisticas.promediar_replicas(replicas_base)

    comparativa = []
    for gidx in range(N):
        n_alt = n_base.copy()
        n_alt[gidx] += 1
        reps_alt   = []
        log_alt    = []

        for rep in range(params.replicaciones):
            pool   = _generar_pool(params.semilla, POOL_SIZE, offset=rep * 31 + (gidx + 1) * 9973)
            grabar = (rep == 0)
            r_alt  = _simular_replica(n_alt, params.tiempo_simulacion, params.tasa_llegada, pool,
                                      registrar_log=grabar)
            reps_alt.append(r_alt)
            if grabar:
                log_alt = r_alt["log"]

        alt    = estadisticas.promediar_replicas(reps_alt)
        mejora = estadisticas.calcular_mejora_pct(alt["throughput"], base["throughput"])
        comparativa.append({
            "grupo":         gidx + 1,
            "n_maquinas":    n_alt[gidx],        # cantidad de máquinas en ese grupo para el escenario
            "throughput":    alt["throughput"],
            "mejora_pct":    round(mejora, 1),
            "espera_g5":     alt["grupos"][4]["espera_promedio"],
            "grupos":        alt["grupos"],       # stats por grupo de este escenario
            "log_eventos":   log_alt,             # log de la primera réplica del escenario
        })

    return {
        "throughput":   base["throughput"],
        "tiempo_total": params.tiempo_simulacion,
        "grupos":       base["grupos"],
        "comparativa":  comparativa,
        "log_eventos":  log_primera,
    }
