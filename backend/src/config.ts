import dotenv from 'dotenv'
import path from 'path'

// Load env from backend/.env regardless of working directory
// Works in both ts-node (src) and compiled (dist)
const backendEnvPath = path.resolve(__dirname, '..', '.env')
dotenv.config({ path: backendEnvPath })
// Fallback: also try process.cwd()/.env if not found
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export const PORT = process.env.PORT || 4001
export const JWT_SECRET = process.env.JWT_SECRET || 'dev'
export const COOKIE_NAME = process.env.COOKIE_NAME || 'procurex_token'
export const NODE_ENV = process.env.NODE_ENV || 'development'

// Google OAuth
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
export const GOOGLE_CALLBACK = process.env.GOOGLE_CALLBACK || 'http://localhost:4001/auth/google/callback'

// Twilio
export const TWILIO_SID = process.env.TWILIO_SID
export const TWILIO_TOKEN = process.env.TWILIO_TOKEN
export const TWILIO_FROM = process.env.TWILIO_FROM

// Rate limiting
export const RATE_LIMIT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS || 15*60*1000)
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 100)
export const RATE_LIMIT_ENABLED = (process.env.RATE_LIMIT_ENABLED ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')).toLowerCase() === 'true'

// Email / SMTP
export const SMTP_HOST = process.env.SMTP_HOST || ''
export const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
export const SMTP_USER = process.env.SMTP_USER || ''
export const SMTP_PASS = process.env.SMTP_PASS || ''
export const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com'
export const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173'
