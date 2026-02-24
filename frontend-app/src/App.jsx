import { useState } from 'react'
import Consigna from './components/consigna'
import Simulacion from './components/simulacion'

const VISTAS = { HOME: 'home', CONSIGNA: 'consigna', SIMULACION: 'simulacion' }

function App() {
  const [vista, setVista] = useState(VISTAS.HOME)

  if (vista !== VISTAS.HOME) {
    return (
      <div>
        {/* Navbar sticky */}
        <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50 px-4">
          <button className="btn btn-ghost btn-sm gap-2" onClick={() => setVista(VISTAS.HOME)}>
            ← Volver
          </button>
          <span className="text-sm text-base-content/50 ml-2">
            {vista === VISTAS.CONSIGNA ? '📋 Consigna' : '▶ Simulación'}
          </span>
        </div>
        {vista === VISTAS.CONSIGNA && <Consigna />}
        {vista === VISTAS.SIMULACION && <Simulacion />}
      </div>
    )
  }

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-lg">
          <div className="badge badge-primary badge-outline mb-4 tracking-widest text-xs">
            SIMULACIÓN · TP Final
          </div>
          <h1 className="text-5xl font-extrabold text-primary mb-4">
            Fábrica de Manufacturas
          </h1>
          <p className="text-base-content/60 mb-10 leading-relaxed">
            Simulación de colas en grupos de máquinas con distintos tipos de manufactura.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="btn btn-outline btn-primary btn-lg gap-2"
              onClick={() => setVista(VISTAS.CONSIGNA)}
            >
              📋 Ver Consigna
            </button>
            <button
              className="btn btn-primary btn-lg gap-2"
              onClick={() => setVista(VISTAS.SIMULACION)}
            >
              ▶ Ir a Simulación
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
