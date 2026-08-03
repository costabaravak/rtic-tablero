import { useState } from 'react'

export interface Punto {
  label: string
  avance: number
  provisional?: boolean
}

const W = 800
const H = 200
const PAD = { l: 40, r: 24, t: 22, b: 28 }

export function Chart({ puntos }: { puntos: Punto[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b
  const x = (i: number) => (puntos.length === 1 ? PAD.l + iw / 2 : PAD.l + (i / (puntos.length - 1)) * iw)
  const y = (v: number) => PAD.t + (1 - v / 100) * ih

  const firmes = puntos.filter((p) => !p.provisional)
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.avance)}`).join('')
  const area = puntos.length > 1 ? `${linea}L${x(puntos.length - 1)},${y(0)}L${x(0)},${y(0)}Z` : ''
  const inicioProv = firmes.length > 0 && firmes.length < puntos.length ? firmes.length - 1 : -1

  function onMove(ev: React.MouseEvent<SVGSVGElement>) {
    const r = ev.currentTarget.getBoundingClientRect()
    const mx = ((ev.clientX - r.left) / r.width) * W
    let mejor = 0
    let d = Infinity
    puntos.forEach((_, i) => {
      const dd = Math.abs(x(i) - mx)
      if (dd < d) {
        d = dd
        mejor = i
      }
    })
    setHover(mejor)
  }

  const p = hover !== null ? puntos[hover] : null

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        height={H}
        role="img"
        aria-label="Gráfico de línea del avance global por semana"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.l - 8} y={y(g) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
              {g}
            </text>
          </g>
        ))}
        {area && <path d={area} fill="var(--accent)" opacity={0.12} />}
        {puntos.length > 1 && (
          <path d={linea} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
        )}
        {inicioProv >= 0 && (
          <path
            d={`M${x(inicioProv)},${y(puntos[inicioProv].avance)}L${x(puntos.length - 1)},${y(puntos[puntos.length - 1].avance)}`}
            fill="none"
            stroke="var(--surface)"
            strokeWidth={4}
          />
        )}
        {inicioProv >= 0 && (
          <path
            d={`M${x(inicioProv)},${y(puntos[inicioProv].avance)}L${x(puntos.length - 1)},${y(puntos[puntos.length - 1].avance)}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeDasharray="4 5"
          />
        )}
        {puntos.map((pt, i) => {
          const ultimo = i === puntos.length - 1
          return (
            <g key={i}>
              <circle
                cx={x(i)}
                cy={y(pt.avance)}
                r={ultimo ? 5 : 4}
                fill={pt.provisional ? 'var(--surface)' : 'var(--accent)'}
                stroke={pt.provisional ? 'var(--accent)' : 'var(--surface)'}
                strokeWidth={2}
              />
              {ultimo && (
                <text
                  x={x(i)}
                  y={y(pt.avance) - 12}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="var(--accent-ink)"
                >
                  {pt.avance} %
                </text>
              )}
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
                {pt.label}
              </text>
            </g>
          )
        })}
      </svg>
      {p && hover !== null && (
        <div
          className="tooltip"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(p.avance) / H) * 100}%` }}
        >
          {p.label}: {p.avance} % de avance{p.provisional ? ' (sin guardar)' : ''}
        </div>
      )}
    </div>
  )
}
