const grupos = [
  { id: 1, maquinas: 3, badge: 'badge-primary' },
  { id: 2, maquinas: 2, badge: 'badge-warning' },
  { id: 3, maquinas: 4, badge: 'badge-success' },
  { id: 4, maquinas: 3, badge: 'badge-error' },
  { id: 5, maquinas: 1, badge: 'badge-secondary' },
]

const coloresGrupo = {
  1: 'badge-primary',
  2: 'badge-warning',
  3: 'badge-success',
  4: 'badge-error',
  5: 'badge-secondary',
}

const manufacturas = [
  {
    id: 1,
    prob: '30%',
    alert: 'alert-info',
    badge: 'badge-info',
    secuencia: [3, 1, 2],
    tiempos: [0.5, 0.8, 0.8],
  },
  {
    id: 2,
    prob: '40%',
    alert: 'alert-warning',
    badge: 'badge-warning',
    secuencia: [4, 1, 3],
    tiempos: [1.1, 0.8, 0.75],
  },
  {
    id: 3,
    prob: '10%',
    alert: 'alert-success',
    badge: 'badge-success',
    secuencia: [2, 5, 1, 4, 3],
    tiempos: [1.9, 0.25, 0.7, 0.9, 1.0],
  },
  {
    id: 4,
    prob: '20%',
    alert: 'alert-error',
    badge: 'badge-error',
    secuencia: [1, 5, 4],
    tiempos: [1.4, 1.8, 0.4],
  },
]

export default function Consigna() {
  return (
    <div className="min-h-screen bg-base-200 p-6 max-w-4xl mx-auto">

      {/* ── HEADER ── */}
      <div className="text-center mb-8">
        <div className="badge badge-outline badge-primary mb-3 tracking-widest text-xs">
          SIMULACIÓN · TP Final
        </div>
        <h1 className="text-4xl font-extrabold text-primary mb-2">Fábrica de Manufacturas</h1>
        <p className="text-base-content/60 text-base">
          Simulación de colas de trabajos sobre grupos de máquinas
        </p>
      </div>

      {/* ── CONSIGNA ── */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg">📋 Consigna</h2>
          <p className="text-base-content/80 leading-relaxed">
            Una fábrica de manufacturas consiste en <strong>cinco grupos de máquinas</strong>, con 3, 2, 4, 3 y 1
            máquinas idénticas respectivamente. Los trabajos llegan con un{' '}
            <strong>tiempo medio de llegada de 20 min (distribución exponencial)</strong>. Se fabrican{' '}
            <strong>4 tipos de manufacturas</strong> con probabilidades 0,3 – 0,4 – 0,1 – 0,2.
            Cada tipo requiere pasar por una secuencia específica de grupos de máquinas.
            Si todas las máquinas de un grupo están ocupadas, el trabajo{' '}
            <strong>espera en cola</strong>.
          </p>
          <div className="alert alert-info mt-2">
            <span>
              🎯 <strong>Objetivo:</strong> Determinar en qué grupo conviene agregar una nueva máquina
              para mejorar la producción y cuantificar esa mejora.
            </span>
          </div>
        </div>
      </div>

      {/* ── GRUPOS DE MÁQUINAS ── */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg">🏭 Grupos de Máquinas</h2>
          <p className="text-base-content/60 text-sm mb-4">
            Cada grupo tiene varias máquinas idénticas en paralelo. Los trabajos forman una única cola por grupo.
          </p>

          <div className="flex flex-wrap gap-4">
            {grupos.map((g) => (
              <div key={g.id} className="card bg-base-200 flex-1 min-w-32 items-center">
                <div className="card-body items-center text-center p-4 gap-2">
                  <span className={`badge ${g.badge} badge-lg font-bold text-base`}>G{g.id}</span>
                  <div className="flex flex-wrap justify-center gap-1">
                    {Array.from({ length: g.maquinas }).map((_, i) => (
                      <span key={i} className="text-2xl">🖥️</span>
                    ))}
                  </div>
                  <span className="text-xs text-base-content/50">
                    {g.maquinas} máquina{g.maquinas > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Leyenda cola */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <div className="badge badge-outline badge-primary gap-1 py-3 px-4">📦 Cola de espera</div>
            <span className="text-base-content/40 font-bold text-lg">→</span>
            <div className="badge badge-outline badge-success gap-1 py-3 px-4">🖥️ Máquina</div>
            <span className="text-base-content/40 font-bold text-lg">→</span>
            <div className="badge badge-outline badge-warning gap-1 py-3 px-4">✅ Tarea lista</div>
          </div>
        </div>
      </div>

      {/* ── LLEGADA DE TRABAJOS ── */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg">📥 Llegada de Trabajos</h2>
          <div className="flex flex-wrap items-center gap-4">
            {/* Fuente */}
            <div className="stat bg-base-200 rounded-box flex-none">
              <div className="stat-figure text-4xl">🚚</div>
              <div className="stat-title">Tiempo entre llegadas</div>
              <div className="stat-value text-primary text-2xl">20 min</div>
              <div className="stat-desc">Distribución Exponencial</div>
            </div>

            <span className="text-base-content/40 font-bold text-2xl">→</span>

            {/* Tipos con probabilidad */}
            <div className="flex-1 min-w-48">
              <p className="text-xs text-base-content/50 mb-2">Tipo asignado aleatoriamente al llegar</p>
              <div className="flex flex-wrap gap-2">
                {manufacturas.map((m) => (
                  <div key={m.id} className={`badge ${m.badge} badge-lg gap-1`}>
                    Tipo {m.id} · {m.prob}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECUENCIAS ── */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg">🔀 Secuencias de Procesamiento por Tipo</h2>
          <p className="text-base-content/60 text-sm mb-4">
            Cada manufactura recorre los grupos en orden. Hace cola en cada grupo y espera a que una máquina quede libre.
          </p>

          <div className="flex flex-col gap-4">
            {manufacturas.map((m) => (
              <div key={m.id} className={`alert ${m.alert} flex-col items-start gap-3`}>
                {/* Encabezado */}
                <div className="flex items-center gap-2 font-bold text-base">
                  <span>Tipo {m.id}</span>
                  <div className={`badge ${m.badge} badge-outline`}>{m.prob}</div>
                </div>

                {/* Flujo con flechas */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="badge badge-ghost badge-lg">Llegada</div>

                  {m.secuencia.map((g, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-bold opacity-60">→</span>
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`badge ${coloresGrupo[g]} badge-lg font-bold`}>G{g}</div>
                        <span className="text-xs opacity-70">{m.tiempos[idx]} hs</span>
                      </div>
                    </div>
                  ))}

                  <span className="font-bold opacity-60">→</span>
                  <div className="badge badge-ghost badge-lg">Salida ✅</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABLA RESUMEN ── */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg">📊 Tabla Resumen</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Prob.</th>
                  <th>Secuencia de Grupos</th>
                  <th>Tiempos de Servicio (hs)</th>
                </tr>
              </thead>
              <tbody>
                {manufacturas.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className={`badge ${m.badge} font-bold`}>Tipo {m.id}</div>
                    </td>
                    <td className="font-semibold">{m.prob}</td>
                    <td>
                      <div className="flex flex-wrap items-center gap-1">
                        {m.secuencia.map((g, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <span className={`badge ${coloresGrupo[g]} badge-sm font-bold`}>G{g}</span>
                            {i < m.secuencia.length - 1 && (
                              <span className="text-base-content/30 text-xs">→</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="font-mono text-sm">{m.tiempos.join(' – ')} hs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── OBJETIVO FINAL ── */}
      <div className="card bg-primary text-primary-content shadow-md">
        <div className="card-body">
          <h2 className="card-title text-lg">🎯 Pregunta del TP</h2>
          <p className="text-lg font-semibold leading-relaxed">
            ¿En qué grupo de máquinas conviene agregar <u>una nueva máquina</u> para{' '}
            maximizar la mejora en la producción de la fábrica?
          </p>
          <p className="text-primary-content/70 text-sm mt-1">
            → Simular el sistema base, luego simular añadiendo +1 máquina a cada grupo por separado
            y comparar métricas: tiempo de espera, throughput y utilización.
          </p>
        </div>
      </div>

    </div>
  )
}
