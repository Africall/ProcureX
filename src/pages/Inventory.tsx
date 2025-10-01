import React, { useEffect, useMemo, useState } from 'react'
import { getItems, createItem, updateItem, deleteItem, fetchItems } from '../api'
import ItemForm from '../components/ItemForm'

export type Item = {
  id: number
  name: string
  sku?: string
  quantity: number
  location?: string
}

export default function Inventory(){
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name'|'quantity'|'location' | ''>('')
  const [filterLocation, setFilterLocation] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)

  const load = ()=>{
    setLoading(true)
    fetchItems({ q: query || undefined, page, limit, sort: sortBy || undefined, location: filterLocation || undefined })
      .then(res=>{
        const serverItems: any[] = res.data.items || []
        // ensure id is number and shape matches Item
        const mapped: Item[] = serverItems.map(s=> ({ id: Number(s.id), name: s.name, sku: s.sku, quantity: Number(s.quantity), location: s.location }))
        setItems(mapped)
        setTotal(res.data.total)
        setLoading(false)
      }).catch(()=>setLoading(false))
  }

  useEffect(()=>{ load() }, [page, query, sortBy, filterLocation])

  const locations = useMemo(()=>{
    // derive locations from current page items (server could expose endpoints for locations)
    const set = new Set<string>()
    items.forEach(i=> i.location && set.add(i.location))
    return Array.from(set)
  },[items])

  const handleSave = (data: Omit<Item,'id'>, id?: number)=>{
    if(id){
      updateItem(id, data).then(()=>{
        setShowForm(false)
        setEditing(null)
        load()
      })
    } else {
      createItem(data).then(()=>{
        setShowForm(false)
        load()
      })
    }
  }

  const handleDelete = (id:number)=>{
    if(!confirm('Delete this item?')) return
    deleteItem(id).then(()=> load())
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Inventory Management</h1>
        <button onClick={()=>{ setEditing(null); setShowForm(true) }}>+ Add Item</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input 
            placeholder="Search name or SKU" 
            value={query} 
            onChange={e=>setQuery(e.target.value)}
            style={{ flex: '1', minWidth: '200px' }}
          />
          <select value={sortBy} onChange={e=> setSortBy(e.target.value as any)}>
            <option value="">Sort by</option>
            <option value="name">Name</option>
            <option value="quantity">Quantity</option>
            <option value="location">Location</option>
          </select>
          <select value={filterLocation} onChange={e=> setFilterLocation(e.target.value)}>
            <option value="">All locations</option>
            {locations.map(l=> <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it=> (
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{it.name}</td>
                <td>{it.sku || '-'}</td>
                <td>
                  <span className={`status-pill ${
                    it.quantity < 10 ? 'status-overdue' : 
                    it.quantity < 50 ? 'status-part-paid' : 
                    'status-paid'
                  }`}>
                    {it.quantity}
                  </span>
                </td>
                <td>{it.location || '-'}</td>
                <td>
                  <button onClick={()=>{ setEditing(it); setShowForm(true) }}>Edit</button>
                  {' '}
                  <button onClick={()=> handleDelete(it.id)} style={{background:'#ef4444'}}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
          <div>Showing {(page-1)*limit+1} - {Math.min(page*limit, total)} of {total}</div>
          <div>
            <button onClick={()=> setPage(p=> Math.max(1,p-1))} disabled={page<=1}>Previous</button>
            {' '}
            <button onClick={()=> setPage(p=> p+1)} disabled={page*limit >= total}>Next</button>
          </div>
        </div>
        </>
      )}

      <ItemForm visible={showForm} onClose={()=>{ setShowForm(false); setEditing(null)}} onSave={handleSave} initial={editing} />
    </div>
  )
}
