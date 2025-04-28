import fs from "fs"
import OpenAI from "openai"
import axios from "axios"
import sharp from "sharp"

export class ImageDescriber {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  /**
   * Generate a description for an image file
   */
  async describeImageFile(imagePath: string): Promise<string> {
    try {
      console.log(`Processing image: ${imagePath}`)

      // Read and optimize the image
      const imageBuffer = await this.prepareImage(imagePath)
      const base64Image = imageBuffer.toString("base64")
      const dataUri = `data:image/jpeg;base64,${base64Image}`

      // Generate description using OpenAI
      return await this.generateDescription(dataUri)
    } catch (error) {
      console.error(`Error describing image: ${error instanceof Error ? error.message : String(error)}`)
      return "Image"
    }
  }

  /**
   * Generate a description for a remote image URL
   */
  async describeImageUrl(imageUrl: string): Promise<string> {
    try {
      console.log(`Downloading image from: ${imageUrl}`)

      // Download the image
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
      const imageBuffer = await this.optimizeImageBuffer(Buffer.from(response.data))
      const base64Image = imageBuffer.toString("base64")
      const dataUri = `data:image/jpeg;base64,${base64Image}`

      // Generate description using OpenAI
      return await this.generateDescription(dataUri)
    } catch (error) {
      console.error(`Error describing remote image: ${error instanceof Error ? error.message : String(error)}`)
      return "Image"
    }
  }

  /**
   * Generate a description for a base64 image
   */
  async describeBase64Image(base64Data: string): Promise<string> {
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

      // Generate description using OpenAI
      return await this.generateDescription(dataUri)
    } catch (error) {
      console.error(`Error describing base64 image: ${error instanceof Error ? error.message : String(error)}`)
      return "Image"
    }
  }

  /**
   * Generate a description using OpenAI
   */
  private async generateDescription(dataUri: string): Promise<string> {
    try {
      console.log("Generating description with OpenAI...")

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image in a brief phrase (10 words or less):" },
              {
                type: "image_url",
                image_url: {
                  url: dataUri,
                },
              },
            ],
          },
        ],
        max_tokens: 50,
      })

      // Clean up the description
      const description = this.cleanDescription(response.choices[0].message.content || "")
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
  private async prepareImage(imagePath: string): Promise<Buffer> {
    const imageBuffer = fs.readFileSync(imagePath)
    return this.optimizeImageBuffer(imageBuffer)
  }

  /**
   * Optimize an image buffer for AI processing
   */
  private async optimizeImageBuffer(buffer: Buffer): Promise<Buffer> {
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
  private cleanDescription(text: string): string {
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