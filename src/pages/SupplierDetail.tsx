import React from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
const Chart = React.lazy(() => import('../components/Chart'))

type Supplier = {
  id: number
  name: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

function RiskBadge({ risk }: { risk: number }){
  const color = risk < 20 ? '#16a34a' : risk < 40 ? '#22c55e' : risk < 60 ? '#f59e0b' : risk < 80 ? '#f97316' : '#ef4444'
  return <span style={{background: color, color:'#fff', padding:'4px 8px', borderRadius: 999, fontSize:12}}>Risk {Math.round(risk)}%</span>
}

export default function SupplierDetail(){
  const { id } = useParams()
  const sid = Number(id)

  const supplierQ = useQuery({
    queryKey: ['supplier', sid],
    queryFn: async () => {
      const res = await api.get(`/suppliers/${sid}`)
      return res.data as Supplier
    },
    enabled: Number.isFinite(sid),
  })

  const insightsQ = useQuery({
    queryKey: ['supplier-insights', sid],
    queryFn: async () => {
      // when MSW enabled in dev, this is mocked; otherwise you can later back it with a real endpoint
      const res = await api.get(`/suppliers/${sid}/insights`)
      return res.data as { deliveryRisk: number; leadTimeDays: number; qualityForecast: number; notes: string }
    },
    enabled: Number.isFinite(sid),
    retry: 0,
  })

  const metricsQ = useQuery({
    queryKey: ['supplier-metrics', sid],
    queryFn: async () => {
      const res = await api.get(`/suppliers/${sid}/metrics`)
      return res.data as { months: { month: string; onTimeRate: number; defectRate: number; spend: number }[] }
    },
    enabled: Number.isFinite(sid),
  })

  const timelineQ = useQuery({
    queryKey: ['supplier-timeline', sid],
    queryFn: async () => {
      const res = await api.get(`/suppliers/${sid}/timeline`)
      return res.data as { events: { date: string; type: string; text: string }[] }
    },
    enabled: Number.isFinite(sid),
  })

  const attachmentsQ = useQuery({
    queryKey: ['supplier-attachments', sid],
    queryFn: async () => {
      const res = await api.get(`/suppliers/${sid}/attachments`)
      return res.data as { attachments: { name: string; url: string; uploadedAt: string }[] }
    },
    enabled: Number.isFinite(sid),
  })

  if (supplierQ.isLoading) return <div>Loading supplier...</div>
  if (supplierQ.isError || !supplierQ.data) return <div>Supplier not found</div>
  const s = supplierQ.data

  return (
    <div>
      <div className="toolbar">
        <h2>Supplier: {s.name}</h2>
        <div style={{display:'flex', gap:8}}>
          <Link to="/suppliers" className="btn-secondary">Back</Link>
          {insightsQ.data && <RiskBadge risk={insightsQ.data.deliveryRisk * 100} />}
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        <motion.div className="card" style={{background:'#fff', padding:16, borderRadius:8}} initial={{opacity:0, y:12}} animate={{opacity:1, y:0}}>
          <h3>Profile</h3>
          <div><b>Contact:</b> {s.contactName || '-'}</div>
          <div><b>Email:</b> {s.email || '-'}</div>
          <div><b>Phone:</b> {s.phone || '-'}</div>
          <div><b>Address:</b> {s.address || '-'}</div>
        </motion.div>

        <motion.div className="card" style={{background:'#fff', padding:16, borderRadius:8}} initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{delay:0.05}}>
          <h3>Predictive Insights</h3>
          {insightsQ.isLoading ? <div>Loading insights...</div> : insightsQ.isError ? (
            <div style={{color:'#ef4444', fontSize:13}}>Insights unavailable</div>
          ) : insightsQ.data ? (
            <>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <RiskBadge risk={insightsQ.data.deliveryRisk * 100} />
                <div>Lead time: <b>{insightsQ.data.leadTimeDays} days</b></div>
                <div>Quality forecast: <b>{Math.round(insightsQ.data.qualityForecast * 100)}%</b></div>
              </div>
              <p style={{marginTop:8, color:'#334155', fontSize:14}}>{insightsQ.data.notes}</p>
            </>
          ) : null}
        </motion.div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginTop:16}}>
        <motion.div className="card" style={{background:'#fff', padding:16, borderRadius:8}} initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{delay:0.1}}>
          <h3>Performance (12 months)</h3>
          {metricsQ.isLoading ? <div>Loading metrics...</div> : metricsQ.isError ? <div style={{color:'#ef4444'}}>Metrics unavailable</div> : metricsQ.data ? (
            <React.Suspense fallback={<div>Loading chart…</div>}>
            <Chart
              labels={metricsQ.data.months.map(m => m.month.slice(5))}
              series={[
                { label: 'On-time', stroke: '#16a34a', values: metricsQ.data.months.map(m => Math.round(m.onTimeRate * 100)) },
                { label: 'Defect (inv)', stroke: '#ef4444', values: metricsQ.data.months.map(m => Math.round((1 - m.defectRate) * 100)) },
              ]}
              height={220}
            />
            </React.Suspense>
          ) : null}
        </motion.div>

        <motion.div className="card" style={{background:'#fff', padding:16, borderRadius:8}} initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{delay:0.15}}>
          <h3>Recent Activity</h3>
          {timelineQ.data ? (
            <ul style={{paddingLeft:16}}>
              {timelineQ.data.events.map((e, i)=> (
                <li key={i} style={{margin:'6px 0'}}>
                  <span style={{fontSize:12, color:'#64748b'}}>{e.date}</span> — {e.text}
                </li>
              ))}
            </ul>
          ) : <div>Loading timeline...</div>}
        </motion.div>
      </div>

      <motion.div className="card" style={{background:'#fff', padding:16, borderRadius:8, marginTop:16}} initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} transition={{delay:0.2}}>
        <h3>Attachments</h3>
        {attachmentsQ.data ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {attachmentsQ.data.attachments.map((a, i)=> (
                <tr key={i}>
                  <td><a href={a.url}>{a.name}</a></td>
                  <td>{a.uploadedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div>Loading attachments...</div>}
      </motion.div>
    </div>
  )
}

// MiniChart replaced by Chart component (uPlot)
