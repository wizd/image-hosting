import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key"

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export const generateToken = (payload: { id: string; email: string }): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    res.status(401).json({ error: "Authentication token is required" })
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string }
    req.user = decoded
    next()
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" })
  }
}
