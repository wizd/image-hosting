#!/usr/bin/env node
import { program } from "commander"
import fs from "fs"
import dotenv from "dotenv"
import { addImageDescriptions } from "./markdown-integration.js"

// Load environment variables
dotenv.config()

// Configure the command line interface
program
  .name("markdown-image-describer")
  .description("Add AI-generated descriptions to images in Markdown files")
  .version("1.0.0")

program
  .argument("<file>", "Markdown file to process")
  .option("-o, --output <file>", "Output file (defaults to overwriting input file)")
  .option("-k, --api-key <key>", "Grok API key", process.env.XAI_API_KEY)
  .action(async (file, options) => {
    try {
      // Validate input file
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`)
        process.exit(1)
      }

      // Validate API key
      if (!options.apiKey) {
        console.error(
          "Error: Grok API key is required. Set it via --api-key option or XAI_API_KEY environment variable.",
        )
        process.exit(1)
      }

      const outputFile = options.output || file

      await addImageDescriptions(file, outputFile, options.apiKey)
      console.log("Processing complete!")
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  })

program.parse()
