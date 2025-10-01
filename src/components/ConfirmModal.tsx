import React from 'react'

export default function ConfirmModal({ visible, title, message, onCancel, onConfirm }: any){
  if(!visible) return null
  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{title}</h3>
        <p>{message}</p>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}
