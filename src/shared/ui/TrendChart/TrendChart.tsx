import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './TrendChart.css'

export type TrendVariant = 'bars' | 'line'

export interface TrendSeries {
  name: string
  color: string
  values: number[]
}

// вертикальная аннотация (напр. точка пересечения = финансовая независимость)
export interface TrendMarker {
  index: number
  label: string
  color?: string
}

interface TrendChartProps {
  labels: string[]            // подпись каждой точки (уже отформатирована)
  series: TrendSeries[]
  variant: TrendVariant
  markers?: TrendMarker[]
  formatValue?: (n: number) => string  // тултип
  formatAxis?: (n: number) => string   // ось Y
  height?: number
}

// минималистичные отступы
const PAD_L = 60
const PAD_R = 20
const PAD_T = 22
const PAD_B = 34
const INSET = 18   // отступ первой/последней точки от осей

const defaultAxis = (n: number) => {
  const a = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (a >= 1_000_000) return `${sign}${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`
  if (a >= 1_000) return `${sign}${Math.round(a / 1_000)}k`
  return `${sign}${Math.round(a)}`
}

export function TrendChart({
  labels,
  series,
  variant,
  markers,
  formatValue = defaultAxis,
  formatAxis = defaultAxis,
  height = 320,
}: TrendChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(900)
  const [hover, setHover] = useState<number | null>(null)
  const H = height
  const n = labels.length

  // реальная ширина контейнера → viewBox 1:1, без растяжения (иначе текст «размазан»)
  useLayoutEffect(() => {
    if (!wrapRef.current) return
    const el = wrapRef.current
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w) setW(Math.round(w))
    })
    ro.observe(el)
    setW(Math.round(el.clientWidth || 900))
    return () => ro.disconnect()
  }, [])

  useEffect(() => { setHover(null) }, [variant, n])

  const geom = useMemo(() => {
    const all = series.flatMap(s => s.values)
    let min = Math.min(0, ...all)
    let max = Math.max(0, ...all)
    if (min === max) max = min + 1
    const span = max - min
    min -= span * 0.06
    max += span * 0.1

    const innerW = W - PAD_L - PAD_R
    const innerH = H - PAD_T - PAD_B
    const inset = Math.min(INSET, innerW / (Math.max(2, n) * 2))
    const plotW = innerW - inset * 2
    const x = (i: number) => (n <= 1 ? PAD_L + innerW / 2 : PAD_L + inset + (i / (n - 1)) * plotW)
    const y = (v: number) => PAD_T + (1 - (v - min) / (max - min)) * innerH
    const bandW = plotW / Math.max(1, n - 1 || 1)
    const grid = Array.from({ length: 5 }, (_, i) => min + (i / 4) * (max - min))
    const zeroY = min < 0 && max > 0 ? y(0) : y(Math.max(min, 0))
    const baseY = PAD_T + innerH
    return { x, y, bandW, grid, zeroY, baseY, innerH, innerW }
  }, [series, W, H, n])

  // подписи оси X — по ширине, не гуще ~1 на 70px
  const maxLabels = Math.max(4, Math.floor((W - PAD_L - PAD_R) / 70))
  const step = Math.max(1, Math.ceil(n / maxLabels))

  return (
    <div className="trend-wrap" ref={wrapRef}>
      <svg
        className="trend-svg"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        onMouseLeave={() => setHover(null)}
      >
        {/* сетка + ось Y */}
        {geom.grid.map((v, i) => (
          <g key={i}>
            <line className="trend-grid" x1={PAD_L} x2={W - PAD_R} y1={geom.y(v)} y2={geom.y(v)} />
            <text className="trend-axis-y" x={PAD_L - 8} y={geom.y(v) + 4} textAnchor="end">
              {formatAxis(v)}
            </text>
          </g>
        ))}
        <line className="trend-zero" x1={PAD_L} x2={W - PAD_R} y1={geom.zeroY} y2={geom.zeroY} />

        {/* маркеры пересечения (вертикальная линия + подпись) */}
        {markers?.map((mk, i) =>
          mk.index >= 0 && mk.index < n ? (
            <g key={`mk-${i}`}>
              <line
                className="trend-marker"
                style={{ stroke: mk.color ?? '#188038' }}
                x1={geom.x(mk.index)} x2={geom.x(mk.index)} y1={PAD_T} y2={geom.baseY}
              />
              <text
                className="trend-marker-label"
                style={{ fill: mk.color ?? '#188038' }}
                x={geom.x(mk.index)} y={PAD_T - 8} textAnchor="middle"
              >
                {mk.label}
              </text>
            </g>
          ) : null,
        )}

        {/* колонны — плоские, минималистичные, скруглённый верх */}
        {variant === 'bars' && series.map((s, si) => {
          const groupW = Math.min(geom.bandW * 0.5, 26)
          const barW = Math.max(3, groupW / series.length)
          return s.values.map((v, i) => {
            const cx = geom.x(i) - (barW * series.length) / 2 + barW * si
            const yv = geom.y(v)
            const up = yv <= geom.zeroY
            const top = Math.min(yv, geom.zeroY)
            const bottom = Math.max(yv, geom.zeroY)
            return (
              <path
                key={`${si}-${i}`}
                className={`trend-bar${hover === i ? ' trend-bar--active' : ''}`}
                d={barPath(cx, barW, top, bottom, up)}
                fill={s.color}
              />
            )
          })
        })}

        {/* линии */}
        {variant === 'line' && series.map((s, si) => {
          const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${geom.x(i)} ${geom.y(v)}`).join(' ')
          return <path key={si} className="trend-line" style={{ stroke: s.color }} d={d} />
        })}

        {/* точки на линии — только под курсором */}
        {variant === 'line' && hover != null && series.map((s, si) => (
          <circle
            key={si}
            className="trend-line-dot"
            style={{ stroke: s.color }}
            cx={geom.x(hover)} cy={geom.y(s.values[hover] ?? 0)} r={4.5}
          />
        ))}

        {/* курсор + хит-зоны */}
        {hover != null && (
          <line className="trend-cursor" x1={geom.x(hover)} x2={geom.x(hover)} y1={PAD_T} y2={geom.baseY} />
        )}
        {labels.map((_, i) => (
          <rect
            key={i}
            x={geom.x(i) - geom.bandW / 2} y={PAD_T}
            width={geom.bandW} height={geom.innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {/* ось X */}
        {labels.map((lb, i) =>
          (i % step === 0 || i === n - 1) ? (
            <text key={i} className="trend-axis-x" x={geom.x(i)} y={H - PAD_B + 20} textAnchor="middle">
              {lb}
            </text>
          ) : null,
        )}
      </svg>

      {hover != null && (
        <div
          className="trend-tooltip"
          style={{ left: Math.max(80, Math.min(W - 80, geom.x(hover))) }}
        >
          <div className="trend-tt-label">{labels[hover]}</div>
          {series.map((s, si) => (
            <div key={si} className="trend-tt-row">
              <span className="trend-tt-dot" style={{ background: s.color }} />
              <span className="trend-tt-name">{s.name}</span>
              <b>{formatValue(s.values[hover] ?? 0)}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Плоский бар со скруглённым «дальним от нуля» концом
function barPath(x: number, w: number, top: number, bottom: number, up: boolean): string {
  const r = Math.min(w / 2, 3, Math.abs(bottom - top))
  if (up) {
    // скругление сверху
    return (
      `M ${x} ${bottom} ` +
      `L ${x} ${top + r} Q ${x} ${top} ${x + r} ${top} ` +
      `L ${x + w - r} ${top} Q ${x + w} ${top} ${x + w} ${top + r} ` +
      `L ${x + w} ${bottom} Z`
    )
  }
  // скругление снизу
  return (
    `M ${x} ${top} ` +
    `L ${x} ${bottom - r} Q ${x} ${bottom} ${x + r} ${bottom} ` +
    `L ${x + w - r} ${bottom} Q ${x + w} ${bottom} ${x + w} ${bottom - r} ` +
    `L ${x + w} ${top} Z`
  )
}
