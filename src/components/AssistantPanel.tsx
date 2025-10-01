import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api'
import { useAssistant } from '../assistantStore'

export default function AssistantPanel(){
  const { open, setOpen } = useAssistant()
  const [q, setQ] = React.useState('')
  const [answer, setAnswer] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const ask = async ()=>{
    setLoading(true)
    setAnswer(null)
    try{
      const res = await api.post('/ai/assist', { q })
      setAnswer(res.data.answer || 'No answer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{position:'fixed', right:16, bottom:16, zIndex:50}}>
      <button className="btn-secondary" onClick={()=> setOpen(!open)}>{open ? 'Close Assistant' : 'AI Assistant'}</button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0, y:12}} animate={{opacity:1, y:0}} exit={{opacity:0, y:12}}
            style={{marginTop:8, width:360}}>
            <div className="card" style={{background:'#fff', padding:12, borderRadius:8}}>
              <textarea value={q} onChange={e=> setQ(e.target.value)} placeholder="Ask about suppliers, items, POs..." style={{width:'100%', minHeight:80}} />
              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:8}}>
                <button onClick={ask} disabled={loading}>{loading ? 'Thinking…' : 'Ask'}</button>
              </div>
              {answer && <div style={{marginTop:8, fontSize:14}}>{answer}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
