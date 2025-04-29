import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { apiKeyService } from "../api-key/api-key-service"

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

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string }
      req.user = decoded
      next()
      return
    } catch (error) {
      // JWT验证失败，继续尝试API密钥认证
      console.warn("JWT verification failed, trying API key authentication")
    }
  }

  // 尝试API密钥认证
  const apiKey = req.headers["x-api-key"] as string

  if (apiKey) {
    try {
      const apiKeyData = await apiKeyService.findByKey(apiKey)

      if (apiKeyData) {
        // 检查API密钥是否过期
        if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
          res.status(401).json({ error: "API key has expired" })
          return
        }

        // 更新最后使用时间
        await apiKeyService.updateLastUsed(apiKey)

        // 将API密钥信息添加到请求对象
        req.user = {
          id: apiKeyData.userId,
          email: "", // API密钥认证不需要email
        }

        next()
        return
      }
    } catch (error) {
      console.error("API key authentication error:", error)
    }
  }

  res.status(401).json({ error: "Authentication required" })
}
