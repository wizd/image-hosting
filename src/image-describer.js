import fs from "fs"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { xai } from "@ai-sdk/xai"
import axios from "axios"
import sharp from "sharp"

export class ImageDescriber {
  constructor(apiKey, provider = "xai") {
    this.apiKey = apiKey
    this.provider = provider
  }

  /**
   * Generate a description for an image file
   */
  async describeImageFile(imagePath) {
    try {
      console.log(`Processing image: ${imagePath}`)

      // Read and optimize the image
      const imageBuffer = await this.prepareImage(imagePath)
      const base64Image = imageBuffer.toString("base64")
      const dataUri = `data:image/jpeg;base64,${base64Image}`

      // Generate description using the selected AI provider
      return await this.generateDescription(dataUri)
    } catch (error) {
      console.error(`Error describing image: ${error instanceof Error ? error.message : String(error)}`)
      return "Image"
    }
  }

  /**
   * Generate a description for a remote image URL
   */
  async describeImageUrl(imageUrl) {
    try {
      console.log(`Downloading image from: ${imageUrl}`)

      // Download the image
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
      const imageBuffer = await this.optimizeImageBuffer(Buffer.from(response.data))
      const base64Image = imageBuffer.toString("base64")
      const dataUri = `data:image/jpeg;base64,${base64Image}`

      // Generate description using the selected AI provider
      return await this.generateDescription(dataUri)
    } catch (error) {
      console.error(`Error describing remote image: ${error instanceof Error ? error.message : String(error)}`)
      return "Image"
    }
  }

  /**
   * Generate a description for a base64 image
   */
  async describeBase64Image(base64Data) {
    try {
      // Extract the base64 data
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 data")
      }

      const base64 = matches[2]
      const buffer = Buffer.from(base64, "base64")
      const optimizedBuffer = await this.optimizeImageBuffer(buffer)
      const optimizedBase64 = optimizedBuffer.toString("base64")
      const dataUri = `data:image/jpeg;base64,${optimizedBase64}`

      // Generate description using the selected AI provider
      return await this.generateDescription(dataUri)
    } catch (error) {
      console.error(`Error describing base64 image: ${error instanceof Error ? error.message : String(error)}`)
      return "Image"
    }
  }

  /**
   * Generate a description using the selected AI provider
   */
  async generateDescription(dataUri) {
    try {
      console.log(`Generating description with ${this.provider}...`)

      let result
      if (this.provider === "openai") {
        result = await generateText({
          model: openai("gpt-4o", { apiKey: this.apiKey }),
          prompt: "Describe this image in a brief phrase (10 words or less):",
          images: [dataUri],
        })
      } else {
        // Default to XAI/Grok
        result = await generateText({
          model: xai("grok-1", { apiKey: this.apiKey }),
          prompt: "Describe this image in a brief phrase (10 words or less):",
          images: [dataUri],
        })
      }

      // Clean up the description
      const description = this.cleanDescription(result.text)
      console.log(`Generated description: "${description}"`)
      return description
    } catch (error) {
      console.error(`AI error: ${error instanceof Error ? error.message : String(error)}`)
      return "Image"
    }
  }

  /**
   * Read and optimize an image file
   */
  async prepareImage(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath)
    return this.optimizeImageBuffer(imageBuffer)
  }

  /**
   * Optimize an image buffer for AI processing
   */
  async optimizeImageBuffer(buffer) {
    try {
      // Resize and optimize the image for AI processing
      return await sharp(buffer)
        .resize({
          width: 800,
          height: 800,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer()
    } catch (error) {
      console.error(`Error optimizing image: ${error instanceof Error ? error.message : String(error)}`)
      return buffer // Return original buffer if optimization fails
    }
  }

  /**
   * Clean up the AI-generated description
   */
  cleanDescription(text) {
    // Remove extra whitespace and punctuation
    let cleaned = text.trim()

    // Truncate if too long
    if (cleaned.length > 100) {
      cleaned = cleaned.substring(0, 97) + "..."
    }

    // Remove trailing punctuation
    cleaned = cleaned.replace(/[.!,;:]$/, "")

    return cleaned
  }
}
