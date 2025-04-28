import express from "express"
import { v4 as uuidv4 } from "uuid"
import multer from "multer"
import path from "path"
import fs from "fs"
import dotenv from "dotenv"
import cors from "cors"

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

// Configuration
const DATA_ROOT = process.env.DATA_ROOT || path.join(__dirname, "../data")
const IMAGE_ROOT_URL = process.env.IMAGE_ROOT_URL || "http://localhost:3000/images/"
const PORT = process.env.PORT || 3000

// Ensure data directory exists
if (!fs.existsSync(DATA_ROOT)) {
  fs.mkdirSync(DATA_ROOT, { recursive: true })
}

const app = express()
app.use(express.json())
app.use(cors())

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Simple health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV })
})

// Create a new collection
app.post("/collections", (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: "Collection name is required" })
    }

    const collectionId = uuidv4()
    const collectionPath = path.join(DATA_ROOT, collectionId)

    // Create collection directory
    fs.mkdirSync(collectionPath, { recursive: true })

    // Save collection metadata
    fs.writeFileSync(
      path.join(collectionPath, "metadata.json"),
      JSON.stringify({ name, createdAt: new Date().toISOString() }),
    )

    const response: CollectionResponse = {
      collectionId,
      collectionName: name,
    }

    res.status(201).json(response)
  } catch (error) {
    console.error("Error creating collection:", error)
    res.status(500).json({ error: "Failed to create collection" })
  }
})

// Upload images to a collection
app.post("/collections/:collectionId/images", upload.array("images"), (req, res) => {
  try {
    const { collectionId } = req.params
    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" })
    }

    const collectionPath = path.join(DATA_ROOT, collectionId)

    // Check if collection exists
    if (!fs.existsSync(collectionPath)) {
      return res.status(404).json({ error: "Collection not found" })
    }

    const imageMetadata: ImageMetadata[] = []

    // Process each uploaded file
    for (const file of files) {
      const fileId = uuidv4()
      const fileExtension = path.extname(file.originalname)
      const fileName = `${fileId}${fileExtension}`
      const filePath = path.join(collectionPath, fileName)

      // Save the file
      fs.writeFileSync(filePath, file.buffer)

      // Create metadata
      const metadata: ImageMetadata = {
        originalName: file.originalname,
        fileId,
        fileExtension,
        fullUrl: `${IMAGE_ROOT_URL}${collectionId}/${fileId}${fileExtension}`,
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
})

// Serve images
app.get("/images/:collectionId/:fileId", (req, res) => {
  try {
    const { collectionId, fileId } = req.params

    // Find the file with the matching fileId prefix
    const collectionPath = path.join(DATA_ROOT, collectionId)

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
    res.sendFile(imagePath)
  } catch (error) {
    console.error("Error serving image:", error)
    res.status(500).json({ error: "Failed to serve image" })
  }
})

// Start the server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Image hosting service running on port ${PORT}`)
    console.log(`DATA_ROOT: ${DATA_ROOT}`)
    console.log(`IMAGE_ROOT_URL: ${IMAGE_ROOT_URL}`)
  })
}

export default app
