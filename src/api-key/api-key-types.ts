export interface ApiKey {
  id: string
  key: string
  name: string
  userId: string
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
  isActive: boolean
  permissions: string[]
}

export interface ApiKeyDTO {
  id: string
  name: string
  key: string // 只在创建时返回完整密钥
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
  isActive: boolean
  permissions: string[]
}

export interface CreateApiKeyRequest {
  name: string
  expiresAt?: string
  permissions?: string[]
}

export interface ApiKeyResponse {
  apiKey: ApiKeyDTO
}

export interface ApiKeysResponse {
  apiKeys: ApiKeyDTO[]
}
