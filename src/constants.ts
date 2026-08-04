import type { Estado } from './types'

export const ESTADOS: Record<Estado, string> = {
  pendiente: 'Pendiente',
  curso: 'En curso',
  completada: 'Completada',
  riesgo: 'Alerta',
}

export const ORDEN_ESTADOS: Estado[] = ['completada', 'curso', 'pendiente', 'riesgo']

// SHA-256 de la clave de edición. Para cambiarla: printf %s "nueva-clave" | shasum -a 256
export const HASH_CLAVE_EDICION = '4f56cdbf9e3f9424ff660853f17b2e3197da0a767a3fa582dfd6b1ae0ea35228'

export const ISLA_META: Record<string, { sillas: number; servicios: string | null; prioridad?: string }> = {
  'Isla 1': { sillas: 6, servicios: null },
  'Isla 2': { sillas: 6, servicios: null },
  'Isla 3': { sillas: 6, servicios: 'Direccional · Cementación · Fluidos · Control de Sólidos', prioridad: 'Priorizar Direccional' },
  'Isla 4': { sillas: 6, servicios: null },
  'Isla 5': { sillas: 6, servicios: 'Coiled Tubing · Stacks · Snubbing · Bombeo Pre-Frac', prioridad: 'Priorizar Coiled Tubing' },
  'Isla 6': { sillas: 2, servicios: 'Toyota Well · RMA · Exploratorios · LNG' },
}
