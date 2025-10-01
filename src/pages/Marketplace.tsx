import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api'
import { motion } from 'framer-motion'
import { notifySuccess } from '../notify'

type MarketSupplier = { id: string; name: string; category: string; rating?: number }

export default function Marketplace(){
  const q = useQuery({
    queryKey: ['marketplace-suppliers'],
    queryFn: async () => {
      const res = await api.get('/marketplace/suppliers')
      return res.data as MarketSupplier[]
    },
  })

  const add = async (m: MarketSupplier) => {
    await api.post('/suppliers', { name: m.name })
    notifySuccess(`Added ${m.name} to database`)
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Marketplace</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Discover and add new suppliers to your database</p>
      </div>

      {q.isLoading ? <div>Loading...</div> : q.isError ? <div style={{color:'#ef4444'}}>Failed to load marketplace</div> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'20px'}}>
          {q.data!.map((m, i)=> (
            <motion.div 
              key={m.id} 
              className="card" 
              style={{padding:'20px'}}
              initial={{opacity:0, y:10}} 
              animate={{opacity:1, y:0}} 
              transition={{delay: i*0.05}}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{m.name.charAt(0)}</div>
              <div style={{fontWeight:'bold', marginBottom: '8px'}}>{m.name}</div>
              <div style={{fontSize:'13px', color:'#64748b', marginBottom: '12px'}}>
                {m.category} • {Number.isFinite(m.rating as number) ? (m.rating as number).toFixed(1) : '0.0'}★
              </div>
              <button onClick={()=> add(m)} style={{ width: '100%' }}>Add to Database</button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
