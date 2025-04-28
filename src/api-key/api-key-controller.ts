import type { Response } from "express"
import { apiKeyService } from "./api-key-service"
import type { CreateApiKeyRequest } from "./api-key-types"
import type { AuthRequest } from "../middleware/auth-middleware"

export class ApiKeyController {
  public async createApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const { name, expiresAt, permissions } = req.body as CreateApiKeyRequest

      if (!name) {
        res.status(400).json({ error: "API key name is required" })
        return
      }

      const apiKey = await apiKeyService.createApiKey(userId, name, expiresAt, permissions)

      res.status(201).json({ apiKey })
    } catch (error) {
      console.error("Create API key error:", error)
      res.status(500).json({ error: "Failed to create API key" })
    }
  }

  public async getUserApiKeys(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const apiKeys = await apiKeyService.findByUserId(userId)
      const apiKeysDTO = apiKeys.map((apiKey) => apiKeyService.toApiKeyDTO(apiKey))

      res.status(200).json({ apiKeys: apiKeysDTO })
    } catch (error) {
      console.error("Get API keys error:", error)
      res.status(500).json({ error: "Failed to get API keys" })
    }
  }

  public async updateApiKeyStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      const { id } = req.params
      const { isActive } = req.body

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      if (isActive === undefined) {
        res.status(400).json({ error: "isActive field is required" })
        return
      }

      const apiKey = await apiKeyService.updateApiKeyStatus(id, userId, isActive)

      if (!apiKey) {
        res.status(404).json({ error: "API key not found" })
        return
      }

      res.status(200).json({ apiKey })
    } catch (error) {
      console.error("Update API key error:", error)
      res.status(500).json({ error: "Failed to update API key" })
    }
  }

  public async deleteApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      const { id } = req.params

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const success = await apiKeyService.deleteApiKey(id, userId)

      if (!success) {
        res.status(404).json({ error: "API key not found" })
        return
      }

      res.status(200).json({ message: "API key deleted successfully" })
    } catch (error) {
      console.error("Delete API key error:", error)
      res.status(500).json({ error: "Failed to delete API key" })
    }
  }
}

export const apiKeyController = new ApiKeyController()
