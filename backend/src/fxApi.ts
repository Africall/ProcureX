import express from 'express'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const router = express.Router()

type FxCache = {
  base: string
  rates: Record<string, number>
  fetchedAt: number
}

// Simple in-memory cache with optional file persistence
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour
const CACHE_FILE = path.resolve(__dirname, '../db/fx_cache.json')
let cache: FxCache | null = null
const FALLBACK_RATES: Record<string, number> = { USD: 0.0073, EUR: 0.0068, GBP: 0.0054 }

function loadCacheFromFile() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8')
      cache = JSON.parse(raw) as FxCache
    }
  } catch (err) {
    console.warn('Failed to load FX cache file:', err)
  }
}

function persistCacheToFile() {
  try {
    const dir = path.dirname(CACHE_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache || {}, null, 2), 'utf8')
  } catch (err) {
    console.warn('Failed to persist FX cache file:', err)
  }
}

async function fetchRatesFromProvider(base = 'KES', symbols: string[] = ['USD', 'EUR', 'GBP']) {
  const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${symbols.map(encodeURIComponent).join(',')}`
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`FX provider error: ${res.status}`)
  const body = await res.json() as any
  const rates = (body && body.rates) ? body.rates : {}
  return { base: body.base || base, rates, fetchedAt: Date.now() }
}

// GET /api/fx/latest?base=KES&symbols=USD,EUR
router.get('/latest', async (req, res) => {
  try {
    const base = (req.query.base as string) || 'KES'
    const symbolsQ = (req.query.symbols as string) || 'USD,EUR,GBP'
    const symbols = symbolsQ.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)

    // load cached file on first request
    if (cache === null) loadCacheFromFile()

    const now = Date.now()
    const isExpired = !cache || (now - (cache.fetchedAt || 0)) > CACHE_TTL_MS || cache.base !== base

    if (!isExpired) {
      // serve from cache but filter rates to requested symbols
      const filtered: Record<string, number> = {}
      for (const s of symbols) if (cache!.rates[s]) filtered[s] = cache!.rates[s]
      return res.json({ source: 'cache', base: cache!.base, rates: filtered, fetchedAt: cache!.fetchedAt })
    }

    // fetch fresh
  const fresh = await fetchRatesFromProvider(base, symbols)
  // If provider returns empty rates, fall back to static defaults for requested symbols
  const hasRates = fresh.rates && Object.keys(fresh.rates).length > 0
  const rates = hasRates ? fresh.rates : Object.fromEntries(symbols.map(s => [s, FALLBACK_RATES[s] || null]).filter(([,v]) => typeof v === 'number'))
  cache = { base: fresh.base, rates, fetchedAt: fresh.fetchedAt }
    try { persistCacheToFile() } catch (err) { /* swallow */ }

    return res.json({ source: 'provider', base: cache.base, rates: cache.rates, fetchedAt: cache.fetchedAt })
  } catch (err: any) {
    console.error('FX latest error', err)
    // If cache present, reply with stale data and a warning
    if (cache) {
      return res.status(200).json({ source: 'stale_cache', base: cache.base, rates: cache.rates, fetchedAt: cache.fetchedAt, warning: 'provider_unavailable' })
    }
    // No cache -> provide fallback so UI remains functional
    const base = (req.query.base as string) || 'KES'
    const symbolsQ = (req.query.symbols as string) || 'USD,EUR,GBP'
    const symbols = symbolsQ.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    const rates = Object.fromEntries(symbols.map(s => [s, FALLBACK_RATES[s] || null]).filter(([,v]) => typeof v === 'number'))
    return res.status(200).json({ source: 'fallback', base, rates, fetchedAt: Date.now(), warning: 'provider_unavailable' })
  }
})

export default router
