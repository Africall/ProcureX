import express from 'express'
import cors from 'cors'
import itemsRouter from './items'
import suppliersRouter from './suppliers'
import dashboardRouter from './dashboardApi'
import financeRouter from './financeApi'
import marketplaceRouter from './marketplace'
import fxRouter from './fxApi'
import { seedEnterpriseData } from './seedData'
import { seedFinanceData } from './financeDb'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import 'express-async-errors'
import { PORT, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW, NODE_ENV, APP_ORIGIN, RATE_LIMIT_ENABLED } from './config'
import crypto from 'crypto'
import path from 'path'

// --------- readiness flags ----------
const ready = { db: false, cache: false }  // add more flags if needed

// OPTIONAL: plug in your real connectors here
async function connectDB() {
  // e.g., await prisma.$connect()
  // Seed enterprise data for dashboard
  await seedEnterpriseData()
  // Seed finance data in PostgreSQL
  await seedFinanceData()
  ready.db = true
}
async function connectCache() {
  // e.g., await redis.connect()
  ready.cache = true
}

// Simple request gate: only allow health checks until ready.
function readinessGate(req: any, res: any, next: any) {
  const isReady = ready.db && ready.cache
  const isHealthPath = ['/live', '/ready', '/health'].includes(req.path)
  
  console.log(`[${req.id}] Readiness check:`, { isReady, isHealthPath, path: req.path })
  
  if (isReady || isHealthPath) {
    return next()
  }
  
  console.warn(`[${req.id}] Blocking request due to service not ready:`, { path: req.path, ready })
  res.status(503).json({ ok: false, reason: 'service_not_ready', path: req.path })
}

const app = express()

// trust first proxy (needed for secure cookies behind reverse proxies)
app.set('trust proxy', 1)

// Security & core middleware
app.use(helmet())
app.use(cors({ origin: NODE_ENV === 'production' ? APP_ORIGIN : true, credentials: true }))
app.use(express.json({ limit: '1mb' }))

// Dev logging only (keeps prod leaner)
if (NODE_ENV !== 'production') app.use(morgan('dev'))
else app.use(morgan('combined'))

// Request ID and detailed logging middleware
app.use((req: any, res, next) => {
  req.id = crypto.randomUUID()
  res.setHeader('X-Request-Id', req.id)
  
  // Log request details for debugging 500s
  console.log(`[${req.id}] ${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    ip: req.ip
  })
  
  next()
})

// rate limiter (configurable)
if (RATE_LIMIT_ENABLED) {
  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => ['/', '/live', '/ready', '/health'].includes(req.path) || req.method === 'OPTIONS',
    keyGenerator: (req: any) => (req.ip || req.headers['x-forwarded-for'] || 'unknown').toString(),
    message: { ok: false, error: 'too_many_requests', hint: 'Please slow down and try again shortly.' }
  })
  // apply limiter to API only (avoid throttling static assets)
  app.use('/api', limiter)
}

// Liveness & readiness (for compose / load balancers / k8s)
app.get('/live', (_req, res) => res.json({ ok: true }))
app.get('/ready', (_req, res) => {
  const isReady = ready.db && ready.cache
  res.status(isReady ? 200 : 503).json({ ok: isReady, ...ready })
})

// Keep your existing /health too
app.get('/health', (_req, res) =>
  res.json({ ok: true, env: NODE_ENV, uptime: process.uptime(), version: process.env.APP_VERSION || '0.1.0' })
)

// Gate non-auth traffic until deps are ready (so we can listen immediately)
app.use(readinessGate)

// In production, serve the built frontend (same-origin)
let staticDir = '' as string
if (NODE_ENV === 'production') {
  // Frontend build output is at repo root /dist; compiled backend runs from backend/dist
  staticDir = path.resolve(__dirname, '../../dist')
  app.use(express.static(staticDir, { index: false, maxAge: '1h', setHeaders(res) { res.setHeader('Cache-Control', 'public, max-age=3600') } }))
}

// Routers
app.use('/api/items', itemsRouter)
app.use('/api/suppliers', suppliersRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/finance', financeRouter)
app.use('/api/marketplace', marketplaceRouter)
app.use('/api/fx', fxRouter)

// SPA fallback: send index.html for non-API routes
if (NODE_ENV === 'production') {
  app.get(/^\/(?!api|health|live|ready).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'))
  })
}

// Enhanced global error handler with detailed logging
app.use((err: any, req: any, res: any, _next: any) => {
  const requestId = req.id || 'unknown'
  const errorDetails = {
    requestId,
    method: req.method,
    path: req.path,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      status: err.status || err.statusCode,
      code: err.code
    },
    body: req.method !== 'GET' ? req.body : undefined,
    headers: req.headers
  }
  
  console.error(`[${requestId}] 500 ERROR CAUGHT:`, JSON.stringify(errorDetails, null, 2))
  
  // Send structured error response
  const status = err.status || err.statusCode || 500
  res.status(status).json({ 
    error: err.message || 'Internal Server Error',
    requestId,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  })
})

let server: any
if (NODE_ENV !== 'test') {
  const start = Date.now()
  // Bind explicitly to 127.0.0.1 in dev to avoid IPv6/localhost resolution issues on Windows
  const listenHost = NODE_ENV === 'production' ? undefined : '127.0.0.1'
  const portNum = Number(PORT)
  server = listenHost ? app.listen(portNum, listenHost, () => {
    console.log(`ProcureX backend listening on ${portNum} (${NODE_ENV}) bound to ${listenHost} in ${Date.now() - start}ms`)
    void init()
  }) : app.listen(portNum, () => {
    console.log(`ProcureX backend listening on ${portNum} (${NODE_ENV}) in ${Date.now() - start}ms`)
    void init()
  })
}

// Graceful shutdown
process.on('SIGTERM', () => { server?.close(() => process.exit(0)) })
process.on('SIGINT', () => { server?.close(() => process.exit(0)) })

export default app

// ---------- async init in parallel ----------
async function init() {
  const t0 = Date.now()
  try {
    const results = await Promise.allSettled([
      connectDB(),
      connectCache(),
      // add other short warmups here (feature flags, small caches) — avoid long tasks
    ])
    
    // Log any failed initializations
    results.forEach((result, index) => {
      const names = ['connectDB', 'connectCache']
      if (result.status === 'rejected') {
        console.error(`Init failed for ${names[index]}:`, result.reason)
      }
    })
    
    const ms = Date.now() - t0
    console.log(`ProcureX init complete in ${ms}ms`, ready)
  } catch (error) {
    console.error('Init error:', error)
    // Don't crash the server, just log and continue
  }
}
