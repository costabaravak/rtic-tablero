import type { Estado } from './types'

export const ESTADOS: Record<Estado, string> = {
  pendiente: 'Pendiente',
  curso: 'En curso',
  completada: 'Completada',
  riesgo: 'En riesgo',
}

export const ORDEN_ESTADOS: Estado[] = ['completada', 'curso', 'pendiente', 'riesgo']

// SHA-256 de la clave de edición. Para cambiarla: printf %s "nueva-clave" | shasum -a 256
export const HASH_CLAVE_EDICION = '2313537addbc6a738c4805ed5e44dfe0a7d1ddc02f73ead65b17f82c2bfc40ea'

export const ISLA_META: Record<string, { sillas: number; servicios: string | null }> = {
  'Isla 1': { sillas: 6, servicios: null },
  'Isla 2': { sillas: 6, servicios: null },
  'Isla 3': { sillas: 6, servicios: 'Direccional · Cementación · Fluidos · Control de Sólidos' },
  'Isla 4': { sillas: 6, servicios: null },
  'Isla 5': { sillas: 6, servicios: 'Coiled Tubing · Stacks · Snubbing · Bombeo Pre-Frac' },
  'Isla 6': { sillas: 2, servicios: 'Toyota Well · RMA · Exploratorios · LNG' },
}
