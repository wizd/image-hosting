import path from "path"
import dotenv from "dotenv"

dotenv.config()

export const CONFIG = {
  DATA_ROOT: process.env.DATA_ROOT || path.join(__dirname, "../data"),
  IMAGE_ROOT_URL: process.env.IMAGE_ROOT_URL || "http://localhost:3000/images/",
  PORT: Number.parseInt(process.env.PORT || "3000", 10),
}
