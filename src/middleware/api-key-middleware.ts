import { Request, Response, NextFunction } from "express";
import { CONFIG } from "../config";

export interface ApiKeyRequest extends Request {
  apiKey?: string;
  user?: {
    id: string;
  };
}

export const authenticateApiKey = (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    res.status(401).json({ error: "API key is required" });
    return;
  }

  if (apiKey !== process.env.API_KEY) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  req.apiKey = apiKey;
  req.user = { id: "default-user" };
  next();
};
