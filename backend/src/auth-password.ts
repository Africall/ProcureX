import { Router } from 'express'
import { dbManager } from './db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { JWT_SECRET, COOKIE_NAME, NODE_ENV, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, APP_ORIGIN } from './config'
import { setCsrfCookie } from './csrf'
import nodemailer from 'nodemailer'
import { User } from './types'
import rateLimit from 'express-rate-limit'
import { requireAuth } from './auth-middleware'
// Lightweight event logger for auth flows
function logEvent(event: string, data?: Record<string, any>) {
  try {
    console.log(`[event] ${event}`, data || {})
  } catch {}
}
import crypto from 'crypto'

const router = Router()
// Endpoint-specific rate limiters
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' }
})

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests, please try again later.' }
})

// Helper: prune expired password reset tokens
async function pruneExpiredTokens() {
  const data = await dbManager.read()
  const list = data.passwordResetTokens || []
  const now = Date.now()
  const pruned = list.filter((t: any) => t.expires > now)
  if (pruned.length !== list.length) {
    data.passwordResetTokens = pruned
    await dbManager.write()
  }
}

function hashResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function normalizeEmail(email:string){
  return email.trim().toLowerCase()
}

// Password policy: length >= 12, at least 3 of 4 character classes
function passwordPolicyIssues(pw: string): string[] {
  const issues: string[] = []
  if (pw.length < 12) issues.push('Password must be at least 12 characters long')
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
  const present = classes.filter(r => r.test(pw)).length
  if (present < 3) issues.push('Password must include at least 3 of: lowercase, uppercase, number, symbol')
  // Basic common weak patterns (can expand or externalize)
  const lowered = pw.toLowerCase()
  const weakList = ['password', 'letmein', 'qwerty', '123456', 'welcome']
  if (weakList.some(w => lowered.includes(w))) issues.push('Password contains common insecure pattern')
  return issues
}

router.post('/register', async (req,res)=>{
  try {
    const { email, password } = req.body || {}
    if(!email || !password) return res.status(400).json({ error: 'email and password required' })
    const issues = passwordPolicyIssues(password)
    if (issues.length) return res.status(400).json({ error: 'weak password', details: issues })
    const norm = normalizeEmail(email)
    const data = await dbManager.read()
    const users = data.users || []
    if(users.find((u: any)=> u.email && normalizeEmail(u.email) === norm)) return res.status(400).json({ error: 'email already registered' })
    const hash = await bcrypt.hash(password, 10)
    const newId = Math.max(0, ...users.map((u: any) => u.id)) + 1
    const now = new Date().toISOString()
    const user: User = {
      id: newId,
      provider: 'password',
      email: norm,
      passwordHash: hash,
      createdAt: now,
      updatedAt: now,
      displayName: norm.split('@')[0],
      sessionVersion: 1,
      role: 'viewer',
      isActive: true
    }
    const createdUser = await dbManager.createUser(user)
    const token = jwt.sign({ sub: createdUser.id, email: createdUser.email, sv: createdUser.sessionVersion }, JWT_SECRET, { expiresIn: '7d' })
    const isProduction = NODE_ENV === 'production'
    res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'strict': 'lax' })
    const csrf = setCsrfCookie(res)
    logEvent('auth.register', { userId: user.id, email: user.email })
    return res.status(201).json({ user: { id: user.id, email: user.email, displayName: user.displayName }, csrf })
  } catch (error: any) {
    console.error(`[${(req as any).id}] Register error:`, error)
    return res.status(500).json({ error: 'Registration failed', details: error.message })
  }
})

router.post('/login', loginLimiter, async (req,res)=>{
  try {
    const { email, password } = req.body || {}
    if(!email || !password) return res.status(400).json({ error: 'email and password required' })
    const norm = normalizeEmail(email)
    const data = await dbManager.read()
    const user = data.users.find((u: any)=> u.email && normalizeEmail(u.email) === norm)
    if(!user || !user.passwordHash) return res.status(401).json({ error: 'invalid credentials' })
    const ok = await bcrypt.compare(password, user.passwordHash)
    if(!ok) { logEvent('auth.login.fail', { email: norm }); return res.status(401).json({ error: 'invalid credentials' }) }
    // Initialize sessionVersion if missing (legacy users)
    if(!user.sessionVersion) { 
      user.sessionVersion = 1; 
      await dbManager.updateUser(user.id, { sessionVersion: 1 })
    }
    const token = jwt.sign({ sub: user.id, email: user.email, sv: user.sessionVersion }, JWT_SECRET, { expiresIn: '7d' })
    const isProduction = NODE_ENV === 'production'
    res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'strict': 'lax' })
    const csrf = setCsrfCookie(res)
    logEvent('auth.login.success', { userId: user.id, email: user.email })
    return res.json({ user: { id: user.id, email: user.email, displayName: user.displayName }, csrf })
  } catch (error: any) {
    console.error(`[${(req as any).id}] Login error:`, error)
    return res.status(500).json({ error: 'Login failed', details: error.message })
  }
})

router.post('/forgot', forgotLimiter, async (req,res)=>{
  const { email } = req.body || {}
  if(!email) return res.status(400).json({ error: 'email required' })
  const norm = normalizeEmail(email)
  await pruneExpiredTokens()
  const data = await dbManager.read()
  const users = data.users
  const user = users.find((u: any)=> u.email && normalizeEmail(u.email) === norm)
  // Always respond success to avoid account enumeration
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashResetToken(rawToken)
  // 15 minute expiration window
  const expires = Date.now() + 15 * 60 * 1000
  const existing = data.passwordResetTokens || []
  // Remove existing tokens for this user
  const filtered = user ? existing.filter((t: any) => t.userId !== user.id) : existing
  data.passwordResetTokens = user ? [...filtered, { tokenHash, userId: user.id, expires }] : filtered
  await dbManager.write()
  // In dev, return raw token to simplify testing; never return in production
  if(NODE_ENV === 'development'){
    logEvent('auth.forgot.dev', { email: norm, userId: user?.id })
    return res.json({ ok:true, token: rawToken, expires })
  }
  // Production-like path: send email if user exists and SMTP configured
  if(user && SMTP_HOST && SMTP_USER && SMTP_PASS){
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      })
      const resetLink = `${APP_ORIGIN}/reset-password?token=${rawToken}`
      const subject = 'Password Reset Instructions'
      const text = `A password reset was requested for your account. If this was you, open the link below to reset your password.\n\n${resetLink}\n\nIf you did not request this, you can ignore this message.`
      const html = `<p>A password reset was requested for your account.</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>If you did not request this, you can ignore this message.</p>`
      await transporter.sendMail({ from: EMAIL_FROM, to: user.email!, subject, text, html })
      logEvent('auth.forgot.email.sent', { email: norm, userId: user.id })
    } catch (err:any) {
      logEvent('auth.forgot.email.error', { email: norm, error: err.message })
      // Intentionally do not reveal error specifics to client
    }
  }
  logEvent('auth.forgot.request', { email: norm, userId: user?.id })
  return res.json({ ok:true })
})

router.post('/reset', async (req,res)=>{
  const { token, password } = req.body || {}
  if(!token || !password) return res.status(400).json({ error: 'token and password required' })
  const issues = passwordPolicyIssues(password)
  if (issues.length) return res.status(400).json({ error: 'weak password', details: issues })
  await pruneExpiredTokens()
  const data = await dbManager.read()
  const list = data.passwordResetTokens || []
  const tokenHash = hashResetToken(token)
  const record = list.find((r: any)=> r.tokenHash === tokenHash)
  if(!record || record.expires < Date.now()) return res.status(400).json({ error: 'invalid or expired token' })
  const users = data.users || []
  const user = users.find((u: any)=> u.id === record.userId)
  if(!user) return res.status(400).json({ error: 'user not found' })
  const passwordHash = await bcrypt.hash(password, 10)
  await dbManager.updateUser(user.id, { passwordHash, updatedAt: new Date().toISOString() })
  data.passwordResetTokens = list.filter((r: any)=> r.tokenHash !== tokenHash)
  await dbManager.write()
  logEvent('auth.reset.success', { userId: user.id })
  return res.json({ ok:true })
})

router.post('/change-password', requireAuth as any, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body || {}
  if(!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' })
  const issues = passwordPolicyIssues(newPassword)
  if(issues.length) return res.status(400).json({ error: 'weak password', details: issues })
  const data = await dbManager.read()
  const user = data.users.find((u: any)=> u.id === req.user.id)
  if(!user || !user.passwordHash) return res.status(400).json({ error: 'user not found or password auth not set' })
  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if(!ok) { logEvent('auth.change-password.fail', { userId: user.id }); return res.status(401).json({ error: 'invalid current password' }) }
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await dbManager.updateUser(user.id, { passwordHash, updatedAt: new Date().toISOString() })
  // Invalidate any outstanding reset tokens for this user
  const list = data.passwordResetTokens || []
  data.passwordResetTokens = list.filter((r: any)=> r.userId !== user.id)
  await dbManager.write()
  logEvent('auth.change-password.success', { userId: user.id })
  return res.json({ ok:true })
})

export default router