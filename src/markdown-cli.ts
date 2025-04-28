#!/usr/bin/env node
import { program } from "commander"
import { Command } from "commander"
import { ImageDescriber } from "./image-describer"
import fs from "fs"
import dotenv from "dotenv"
import path from "path"

// Load environment variables
dotenv.config()

program
  .name("markdown-cli")
  .description("CLI for processing markdown files")
  .version("1.0.0")

program
  .command("process")
  .description("Process a markdown file")
  .argument("<file>", "The markdown file to process")
  .option("-o, --output <file>", "Output file path")
  .option("-k, --api-key <key>", "OpenAI API key")
  .action(async (file: string, options: { output?: string; apiKey?: string }) => {
    try {
      // Validate input file
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`)
        process.exit(1)
      }

      // Validate API key
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.error(
          "Error: OpenAI API key is required. Set it via --api-key option or OPENAI_API_KEY environment variable.",
        )
        process.exit(1)
      }

      const outputFile = options.output || file
      const imageDescriber = new ImageDescriber(apiKey)

      // Process the markdown file
      const markdown = fs.readFileSync(file, "utf-8")
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
      let processedMarkdown = markdown
      let match

      while ((match = imageRegex.exec(markdown)) !== null) {
        const [fullMatch, altText, imagePath] = match
        if (!altText || altText.trim() === "") {
          try {
            let description
            if (imagePath.startsWith("http")) {
              description = await imageDescriber.describeImageUrl(imagePath)
            } else if (imagePath.startsWith("data:")) {
              description = await imageDescriber.describeBase64Image(imagePath)
            } else {
              const fullPath = path.resolve(path.dirname(file), imagePath)
              description = await imageDescriber.describeImageFile(fullPath)
            }
            processedMarkdown = processedMarkdown.replace(fullMatch, `![${description}](${imagePath})`)
          } catch (error) {
            console.error(`Error processing image ${imagePath}: ${error}`)
          }
        }
      }

      // Write the processed markdown
      fs.writeFileSync(outputFile, processedMarkdown)
      console.log("Processing complete!")
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  })

program.parse()