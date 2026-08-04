import { useState } from 'react'
import { ESTADOS, ISLA_META } from '../constants'
import type { Estado, Indicador } from '../types'

interface Props {
  isla: string
  categoria: string
  kpis: Indicador[]
  filtro: 'todos' | Estado
  editar: boolean
  onCambio: (id: string, patch: Partial<Indicador>) => void
  onAgregar: (
    base: Pick<Indicador, 'isla' | 'categoria' | 'monitor' | 'monitor_titulo'>,
    nombre: string,
  ) => void
  onEliminar: (k: Indicador) => void
}

function AgregarForm({ onAgregar }: { onAgregar: (nombre: string) => void }) {
  const [nombre, setNombre] = useState('')

  function enviar() {
    const limpio = nombre.trim()
    if (!limpio) return
    onAgregar(limpio)
    setNombre('')
  }

  return (
    <div className="agregar">
      <input
        type="text"
        value={nombre}
        placeholder="Nombre del nuevo indicador"
        aria-label="Nombre del nuevo indicador"
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && enviar()}
      />
      <button className="btn chico" onClick={enviar} disabled={!nombre.trim()}>
        + Agregar
      </button>
    </div>
  )
}

export function IslaCard({ isla, categoria, kpis, filtro, editar, onCambio, onAgregar, onEliminar }: Props) {
  const meta = ISLA_META[isla]
  const pct = Math.round(kpis.reduce((s, k) => s + k.progreso, 0) / kpis.length)

  const monitores = new Map<number, Indicador[]>()
  for (const k of kpis) {
    if (!monitores.has(k.monitor)) monitores.set(k.monitor, [])
    monitores.get(k.monitor)!.push(k)
  }

  function cambiarEstado(k: Indicador, estado: Estado) {
    const patch: Partial<Indicador> = { estado }
    if (estado === 'completada') patch.progreso = 100
    if (estado === 'pendiente') patch.progreso = 0
    onCambio(k.id, patch)
  }

  function cambiarProgreso(k: Indicador, progreso: number) {
    const patch: Partial<Indicador> = { progreso }
    if (progreso === 100) patch.estado = 'completada'
    else if (progreso > 0 && (k.estado === 'pendiente' || k.estado === 'completada')) patch.estado = 'curso'
    else if (progreso === 0 && k.estado === 'completada') patch.estado = 'pendiente'
    onCambio(k.id, patch)
  }

  return (
    <article className="isla">
      <div className="isla-head">
        <div className="row1">
          <div>
            <p className="eyebrow">{isla}</p>
            <h2>{categoria}</h2>
            {meta?.servicios && <div className="servicios">{meta.servicios}</div>}
            {meta?.prioridad && <div className="prioridad">{meta.prioridad}</div>}
          </div>
          {meta && <span className="sillas">{meta.sillas} sillas</span>}
        </div>
        <div className="isla-avance">
          <div className="bar" role="img" aria-label={`Avance de ${categoria}: ${pct}%`}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="pct">{pct} %</span>
        </div>
      </div>

      {[...monitores.entries()].map(([num, lista]) => (
        <div className="monitor" key={num}>
          <h3>
            <span className="mnum">Monitor {num}</span> — {lista[0].monitor_titulo}
          </h3>
          <p className="proyecta">
            {lista.length} indicador{lista.length !== 1 ? 'es' : ''}
          </p>
          <ul className="kpis">
            {lista
              .filter((k) => filtro === 'todos' || k.estado === filtro)
              .map((k) => (
                <li className={`kpi${editar ? ' edit' : ''}`} key={k.id}>
                  {editar ? (
                    <select
                      className="sel-estado"
                      value={k.estado}
                      aria-label={`Estado de ${k.nombre}`}
                      onChange={(e) => cambiarEstado(k, e.target.value as Estado)}
                    >
                      {(Object.keys(ESTADOS) as Estado[]).map((e) => (
                        <option key={e} value={e}>
                          {ESTADOS[e]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`estado ${k.estado}`}>{ESTADOS[k.estado]}</span>
                  )}
                  <span className="nombre">{k.nombre}</span>
                  {editar ? (
                    <input
                      type="range"
                      className="rango"
                      min={0}
                      max={100}
                      step={5}
                      value={k.progreso}
                      aria-label={`Progreso de ${k.nombre}`}
                      onChange={(e) => cambiarProgreso(k, Number(e.target.value))}
                    />
                  ) : (
                    <span className="bar" aria-hidden="true">
                      <i style={{ width: `${k.progreso}%` }} />
                    </span>
                  )}
                  <span className="pct">{k.progreso} %</span>
                  {editar && (
                    <button
                      className="btn-borrar"
                      title={`Eliminar ${k.nombre}`}
                      aria-label={`Eliminar ${k.nombre}`}
                      onClick={() => onEliminar(k)}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
          </ul>
          {editar && (
            <AgregarForm
              onAgregar={(nombre) =>
                onAgregar({ isla, categoria, monitor: num, monitor_titulo: lista[0].monitor_titulo }, nombre)
              }
            />
          )}
        </div>
      ))}
    </article>
  )
}
