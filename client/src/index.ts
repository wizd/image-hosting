#!/usr/bin/env node

import { program } from "commander"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { processMarkdown } from "./markdown-processor"
import { ApiClient } from "./api-client"
import { ImageDescriber } from "./image-describer"
import chalk from "chalk"

// Load environment variables
dotenv.config()

// Configure the command line interface
program
  .name("markdown-image-processor")
  .description("Process images in markdown files and upload them to image hosting service")
  .version("1.0.0")

program
  .argument("<file>", "Markdown file to process")
  .option(
    "-o, --output <file>",
    "Output file (defaults to input filename with '.hosted' suffix)"
  )
  .option(
    "-c, --collection <name>",
    "Collection name for images",
    process.env.COLLECTION_NAME || "markdown-images"
  )
  .option(
    "-u, --url <url>",
    "API URL",
    process.env.API_URL || "http://localhost:3000"
  )
  .option(
    "-k, --api-key <key>",
    "API key for authentication",
    process.env.API_KEY
  )
  .option("-d, --describe", "Generate descriptions for images using AI")
  .option(
    "--ai-provider <provider>",
    "AI provider for image description (openai or xai)",
    process.env.AI_PROVIDER || "openai"
  )
  .option("--openai-key <key>", "OpenAI API key", process.env.OPENAI_API_KEY)
  .option("--xai-key <key>", "XAI API key", process.env.XAI_API_KEY)
  .action(async (file, options) => {
    try {
      // Validate input file
      if (!fs.existsSync(file)) {
        console.error(chalk.red(`Error: File not found: ${file}`));
        process.exit(1);
      }

      // 验证API密钥
      if (!options.apiKey) {
        console.error(
          chalk.red(
            "Error: API key is required. Set it via -k option or API_KEY environment variable."
          )
        );
        process.exit(1);
      }

      // Validate AI options if description is enabled
      if (options.describe) {
        const provider = options.aiProvider;
        if (provider !== "openai" && provider !== "xai") {
          console.error(
            chalk.red("Error: AI provider must be either 'openai' or 'xai'")
          );
          process.exit(1);
        }

        const apiKey =
          provider === "openai" ? options.openaiKey : options.xaiKey;
        if (!apiKey) {
          console.error(
            chalk.red(
              `Error: ${provider.toUpperCase()} API key is required for image description`
            )
          );
          process.exit(1);
        }
      }

      // Generate output filename if not specified
      const outputFile =
        options.output ||
        (() => {
          const parsedPath = path.parse(file);
          return path.join(
            parsedPath.dir,
            `${parsedPath.name}.hosted${parsedPath.ext}`
          );
        })();

      console.log(chalk.blue("Initializing API client..."));
      const apiClient = new ApiClient(options.url, {
        apiKey: options.apiKey,
      });

      // Initialize image describer if needed
      let imageDescriber = null;
      if (options.describe) {
        console.log(
          chalk.blue(
            `Initializing image description with ${options.aiProvider}...`
          )
        );
        const apiKey =
          options.aiProvider === "openai" ? options.openaiKey : options.xaiKey;
        imageDescriber = new ImageDescriber(options.aiProvider, apiKey);
      }

      console.log(chalk.blue(`Processing markdown file: ${file}`));
      const markdown = fs.readFileSync(file, "utf-8");

      console.log(chalk.blue(`Using collection: ${options.collection}`));
      const processedMarkdown = await processMarkdown(
        markdown,
        apiClient,
        options.collection,
        path.dirname(file),
        imageDescriber
      );

      console.log(chalk.blue(`Writing output to: ${outputFile}`));
      fs.writeFileSync(outputFile, processedMarkdown);

      console.log(chalk.green("Processing complete!"));
    } catch (error) {
      console.error(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      process.exit(1);
    }
  });

program.parse()
