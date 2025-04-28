declare module "./markdown-integration.js" {
  export function addImageDescriptions(
    inputFile: string,
    outputFile: string,
    apiKey: string
  ): Promise<void>;
} 