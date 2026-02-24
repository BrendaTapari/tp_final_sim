/**
 * Cliente API para el backend de simulación.
 * Todas las llamadas pasan por el proxy de Vite (/api → http://localhost:8000/api).
 */

const BASE = '/api'

/**
 * Verifica que el backend esté activo.
 * @returns {{ status: string, mensaje: string }}
 */
export async function healthCheck() {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new Error('Backend no disponible')
  return res.json()
}

/**
 * Ejecuta la simulación enviando los parámetros al backend.
 *
 * @param {{
 *   replicaciones: number,
 *   tiempo_simulacion: number,
 *   tasa_llegada: number,
 *   semilla: number
 * }} params
 *
 * @returns {Promise<{
 *   throughput: number,
 *   tiempo_total: number,
 *   grupos: Array<{id, maquinas, utilizacion, espera_promedio, cola_promedio}>,
 *   comparativa: Array<{grupo, throughput, mejora_pct, espera_g5}>
 * }>}
 */
export async function simular(params) {
  const res = await fetch(`${BASE}/simular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }

  return res.json()
}

/**
 * Genera números pseudoaleatorios con el LCG.
 * @param {{ semilla, cantidad, modulo, multiplicador, incremento }} params
 * @returns {{ numeros_crudos, numeros_normalizados, cantidad }}
 */
export async function generar(params) {
  const res = await fetch(`${BASE}/generar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

/**
 * Verifica que los parámetros del LCG sean válidos (Hull-Dobell).
 * @param {{ semilla, cantidad, modulo, multiplicador, incremento }} params
 * @returns {{ valido, modulo, multiplicador, incremento }}
 */
export async function verificarParametros(params) {
  const res = await fetch(`${BASE}/verificar-parametros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

/**
 * Dado solo la cantidad, devuelve parámetros LCG válidos generados automáticamente.
 * @param {number} cantidad
 * @returns {{ semilla, cantidad, modulo, multiplicador, incremento, _info }}
 */
export async function generarParametros(cantidad) {
  const res = await fetch(`${BASE}/generar-parametros/${cantidad}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

