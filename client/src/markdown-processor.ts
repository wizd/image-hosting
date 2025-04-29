import fs from "fs"
import path from "path"
import type { ApiClient } from "./api-client"
import chalk from "chalk"

// Regular expressions for finding images in markdown
const LOCAL_IMAGE_REGEX = /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g;
const REMOTE_IMAGE_REGEX = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
const BASE64_IMAGE_REGEX =
  /!\[([^\]]*)\]\((data:image\/[a-zA-Z+]+;base64,[^)]+)\)/g;

export async function processMarkdown(
  markdown: string,
  apiClient: ApiClient,
  collectionName: string,
  basePath: string,
  imageDescriber: any = null
): Promise<string> {
  let processedMarkdown = markdown;

  console.log(chalk.cyan("\n=== Starting Markdown Processing ==="));

  // 确保集合存在并获取集合ID
  console.log(
    chalk.cyan(`\n--- Ensuring Collection Exists: ${collectionName} ---`)
  );
  let collectionId;
  try {
    collectionId = await apiClient.ensureCollection(collectionName);
    console.log(
      chalk.green(`Collection created/found with ID: ${collectionId}`)
    );

    // 验证返回的 UUID 格式
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(collectionId)) {
      throw new Error(`Invalid collection ID format received: ${collectionId}`);
    }
  } catch (error) {
    console.error(
      chalk.red(
        `Error ensuring collection: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    throw error;
  }

  // Process local images
  console.log(chalk.cyan("\n--- Processing Local Images ---"));
  processedMarkdown = await processLocalImages(
    processedMarkdown,
    apiClient,
    collectionId,
    collectionName,
    basePath,
    imageDescriber
  );

  // Process remote images
  console.log(chalk.cyan("\n--- Processing Remote Images ---"));
  processedMarkdown = await processRemoteImages(
    processedMarkdown,
    apiClient,
    collectionId,
    collectionName,
    imageDescriber
  );

  // Process base64 images
  console.log(chalk.cyan("\n--- Processing Base64 Images ---"));
  processedMarkdown = await processBase64Images(
    processedMarkdown,
    apiClient,
    collectionId,
    collectionName,
    imageDescriber
  );

  console.log(chalk.cyan("\n=== Markdown Processing Completed ===\n"));
  return processedMarkdown;
}

async function processLocalImages(
  markdown: string,
  apiClient: ApiClient,
  collectionId: string,
  collectionName: string,
  basePath: string,
  imageDescriber: any = null
): Promise<string> {
  let result = markdown;
  const matches = Array.from(result.matchAll(LOCAL_IMAGE_REGEX));

  for (const match of matches) {
    const [fullMatch, altText, localPath] = match;
    console.log(chalk.cyan(`\nProcessing local image: ${localPath}`));
    console.log(chalk.gray(`Alt text: ${altText || "(empty)"}`));

    try {
      // Handle file:/// protocol paths
      let fullPath = localPath;
      if (localPath.startsWith("file:///")) {
        fullPath = localPath.replace("file:///", "");
      } else {
        fullPath = path.isAbsolute(localPath)
          ? localPath
          : path.resolve(basePath, localPath);
      }
      console.log(chalk.gray(`Full path: ${fullPath}`));

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.warn(
          chalk.yellow(`Warning: Local image not found: ${fullPath}`)
        );
        continue;
      }

      // Generate description if requested
      let description = altText;
      if (imageDescriber && (!altText || altText.trim() === "")) {
        console.log(chalk.blue(`Generating description for local image...`));
        description = await imageDescriber.describeImage(fullPath);
        console.log(chalk.green(`Generated description: "${description}"`));
      }

      console.log(
        chalk.blue(
          `Uploading local image to collection "${collectionName}" (ID: ${collectionId})`
        )
      );
      const uploadResult = await apiClient.uploadLocalImage(
        fullPath,
        collectionId
      );

      // Replace the local image reference with the hosted URL
      result = result.replace(
        fullMatch,
        `![${description}](${uploadResult.fullUrl})`
      );
      console.log(
        chalk.green(`✓ Successfully replaced with: ${uploadResult.fullUrl}`)
      );
    } catch (error) {
      console.error(
        chalk.red(
          `✗ Error processing local image ${localPath}: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  return result;
}

async function processRemoteImages(
  markdown: string,
  apiClient: ApiClient,
  collectionId: string,
  collectionName: string,
  imageDescriber: any = null
): Promise<string> {
  let result = markdown;
  const matches = Array.from(result.matchAll(REMOTE_IMAGE_REGEX));

  for (const match of matches) {
    const [fullMatch, altText, remoteUrl] = match;
    console.log(chalk.cyan(`\nProcessing remote image: ${remoteUrl}`));
    console.log(chalk.gray(`Alt text: ${altText || "(empty)"}`));

    try {
      // Generate description if requested
      let description = altText;
      if (imageDescriber && (!altText || altText.trim() === "")) {
        console.log(chalk.blue(`Generating description for remote image...`));
        description = await imageDescriber.describeRemoteImage(remoteUrl);
        console.log(chalk.green(`Generated description: "${description}"`));
      }

      console.log(
        chalk.blue(
          `Uploading remote image to collection "${collectionName}" (ID: ${collectionId})`
        )
      );
      const uploadResult = await apiClient.uploadRemoteImage(
        remoteUrl,
        collectionId
      );

      // Replace the remote image reference with the hosted URL
      result = result.replace(
        fullMatch,
        `![${description}](${uploadResult.fullUrl})`
      );
      console.log(
        chalk.green(`✓ Successfully replaced with: ${uploadResult.fullUrl}`)
      );
    } catch (error) {
      console.error(
        chalk.red(
          `✗ Error processing remote image ${remoteUrl}: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  return result;
}

async function processBase64Images(
  markdown: string,
  apiClient: ApiClient,
  collectionId: string,
  collectionName: string,
  imageDescriber: any = null
): Promise<string> {
  let result = markdown;
  const matches = Array.from(result.matchAll(BASE64_IMAGE_REGEX));

  for (const match of matches) {
    const [fullMatch, altText, base64Data] = match;
    console.log(chalk.cyan("\nProcessing base64 image"));
    console.log(chalk.gray(`Alt text: ${altText || "(empty)"}`));

    try {
      if (!base64Data) {
        console.warn(chalk.yellow("Warning: Invalid base64 data format"));
        continue;
      }

      // Generate description if requested
      let description = altText;
      if (imageDescriber && (!altText || altText.trim() === "")) {
        console.log(chalk.blue(`Generating description for base64 image...`));
        description = await imageDescriber.describeBase64Image(base64Data);
        console.log(chalk.green(`Generated description: "${description}"`));
      }

      const filename = `base64-image-${Date.now()}.png`;
      console.log(
        chalk.blue(
          `Uploading base64 image to collection "${collectionName}" (ID: ${collectionId})`
        )
      );
      const uploadResult = await apiClient.uploadBase64Image(
        base64Data,
        filename,
        collectionId
      );

      // Replace the base64 image reference with the hosted URL
      result = result.replace(
        fullMatch,
        `![${description}](${uploadResult.fullUrl})`
      );
      console.log(
        chalk.green(`✓ Successfully replaced with: ${uploadResult.fullUrl}`)
      );
    } catch (error) {
      console.error(
        chalk.red(
          `✗ Error processing base64 image: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  return result;
}
