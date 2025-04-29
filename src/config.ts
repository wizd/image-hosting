import path from "path"
import dotenv from "dotenv"

dotenv.config()

// Helper function to ensure HTTPS in production
function ensureHttps(url: string): string {
  if (process.env.NODE_ENV === 'production') {
    return url.replace(/^http:/, 'https:');
  }
  return url;
}

export const CONFIG = {
  DATA_ROOT: process.env.DATA_ROOT || path.join(__dirname, "../data"),
  IMAGE_ROOT_URL: ensureHttps(process.env.IMAGE_ROOT_URL || "http://localhost:3000"),
  PORT: Number.parseInt(process.env.PORT || "3000", 10),
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_MODEL_NAME: process.env.OPENAI_MODEL_NAME,
};
