import axios, { type AxiosInstance } from "axios"
import FormData from "form-data"
import fs from "fs"
import path from "path"

export interface ImageUploadResult {
  originalName: string
  fileId: string
  fileExtension: string
  fullUrl: string
}

export interface AuthOptions {
  email?: string
  password?: string
  apiKey?: string
}

export interface Collection {
  collectionId: string;
  collectionName: string;
}

export class ApiClient {
  private baseUrl: string;
  private email?: string;
  private password?: string;
  private apiKey?: string;
  private token: string | null = null;
  private client: AxiosInstance;
  private collectionId: string = "";
  private collectionName: string | null = null;

  constructor(baseUrl: string, authOptions: AuthOptions) {
    this.baseUrl = baseUrl;
    this.email = authOptions.email;
    this.password = authOptions.password;
    this.apiKey = authOptions.apiKey;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 seconds
    });

    // 如果提供了API密钥，直接设置请求头
    if (this.apiKey) {
      this.client.defaults.headers.common["x-api-key"] = this.apiKey;
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client.defaults.headers.common["x-api-key"] = apiKey;
    // 清除之前的 token
    this.token = null;
    delete this.client.defaults.headers.common["Authorization"];
  }

  async initialize(): Promise<void> {
    // 如果使用API密钥认证，不需要登录
    if (this.apiKey) {
      return;
    }

    // 否则使用邮箱和密码登录
    if (this.email && this.password) {
      await this.login();
    } else {
      throw new Error("Either API key or email/password must be provided");
    }
  }

  private async login(): Promise<void> {
    try {
      const response = await this.client.post("/auth/login", {
        email: this.email,
        password: this.password,
      });

      this.token = response.data.token;
      this.client.defaults.headers.common["Authorization"] =
        `Bearer ${this.token}`;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Login failed: ${error.response.data.error || error.message}`
        );
      }
      throw new Error(
        `Login failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async ensureCollection(name: string): Promise<string> {
    if (this.collectionId && this.collectionName === name) {
      return this.collectionId;
    }

    try {
      // 确保已经初始化
      await this.initialize();

      // 获取所有集合
      const response = await this.client.get<{ collections: Collection[] }>(
        "/v1/collections"
      );
      const existingCollection = response.data.collections.find(
        (c) => c.collectionName === name
      );

      if (existingCollection) {
        this.collectionId = existingCollection.collectionId;
        this.collectionName = name;
        return this.collectionId;
      }

      // 如果集合不存在，创建新集合
      const createResponse = await this.client.post<{
        collectionId: string;
        collectionName: string;
      }>("/v1/collections", { name });

      // 验证返回的 UUID 格式
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(createResponse.data.collectionId)) {
        throw new Error(
          `Server returned invalid collection ID format: ${createResponse.data.collectionId}`
        );
      }

      this.collectionId = createResponse.data.collectionId;
      this.collectionName = name;
      return this.collectionId;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Failed to ensure collection: ${error.response.data.error || error.message}`
        );
      }
      throw new Error(
        `Failed to ensure collection: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async uploadLocalImage(
    filePath: string,
    collectionId: string
  ): Promise<ImageUploadResult> {
    try {
      // 确保已经初始化
      await this.initialize();

      const formData = new FormData();
      formData.append("images", fs.createReadStream(filePath));

      const response = await this.client.post(
        `/v1/collections/${collectionId}/assets`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            // 确保认证头被正确设置
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
            ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
          },
        }
      );

      return response.data.images[0];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Failed to upload local image: ${error.response.data.error || error.message}`
        );
      }
      throw new Error(
        `Failed to upload local image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async uploadRemoteImage(
    imageUrl: string,
    collectionId: string
  ): Promise<ImageUploadResult> {
    try {
      // 确保已经初始化
      await this.initialize();

      // Download the remote image
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(response.data);

      // Get filename from URL
      const urlPath = new URL(imageUrl).pathname;
      const filename = path.basename(urlPath) || "remote-image.jpg";

      // Get content type
      const contentType = response.headers["content-type"] || "image/jpeg";

      return await this.uploadBuffer(
        buffer,
        filename,
        contentType,
        collectionId
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Failed to upload remote image: ${error.response.data.error || error.message}`
        );
      }
      throw new Error(
        `Failed to upload remote image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async uploadBase64Image(
    base64Data: string,
    filename: string,
    collectionId: string
  ): Promise<ImageUploadResult> {
    try {
      // 确保已经初始化
      await this.initialize();

      // 从 base64 数据中提取图片数据和内容类型
      const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 data format");
      }

      const contentType = matches[1];
      const base64ImageData = matches[2];
      const buffer = Buffer.from(base64ImageData, "base64");

      return await this.uploadBuffer(
        buffer,
        filename,
        contentType,
        collectionId
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Failed to upload base64 image: ${error.response.data.error || error.message}`
        );
      }
      throw new Error(
        `Failed to upload base64 image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async uploadBuffer(
    buffer: Buffer,
    filename: string,
    contentType: string,
    collectionId: string
  ): Promise<ImageUploadResult> {
    try {
      // 确保已经初始化
      await this.initialize();

      const formData = new FormData();
      formData.append("images", buffer, {
        filename,
        contentType,
      });

      const response = await this.client.post(
        `/v1/collections/${collectionId}/assets`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            // 确保认证头被正确设置
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
            ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
          },
        }
      );

      return response.data.images[0];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Failed to upload buffer: ${error.response.data.error || error.message}`
        );
      }
      throw new Error(
        `Failed to upload buffer: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
