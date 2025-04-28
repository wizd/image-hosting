import axios, { type AxiosInstance } from "axios"
import FormData from "form-data"
import fs from "fs"
import path from "path"

export interface ImageUploadResult {
  originalName: string
  fileId: string
  fileExtension: string
  fullUrl: string
}

export interface AuthOptions {
  email?: string
  password?: string
  apiKey?: string
}

export class ApiClient {
  private baseUrl: string
  private email?: string
  private password?: string
  private apiKey?: string
  private token: string | null = null
  private client: AxiosInstance
  private collectionId: string = ""
  private collectionName: string | null = null

  constructor(baseUrl: string, authOptions: AuthOptions) {
    this.baseUrl = baseUrl
    this.email = authOptions.email
    this.password = authOptions.password
    this.apiKey = authOptions.apiKey
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 seconds
    })

    // 如果提供了API密钥，直接设置请求头
    if (this.apiKey) {
      this.client.defaults.headers.common["x-api-key"] = this.apiKey
    }
  }

  async initialize(): Promise<void> {
    // 如果使用API密钥认证，不需要登录
    if (this.apiKey) {
      return
    }

    // 否则使用邮箱和密码登录
    if (this.email && this.password) {
      await this.login()
    } else {
      throw new Error("Either API key or email/password must be provided")
    }
  }

  private async login(): Promise<void> {
    try {
      const response = await this.client.post("/auth/login", {
        email: this.email,
        password: this.password,
      })

      this.token = response.data.token
      this.client.defaults.headers.common["Authorization"] = `Bearer ${this.token}`
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Login failed: ${error.response.data.error || error.message}`)
      }
      throw new Error(`Login failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async ensureCollection(name: string): Promise<string> {
    if (this.collectionId && this.collectionName === name) {
      return this.collectionId
    }

    try {
      // First check if collection already exists
      const collectionsResponse = await this.client.get("/collections")
      const existingCollection = collectionsResponse.data.collections.find((c: any) => c.collectionName === name)

      if (existingCollection) {
        this.collectionId = existingCollection.collectionId
        this.collectionName = name
        return this.collectionId
      }

      // Create new collection if it doesn't exist
      const response = await this.client.post("/collections", { name })
      this.collectionId = response.data.collectionId
      this.collectionName = name
      return this.collectionId
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to ensure collection: ${error.response.data.error || error.message}`)
      }
      throw new Error(`Failed to ensure collection: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async uploadLocalImage(filePath: string, collectionName: string): Promise<ImageUploadResult> {
    try {
      const collectionId = await this.ensureCollection(collectionName)

      const formData = new FormData()
      formData.append("images", fs.createReadStream(filePath))

      const response = await this.client.post(`/collections/${collectionId}/images`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      })

      return response.data.images[0]
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to upload local image: ${error.response.data.error || error.message}`)
      }
      throw new Error(`Failed to upload local image: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async uploadRemoteImage(imageUrl: string, collectionName: string): Promise<ImageUploadResult> {
    try {
      // Download the remote image
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
      const buffer = Buffer.from(response.data)

      // Get filename from URL
      const urlPath = new URL(imageUrl).pathname
      const filename = path.basename(urlPath) || "remote-image.jpg"

      // Get content type
      const contentType = response.headers["content-type"] || "image/jpeg"

      return await this.uploadBuffer(buffer, filename, contentType, collectionName)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to upload remote image: ${error.response.data.error || error.message}`)
      }
      throw new Error(`Failed to upload remote image: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async uploadBase64Image(base64Data: string, filename: string, collectionName: string): Promise<ImageUploadResult> {
    try {
      const collectionId = await this.ensureCollection(collectionName)

      const response = await this.client.post(`/collections/${collectionId}/base64`, {
        images: [
          {
            data: base64Data,
            filename: filename,
          },
        ],
      })

      return response.data.images[0]
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to upload base64 image: ${error.response.data.error || error.message}`)
      }
      throw new Error(`Failed to upload base64 image: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async uploadBuffer(
    buffer: Buffer,
    filename: string,
    contentType: string,
    collectionName: string,
  ): Promise<ImageUploadResult> {
    try {
      const collectionId = await this.ensureCollection(collectionName)

      const formData = new FormData()
      formData.append("images", buffer, {
        filename,
        contentType,
      })

      const response = await this.client.post(`/collections/${collectionId}/images`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      })

      return response.data.images[0]
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Failed to upload buffer: ${error.response.data.error || error.message}`)
      }
      throw new Error(`Failed to upload buffer: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
