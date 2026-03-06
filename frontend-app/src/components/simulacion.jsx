import { useState, Fragment } from 'react'
import * as api from '../api/simulacion'
import { CalendarClock, ChartColumn, Clock, Dices, Forklift, RotateCw, Play, Star, Boxes, Blocks } from 'lucide-react'

// ── Colores por evento
const BADGE_EVENTO = {
  'Llegada': 'badge-primary',
  'Inicio Servicio': 'badge-success',
  'Espera en Cola': 'badge-warning',
  'Sale de Cola': 'badge-info',
  'Fin Servicio': 'badge-ghost',
  'Completado': 'badge-accent',
  'Inicio Simulación': 'badge-neutral',
}

const GRUPOS_BASE = [
  { id: 1, maquinas: 3 },
  { id: 2, maquinas: 2 },
  { id: 3, maquinas: 4 },
  { id: 4, maquinas: 3 },
  { id: 5, maquinas: 1 },
]

const ESTADO = { IDLE: 'idle', CORRIENDO: 'corriendo', LISTO: 'listo', ERROR: 'error' }

const TIPO_COLORS = [
  'badge-primary', 'badge-secondary', 'badge-accent',
  'badge-info', 'badge-warning', 'badge-error', 'badge-success',
]
function badgeTipo(tipo) {
  if (!tipo) return <span className="opacity-20 text-xs">—</span>
  const idx = (tipo.charCodeAt(tipo.length - 1) ?? 0) % TIPO_COLORS.length
  return <span className={`badge badge-xs whitespace-nowrap ${TIPO_COLORS[idx]}`}>{tipo}</span>
}

function badgeUtil(pct) {
  if (pct >= 90) return 'badge-error'
  if (pct >= 75) return 'badge-warning'
  return 'badge-success'
}

// ── Componente principal
export default function Simulacion() {
  const [params, setParams] = useState({ replicaciones: 10, tiempoSim: 480, semilla: 42 })
  const [estado, setEstado] = useState(ESTADO.IDLE)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)
  const [vista, setVista] = useState('eventos')
  const [escenario, setEscenario] = useState('base')

  const handleChange = (e) =>
    setParams({ ...params, [e.target.name]: Number(e.target.value) })

  const handleSimular = async () => {
    setEstado(ESTADO.CORRIENDO)
    setResultado(null)
    setError(null)
    const semillaEfectiva = params.semilla
    if (resultado !== null) setParams(p => ({ ...p, semilla: p.semilla + 1 }))
    try {
      const data = await api.simular({
        replicaciones: params.replicaciones,
        tiempo_simulacion: params.tiempoSim,
        semilla: semillaEfectiva,
      })
      setResultado({
        throughput: data.throughput,
        tiempoTotal: data.tiempo_total,
        grupos: data.grupos.map(g => ({
          id: g.id, maquinas: g.maquinas,
          utilizacion: g.utilizacion, espera: g.espera_promedio, colaPromedio: g.cola_promedio,
        })),
        comparativa: data.comparativa,
        logEventos: data.log_eventos ?? [],
      })
      setEstado(ESTADO.LISTO)
    } catch (err) {
      setError(err.message || 'Error desconocido')
      setEstado(ESTADO.ERROR)
    }
  }

  const handleReset = () => { setEstado(ESTADO.IDLE); setResultado(null); setError(null) }

  return (
    <div className="h-screen flex flex-col bg-base-200 overflow-hidden">

      {/* ── BARRA SUPERIOR: parámetros + botón ── */}
      <div className="bg-base-100 border-b border-base-300 shadow-sm px-4 py-2 shrink-0">
        <div className="flex flex-wrap items-end gap-3">

          {/* Título */}
          <div className="shrink-0 mr-2">
            <div className="text-xs text-accent font-bold tracking-widest uppercase">TP Final · Simulación</div>
            <div className="text-base font-extrabold leading-tight">Panel de control</div>
          </div>

          {/* Corridas */}
          <label className="form-control">
            <div className="label py-0"><span className="label-text text-xs">Corridas</span></div>
            <input type="number" name="replicaciones" min={1} max={100}
              value={params.replicaciones} onChange={handleChange}
              className="input input-bordered input-xs w-20" />
          </label>

          {/* Duración */}
          <label className="form-control">
            <div className="label py-0"><span className="label-text text-xs">Duración (min)</span></div>
            <input type="number" name="tiempoSim" min={60} step={60}
              value={params.tiempoSim} onChange={handleChange}
              className="input input-bordered input-xs w-28" />
          </label>

          {/* Semilla */}
          <label className="form-control">
            <div className="label py-0"><span className="label-text text-xs">Semilla</span></div>
            <div className="flex gap-1">
              <input type="number" name="semilla" min={0}
                value={params.semilla} onChange={handleChange}
                className="input input-bordered input-xs w-24" />
              <button className="btn btn-ghost btn-xs px-2 text-base text-accent tooltip tooltip-top" data-tip="Semilla aleatoria"
                onClick={async () => {
                  try {
                    const data = await api.generarSemilla();
                    setParams(p => ({ ...p, semilla: data.semilla }));
                  } catch (e) {
                    console.error("Error al obtener semilla", e);
                  }
                }}>
                <Dices className='w-6 h-6' />
              </button>
            </div>
          </label>

          {/* Info fija */}
          <span className="text-xs text-base-content/50 self-end pb-1 flex items-center gap-1">
            <Clock className='h-4 w-4' /> Llegada manufacturas: <strong>20 min</strong>
          </span>

          {/* Grupos compactos */}
          <div className="flex gap-1 self-end pb-1">
            {GRUPOS_BASE.map(g => (
              <span key={g.id} className="badge badge-primary badge-outline badge-xs">G{g.id}:{g.maquinas}</span>
            ))}
          </div>

          {/* Botones a la derecha */}
          <div className="ml-auto flex items-end gap-2">
            {estado === ESTADO.LISTO && resultado && (
              <div className="badge badge-success mb-1">
                Rendimiento: <strong className="ml-1">{resultado.throughput} trab/hs</strong>
              </div>
            )}
            <button
              className={`btn btn-primary btn-sm ${estado === ESTADO.CORRIENDO ? 'loading' : ''}`}
              onClick={handleSimular} disabled={estado === ESTADO.CORRIENDO}>
              {estado === ESTADO.CORRIENDO ? 'Simulando…'
                : estado === ESTADO.LISTO ? <><RotateCw className="w-4 h-4 mr-1" /> Simular de nuevo</>
                  : <><Play className="w-4 h-4 mr-1" /> Ejecutar</>}
            </button>
            {estado === ESTADO.LISTO && (
              <button className="btn btn-ghost btn-sm" onClick={handleReset}>✕</button>
            )}
          </div>
        </div>

        {/* Tabs + Selector de escenario */}
        {estado === ESTADO.LISTO && resultado && (
          <div className="flex items-center gap-2 mt-1 flex-wrap justify-between mt-2">
            {/* Tabs de vista */}
            <div role="tablist" className="tabs tabs-bordered">
              <button role="tab"
                className={`tab tab-sm tooltip tooltip-bottom ${vista === 'eventos' ? 'tab-active' : ''}`}
                data-tip="Tabla de Eventos"
                onClick={() => setVista('eventos')}>
                <CalendarClock /> Tabla de Eventos
              </button>
              <button role="tab"
                className={`tab tab-sm tooltip tooltip-bottom ${vista === 'resumen' ? 'tab-active' : ''}`}
                data-tip="Resumen y Comparativa"
                onClick={() => setVista('resumen')}>
                <ChartColumn /> Resumen y Comparativa
              </button>
            </div>

            {/* Selector de escenario (solo en vista eventos) */}
            {vista === 'eventos' && (
              <div className="flex items-center gap-1 ml-2 flex-wrap">
                <span className="text-xs text-base-content/50 mr-1">Ver corrida de:</span>

                {/* Base */}
                <button
                  className={`btn btn-xs ${escenario === 'base' ? 'btn-primary' : 'btn-ghost'
                    }`}
                  onClick={() => setEscenario('base')}>
                  Base
                  <span className="ml-1 font-mono opacity-70">{resultado.throughput} t/h</span>
                </button>

                {/* +1 en cada grupo */}
                {resultado.comparativa.map(c => (
                  <button key={c.grupo}
                    className={`btn btn-xs ${escenario === `g${c.grupo}` ? 'btn-secondary' : 'btn-ghost'
                      }`}
                    onClick={() => setEscenario(`g${c.grupo}`)}>
                    +1 G{c.grupo}
                    <span className={`ml-1 font-mono text-xs ${c.mejora_pct > 5 ? 'text-success' :
                      c.mejora_pct > 0 ? 'text-info' : 'text-error'
                      }`}>
                      {c.mejora_pct > 0 ? '+' : ''}{c.mejora_pct}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ÁREA PRINCIPAL: resultados a pantalla completa ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {estado === ESTADO.ERROR && (
          <div className="alert alert-error m-3">
            <span>⚠️ <strong>Error:</strong> {error}</span>
            <button className="btn btn-sm btn-ghost ml-auto" onClick={handleReset}>Reintentar</button>
          </div>
        )}

        {estado === ESTADO.IDLE && (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center">
            <div className="text-7xl"><Forklift className='text-primary w-32 h-32' /></div>
            <p className="text-base-content/40 text-xl font-semibold">Ejecutá la simulación para ver los eventos</p>
            <span className="text-base-content/30 text-sm flex items-center gap-1">Usá <Dices className='w-4 h-4' /> para cambiar la semilla y obtener resultados distintos</span>
          </div>
        )}

        {estado === ESTADO.CORRIENDO && (
          <div className="flex-1 flex items-center justify-center flex-col gap-6">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-base-content/60 font-semibold text-lg">Simulando {params.replicaciones} corridas…</p>
          </div>
        )}

        {estado === ESTADO.LISTO && resultado && vista === 'eventos' && (() => {
          // Determinar qué log y qué grupos mostrar según el escenario seleccionado
          const comp = resultado.comparativa.find(c => `g${c.grupo}` === escenario)
          const logActivo = comp ? (comp.log_eventos ?? []) : resultado.logEventos
          const gruposActivos = comp ? (comp.grupos ?? resultado.grupos) : resultado.grupos
          const throughputActivo = comp ? comp.throughput : resultado.throughput
          const labelActivo = comp ? `+1 máquina en G${comp.grupo}` : 'Base'
          return (
            <TablaEventos
              eventos={logActivo}
              grupos={gruposActivos}
              throughput={throughputActivo}
              label={labelActivo}
              grupoExtra={comp?.grupo ?? null}
            />
          )
        })()}

        {estado === ESTADO.LISTO && resultado && vista === 'resumen' && (
          <div className="flex-1 overflow-y-auto p-4">
            <VistaResumen resultado={resultado} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tabla de Eventos
const GRUPOS_IDS = [1, 2, 3, 4, 5]

// Badges visuales para estado de trabajo y de máquina
function badgeTrabajo(estado) {
  if (!estado) return <span className="opacity-20 text-xs">—</span>
  if (estado === 'Completado')
    return <span className="badge badge-accent badge-xs whitespace-nowrap">✓ Completado</span>
  if (estado === 'Esperando atención')
    return <span className="badge badge-warning badge-xs whitespace-nowrap">En cola</span>
  // En grupo N
  return <span className="badge badge-success badge-xs whitespace-nowrap">{estado}</span>
}

function badgeMaquina(estado) {
  if (!estado) return <span className="opacity-20 text-xs">—</span>
  if (estado === 'Ocupada')
    return <span className="badge badge-error badge-xs">Ocupada</span>
  return <span className="badge badge-success badge-xs">Libre</span>
}

function TablaEventos({ eventos, grupos = [], throughput, label = 'Base', grupoExtra = null }) {
  const [filtro, setFiltro] = useState('')

  if (!eventos || eventos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <div className="text-4xl">⚠️</div>
        <p className="font-semibold text-base-content/60">El backend no devolvió eventos.</p>
        <code className="text-xs bg-base-200 px-3 py-1 rounded">
          python -m uvicorn main:app --port 8001 --reload
        </code>
      </div>
    )
  }

  // ── Calcular máximo trabajo_id para columnas dinámicas
  const maxTrabajo = eventos.reduce((mx, e) => {
    if (e.estado_trabajos) {
      const ids = Object.keys(e.estado_trabajos).map(Number)
      if (ids.length > 0) mx = Math.max(mx, ...ids)
    }
    return mx
  }, 0)
  const trabajoIds = Array.from({ length: maxTrabajo }, (_, i) => i + 1)

  // ── Columnas de máquinas por grupo: {g: count}
  const maquinasPorGrupo = {}
  for (const ev of eventos) {
    if (ev.estado_maquinas) {
      for (const [gStr, arr] of Object.entries(ev.estado_maquinas)) {
        const g = Number(gStr)
        if (!maquinasPorGrupo[g]) maquinasPorGrupo[g] = arr.length
      }
      break // basta con el primer evento que lo tenga
    }
  }
  // Lista ordenada de grupos con sus slots: [{g, slots}]
  const gruposConMaq = Object.entries(maquinasPorGrupo)
    .map(([g, slots]) => ({ g: Number(g), slots }))
    .sort((a, b) => a.g - b.g)

  const filas = filtro
    ? eventos.filter(e =>
      (e.evento ?? '').toLowerCase().includes(filtro.toLowerCase()) ||
      String(e.trabajo_id ?? '').includes(filtro) ||
      String(e.grupo ?? '').includes(filtro) ||
      (e.tipo_manufactura ?? '').toLowerCase().includes(filtro.toLowerCase()) ||
      (e.descripcion ?? '').toLowerCase().includes(filtro.toLowerCase())
    )
    : eventos

  const getGrupoSnap = (ev) => {
    const snap = {}
    if (ev.estado_grupos) {
      ev.estado_grupos.forEach(s => { snap[s.g] = s })
    }
    return snap
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      <div className="shrink-0 bg-base-100 border-b border-base-300 px-3 py-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`badge font-bold text-xs ${grupoExtra ? 'badge-secondary' : 'badge-primary'}`}>
            {label}
          </span>

          {throughput != null && (
            <span className="text-xs font-mono">
              Throughput: <strong className="text-primary">{throughput} trab/hs</strong>
            </span>
          )}

          {grupos.length > 0 && (
            <div className="flex gap-2 flex-wrap ml-2">
              {grupos.map(g => {
                const esExtra = g.id === grupoExtra
                return (
                  <div key={g.id}
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg border ${esExtra ? 'border-secondary bg-secondary/10' : 'border-base-300 bg-base-200'
                      }`}>
                    <span className="font-bold">
                      G{g.id}{esExtra ? <span className="text-secondary ml-0.5">+1</span> : ''}
                    </span>
                    <span className="text-base-content/60">·</span>
                    <span title="Utilización"
                      className={`font-mono ${g.utilizacion >= 90 ? 'text-error' : g.utilizacion >= 75 ? 'text-warning' : 'text-success'}`}>
                      {g.utilizacion}%
                    </span>
                    <span className="text-base-content/40">|</span>
                    <span title="Espera promedio" className="font-mono text-info">{g.espera_promedio ?? g.espera}min</span>
                    <span className="text-base-content/40">|</span>
                    <span title="Cola promedio" className="font-mono opacity-60">{g.cola_promedio}c</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 px-3 py-2 bg-base-100 border-b border-base-300 flex-wrap shrink-0">
        <span className="font-bold text-sm shrink-0">Réplica 1</span>
        <span className="badge badge-ghost badge-sm">{eventos.length} eventos</span>
        {filtro && <span className="badge badge-warning badge-sm">{filas.length} visibles</span>}
        <input type="text" placeholder="Filtrar por evento, tipo, grupo…"
          className="input input-bordered input-xs flex-1 min-w-40 max-w-56"
          value={filtro} onChange={e => setFiltro(e.target.value)} />
        {filtro && <button className="btn btn-ghost btn-xs" onClick={() => setFiltro('')}>✕</button>}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="table table-xs table-zebra w-full">
          <thead className="sticky top-0 bg-base-200 z-10 text-xs">
            <tr>
              <th className="whitespace-nowrap">Reloj (min)</th>
              <th className="min-w-[240px]">Evento</th>
              <th className="whitespace-nowrap">Tipo mfg</th>
              <th
                className="whitespace-nowrap cursor-help text-accent"
                title="Random que determinó el Tipo de manufactura (solo en Llegada). En otros eventos no hay selección de tipo, por eso muestra —.">
                R. tipo ↓
              </th>
              <th
                className="whitespace-nowrap cursor-help"
                title="Random para calcular el tiempo de servicio (Inicio Servicio) o el intervalo hasta la próxima llegada (Llegada)">
                R. servicio ↓
              </th>

              <th className="whitespace-nowrap cursor-help"
                title="Tiempo sorteado usando la distribución exponencial para el servicio">
                T. calc serv. (min)
              </th>
              <th className="whitespace-nowrap cursor-help"
                title="Reloj + T.calc = momento en que finaliza el servicio o llega el próximo trabajo">
                Hora fin (min)
              </th>

              {/* ── Próxima llegada */}
              <th className="whitespace-nowrap cursor-help text-warning"
                title="RND usado para calcular el tiempo hasta la próxima llegada">
                R. próx. llegada ↓
              </th>
              <th className="whitespace-nowrap cursor-help text-warning"
                title="Tiempo entre llegadas calculado con la distribución exponencial (media=20 min)">
                T. entre llegadas
              </th>
              <th className="whitespace-nowrap cursor-help text-warning"
                title="Hora del reloj en que arriba el próximo trabajo">
                Próx. llegada (reloj)
              </th>

              {GRUPOS_IDS.map(g => (
                <th key={`maq${g}`}
                  className="whitespace-nowrap text-center cursor-help"
                  title={`Máquinas libres en Grupo ${g} en este instante`}>
                  <Boxes /> G{g}
                </th>
              ))}

              {GRUPOS_IDS.map(g => (
                <th key={`cola${g}`}
                  className="whitespace-nowrap text-center cursor-help"
                  title={`Trabajos en cola del Grupo ${g} en este instante`}>
                  <Clock /> G{g}
                </th>
              ))}

              {GRUPOS_IDS.map(g => (
                <th key={`fin${g}`}
                  className="whitespace-nowrap text-center cursor-help text-success"
                  title={`Próximos finales de servicio en Grupo ${g}`}>
                  T.Fin G{g}
                </th>
              ))}

              {/* ── Estado individual de máquinas por grupo */}
              {gruposConMaq.map(({ g, slots }) =>
                Array.from({ length: slots }, (_, i) => (
                  <th key={`estmaq-g${g}-m${i + 1}`}
                    className="whitespace-nowrap text-center cursor-help text-info"
                    title={`Estado de la máquina ${i + 1} del Grupo ${g}`}>
                    G{g}-M{i + 1}
                  </th>
                ))
              )}

              {/* ── Estado y Tipo de cada trabajo */}
              {trabajoIds.map(tid => (
                <Fragment key={tid}>
                  <th
                    className="whitespace-nowrap text-center cursor-help text-secondary"
                    title={`Estado del Trabajo ${tid} en este instante`}>
                    T#{tid} Estado
                  </th>
                  <th
                    className="whitespace-nowrap text-center cursor-help text-accent"
                    title={`Tipo de manufactura del Trabajo ${tid}`}>
                    T#{tid} Tipo
                  </th>
                </Fragment>
              ))}

              <th
                className="whitespace-nowrap text-center cursor-help text-accent font-bold"
                title="IDs de trabajos que completaron todos sus grupos hasta este momento">
                ✓ Terminados
              </th>

              <th>Paso</th>
              <th>Secuencia</th>

              <th className="min-w-[240px] text-base-content/40">Descripción</th>
            </tr>

            <tr className="text-xs opacity-50">
              <th colSpan={7} />
              <th colSpan={3} className="text-center border-l border-warning text-warning">← Próx. llegada →</th>
              <th colSpan={5} className="text-center border-l border-base-300">← Máq. libres por grupo →</th>
              <th colSpan={5} className="text-center border-l border-base-300">← Cola por grupo →</th>
              <th colSpan={5} className="text-center border-l border-base-300 text-success">← T. Fin Servicio →</th>
              {gruposConMaq.length > 0 && (
                <th
                  colSpan={gruposConMaq.reduce((s, x) => s + x.slots, 0)}
                  className="text-center border-l border-info text-info">
                  ← Estado máquinas →
                </th>
              )}
              {trabajoIds.length > 0 && (
                <th
                  colSpan={trabajoIds.length * 2}
                  className="text-center border-l border-secondary text-secondary">
                  ← Estado · Tipo por trabajo →
                </th>
              )}
              <th className="text-center border-l border-accent text-accent">Terminados</th>
              <th colSpan={3} />
            </tr>
          </thead>

          <tbody>
            {filas.map((ev, i) => {
              const snap = getGrupoSnap(ev)

              const rowClass =
                ev.evento?.includes('COMPLETADO') ? 'bg-accent/10' :
                  ev.evento?.includes('Llegada') ? 'bg-primary/5' :
                    ev.evento?.includes('espera') ? 'bg-warning/10' :
                      ev.evento?.includes('Inicio sim') ? 'bg-base-300/30' : ''

              return (
                <tr key={i} className={rowClass}>
                  <td className="font-mono font-bold text-primary whitespace-nowrap">{ev.reloj}</td>

                  <td className="font-semibold text-xs min-w-[240px] leading-snug">
                    {ev.evento ?? '—'}
                  </td>

                  <td className="whitespace-nowrap">
                    {ev.tipo_manufactura
                      ? <span className="badge badge-accent badge-xs">{ev.tipo_manufactura}</span>
                      : <span className="opacity-20 text-xs">—</span>}
                  </td>

                  <td className="font-mono text-xs">
                    {ev.random_tipo != null
                      ? <span className="text-accent font-bold">{ev.random_tipo}</span>
                      : <span className="opacity-20">—</span>}
                  </td>

                  <td className="font-mono text-xs opacity-70">
                    {ev.random_usado != null ? ev.random_usado : <span className="opacity-20">—</span>}
                  </td>

                  <td className="font-mono font-semibold text-info whitespace-nowrap">
                    {ev.tiempo_calculado ?? <span className="opacity-20">—</span>}
                  </td>
                  <td className="font-mono font-semibold text-success whitespace-nowrap">
                    {ev.tiempo_fin ?? <span className="opacity-20">—</span>}
                  </td>

                  {/* Próxima llegada */}
                  <td className="font-mono text-xs text-warning">
                    {ev.prox_llegada_rnd != null
                      ? <span className="font-bold">{ev.prox_llegada_rnd}</span>
                      : <span className="opacity-20">—</span>}
                  </td>
                  <td className="font-mono text-xs text-warning">
                    {ev.prox_llegada_t_calc != null
                      ? ev.prox_llegada_t_calc
                      : <span className="opacity-20">—</span>}
                  </td>
                  <td className="font-mono font-semibold text-warning whitespace-nowrap">
                    {ev.prox_llegada_reloj != null
                      ? ev.prox_llegada_reloj
                      : <span className="opacity-20">—</span>}
                  </td>

                  {GRUPOS_IDS.map(g => {
                    const s = snap[g]
                    return (
                      <td key={`maq${g}`} className="text-center">
                        {s != null
                          ? <span className={`badge badge-xs font-bold ${s.maq_libres === 0 ? 'badge-error' : 'badge-success'}`}>
                            {s.maq_libres}
                          </span>
                          : <span className="opacity-20 text-xs">—</span>}
                      </td>
                    )
                  })}

                  {GRUPOS_IDS.map(g => {
                    const s = snap[g]
                    return (
                      <td key={`cola${g}`} className="text-center">
                        {s != null
                          ? <span className={`badge badge-xs ${s.cola > 2 ? 'badge-error' : s.cola > 0 ? 'badge-warning' : 'badge-ghost'}`}>
                            {s.cola}
                          </span>
                          : <span className="opacity-20 text-xs">—</span>}
                      </td>
                    )
                  })}

                  {GRUPOS_IDS.map(g => {
                    const s = snap[g]
                    return (
                      <td key={`fin${g}`} className="text-center">
                        {s != null && s.fin_servicio && s.fin_servicio.length > 0
                          ? <div className="flex flex-col gap-0.5 items-center">
                            {s.fin_servicio.map((tf, idx) => (
                              <span key={idx} className="badge badge-success badge-outline badge-xs font-mono">{tf}</span>
                            ))}
                          </div>
                          : <span className="opacity-20 text-xs">—</span>}
                      </td>
                    )
                  })}

                  {/* ── Estado de cada máquina individual por grupo */}
                  {gruposConMaq.map(({ g, slots }) =>
                    Array.from({ length: slots }, (_, i) => {
                      const estadoArr = ev.estado_maquinas?.[g]
                      return (
                        <td key={`estmaq-g${g}-m${i + 1}`} className="text-center whitespace-nowrap">
                          {estadoArr ? badgeMaquina(estadoArr[i]) : <span className="opacity-20 text-xs">—</span>}
                        </td>
                      )
                    })
                  )}

                  {/* ── Estado y Tipo de cada trabajo */}
                  {trabajoIds.map(tid => (
                    <Fragment key={tid}>
                      <td className="text-center whitespace-nowrap">
                        {badgeTrabajo(ev.estado_trabajos?.[tid])}
                      </td>
                      <td className="text-center whitespace-nowrap">
                        {badgeTipo(ev.tipo_trabajos?.[tid])}
                      </td>
                    </Fragment>
                  ))}

                  {/* ── Trabajos terminados acumulados */}
                  <td className="text-center whitespace-nowrap">
                    {ev.trabajos_terminados && ev.trabajos_terminados.length > 0
                      ? <span className="badge badge-accent badge-sm font-bold font-mono">
                        {ev.trabajos_terminados.length}
                      </span>
                      : <span className="opacity-20 text-xs">—</span>}
                  </td>

                  <td className="font-mono text-xs text-center">
                    {ev.paso != null && ev.total_pasos != null
                      ? <span className="badge badge-ghost badge-xs">{ev.paso}/{ev.total_pasos}</span>
                      : <span className="opacity-20">—</span>}
                  </td>

                  <td className="whitespace-nowrap text-xs">
                    {ev.secuencia
                      ? <span className="font-mono text-secondary">G{ev.secuencia.join('→G')}</span>
                      : <span className="opacity-20">—</span>}
                  </td>

                  <td className="text-xs opacity-40 min-w-[240px]">{ev.descripcion}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filas.length === 0 && filtro && (
          <div className="text-center py-8">
            <p className="opacity-40">Sin coincidencias para "<strong>{filtro}</strong>"</p>
            <button className="btn btn-ghost btn-xs mt-2" onClick={() => setFiltro('')}>Borrar filtro</button>
          </div>
        )}
      </div>
    </div>
  )
}

function VistaResumen({ resultado }) {
  const ganador = resultado.comparativa.reduce(
    (max, c) => (c.mejora_pct > max.mejora_pct ? c : max),
    resultado.comparativa[0]
  )

  return (
    <div className="flex flex-col gap-4 max-w-5xl">

      {/* KPIs */}
      <div className="stats stats-horizontal shadow bg-base-100 w-full flex-wrap">
        <div className="stat">
          <div className="stat-title">Rendimiento base</div>
          <div className="stat-value text-primary text-2xl">{resultado.throughput}</div>
          <div className="stat-desc">trabajos/hora</div>
        </div>
        <div className="stat">
          <div className="stat-title">Tiempo simulado</div>
          <div className="stat-value text-secondary text-2xl">{resultado.tiempoTotal}</div>
          <div className="stat-desc">minutos</div>
        </div>
        <div className="stat">
          <div className="stat-title">Mayor cuello de botella</div>
          <div className="stat-value text-error text-2xl">
            G{resultado.grupos.reduce((mx, g) => g.espera > mx.espera ? g : mx).id}
          </div>
          <div className="stat-desc">mayor espera promedio</div>
        </div>
        <div className="stat">
          <div className="stat-title">Mejor escenario</div>
          <div className="stat-value text-success text-2xl">+1 en G{ganador.grupo}</div>
          <div className="stat-desc">+{ganador.mejora_pct}% rendimiento</div>
        </div>
      </div>

      {/* Tabla grupos */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-4">
          <h2 className="card-title text-base mb-2">Sistema Base — Estadísticas por Grupo <Boxes size={20} /></h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-sm">
              <thead>
                <tr>
                  <th>Grupo</th><th>Máq.</th><th>Utilización</th>
                  <th>Espera prom. (min)</th><th>Cola prom.</th>
                </tr>
              </thead>
              <tbody>
                {resultado.grupos.map(g => (
                  <tr key={g.id}>
                    <td><span className="badge badge-primary font-bold">G{g.id}</span></td>
                    <td>{g.maquinas}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <progress
                          className={`progress w-20 ${g.utilizacion >= 90 ? 'progress-error' : g.utilizacion >= 75 ? 'progress-warning' : 'progress-success'}`}
                          value={g.utilizacion} max={100}
                        />
                        <span className={`badge ${badgeUtil(g.utilizacion)} badge-sm`}>{g.utilizacion}%</span>
                      </div>
                    </td>
                    <td className="font-mono font-semibold">{g.espera}</td>
                    <td className="font-mono">{g.colaPromedio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Comparativa */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-4">
          <h2 className="card-title text-base mb-1">Comparativa — ¿Dónde agregar la máquina? <Blocks size={20} />  </h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-sm">
              <thead>
                <tr>
                  <th>Escenario</th><th>Rendimiento</th><th>Mejora vs base</th>
                  <th>Espera G5 (min)</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold opacity-60">
                  <td><span className="badge badge-ghost">Base</span></td>
                  <td>{resultado.throughput}</td>
                  <td>—</td>
                  <td>{resultado.grupos[4]?.espera}</td>
                  <td></td>
                </tr>
                {resultado.comparativa
                  .slice()
                  .sort((a, b) => b.mejora_pct - a.mejora_pct)
                  .map(c => {
                    const esMejor = c.grupo === ganador.grupo
                    return (
                      <tr key={c.grupo} className={esMejor ? 'bg-success/10' : ''}>
                        <td>
                          <span className="badge badge-primary badge-outline">+1 en G{c.grupo}</span>
                          {esMejor && <span className="badge badge-success ml-2 text-xs"><Star /> Mejor</span>}
                        </td>
                        <td className="font-mono font-bold">{c.throughput}</td>
                        <td>
                          <span className={`badge badge-sm ${c.mejora_pct > 5 ? 'badge-success' : c.mejora_pct > 0 ? 'badge-warning' : 'badge-error'}`}>
                            {c.mejora_pct > 0 ? '+' : ''}{c.mejora_pct}%
                          </span>
                        </td>
                        <td className="font-mono">{c.espera_g5}</td>
                        <td>{esMejor && <span className="text-xs text-success font-semibold">✓ Recomendado</span>}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          <div className="alert alert-success mt-4">
            <span>
              Agregar una máquina al <strong>Grupo {ganador.grupo}</strong> mejora el rendimiento
              en <strong>+{ganador.mejora_pct}%</strong>
              {' '}(de {resultado.throughput} a {ganador.throughput} trab/hs).
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}