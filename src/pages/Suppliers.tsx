import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

type Supplier = {
  id: number
  name: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

export default function Suppliers(){
  const [list, setList] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = ()=>{
    setLoading(true)
    api.get('/suppliers', { params: { q } }).then(res=>{
      setList(res.data.items || [])
    }).finally(()=> setLoading(false))
  }

  useEffect(()=>{ load() }, [q])

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Suppliers</h1>
        <input placeholder="Search suppliers" value={q} onChange={e=> setQ(e.target.value)} />
      </div>

      {loading ? <div>Loading...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {list.map(s=> (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td><Link to={`/suppliers/${s.id}`} className="btn-link">{s.name}</Link></td>
                <td>{s.contactName || '-'}</td>
                <td>{s.email || '-'}</td>
                <td>{s.phone || '-'}</td>
                <td>{s.address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
