import fs from "fs"
import axios from "axios"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { xai } from "@ai-sdk/xai"
import sharp from "sharp"

// 支持的AI提供商
type AIProvider = "openai" | "xai"

export class ImageDescriber {
  private provider: AIProvider
  private apiKey: string

  constructor(provider: AIProvider, apiKey: string) {
    this.provider = provider
    this.apiKey = apiKey
  }

  /**
   * 为图片生成简短描述
   */
  async describeImage(imagePath: string): Promise<string> {
    try {
      // 读取图片并转换为base64
      const imageBuffer = await this.prepareImage(imagePath)
      const base64Image = imageBuffer.toString("base64")
      const dataUri = `data:image/jpeg;base64,${base64Image}`

      // 根据提供商选择不同的模型
      if (this.provider === "openai") {
        return await this.describeWithOpenAI(dataUri)
      } else if (this.provider === "xai") {
        return await this.describeWithXAI(dataUri)
      } else {
        throw new Error(`Unsupported AI provider: ${this.provider}`)
      }
    } catch (error) {
      console.error(`Error describing image: ${error instanceof Error ? error.message : String(error)}`)
      return "Image" // 失败时返回默认文本
    }
  }

  /**
   * 为远程图片URL生成简短描述
   */
  async describeRemoteImage(imageUrl: string): Promise<string> {
    try {
      // 下载远程图片
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" })
      const imageBuffer = await this.optimizeImageBuffer(Buffer.from(response.data))
      const base64Image = imageBuffer.toString("base64")
      const dataUri = `data:image/jpeg;base64,${base64Image}`

      // 根据提供商选择不同的模型
      if (this.provider === "openai") {
        return await this.describeWithOpenAI(dataUri)
      } else if (this.provider === "xai") {
        return await this.describeWithXAI(dataUri)
      } else {
        throw new Error(`Unsupported AI provider: ${this.provider}`)
      }
    } catch (error) {
      console.error(`Error describing remote image: ${error instanceof Error ? error.message : String(error)}`)
      return "Image" // 失败时返回默认文本
    }
  }

  /**
   * 为base64编码的图片生成简短描述
   */
  async describeBase64Image(base64Data: string): Promise<string> {
    try {
      // 提取base64数据
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 data")
      }

      const base64 = matches[2]
      const buffer = Buffer.from(base64, "base64")
      const optimizedBuffer = await this.optimizeImageBuffer(buffer)
      const optimizedBase64 = optimizedBuffer.toString("base64")
      const dataUri = `data:image/jpeg;base64,${optimizedBase64}`

      // 根据提供商选择不同的模型
      if (this.provider === "openai") {
        return await this.describeWithOpenAI(dataUri)
      } else if (this.provider === "xai") {
        return await this.describeWithXAI(dataUri)
      } else {
        throw new Error(`Unsupported AI provider: ${this.provider}`)
      }
    } catch (error) {
      console.error(`Error describing base64 image: ${error instanceof Error ? error.message : String(error)}`)
      return "Image" // 失败时返回默认文本
    }
  }

  /**
   * 准备图片：读取并优化
   */
  private async prepareImage(imagePath: string): Promise<Buffer> {
    const imageBuffer = fs.readFileSync(imagePath)
    return this.optimizeImageBuffer(imageBuffer)
  }

  /**
   * 优化图片大小和质量
   */
  private async optimizeImageBuffer(buffer: Buffer): Promise<Buffer> {
    try {
      // 使用sharp调整图片大小和质量，以减少API请求大小
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
      return buffer // 如果优化失败，返回原始buffer
    }
  }

  /**
   * 使用OpenAI生成图片描述
   */
  private async describeWithOpenAI(dataUri: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o", { apiKey: this.apiKey }),
        prompt: "Describe this image in a brief phrase (10 words or less):",
        images: [dataUri],
      })

      // 清理和简化描述
      return this.cleanDescription(text)
    } catch (error) {
      console.error(`OpenAI error: ${error instanceof Error ? error.message : String(error)}`)
      return "Image"
    }
  }

  /**
   * 使用XAI (Grok) 生成图片描述
   */
  private async describeWithXAI(dataUri: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: xai("grok-1", { apiKey: this.apiKey }),
        prompt: "Describe this image in a brief phrase (10 words or less):",
        images: [dataUri],
      })

      // 清理和简化描述
      return this.cleanDescription(text)
    } catch (error) {
      console.error(`XAI error: ${error instanceof Error ? error.message : String(error)}`)
      return "Image"
    }
  }

  /**
   * 清理和简化AI生成的描述
   */
  private cleanDescription(text: string): string {
    // 移除多余的标点和空格
    let cleaned = text.trim()

    // 如果描述太长，截断它
    if (cleaned.length > 100) {
      cleaned = cleaned.substring(0, 97) + "..."
    }

    // 移除末尾的标点
    cleaned = cleaned.replace(/[.!,;:]$/, "")

    return cleaned
  }
}
