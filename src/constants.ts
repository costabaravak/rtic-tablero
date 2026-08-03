import type { Estado } from './types'

export const ESTADOS: Record<Estado, string> = {
  pendiente: 'Pendiente',
  curso: 'En curso',
  completada: 'Completada',
  riesgo: 'En riesgo',
}

export const ORDEN_ESTADOS: Estado[] = ['completada', 'curso', 'pendiente', 'riesgo']

export const ISLA_META: Record<string, { sillas: number; servicios: string | null }> = {
  'Isla 1': { sillas: 6, servicios: null },
  'Isla 2': { sillas: 6, servicios: null },
  'Isla 3': { sillas: 6, servicios: 'Direccional · Cementación · Fluidos · Control de Sólidos' },
  'Isla 4': { sillas: 6, servicios: null },
  'Isla 5': { sillas: 6, servicios: 'Coiled Tubing · Stacks · Snubbing · Bombeo Pre-Frac' },
  'Isla 6': { sillas: 2, servicios: 'Toyota Well · RMA · Exploratorios · LNG' },
}
