import React, { useEffect, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'

type LineSeries = { label: string; stroke: string; values: number[] }

export default function Chart({
  labels,
  series,
  height = 220,
}: {
  labels: string[]
  series: LineSeries[]
  height?: number
}) {
  const el = useRef<HTMLDivElement | null>(null)
  const plot = useRef<uPlot | null>(null)

  useEffect(() => {
    if (!el.current) return
    const x = labels.map((_, i) => i)
    const data: any[] = [x, ...series.map(s => s.values)]
    const opts: uPlot.Options = {
      width: el.current.clientWidth || 560,
      height,
      scales: { x: { time: false }, y: { auto: true } },
      series: [{}, ...series.map(s => ({ label: s.label, stroke: s.stroke, width: 2 }))],
      axes: [
        { values: (u, vals) => vals.map(v => labels[Math.round(v)] || '') },
        { }
      ],
    }
    plot.current = new uPlot(opts, data, el.current)
    const onResize = () => {
      if (!plot.current) return
      const w = el.current?.clientWidth || 560
      plot.current.setSize({ width: w, height })
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      plot.current?.destroy()
      plot.current = null
    }
  }, [labels.join('|'), JSON.stringify(series), height])

  return <div ref={el} />
}
