import fs from "fs"
import path from "path"
import type { ApiClient } from "./api-client"
import chalk from "chalk"

// Regular expressions for finding images in markdown
const LOCAL_IMAGE_REGEX = /!\[([^\]]*)\]$$(?!https?:\/\/)([^)]+)$$/g
const REMOTE_IMAGE_REGEX = /!\[([^\]]*)\]$$(https?:\/\/[^)]+)$$/g
const BASE64_IMAGE_REGEX = /!\[([^\]]*)\]$$data:image\/[a-zA-Z+]+;base64,[^)]+$$/g

export async function processMarkdown(
  markdown: string,
  apiClient: ApiClient,
  collectionName: string,
  basePath: string,
  imageDescriber: any = null,
): Promise<string> {
  let processedMarkdown = markdown

  // Process local images
  processedMarkdown = await processLocalImages(processedMarkdown, apiClient, collectionName, basePath, imageDescriber)

  // Process remote images
  processedMarkdown = await processRemoteImages(processedMarkdown, apiClient, collectionName, imageDescriber)

  // Process base64 images
  processedMarkdown = await processBase64Images(processedMarkdown, apiClient, collectionName, imageDescriber)

  return processedMarkdown
}

async function processLocalImages(
  markdown: string,
  apiClient: ApiClient,
  collectionName: string,
  basePath: string,
  imageDescriber: any = null,
): Promise<string> {
  let result = markdown
  const matches = Array.from(result.matchAll(LOCAL_IMAGE_REGEX))

  for (const match of matches) {
    const [fullMatch, altText, localPath] = match

    try {
      // Resolve the full path to the image
      const fullPath = path.isAbsolute(localPath) ? localPath : path.resolve(basePath, localPath)

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.warn(chalk.yellow(`Warning: Local image not found: ${fullPath}`))
        continue
      }

      // Generate description if requested
      let description = altText
      if (imageDescriber && (!altText || altText.trim() === "")) {
        console.log(chalk.blue(`Generating description for local image: ${fullPath}`))
        description = await imageDescriber.describeImage(fullPath)
        console.log(chalk.green(`Generated description: "${description}"`))
      }

      console.log(chalk.blue(`Uploading local image: ${fullPath}`))
      const uploadResult = await apiClient.uploadLocalImage(fullPath, collectionName)

      // Replace the local image reference with the hosted URL
      result = result.replace(fullMatch, `![${description}](${uploadResult.fullUrl})`)
      console.log(chalk.green(`Replaced local image with: ${uploadResult.fullUrl}`))
    } catch (error) {
      console.error(
        chalk.red(
          `Error processing local image ${localPath}: ${error instanceof Error ? error.message : String(error)}`,
        ),
      )
    }
  }

  return result
}

async function processRemoteImages(
  markdown: string,
  apiClient: ApiClient,
  collectionName: string,
  imageDescriber: any = null,
): Promise<string> {
  let result = markdown
  const matches = Array.from(result.matchAll(REMOTE_IMAGE_REGEX))

  for (const match of matches) {
    const [fullMatch, altText, remoteUrl] = match

    try {
      // Generate description if requested
      let description = altText
      if (imageDescriber && (!altText || altText.trim() === "")) {
        console.log(chalk.blue(`Generating description for remote image: ${remoteUrl}`))
        description = await imageDescriber.describeRemoteImage(remoteUrl)
        console.log(chalk.green(`Generated description: "${description}"`))
      }

      console.log(chalk.blue(`Uploading remote image: ${remoteUrl}`))
      const uploadResult = await apiClient.uploadRemoteImage(remoteUrl, collectionName)

      // Replace the remote image reference with the hosted URL
      result = result.replace(fullMatch, `![${description}](${uploadResult.fullUrl})`)
      console.log(chalk.green(`Replaced remote image with: ${uploadResult.fullUrl}`))
    } catch (error) {
      console.error(
        chalk.red(
          `Error processing remote image ${remoteUrl}: ${error instanceof Error ? error.message : String(error)}`,
        ),
      )
    }
  }

  return result
}

async function processBase64Images(
  markdown: string,
  apiClient: ApiClient,
  collectionName: string,
  imageDescriber: any = null,
): Promise<string> {
  let result = markdown
  const matches = Array.from(result.matchAll(BASE64_IMAGE_REGEX))

  for (const match of matches) {
    const [fullMatch, altText] = match

    try {
      // Extract the base64 data
      const base64Data = fullMatch.match(/$$data:image\/[a-zA-Z+]+;base64,[^)]+$$/)?.[0].slice(1, -1)

      if (!base64Data) {
        continue
      }

      // Generate description if requested
      let description = altText
      if (imageDescriber && (!altText || altText.trim() === "")) {
        console.log(chalk.blue(`Generating description for base64 image`))
        description = await imageDescriber.describeBase64Image(base64Data)
        console.log(chalk.green(`Generated description: "${description}"`))
      }

      console.log(chalk.blue(`Uploading base64 image`))
      const filename = `base64-image-${Date.now()}.png`
      const uploadResult = await apiClient.uploadBase64Image(base64Data, filename, collectionName)

      // Replace the base64 image reference with the hosted URL
      result = result.replace(fullMatch, `![${description}](${uploadResult.fullUrl})`)
      console.log(chalk.green(`Replaced base64 image with: ${uploadResult.fullUrl}`))
    } catch (error) {
      console.error(
        chalk.red(`Error processing base64 image: ${error instanceof Error ? error.message : String(error)}`),
      )
    }
  }

  return result
}
