import React, { useState, useEffect } from 'react'
import { Item } from '../pages/Inventory'

type Props = {
  visible: boolean
  onClose: () => void
  onSave: (data: Omit<Item, 'id'>, id?: number) => void
  initial?: Item | null
}

export default function ItemForm({ visible, onClose, onSave, initial }: Props){
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [location, setLocation] = useState('')

  useEffect(()=>{
    if(initial){
      setName(initial.name)
      setSku(initial.sku || '')
      setQuantity(initial.quantity)
      setLocation(initial.location || '')
    } else {
      setName('')
      setSku('')
      setQuantity(0)
      setLocation('')
    }
  },[initial, visible])

  if(!visible) return null

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{initial ? 'Edit Item' : 'Add Item'}</h3>
        <label>Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} />
        <label>SKU</label>
        <input value={sku} onChange={e=>setSku(e.target.value)} />
        <label>Quantity</label>
        <input type="number" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} />
        <label>Location</label>
        <input value={location} onChange={e=>setLocation(e.target.value)} />
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={()=> onSave({ name, sku: sku || undefined, quantity, location: location || undefined }, initial?.id)}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
