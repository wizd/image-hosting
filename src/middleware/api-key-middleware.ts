import type { Request, Response, NextFunction } from "express"
import { apiKeyService } from "../api-key/api-key-service"

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: string
    userId: string
    permissions: string[]
  }
}

export const authenticateApiKey = async (req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> => {
  const apiKey = req.headers["x-api-key"] as string

  if (!apiKey) {
    res.status(401).json({ error: "API key is required" })
    return
  }

  try {
    const apiKeyData = await apiKeyService.findByKey(apiKey)

    if (!apiKeyData) {
      res.status(401).json({ error: "Invalid API key" })
      return
    }

    // 检查API密钥是否过期
    if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
      res.status(401).json({ error: "API key has expired" })
      return
    }

    // 更新最后使用时间
    await apiKeyService.updateLastUsed(apiKey)

    // 将API密钥信息添加到请求对象
    req.apiKey = {
      id: apiKeyData.id,
      userId: apiKeyData.userId,
      permissions: apiKeyData.permissions,
    }

    next()
  } catch (error) {
    console.error("API key authentication error:", error)
    res.status(500).json({ error: "Authentication failed" })
  }
}

// 检查API密钥是否具有特定权限
export const requireApiKeyPermission = (permission: string) => {
  return (req: ApiKeyRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json({ error: "API key authentication required" })
      return
    }

    if (!req.apiKey.permissions.includes(permission) && !req.apiKey.permissions.includes("admin")) {
      res.status(403).json({ error: `API key does not have ${permission} permission` })
      return
    }

    next()
  }
}
