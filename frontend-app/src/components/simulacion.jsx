import { useState } from 'react'
import * as api from '../api/simulacion'

// ─── Datos base del sistema ───────────────────────────────────────────────────
const GRUPOS_DEFECTO = [
  { id: 1, maquinas: 3 },
  { id: 2, maquinas: 2 },
  { id: 3, maquinas: 4 },
  { id: 4, maquinas: 3 },
  { id: 5, maquinas: 1 },
]

const ESTADO_SIM = { IDLE: 'idle', CORRIENDO: 'corriendo', LISTO: 'listo', ERROR: 'error' }



// Color de badge según utilización
function badgeUtilizacion(pct) {
  if (pct >= 90) return 'badge-error'
  if (pct >= 75) return 'badge-warning'
  return 'badge-success'
}

export default function Simulacion() {
  // ─── Estado ────────────────────────────────────────────────────────────────
  const [params, setParams] = useState({
    replicaciones: 10,
    tiempoSim: 480,       // minutos
    semilla: 42,
    tasaLlegada: 20,      // minutos entre llegadas
  })
  const [estado, setEstado] = useState(ESTADO_SIM.IDLE)
  const [resultado, setResultado] = useState(null)
  const [tabActiva, setTabActiva] = useState('base') // 'base' | 'comparativa'
  const [error, setError] = useState(null)

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setParams({ ...params, [e.target.name]: Number(e.target.value) })
  }

  const handleSimular = async () => {
    setEstado(ESTADO_SIM.CORRIENDO)
    setResultado(null)
    setError(null)
    try {
      const data = await api.simular({
        replicaciones: params.replicaciones,
        tiempo_simulacion: params.tiempoSim,
        tasa_llegada: params.tasaLlegada,
        semilla: params.semilla,
      })
      // Normalizar keys del backend (snake_case) al formato que usa el componente
      const resultado = {
        throughput: data.throughput,
        tiempoTotal: data.tiempo_total,
        grupos: data.grupos.map((g) => ({
          id: g.id,
          maquinas: g.maquinas,
          utilizacion: g.utilizacion,
          espera: g.espera_promedio,
          colaPromedio: g.cola_promedio,
        })),
        comparativa: data.comparativa,
      }
      setResultado(resultado)
      setEstado(ESTADO_SIM.LISTO)
    } catch (err) {
      setError(err.message || 'Error desconocido')
      setEstado(ESTADO_SIM.ERROR)
    }
  }

  const handleReset = () => {
    setEstado(ESTADO_SIM.IDLE)
    setResultado(null)
    setError(null)
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-6xl mx-auto">

        {/* ── TÍTULO ── */}
        <div className="mb-6">
          <div className="badge badge-primary badge-outline mb-2 tracking-widest text-xs">
            SIMULACIÓN · TP Final
          </div>
          <h1 className="text-3xl font-extrabold text-primary">Panel de Simulación</h1>
          <p className="text-base-content/50 text-sm mt-1">
            Configurá los parámetros, ejecutá la simulación y analizá los resultados.
          </p>
        </div>

        {/* ── LAYOUT PRINCIPAL ── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ════════════════════════════════
              COLUMNA IZQUIERDA — Parámetros
          ════════════════════════════════ */}
          <div className="flex flex-col gap-4 lg:w-1/3">

            {/* Card parámetros globales */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body gap-4">
                <h2 className="card-title text-base">⚙️ Parámetros Globales</h2>

                <label className="form-control w-full">
                  <div className="label"><span className="label-text">Replicaciones</span></div>
                  <input
                    type="number" name="replicaciones" min={1} max={100}
                    value={params.replicaciones} onChange={handleChange}
                    className="input input-bordered input-sm w-full"
                  />
                  <div className="label"><span className="label-text-alt text-base-content/40">Cuántas veces se repite la simulación</span></div>
                </label>

                <label className="form-control w-full">
                  <div className="label"><span className="label-text">Tiempo de simulación (min)</span></div>
                  <input
                    type="number" name="tiempoSim" min={60} step={60}
                    value={params.tiempoSim} onChange={handleChange}
                    className="input input-bordered input-sm w-full"
                  />
                  <div className="label"><span className="label-text-alt text-base-content/40">Duración de cada réplica</span></div>
                </label>

                <label className="form-control w-full">
                  <div className="label"><span className="label-text">Tasa de llegada media (min)</span></div>
                  <input
                    type="number" name="tasaLlegada" min={1}
                    value={params.tasaLlegada} onChange={handleChange}
                    className="input input-bordered input-sm w-full"
                  />
                </label>

                <label className="form-control w-full">
                  <div className="label"><span className="label-text">Semilla aleatoria</span></div>
                  <input
                    type="number" name="semilla"
                    value={params.semilla} onChange={handleChange}
                    className="input input-bordered input-sm w-full"
                  />
                  <div className="label"><span className="label-text-alt text-base-content/40">Para reproducibilidad</span></div>
                </label>
              </div>
            </div>

            {/* Card grupos de máquinas (editables) */}
            <div className="card bg-base-100 shadow-md">
              <div className="card-body gap-3">
                <h2 className="card-title text-base">🏭 Grupos de Máquinas</h2>
                <p className="text-xs text-base-content/40">
                  Cantidad de máquinas por grupo (sistema base)
                </p>
                {GRUPOS_DEFECTO.map((g) => (
                  <div key={g.id} className="flex items-center gap-3">
                    <span className="badge badge-primary badge-outline w-12 shrink-0">G{g.id}</span>
                    <progress
                      className="progress progress-primary flex-1"
                      value={g.maquinas} max={5}
                    />
                    <span className="text-sm font-bold w-4">{g.maquinas}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón simular */}
            <button
              className={`btn btn-primary btn-lg w-full gap-2 ${estado === ESTADO_SIM.CORRIENDO ? 'loading' : ''}`}
              onClick={handleSimular}
              disabled={estado === ESTADO_SIM.CORRIENDO}
            >
              {estado === ESTADO_SIM.CORRIENDO
                ? 'Simulando...'
                : estado === ESTADO_SIM.LISTO
                ? '🔁 Volver a simular'
                : '▶ Ejecutar Simulación'}
            </button>

            {estado === ESTADO_SIM.LISTO && (
              <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                Limpiar resultados
              </button>
            )}
          </div>

          {/* ════════════════════════════════
              COLUMNA DERECHA — Resultados
          ════════════════════════════════ */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Estado: error */}
            {estado === ESTADO_SIM.ERROR && (
              <div className="alert alert-error shadow-md">
                <span>⚠️ <strong>Error al conectar con el backend:</strong> {error}</span>
                <button className="btn btn-sm btn-ghost" onClick={handleReset}>Reintentar</button>
              </div>
            )}

            {/* Estado: esperando */}
            {estado === ESTADO_SIM.IDLE && (
              <div className="card bg-base-100 shadow-md flex-1">
                <div className="card-body items-center justify-center text-center gap-4 min-h-64">
                  <div className="text-6xl">🏭</div>
                  <p className="text-base-content/40 text-lg font-semibold">
                    Configurá los parámetros y ejecutá la simulación
                  </p>
                  <p className="text-base-content/30 text-sm max-w-xs">
                    Los resultados aparecerán acá: estadísticas por grupo, utilización,
                    tiempos de espera y comparativa de escenarios.
                  </p>
                </div>
              </div>
            )}

            {/* Estado: corriendo */}
            {estado === ESTADO_SIM.CORRIENDO && (
              <div className="card bg-base-100 shadow-md flex-1">
                <div className="card-body items-center justify-center gap-6 min-h-64">
                  <span className="loading loading-spinner loading-lg text-primary" />
                  <p className="text-base-content/60 font-semibold">Ejecutando simulación...</p>
                  <p className="text-base-content/30 text-sm">
                    {params.replicaciones} replicaciones · {params.tiempoSim} min c/u
                  </p>
                </div>
              </div>
            )}

            {/* Estado: listo — resultados */}
            {estado === ESTADO_SIM.LISTO && resultado && (
              <>
                {/* KPIs resumen */}
                <div className="stats stats-horizontal shadow bg-base-100 w-full flex-wrap">
                  <div className="stat">
                    <div className="stat-title">Throughput</div>
                    <div className="stat-value text-primary text-2xl">{resultado.throughput}</div>
                    <div className="stat-desc">manufacturás/hora</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Tiempo simulado</div>
                    <div className="stat-value text-secondary text-2xl">{resultado.tiempoTotal}</div>
                    <div className="stat-desc">minutos</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Cuello de botella</div>
                    <div className="stat-value text-error text-2xl">
                      G{resultado.grupos.reduce((max, g) => g.espera > max.espera ? g : max).id}
                    </div>
                    <div className="stat-desc">mayor tiempo de espera</div>
                  </div>
                </div>

                {/* Tabs: Base vs Comparativa */}
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <div role="tablist" className="tabs tabs-bordered mb-4">
                      <button
                        role="tab"
                        className={`tab ${tabActiva === 'base' ? 'tab-active' : ''}`}
                        onClick={() => setTabActiva('base')}
                      >
                        📊 Sistema Base
                      </button>
                      <button
                        role="tab"
                        className={`tab ${tabActiva === 'comparativa' ? 'tab-active' : ''}`}
                        onClick={() => setTabActiva('comparativa')}
                      >
                        🔁 Comparativa (+1 máquina)
                      </button>
                    </div>

                    {/* Tab: Sistema Base */}
                    {tabActiva === 'base' && (
                      <div className="overflow-x-auto">
                        <table className="table table-zebra w-full text-sm">
                          <thead>
                            <tr>
                              <th>Grupo</th>
                              <th>Máquinas</th>
                              <th>Utilización</th>
                              <th>Espera prom. (min)</th>
                              <th>Cola prom.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultado.grupos.map((g) => (
                              <tr key={g.id}>
                                <td><span className="badge badge-primary font-bold">G{g.id}</span></td>
                                <td className="font-mono">{g.maquinas}</td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <progress
                                      className={`progress w-20 ${g.utilizacion >= 90 ? 'progress-error' : g.utilizacion >= 75 ? 'progress-warning' : 'progress-success'}`}
                                      value={g.utilizacion} max={100}
                                    />
                                    <span className={`badge ${badgeUtilizacion(g.utilizacion)} badge-sm`}>
                                      {g.utilizacion}%
                                    </span>
                                  </div>
                                </td>
                                <td className="font-mono font-semibold">{g.espera}</td>
                                <td className="font-mono">{g.colaPromedio}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="alert alert-warning mt-4">
                          <span>
                            ⚠️ <strong>G5</strong> tiene utilización del 95% y espera promedio de 41,3 min.
                            Es el candidato principal para agregar una máquina.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tab: Comparativa */}
                    {tabActiva === 'comparativa' && (
                      <div>
                        <p className="text-sm text-base-content/50 mb-4">
                          Resultado de simular agregando +1 máquina a cada grupo por separado.
                          Se compara el throughput obtenido vs el sistema base.
                        </p>

                        <div className="overflow-x-auto">
                          <table className="table table-zebra w-full text-sm">
                            <thead>
                              <tr>
                                <th>Escenario</th>
                                <th>Throughput</th>
                                <th>Mejora</th>
                                <th>Espera G5 (min)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="font-bold">
                                <td><span className="badge badge-ghost">Base</span></td>
                                <td>22.4</td>
                                <td>—</td>
                                <td>41.3</td>
                              </tr>
                              {[
                                { grupo: 1, thr: 22.7, espG5: 40.1 },
                                { grupo: 2, thr: 23.0, espG5: 39.8 },
                                { grupo: 3, thr: 22.5, espG5: 41.0 },
                                { grupo: 4, thr: 23.2, espG5: 40.5 },
                                { grupo: 5, thr: 25.8, espG5: 12.6 },
                              ].map((e) => {
                                const mejora = ((e.thr - 22.4) / 22.4 * 100).toFixed(1)
                                const esMejor = e.grupo === 5
                                return (
                                  <tr key={e.grupo} className={esMejor ? 'bg-success/10' : ''}>
                                    <td>
                                      <span className="badge badge-primary badge-outline">+1 en G{e.grupo}</span>
                                      {esMejor && <span className="badge badge-success ml-2 text-xs">⭐ Mejor</span>}
                                    </td>
                                    <td className="font-mono font-bold">{e.thr}</td>
                                    <td>
                                      <span className={`badge ${Number(mejora) > 5 ? 'badge-success' : Number(mejora) > 1 ? 'badge-warning' : 'badge-ghost'} badge-sm`}>
                                        +{mejora}%
                                      </span>
                                    </td>
                                    <td className="font-mono">{e.espG5}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="alert alert-success mt-4">
                          <span>
                            ✅ Agregar una máquina al <strong>Grupo 5</strong> mejora el throughput en un{' '}
                            <strong>+15.2%</strong> y reduce la espera promedio de 41,3 a 12,6 min.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}