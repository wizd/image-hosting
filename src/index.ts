import express from "express"
import { v4 as uuidv4 } from "uuid"
import multer from "multer"
import path from "path"
import fs from "fs"
import dotenv from "dotenv"
import cors from "cors"
import { authenticateToken, type AuthRequest } from "./middleware/auth-middleware"
import { authController } from "./auth/auth-controller"
import { apiKeyController } from "./api-key/api-key-controller"
import { authenticateApiKey, type ApiKeyRequest } from "./middleware/api-key-middleware"
import { CONFIG } from "./config"

// Load environment variables
dotenv.config()

// Types
interface ImageMetadata {
  originalName: string
  fileId: string
  fileExtension: string
  fullUrl: string
}

interface CollectionResponse {
  collectionId: string
  collectionName: string
  userId?: string
}

interface UploadResponse {
  collectionId: string
  images: ImageMetadata[]
}

// Ensure data directory exists
if (!fs.existsSync(CONFIG.DATA_ROOT)) {
  fs.mkdirSync(CONFIG.DATA_ROOT, { recursive: true })
}

const app = express()
app.use(express.json({ limit: "50mb" })) // Increased limit for base64 images
app.use(cors())

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

// Simple health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV })
})

// Auth routes
app.post("/auth/register", authController.register.bind(authController))
app.post("/auth/login", authController.login.bind(authController))
app.get("/auth/profile", authenticateToken, authController.getProfile.bind(authController))

// API Key routes
app.post("/api-keys", authenticateToken, apiKeyController.createApiKey.bind(apiKeyController))
app.get("/api-keys", authenticateToken, apiKeyController.getUserApiKeys.bind(apiKeyController))
app.patch("/api-keys/:id", authenticateToken, apiKeyController.updateApiKeyStatus.bind(apiKeyController))
app.delete("/api-keys/:id", authenticateToken, apiKeyController.deleteApiKey.bind(apiKeyController))

// Create a new collection - 支持JWT或API密钥认证
app.post(
  "/collections",
  async (req: AuthRequest & ApiKeyRequest, res) => {
    try {
      // 检查是否有JWT认证
      let userId = req.user?.id

      // 如果没有JWT认证，检查API密钥认证
      if (!userId && req.apiKey) {
        userId = req.apiKey.userId

        // 检查API密钥是否有写权限
        if (!req.apiKey.permissions.includes("write") && !req.apiKey.permissions.includes("admin")) {
          return res.status(403).json({ error: "API key does not have write permission" })
        }
      }

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" })
      }

      const { name } = req.body

      if (!name) {
        return res.status(400).json({ error: "Collection name is required" })
      }

      const collectionId = uuidv4()
      const collectionPath = path.join(CONFIG.DATA_ROOT, collectionId)

      // Create collection directory
      fs.mkdirSync(collectionPath, { recursive: true })

      // Save collection metadata
      fs.writeFileSync(
        path.join(collectionPath, "metadata.json"),
        JSON.stringify({ name, userId, createdAt: new Date().toISOString() }),
      )

      const response: CollectionResponse = {
        collectionId,
        collectionName: name,
        userId,
      }

      res.status(201).json(response)
    } catch (error) {
      console.error("Error creating collection:", error)
      res.status(500).json({ error: "Failed to create collection" })
    }
  },
  authenticateApiKey,
)

// Get user's collections - 支持JWT或API密钥认证
app.get(
  "/collections",
  async (req: AuthRequest & ApiKeyRequest, res) => {
    try {
      // 检查是否有JWT认证
      let userId = req.user?.id

      // 如果没有JWT认证，检查API密钥认证
      if (!userId && req.apiKey) {
        userId = req.apiKey.userId

        // 检查API密钥是否有读权限
        if (!req.apiKey.permissions.includes("read") && !req.apiKey.permissions.includes("admin")) {
          return res.status(403).json({ error: "API key does not have read permission" })
        }
      }

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" })
      }

      const collections: CollectionResponse[] = []

      // Read all collection directories
      const collectionDirs = fs
        .readdirSync(CONFIG.DATA_ROOT, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)

      // Filter collections by user ID
      for (const collectionId of collectionDirs) {
        const metadataPath = path.join(CONFIG.DATA_ROOT, collectionId, "metadata.json")

        if (fs.existsSync(metadataPath)) {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"))

          if (metadata.userId === userId) {
            collections.push({
              collectionId,
              collectionName: metadata.name,
              userId,
            })
          }
        }
      }

      res.status(200).json({ collections })
    } catch (error) {
      console.error("Error getting collections:", error)
      res.status(500).json({ error: "Failed to get collections" })
    }
  },
  authenticateApiKey,
)

// Upload images to a collection - 支持JWT或API密钥认证
app.post(
  "/collections/:collectionId/images",
  upload.array("images"),
  async (req: AuthRequest & ApiKeyRequest, res) => {
    try {
      const { collectionId } = req.params

      // 检查是否有JWT认证
      let userId = req.user?.id

      // 如果没有JWT认证，检查API密钥认证
      if (!userId && req.apiKey) {
        userId = req.apiKey.userId

        // 检查API密钥是否有写权限
        if (!req.apiKey.permissions.includes("write") && !req.apiKey.permissions.includes("admin")) {
          return res.status(403).json({ error: "API key does not have write permission" })
        }
      }

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" })
      }

      const files = req.files as Express.Multer.File[]

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" })
      }

      const collectionPath = path.join(CONFIG.DATA_ROOT, collectionId)

      // Check if collection exists
      if (!fs.existsSync(collectionPath)) {
        return res.status(404).json({ error: "Collection not found" })
      }

      // Check if user owns the collection
      const metadataPath = path.join(collectionPath, "metadata.json")
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"))

        if (metadata.userId !== userId) {
          return res.status(403).json({ error: "You do not have permission to upload to this collection" })
        }
      } else {
        return res.status(404).json({ error: "Collection metadata not found" })
      }

      const imageMetadata: ImageMetadata[] = []

      // Process each uploaded file
      for (const file of files) {
        const fileId = uuidv4()
        const fileExtension = path.extname(file.originalname) || getExtensionFromMimeType(file.mimetype)
        const fileName = `${fileId}${fileExtension}`
        const filePath = path.join(collectionPath, fileName)

        // Save the file
        fs.writeFileSync(filePath, file.buffer)

        // Create metadata
        const metadata: ImageMetadata = {
          originalName: file.originalname,
          fileId,
          fileExtension,
          fullUrl: `${CONFIG.IMAGE_ROOT_URL}${collectionId}/${fileId}${fileExtension}`,
        }

        imageMetadata.push(metadata)
      }

      // Save metadata for the upload
      const uploadMetadataPath = path.join(collectionPath, "uploads.json")
      let uploads = []

      if (fs.existsSync(uploadMetadataPath)) {
        const existingData = fs.readFileSync(uploadMetadataPath, "utf8")
        uploads = JSON.parse(existingData)
      }

      uploads.push({
        uploadedAt: new Date().toISOString(),
        userId,
        images: imageMetadata,
      })

      fs.writeFileSync(uploadMetadataPath, JSON.stringify(uploads, null, 2))

      const response: UploadResponse = {
        collectionId,
        images: imageMetadata,
      }

      res.status(200).json(response)
    } catch (error) {
      console.error("Error uploading images:", error)
      res.status(500).json({ error: "Failed to upload images" })
    }
  },
  authenticateApiKey,
)

// 为其他API端点添加类似的认证机制...
// 这里省略了其他端点的代码，但应该以类似的方式添加API密钥认证

// Get images in a collection
app.get("/collections/:collectionId/images", authenticateToken, (req: AuthRequest, res) => {
  try {
    const { collectionId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const collectionPath = path.join(CONFIG.DATA_ROOT, collectionId)

    // Check if collection exists
    if (!fs.existsSync(collectionPath)) {
      return res.status(404).json({ error: "Collection not found" })
    }

    // Check if user owns the collection
    const metadataPath = path.join(collectionPath, "metadata.json")
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"))

      if (metadata.userId !== userId) {
        return res.status(403).json({ error: "You do not have permission to view this collection" })
      }
    } else {
      return res.status(404).json({ error: "Collection metadata not found" })
    }

    // Get uploads metadata
    const uploadMetadataPath = path.join(collectionPath, "uploads.json")
    if (!fs.existsSync(uploadMetadataPath)) {
      return res.status(200).json({ images: [] })
    }

    const uploads = JSON.parse(fs.readFileSync(uploadMetadataPath, "utf8"))

    // Flatten all images from all uploads
    const images = uploads.reduce((acc: ImageMetadata[], upload: any) => {
      return acc.concat(upload.images)
    }, [])

    res.status(200).json({ collectionId, images })
  } catch (error) {
    console.error("Error getting images:", error)
    res.status(500).json({ error: "Failed to get images" })
  }
})

// Upload base64 images to a collection
app.post("/collections/:collectionId/base64", authenticateToken, (req: AuthRequest, res) => {
  try {
    const { collectionId } = req.params
    const userId = req.user?.id
    const { images } = req.body

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "No images provided" })
    }

    const collectionPath = path.join(CONFIG.DATA_ROOT, collectionId)

    // Check if collection exists
    if (!fs.existsSync(collectionPath)) {
      return res.status(404).json({ error: "Collection not found" })
    }

    // Check if user owns the collection
    const metadataPath = path.join(collectionPath, "metadata.json")
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"))

      if (metadata.userId !== userId) {
        return res.status(403).json({ error: "You do not have permission to upload to this collection" })
      }
    } else {
      return res.status(404).json({ error: "Collection metadata not found" })
    }

    const imageMetadata: ImageMetadata[] = []

    // Process each base64 image
    for (const image of images) {
      if (!image.data || !image.filename) {
        continue
      }

      // Extract the base64 data and content type
      const matches = image.data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)

      if (!matches || matches.length !== 3) {
        continue
      }

      const contentType = matches[1]
      const base64Data = matches[2]
      const buffer = Buffer.from(base64Data, "base64")

      const fileId = uuidv4()
      const fileExtension = path.extname(image.filename) || getExtensionFromMimeType(contentType)
      const fileName = `${fileId}${fileExtension}`
      const filePath = path.join(collectionPath, fileName)

      // Save the file
      fs.writeFileSync(filePath, buffer)

      // Create metadata
      const metadata: ImageMetadata = {
        originalName: image.filename,
        fileId,
        fileExtension,
        fullUrl: `${CONFIG.IMAGE_ROOT_URL}${collectionId}/${fileId}${fileExtension}`,
      }

      imageMetadata.push(metadata)
    }

    // Save metadata for the upload
    const uploadMetadataPath = path.join(collectionPath, "uploads.json")
    let uploads = []

    if (fs.existsSync(uploadMetadataPath)) {
      const existingData = fs.readFileSync(uploadMetadataPath, "utf8")
      uploads = JSON.parse(existingData)
    }

    uploads.push({
      uploadedAt: new Date().toISOString(),
      userId,
      images: imageMetadata,
    })

    fs.writeFileSync(uploadMetadataPath, JSON.stringify(uploads, null, 2))

    const response: UploadResponse = {
      collectionId,
      images: imageMetadata,
    }

    res.status(200).json(response)
  } catch (error) {
    console.error("Error uploading base64 images:", error)
    res.status(500).json({ error: "Failed to upload images" })
  }
})

// Serve images - public access
app.get("/images/:collectionId/:fileId", (req, res) => {
  try {
    const { collectionId, fileId } = req.params

    // Find the file with the matching fileId prefix
    const collectionPath = path.join(CONFIG.DATA_ROOT, collectionId)

    if (!fs.existsSync(collectionPath)) {
      return res.status(404).json({ error: "Collection not found" })
    }

    const files = fs.readdirSync(collectionPath)
    const imageFile = files.find(
      (file) => file.startsWith(fileId) && file !== "metadata.json" && file !== "uploads.json",
    )

    if (!imageFile) {
      return res.status(404).json({ error: "Image not found" })
    }

    const imagePath = path.join(collectionPath, imageFile)

    // Set appropriate content type based on file extension
    const ext = path.extname(imageFile).toLowerCase()
    const contentType = getContentTypeFromExtension(ext)
    if (contentType) {
      res.setHeader("Content-Type", contentType)
    }

    res.sendFile(imagePath)
  } catch (error) {
    console.error("Error serving image:", error)
    res.status(500).json({ error: "Failed to serve image" })
  }
})

// Delete a collection
app.delete("/collections/:collectionId", authenticateToken, (req: AuthRequest, res) => {
  try {
    const { collectionId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const collectionPath = path.join(CONFIG.DATA_ROOT, collectionId)

    // Check if collection exists
    if (!fs.existsSync(collectionPath)) {
      return res.status(404).json({ error: "Collection not found" })
    }

    // Check if user owns the collection
    const metadataPath = path.join(collectionPath, "metadata.json")
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"))

      if (metadata.userId !== userId) {
        return res.status(403).json({ error: "You do not have permission to delete this collection" })
      }
    } else {
      return res.status(404).json({ error: "Collection metadata not found" })
    }

    // Delete the collection directory and all its contents
    fs.rmSync(collectionPath, { recursive: true, force: true })

    res.status(200).json({ message: "Collection deleted successfully" })
  } catch (error) {
    console.error("Error deleting collection:", error)
    res.status(500).json({ error: "Failed to delete collection" })
  }
})

// Helper function to get file extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff",
  }

  return mimeToExt[mimeType] || ".jpg"
}

// Helper function to get content type from file extension
function getContentTypeFromExtension(extension: string): string | null {
  const extToMime: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
  }

  return extToMime[extension] || null
}

// Start the server
if (process.env.NODE_ENV !== "test") {
  app.listen(CONFIG.PORT, () => {
    console.log(`Image hosting service running on port ${CONFIG.PORT}`)
    console.log(`DATA_ROOT: ${CONFIG.DATA_ROOT}`)
    console.log(`IMAGE_ROOT_URL: ${CONFIG.IMAGE_ROOT_URL}`)
  })
}

export default app
