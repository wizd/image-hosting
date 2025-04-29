import express, { Express } from "express"
import { v4 as uuidv4 } from "uuid"
import multer from "multer"
import path from "path"
import fs from "fs"
import dotenv from "dotenv"
import cors from "cors";
import {
  authenticateApiKey,
  type ApiKeyRequest,
} from "./middleware/api-key-middleware";
import { apiKeyController } from "./api-key/api-key-controller";
import { CONFIG } from "./config";
import { requestLogger } from "./middleware/logging-middleware";

// Load environment variables
dotenv.config();

// Types
interface ImageMetadata {
  originalName: string;
  fileId: string;
  fileExtension: string;
  fullUrl: string;
}

interface CollectionResponse {
  collectionId: string;
  collectionName: string;
}

interface UploadResponse {
  collectionId: string;
  images: ImageMetadata[];
}

// Ensure data directory exists
if (!fs.existsSync(CONFIG.DATA_ROOT)) {
  fs.mkdirSync(CONFIG.DATA_ROOT, { recursive: true });
}

const app: Express = express();
app.use(express.json()); // Default limit
app.use(cors());
app.use(requestLogger); // Add logging middleware

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Simple health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: process.env.NODE_ENV });
});

// API Key routes
app.post(
  "/api-keys",
  authenticateApiKey,
  apiKeyController.createApiKey.bind(apiKeyController)
);
app.get(
  "/api-keys",
  authenticateApiKey,
  apiKeyController.getUserApiKeys.bind(apiKeyController)
);
app.patch(
  "/api-keys/:id",
  authenticateApiKey,
  apiKeyController.updateApiKeyStatus.bind(apiKeyController)
);
app.delete(
  "/api-keys/:id",
  authenticateApiKey,
  apiKeyController.deleteApiKey.bind(apiKeyController)
);

// Create a new collection
app.post(
  "/collections",
  authenticateApiKey,
  async (req: ApiKeyRequest, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Collection name is required" });
      }

      const collectionId = uuidv4();
      const collectionPath = path.join(CONFIG.DATA_ROOT, collectionId);

      // Create collection directory
      fs.mkdirSync(collectionPath, { recursive: true });

      // Save collection metadata
      fs.writeFileSync(
        path.join(collectionPath, "metadata.json"),
        JSON.stringify({ name, createdAt: new Date().toISOString() })
      );

      const response: CollectionResponse = {
        collectionId,
        collectionName: name,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ error: "Failed to create collection" });
    }
  }
);

// Get collections
app.get("/collections", authenticateApiKey, async (req: ApiKeyRequest, res) => {
  try {
    const collections: CollectionResponse[] = [];

    // Read all collection directories
    const collectionDirs = fs
      .readdirSync(CONFIG.DATA_ROOT, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // Get all collections
    for (const collectionId of collectionDirs) {
      const metadataPath = path.join(
        CONFIG.DATA_ROOT,
        collectionId,
        "metadata.json"
      );

      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
        collections.push({
          collectionId,
          collectionName: metadata.name,
        });
      }
    }

    res.status(200).json({ collections });
  } catch (error) {
    console.error("Error getting collections:", error);
    res.status(500).json({ error: "Failed to get collections" });
  }
});

// Upload images to a collection
app.post(
  "/collections/:collectionId/images",
  upload.array("images"),
  authenticateApiKey,
  async (req: ApiKeyRequest, res) => {
    try {
      const { collectionId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      const collectionPath = path.resolve(CONFIG.DATA_ROOT, collectionId);

      // Create collection directory if it doesn't exist
      if (!fs.existsSync(collectionPath)) {
        fs.mkdirSync(collectionPath, { recursive: true });
      }

      // Create metadata file if it doesn't exist
      const metadataPath = path.resolve(collectionPath, "metadata.json");
      if (!fs.existsSync(metadataPath)) {
        fs.writeFileSync(
          metadataPath,
          JSON.stringify({
            name: collectionId,
            createdAt: new Date().toISOString(),
          })
        );
      }

      const imageMetadata: ImageMetadata[] = [];

      // Process each uploaded file
      for (const file of files) {
        const fileId = uuidv4();
        const fileExtension =
          path.extname(file.originalname) ||
          getExtensionFromMimeType(file.mimetype);
        const fileName = `${fileId}${fileExtension}`;
        const filePath = path.resolve(collectionPath, fileName);

        // Save the file
        fs.writeFileSync(filePath, file.buffer);

        // Create metadata
        const metadata: ImageMetadata = {
          originalName: file.originalname,
          fileId,
          fileExtension,
          fullUrl: `${CONFIG.IMAGE_ROOT_URL}${collectionId}/${fileId}${fileExtension}`,
        };

        imageMetadata.push(metadata);
      }

      // Save metadata for the upload
      const uploadMetadataPath = path.resolve(collectionPath, "uploads.json");
      let uploads = [];

      if (fs.existsSync(uploadMetadataPath)) {
        const existingData = fs.readFileSync(uploadMetadataPath, "utf8");
        uploads = JSON.parse(existingData);
      }

      uploads.push({
        uploadedAt: new Date().toISOString(),
        images: imageMetadata,
      });

      fs.writeFileSync(uploadMetadataPath, JSON.stringify(uploads, null, 2));

      const response: UploadResponse = {
        collectionId,
        images: imageMetadata,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  }
);

// Get images in a collection
app.get(
  "/collections/:collectionId/images",
  authenticateApiKey,
  async (req: ApiKeyRequest, res) => {
    try {
      const { collectionId } = req.params;

      const collectionPath = path.join(CONFIG.DATA_ROOT, collectionId);

      // Check if collection exists
      if (!fs.existsSync(collectionPath)) {
        return res.status(404).json({ error: "Collection not found" });
      }

      // Get uploads metadata
      const uploadMetadataPath = path.join(collectionPath, "uploads.json");
      if (!fs.existsSync(uploadMetadataPath)) {
        return res.status(200).json({ images: [] });
      }

      const uploads = JSON.parse(fs.readFileSync(uploadMetadataPath, "utf8"));

      // Flatten all images from all uploads
      const images = uploads.reduce((acc: ImageMetadata[], upload: any) => {
        return acc.concat(upload.images);
      }, []);

      res.status(200).json({ collectionId, images });
    } catch (error) {
      console.error("Error getting images:", error);
      res.status(500).json({ error: "Failed to get images" });
    }
  }
);

// Delete a collection
app.delete(
  "/collections/:collectionId",
  authenticateApiKey,
  async (req: ApiKeyRequest, res) => {
    try {
      const { collectionId } = req.params;

      const collectionPath = path.join(CONFIG.DATA_ROOT, collectionId);

      // Check if collection exists
      if (!fs.existsSync(collectionPath)) {
        return res.status(404).json({ error: "Collection not found" });
      }

      // Delete the collection directory and all its contents
      fs.rmSync(collectionPath, { recursive: true, force: true });

      res.status(200).json({ message: "Collection deleted successfully" });
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ error: "Failed to delete collection" });
    }
  }
);

// Serve images - public access
app.get("/images/:collectionId/:fileId", (req, res) => {
  try {
    const { collectionId, fileId } = req.params;

    // Find the file with the matching fileId prefix
    const collectionPath = path.resolve(CONFIG.DATA_ROOT, collectionId);

    if (!fs.existsSync(collectionPath)) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const files = fs.readdirSync(collectionPath);
    const imageFile = files.find(
      (file) =>
        file.startsWith(fileId) &&
        file !== "metadata.json" &&
        file !== "uploads.json"
    );

    if (!imageFile) {
      return res.status(404).json({ error: "Image not found" });
    }

    const imagePath = path.resolve(collectionPath, imageFile);

    // Set appropriate content type based on file extension
    const ext = path.extname(imageFile).toLowerCase();
    const contentType = getContentTypeFromExtension(ext);
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    res.sendFile(imagePath);
  } catch (error) {
    console.error("Error serving image:", error);
    res.status(500).json({ error: "Failed to serve image" });
  }
});

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
