import { Router } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { RequestHandler } from 'express'
import { dbManager } from './db'
import twilio from 'twilio'
import { COOKIE_NAME, JWT_SECRET, NODE_ENV, TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM } from './config'
import { setCsrfCookie } from './csrf'

const router = Router()

function generateCode(){
  return Math.floor(100000 + Math.random()*900000).toString()
}

// Start phone flow: accept { phone } and send a code (mocked)
router.post('/phone', async (req,res)=>{
  const phone = req.body.phone || req.query.phone
  if(!phone) return res.status(400).json({ error: 'phone required' })
  const code = generateCode()
  const data = await dbManager.read()
  const pending = data.pendingPhoneCodes || []
  const entry = { phone, code, expires: Date.now() + 5*60*1000 }
  const filtered = pending.filter((p: any)=> p.phone !== phone)
  filtered.push(entry)
  data.pendingPhoneCodes = filtered
  await dbManager.write()
  // Try to send via Twilio if configured
  if(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM){
    const client = twilio(TWILIO_SID, TWILIO_TOKEN)
    client.messages.create({ body: `Your ProcureX code is ${code}`, from: TWILIO_FROM, to: phone }).then(()=>{
      return res.json({ ok:true })
    }).catch((err:any)=>{
      console.error('Twilio send failed', err)
      // fallback to returning code only in dev mode
      if(NODE_ENV === 'development'){
        return res.json({ ok:true, code })
      }
      return res.status(500).json({ error: 'SMS service unavailable' })
    })
  } else {
    // Only return code in development mode for testing
    if(NODE_ENV === 'development'){
      return res.json({ ok:true, code })
    }
    return res.status(500).json({ error: 'SMS service not configured' })
  }
})

// Verify code: { phone, code }
router.post('/phone/verify', async (req,res)=>{
  const { phone, code } = req.body
  if(!phone || !code) return res.status(400).json({ error: 'phone and code required' })
  const data = await dbManager.read()
  const pending = data.pendingPhoneCodes || []
  const entry = pending.find((p: any)=> p.phone === phone && p.code === code)
  if(!entry || entry.expires < Date.now()) return res.status(400).json({ error: 'Invalid or expired code' })

  // Upsert user
  const users = data.users || []
  let user = users.find((u: any)=> u.provider === 'phone' && u.providerId === phone)
  if(!user){
    const newId = Math.max(0, ...users.map((u: any) => u.id)) + 1
    const now = new Date().toISOString()
    const userData = { provider: 'phone', providerId: phone, displayName: phone, createdAt: now, updatedAt: now, sessionVersion: 1, role: 'viewer', isActive: true } as any
    user = await dbManager.createUser(userData)
  }
  // cleanup pending code
  data.pendingPhoneCodes = pending.filter((p: any)=> !(p.phone === phone && p.code === code))
  await dbManager.write()

  const token = jwt.sign({ sub: (user as any).id, name: (user as any).displayName }, JWT_SECRET, { expiresIn: '7d' })
  const isProduction = NODE_ENV === 'production'
  res.cookie(COOKIE_NAME, token, { 
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax'
  })
  setCsrfCookie(res)
  return res.json({ ok:true, user: { id: (user as any).id, displayName: (user as any).displayName } })
})

export default router
