import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_strong_secret'

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
    email?: string
    name?: string
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' })

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Invalid Authorization format' })

  const token = parts[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    req.user = { id: payload.userId, role: payload.role, email: payload.email, name: payload.name }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden - insufficient role' })
    next()
  }
}
