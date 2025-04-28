import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import crypto from "crypto"
import type { ApiKey, ApiKeyDTO } from "./api-key-types"
import { CONFIG } from "../config"

const API_KEYS_FILE = path.join(CONFIG.DATA_ROOT, "api-keys.json")

// 确保API密钥文件存在
if (!fs.existsSync(CONFIG.DATA_ROOT)) {
  fs.mkdirSync(CONFIG.DATA_ROOT, { recursive: true })
}

if (!fs.existsSync(API_KEYS_FILE)) {
  fs.writeFileSync(API_KEYS_FILE, JSON.stringify([]))
}

export class ApiKeyService {
  private getApiKeys(): ApiKey[] {
    const data = fs.readFileSync(API_KEYS_FILE, "utf8")
    return JSON.parse(data)
  }

  private saveApiKeys(apiKeys: ApiKey[]): void {
    fs.writeFileSync(API_KEYS_FILE, JSON.stringify(apiKeys, null, 2))
  }

  public async findById(id: string): Promise<ApiKey | undefined> {
    const apiKeys = this.getApiKeys()
    return apiKeys.find((apiKey) => apiKey.id === id)
  }

  public async findByKey(key: string): Promise<ApiKey | undefined> {
    const apiKeys = this.getApiKeys()
    return apiKeys.find((apiKey) => apiKey.key === key && apiKey.isActive)
  }

  public async findByUserId(userId: string): Promise<ApiKey[]> {
    const apiKeys = this.getApiKeys()
    return apiKeys.filter((apiKey) => apiKey.userId === userId)
  }

  public async createApiKey(
    userId: string,
    name: string,
    expiresAt?: string,
    permissions: string[] = ["read", "write"],
  ): Promise<ApiKeyDTO> {
    const apiKeys = this.getApiKeys()

    // 生成一个安全的随机API密钥
    const key = this.generateApiKey()

    const newApiKey: ApiKey = {
      id: uuidv4(),
      key,
      name,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
      isActive: true,
      permissions,
    }

    apiKeys.push(newApiKey)
    this.saveApiKeys(apiKeys)

    // 返回包含完整密钥的DTO（仅在创建时返回）
    return this.toApiKeyDTO(newApiKey, true)
  }

  public async updateApiKeyStatus(id: string, userId: string, isActive: boolean): Promise<ApiKeyDTO | null> {
    const apiKeys = this.getApiKeys()
    const apiKeyIndex = apiKeys.findIndex((apiKey) => apiKey.id === id && apiKey.userId === userId)

    if (apiKeyIndex === -1) {
      return null
    }

    apiKeys[apiKeyIndex].isActive = isActive
    this.saveApiKeys(apiKeys)

    return this.toApiKeyDTO(apiKeys[apiKeyIndex])
  }

  public async deleteApiKey(id: string, userId: string): Promise<boolean> {
    const apiKeys = this.getApiKeys()
    const initialLength = apiKeys.length
    const filteredApiKeys = apiKeys.filter((apiKey) => !(apiKey.id === id && apiKey.userId === userId))

    if (filteredApiKeys.length === initialLength) {
      return false
    }

    this.saveApiKeys(filteredApiKeys)
    return true
  }

  public async updateLastUsed(key: string): Promise<void> {
    const apiKeys = this.getApiKeys()
    const apiKeyIndex = apiKeys.findIndex((apiKey) => apiKey.key === key)

    if (apiKeyIndex !== -1) {
      apiKeys[apiKeyIndex].lastUsedAt = new Date().toISOString()
      this.saveApiKeys(apiKeys)
    }
  }

  public toApiKeyDTO(apiKey: ApiKey, includeFullKey = false): ApiKeyDTO {
    const { id, name, key, createdAt, lastUsedAt, expiresAt, isActive, permissions } = apiKey

    return {
      id,
      name,
      key: includeFullKey ? key : `${key.substring(0, 8)}...`,
      createdAt,
      lastUsedAt,
      expiresAt,
      isActive,
      permissions,
    }
  }

  private generateApiKey(): string {
    // 生成32字节的随机数据并转换为base64
    const buffer = crypto.randomBytes(32)
    return buffer.toString("base64").replace(/[+/=]/g, "").substring(0, 40)
  }
}

export const apiKeyService = new ApiKeyService()
