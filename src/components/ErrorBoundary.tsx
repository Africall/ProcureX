import React from 'react'
import { useDashboardStore } from '../stores/dashboardStore'

type Props = { children: React.ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props){
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error){
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo){
    console.error('App crashed:', error, info)
  }

  render(){
    if(this.state.error){
      return <ErrorFallback error={this.state.error} onRetry={()=> this.setState({ error: null })} />
    }
    return this.props.children
  }
}

function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }){
  // Hook inside child function component to use store
  const resetLayout = useDashboardStore(s => s.resetLayout)
  return (
    <div style={{padding:24}}>
      <h2 style={{marginTop:0}}>Something went wrong</h2>
      <pre style={{whiteSpace:'pre-wrap', background:'#f8fafc', padding:12, borderRadius:8, border:'1px solid #e2e8f0'}}>{error.message}</pre>
      <div style={{display:'flex', gap:12, marginTop:12}}>
        <button className="btn-secondary" onClick={()=>{ try{ resetLayout() }catch{}; onRetry(); location.reload() }}>Reset dashboard & Reload</button>
        <button onClick={()=> location.reload()}>Reload</button>
      </div>
    </div>
  )
}

export default ErrorBoundary
