import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface ToastMessage {
  id: string
  type?: 'success' | 'error' | 'info'
  text: string
  timeout?: number
}

interface ToastContextValue {
  push: (msg: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const push = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const timeout = msg.timeout ?? 4000
    setMessages(m => [...m, { id, ...msg }])
    // Skip auto-dismiss timers in test env to reduce act() warnings
    const isTest = (import.meta as any)?.env?.MODE === 'test'
    if (timeout > 0 && !isTest) {
      setTimeout(() => {
        setMessages(m => m.filter(x => x.id !== id))
      }, timeout)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div style={{position:'fixed', top:16, right:16, display:'flex', flexDirection:'column', gap:8, zIndex:1000}}>
        {messages.map(m => {
          const bg = m.type === 'error' ? '#dc2626' : m.type === 'success' ? '#16a34a' : '#334155'
          return (
            <div key={m.id} style={{background:bg, color:'#fff', padding:'8px 12px', borderRadius:6, minWidth:200, boxShadow:'0 4px 12px rgba(0,0,0,0.15)', fontSize:13}}>
              {m.text}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if(!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
