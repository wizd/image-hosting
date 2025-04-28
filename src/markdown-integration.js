import fs from "fs"
import path from "path"

// Regular expressions for finding images in markdown
const LOCAL_IMAGE_REGEX = /!\[([^\]]*)\]$$(?!https?:\/\/)([^)]+)$$/g
const REMOTE_IMAGE_REGEX = /!\[([^\]]*)\]$$(https?:\/\/[^)]+)$$/g
const BASE64_IMAGE_REGEX = /!\[([^\]]*)\]$$(data:image\/[a-zA-Z+]+;base64,[^)]+)$$/g

/**
 * Process a Markdown file and add descriptions to images
 */
export async function addImageDescriptions(markdownPath, outputPath, apiKey, provider = "xai") {
  console.log(`Processing Markdown file: ${markdownPath}`)

  // Read the markdown file
  const markdown = fs.readFileSync(markdownPath, "utf-8")

  // Import the ImageDescriber dynamically to avoid circular dependencies
  const { ImageDescriber } = await import("./image-describer.js")
  const imageDescriber = new ImageDescriber(apiKey, provider)

  // Process the markdown content
  let processedMarkdown = markdown

  // Process local images
  processedMarkdown = await processLocalImages(processedMarkdown, imageDescriber, path.dirname(markdownPath))

  // Process remote images
  processedMarkdown = await processRemoteImages(processedMarkdown, imageDescriber)

  // Process base64 images
  processedMarkdown = await processBase64Images(processedMarkdown, imageDescriber)

  // Write the processed markdown to the output file
  fs.writeFileSync(outputPath, processedMarkdown)
  console.log(`Processed Markdown saved to: ${outputPath}`)
}

/**
 * Process local image references in markdown
 */
async function processLocalImages(markdown, imageDescriber, basePath) {
  let result = markdown
  const matches = Array.from(result.matchAll(LOCAL_IMAGE_REGEX))

  for (const match of matches) {
    const [fullMatch, altText, localPath] = match

    // Only process images with empty alt text
    if (!altText || altText.trim() === "") {
      try {
        // Resolve the full path to the image
        const fullPath = path.isAbsolute(localPath) ? localPath : path.resolve(basePath, localPath)

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          console.warn(`Warning: Local image not found: ${fullPath}`)
          continue
        }

        // Generate description
        const description = await imageDescriber.describeImageFile(fullPath)

        // Replace the image reference with the new alt text
        result = result.replace(fullMatch, `![${description}](${localPath})`)
      } catch (error) {
        console.error(
          `Error processing local image ${localPath}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }

  return result
}

/**
 * Process remote image references in markdown
 */
async function processRemoteImages(markdown, imageDescriber) {
  let result = markdown
  const matches = Array.from(result.matchAll(REMOTE_IMAGE_REGEX))

  for (const match of matches) {
    const [fullMatch, altText, remoteUrl] = match

    // Only process images with empty alt text
    if (!altText || altText.trim() === "") {
      try {
        // Generate description
        const description = await imageDescriber.describeImageUrl(remoteUrl)

        // Replace the image reference with the new alt text
        result = result.replace(fullMatch, `![${description}](${remoteUrl})`)
      } catch (error) {
        console.error(
          `Error processing remote image ${remoteUrl}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
  }

  return result
}

/**
 * Process base64 image references in markdown
 */
async function processBase64Images(markdown, imageDescriber) {
  let result = markdown
  const matches = Array.from(result.matchAll(BASE64_IMAGE_REGEX))

  for (const match of matches) {
    const [fullMatch, altText, base64Data] = match

    // Only process images with empty alt text
    if (!altText || altText.trim() === "") {
      try {
        // Generate description
        const description = await imageDescriber.describeBase64Image(base64Data)

        // Replace the image reference with the new alt text
        result = result.replace(fullMatch, `![${description}](${base64Data})`)
      } catch (error) {
        console.error(`Error processing base64 image: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  return result
}
