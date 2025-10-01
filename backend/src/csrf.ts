import crypto from 'crypto'

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function setCsrfCookie(res: any): string {
  const token = generateCsrfToken()
  res.cookie('csrf_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  })
  return token
}

export function validateCsrf(req: any): boolean {
  const tokenFromCookie = req.cookies?.csrf_token
  const tokenFromHeader = req.headers['x-csrf-token']
  return tokenFromCookie && tokenFromHeader && tokenFromCookie === tokenFromHeader
}

export function csrfProtection(req: any, res: any, next: any) {
  const method = req.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next()
  }
  if (!validateCsrf(req)) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
  next()
}
