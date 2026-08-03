export type Estado = 'pendiente' | 'curso' | 'completada' | 'riesgo'

export interface Indicador {
  id: string
  isla: string
  categoria: string
  monitor: number
  monitor_titulo: string
  nombre: string
  rotacion: boolean
  estado: Estado
  progreso: number
  responsable: string
  comentario: string
  orden: number
  updated_at: string
}

export interface Corte {
  id: string
  semana: number
  fecha: string
  avance_global: number
  completados: number
  en_curso: number
  pendientes: number
  en_riesgo: number
  nota: string
}
