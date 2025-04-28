import sharp from "sharp"

interface ProcessingOptions {
  width?: number
  height?: number
  quality?: number
  format?: "jpeg" | "png" | "webp" | "avif"
}

export async function processImage(buffer: Buffer, options: ProcessingOptions): Promise<Buffer> {
  let processor = sharp(buffer)

  // Resize if dimensions provided
  if (options.width || options.height) {
    processor = processor.resize({
      width: options.width,
      height: options.height,
      fit: "inside",
      withoutEnlargement: true,
    })
  }

  // Convert format if specified
  if (options.format) {
    switch (options.format) {
      case "jpeg":
        processor = processor.jpeg({ quality: options.quality || 80 })
        break
      case "png":
        processor = processor.png({ quality: options.quality || 80 })
        break
      case "webp":
        processor = processor.webp({ quality: options.quality || 80 })
        break
      case "avif":
        processor = processor.avif({ quality: options.quality || 80 })
        break
    }
  }

  return processor.toBuffer()
}
