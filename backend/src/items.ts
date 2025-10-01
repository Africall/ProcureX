import { Router } from 'express'
import db from './db'
import { body, validationResult } from 'express-validator'

const router = Router()

router.get('/', async (req, res)=>{
  try{
    await db.read()
    const q = (req.query.q as string) || ''
    const page = parseInt((req.query.page as string) || '1')
    const limit = parseInt((req.query.limit as string) || '50')
    const sort = (req.query.sort as string) || 'id'
    const location = (req.query.location as string) || ''

    let items = (db.data?.items || []) as any[]
    if(q){ const qq = q.toLowerCase(); items = items.filter(i=> i.name.toLowerCase().includes(qq) || (i.sku||'').toLowerCase().includes(qq)) }
    if(location) items = items.filter(i=> i.location === location)
    const total = items.length
    if(sort) items.sort((a,b)=> (a[sort] || '').toString().localeCompare((b[sort] || '').toString()))
    const offset = (page-1)*limit
    const pageItems = items.slice(offset, offset+limit)
    res.json({ items: pageItems, total })
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: 'Unable to fetch items' })
  }
})

router.post('/', body('name').isLength({min:1}), body('quantity').isInt({min:0}), async (req,res)=>{
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
  try{
    await db.read()
    const { name, sku, quantity, location, minStock, maxStock, unitPrice, category, description, tags } = req.body
    const id = (db.data!.lastId || 0) + 1
    const now = new Date().toISOString()
    const item = { 
      id, 
      name, 
      sku: sku || null, 
      quantity, 
      location: location || null,
      minStock: minStock || Math.max(1, Math.floor(quantity * 0.2)),
      maxStock: maxStock || Math.floor(quantity * 2),
      unitPrice: unitPrice || 0,
      category: category || 'General',
      description: description || '',
      tags: tags || [],
      isActive: true,
      createdAt: now,
      updatedAt: now
    }
    db.data!.items = (db.data!.items || []).concat([item])
    db.data!.lastId = id
    await db.write()
    res.status(201).json(item)
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: 'Unable to create item' })
  }
})

router.put('/:id', body('name').optional().isLength({min:1}), body('quantity').optional().isInt({min:0}), async (req,res)=>{
  const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({errors: errors.array()})
  try{
    const idParam = req.params?.id
    if (!idParam) return res.status(400).json({ error: 'Item id is required' })

    const id = Number(idParam)
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid item id' })

    await db.read()
    const item = (db.data!.items || []).find((x:any)=> x.id === id)
    if(!item) return res.status(404).send()
    const { name, sku, quantity, location } = req.body
    if(name !== undefined) item.name = name
    if(sku !== undefined) item.sku = sku
    if(quantity !== undefined) item.quantity = quantity
    if(location !== undefined) item.location = location
    await db.write()
    res.json(item)
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: 'Unable to update item' })
  }
})

router.delete('/:id', async (req,res)=>{
  try{
    const idParam = req.params?.id
    if (!idParam) return res.status(400).json({ error: 'Item id is required' })

    const id = Number(idParam)
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid item id' })

    await db.read()
    db.data!.items = (db.data!.items || []).filter((x:any)=> x.id !== id)
    await db.write()
    res.status(204).send()
  }catch(err:any){
    console.error(err)
    res.status(500).json({ error: 'Unable to delete item' })
  }
})

export default router
