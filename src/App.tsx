import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { ESTADOS } from './constants'
import type { Corte, Estado, Indicador } from './types'
import { Chart, type Punto } from './components/Chart'
import { IslaCard } from './components/IslaCard'

type Filtro = 'todos' | Estado

const FILTROS: { f: Filtro; label: string }[] = [
  { f: 'todos', label: 'Todos' },
  { f: 'completada', label: 'Completados' },
  { f: 'curso', label: 'En curso' },
  { f: 'pendiente', label: 'Pendientes' },
  { f: 'riesgo', label: 'En riesgo' },
]

export default function App() {
  const [inds, setInds] = useState<Indicador[] | null>(null)
  const [cortes, setCortes] = useState<Corte[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [editar, setEditar] = useState(false)
  const [ultimoCambio, setUltimoCambio] = useState<string | null>(null)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  async function cargar() {
    const [ri, rc] = await Promise.all([
      supabase.from('indicadores').select('*').order('orden'),
      supabase.from('cortes_semanales').select('*').order('semana'),
    ])
    if (ri.error || rc.error) {
      setError(ri.error?.message ?? rc.error?.message ?? 'Error desconocido')
      return
    }
    setError(null)
    setInds(ri.data as Indicador[])
    setCortes(rc.data as Corte[])
  }

  useEffect(() => {
    cargar()
    const canal = supabase
      .channel('rtic-cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'indicadores' }, (payload) => {
        setInds((prev) => {
          if (!prev) return prev
          if (payload.eventType === 'DELETE') {
            const viejo = payload.old as Partial<Indicador>
            return prev.filter((k) => k.id !== viejo.id)
          }
          const nuevo = payload.new as Indicador
          if (payload.eventType === 'INSERT') {
            if (prev.some((k) => k.id === nuevo.id)) return prev
            return [...prev, nuevo].sort((a, b) => a.orden - b.orden)
          }
          return prev.map((k) => (k.id === nuevo.id ? nuevo : k))
        })
        setUltimoCambio(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cortes_semanales' }, () => {
        supabase
          .from('cortes_semanales')
          .select('*')
          .order('semana')
          .then(({ data }) => data && setCortes(data as Corte[]))
      })
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  function onCambio(id: string, patch: Partial<Indicador>) {
    setInds((prev) => prev?.map((k) => (k.id === id ? { ...k, ...patch } : k)) ?? prev)
    const previo = timers.current.get(id)
    if (previo) clearTimeout(previo)
    timers.current.set(
      id,
      setTimeout(async () => {
        timers.current.delete(id)
        const { error: e } = await supabase.from('indicadores').update(patch).eq('id', id)
        if (e) {
          alert(`No se pudo guardar el cambio: ${e.message}`)
          cargar()
        } else {
          setUltimoCambio(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
        }
      }, 500),
    )
  }

  async function agregar(base: Pick<Indicador, 'isla' | 'categoria' | 'monitor' | 'monitor_titulo'>, nombre: string, rotacion: boolean) {
    const orden = Math.max(0, ...(inds?.map((k) => k.orden) ?? [])) + 1
    const { data, error: e } = await supabase
      .from('indicadores')
      .insert({ ...base, nombre, rotacion, orden })
      .select()
      .single()
    if (e) {
      alert(`No se pudo agregar el indicador: ${e.message}`)
      return
    }
    const nuevo = data as Indicador
    setInds((prev) =>
      prev && !prev.some((k) => k.id === nuevo.id)
        ? [...prev, nuevo].sort((a, b) => a.orden - b.orden)
        : prev,
    )
    setUltimoCambio(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
  }

  async function eliminar(k: Indicador) {
    const delMonitor = inds?.filter(
      (x) => x.isla === k.isla && x.monitor === k.monitor,
    )
    if (delMonitor && delMonitor.length <= 1) {
      alert('No se puede eliminar el último indicador de un monitor: el monitor quedaría vacío y desaparecería del tablero. Agregá primero el reemplazo.')
      return
    }
    if (!confirm(`¿Eliminar "${k.nombre}" (${k.isla} · Monitor ${k.monitor})? Esta acción no se puede deshacer.`)) return
    const { error: e } = await supabase.from('indicadores').delete().eq('id', k.id)
    if (e) {
      alert(`No se pudo eliminar: ${e.message}`)
      return
    }
    setInds((prev) => prev?.filter((x) => x.id !== k.id) ?? prev)
    setUltimoCambio(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
  }

  const stats = useMemo(() => {
    if (!inds) return null
    const n = inds.length
    const global = Math.round(inds.reduce((s, k) => s + k.progreso, 0) / n)
    const cnt = (e: Estado) => inds.filter((k) => k.estado === e).length
    return {
      n,
      global,
      completada: cnt('completada'),
      curso: cnt('curso'),
      pendiente: cnt('pendiente'),
      riesgo: cnt('riesgo'),
    }
  }, [inds])

  const islas = useMemo(() => {
    if (!inds) return []
    const grupos = new Map<string, Indicador[]>()
    for (const k of inds) {
      if (!grupos.has(k.isla)) grupos.set(k.isla, [])
      grupos.get(k.isla)!.push(k)
    }
    return [...grupos.entries()]
  }, [inds])

  async function guardarCorte() {
    if (!stats) return
    const semana = (cortes.at(-1)?.semana ?? 0) + 1
    const fecha = new Date().toISOString().slice(0, 10)
    if (!confirm(`¿Guardar el corte de la Semana ${semana} (${fecha}) con ${stats.global} % de avance global?`))
      return
    const { error: e } = await supabase.from('cortes_semanales').insert({
      semana,
      fecha,
      avance_global: stats.global,
      completados: stats.completada,
      en_curso: stats.curso,
      pendientes: stats.pendiente,
      en_riesgo: stats.riesgo,
    })
    if (e) alert(`No se pudo guardar el corte: ${e.message}`)
    else cargar()
  }

  async function eliminarCorte(c: Corte) {
    if (
      !confirm(
        `¿Eliminar el corte de la Semana ${c.semana} (${c.fecha}, ${Math.round(Number(c.avance_global))} % de avance)? El punto desaparece del gráfico y esta acción no se puede deshacer.`,
      )
    )
      return
    const { error: e } = await supabase.from('cortes_semanales').delete().eq('id', c.id)
    if (e) {
      alert(`No se pudo eliminar el corte: ${e.message}`)
      return
    }
    setCortes((prev) => prev.filter((x) => x.id !== c.id))
    setUltimoCambio(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
  }

  const puntos = useMemo(() => {
    const pts: Punto[] = cortes.map((c) => ({
      label: `Sem ${c.semana}`,
      avance: Math.round(Number(c.avance_global)),
    }))
    if (stats) pts.push({ label: 'Hoy', avance: stats.global, provisional: true })
    return pts
  }, [cortes, stats])

  if (error)
    return (
      <div className="wrap">
        <div className="aviso error">
          <p>
            <strong>No se pudo leer la base de datos.</strong>
          </p>
          <p>{error}</p>
          <p>
            Si las tablas todavía no existen, pegá el contenido de <code>supabase-schema.sql</code> en el SQL
            Editor de Supabase y ejecutalo. Después recargá esta página.
          </p>
        </div>
      </div>
    )

  if (!inds || !stats)
    return (
      <div className="wrap">
        <div className="aviso">Cargando tablero…</div>
      </div>
    )

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <p className="eyebrow">RTIC · Well Construction</p>
          <h1>Tablero de avance de implementación</h1>
          <p className="sub">
            Seguimiento semanal de los indicadores de las 12 pantallas — 6 islas · 12 monitores · {stats.n}{' '}
            indicadores · 32 sillas.
          </p>
        </div>
        <div className="head-right">
          <div>
            <button className={`btn${editar ? ' activo' : ''}`} onClick={() => setEditar(!editar)}>
              {editar ? 'Salir del modo edición' : 'Modo edición'}
            </button>{' '}
            {editar && (
              <button className="btn primario" onClick={guardarCorte}>
                Guardar corte semanal
              </button>
            )}
          </div>
          <span className="sync">
            {ultimoCambio ? `Último cambio guardado ${ultimoCambio}` : 'Conectado a la base de datos'}
          </span>
        </div>
      </header>

      <section className="tiles" aria-label="Resumen general">
        <div className="tile hero">
          <div className="k">Avance global</div>
          <div className="v">
            {stats.global}
            <span className="unit"> %</span>
          </div>
          <div className="d">promedio de los {stats.n} indicadores</div>
        </div>
        {(['completada', 'curso', 'pendiente', 'riesgo'] as Estado[]).map((e) => (
          <div className="tile" key={e}>
            <div className="k">{e === 'completada' ? 'Completados' : e === 'curso' ? 'En curso' : e === 'pendiente' ? 'Pendientes' : 'En riesgo'}</div>
            <div className="v">{stats[e]}</div>
            <div className="d">de {stats.n} indicadores</div>
          </div>
        ))}
      </section>

      <section className="chart-card">
        <h2>Evolución semanal del avance global</h2>
        <p className="hint">
          Cada punto es un corte guardado. El punto «Hoy» muestra el estado actual y se vuelve definitivo al
          guardar el corte de la semana.
        </p>
        <Chart puntos={puntos} />
        {editar && cortes.length > 0 && (
          <div className="cortes-lista" role="group" aria-label="Cortes guardados">
            <span className="cap">Cortes guardados:</span>
            {cortes.map((c) => (
              <span className="corte-item" key={c.id}>
                Sem {c.semana} · {c.fecha} · {Math.round(Number(c.avance_global))} %
                <button
                  className="btn-borrar"
                  title={`Eliminar corte de la semana ${c.semana}`}
                  aria-label={`Eliminar corte de la semana ${c.semana}`}
                  onClick={() => eliminarCorte(c)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="filters" role="group" aria-label="Filtrar indicadores por estado">
        <span className="cap">Ver:</span>
        {FILTROS.map(({ f, label }) => (
          <button key={f} className="chip" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
            {label}
          </button>
        ))}
        <span className="leyenda-rot">
          Indicador en carrusel <span className="tag-rot">Rotación</span>
        </span>
      </div>

      <section className="islas" aria-label="Avance por isla">
        {islas.map(([isla, kpis]) => (
          <IslaCard
            key={isla}
            isla={isla}
            categoria={kpis[0].categoria}
            kpis={kpis}
            filtro={filtro}
            editar={editar}
            onCambio={onCambio}
            onAgregar={agregar}
            onEliminar={eliminar}
          />
        ))}
      </section>

      <section className="notas">
        <h2>Notas y pendientes de validación</h2>
        <ul>
          <li>Ámbar = indicadores en rotación: comparten pantalla mediante carrusel dentro del monitor.</li>
          <li>Nomenclatura de servicios de E-20 y E-30 pendiente de validación.</li>
          <li>8% de descuento promedio ponderado por familia de producto (OCTG) — a confirmar con Quirce.</li>
          <li>
            Share dinámico disponible únicamente en Direccional, Coiled Tubing y Stacks; se incorpora al
            ampliar la cantidad de pantallas.
          </li>
        </ul>
      </section>

      <footer className="pie">
        RTIC Well Construction · configuración base 6 islas / 12 monitores / 32 sillas · estados:{' '}
        {Object.values(ESTADOS).join(' · ')}
      </footer>
    </div>
  )
}
