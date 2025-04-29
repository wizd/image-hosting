import { Request, Response, NextFunction } from "express";
import { apiKeyService } from "../api-key/api-key-service";
import { CONFIG } from "../config";

export interface ApiKeyRequest extends Request {
  apiKey?: string;
  user?: {
    id: string;
    permissions?: string[];
  };
}

export const authenticateApiKey = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    res.status(401).json({ error: "API key is required" });
    return;
  }

  // 检查是否是root API key
  if (apiKey === process.env.ROOT_API_KEY) {
    req.apiKey = apiKey;
    req.user = {
      id: "root",
      permissions: ["read", "write", "admin"],
    };
    next();
    return;
  }

  try {
    // 验证普通API key
    const apiKeyData = await apiKeyService.findByKey(apiKey);

    if (!apiKeyData) {
      res.status(403).json({ error: "Invalid API key" });
      return;
    }

    // 检查API key是否过期
    if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
      res.status(403).json({ error: "API key has expired" });
      return;
    }

    // 检查API key是否被禁用
    if (!apiKeyData.isActive) {
      res.status(403).json({ error: "API key is inactive" });
      return;
    }

    // 更新最后使用时间
    await apiKeyService.updateLastUsed(apiKeyData.key);

    req.apiKey = apiKey;
    req.user = {
      id: apiKeyData.userId,
      permissions: apiKeyData.permissions,
    };
    next();
  } catch (error) {
    console.error("API key authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};
