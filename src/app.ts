import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import dotenv from "dotenv"
import cors from "cors"

// Load environment variables
dotenv.config()

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
  res.status(200).json({ status: "ok" })
})

export default app
