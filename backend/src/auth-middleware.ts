import jwt from 'jsonwebtoken'
import { dbManager } from './db'
import { JWT_SECRET, COOKIE_NAME } from './config'
import { User } from './types'

export interface AuthRequest extends Express.Request {
  user?: User
}

export const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) return res.status(401).json({ error: 'Not authenticated' })

    const payload = jwt.verify(token, JWT_SECRET) as any
    const userId = payload.sub as number
    const tokenSv = payload.sv as number | undefined

    const data = await dbManager.read()
    const user = data.users.find((u: User) => u.id === userId)
    
    if (!user) return res.status(401).json({ error: 'User not found' })

    if (user.sessionVersion && tokenSv && tokenSv !== user.sessionVersion) {
      return res.status(401).json({ error: 'Session revoked' })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export const requireRole = (role: string) => (req: any, res: any, next: any) => {
  const user = req.user as User | undefined
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  if (!(user.roles || []).includes(role)) return res.status(403).json({ error: 'Forbidden' })
  next()
}
