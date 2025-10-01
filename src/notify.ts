// Lightweight global notification bridge so utility modules can surface errors
// without importing UI components directly.

type Notifier = (message: string, type?: 'error' | 'success' | 'info') => void

let notify: Notifier = () => {}

export function setGlobalNotifier(fn: Notifier){
  notify = fn
}

export function notifyError(err: any, fallback = 'Request failed'){
  // Axios-like error normalization
  const msg = err?.code === 'ECONNABORTED' ? 'Request timed out. Please check your connection.'
    : (err?.message?.includes('Network Error') ? 'Network error. Is the server running?' : (err?.response?.data?.error || err?.message || fallback))
  notify(msg, 'error')
}

export function notifySuccess(msg: string){
  notify(msg, 'success')
}
