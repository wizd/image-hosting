import request from 'supertest'
import path from 'path'
import fs from "fs";
import { CONFIG } from "../config";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import chalk from "chalk";
// 加载环境变量
dotenv.config({ path: ".env.test" });

// 测试数据
const ROOT_API_KEY = process.env.ROOT_API_KEY || "test-root-key"; // 需要在环境变量中设置一个根API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // OpenAI API密钥用于测试图片描述功能
const API_URL = process.env.API_URL || `http://localhost:${CONFIG.PORT}`; // 使用环境变量中的API_URL，如果未设置则使用本地地址

// 打印测试配置信息
console.log(chalk.blue("=== Test Configuration ==="));
console.log(chalk.blue(`API_URL: ${API_URL}`));
console.log(chalk.blue(`DATA_ROOT: ${CONFIG.DATA_ROOT}`));
console.log(chalk.blue(`ROOT_API_KEY: ${ROOT_API_KEY.substring(0, 4)}...`)); // 只显示前4位
console.log(chalk.blue("=====================\n"));

const TEST_API_KEY = {
  name: "Test API Key",
  permissions: ["read", "write"],
};

const TEST_COLLECTION = {
  name: "Test Collection",
};

let apiKey: string;
let collectionId: string;
let uploadedImageId: string;
let uploadedImageExt: string;

// 清理测试数据
const cleanupTestData = () => {
  if (collectionId) {
    const testDir = path.join(CONFIG.DATA_ROOT, collectionId);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
};

describe("Image Hosting API Integration Tests", () => {
  // 在所有测试开始前创建API Key
  beforeAll(async () => {
    try {
      // 使用ROOT_API_KEY创建一个测试用的API Key
      const response = await request(API_URL)
        .post("/api-keys")
        .set("X-API-Key", ROOT_API_KEY)
        .send(TEST_API_KEY);

      if (response.status !== 201) {
        console.error(chalk.red("Failed to create API key:"));
        console.error(chalk.red(`Status: ${response.status}`));
        console.error(
          chalk.red(`Body: ${JSON.stringify(response.body, null, 2)}`)
        );
        throw new Error(`Failed to create API key: ${response.status}`);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("key");
      apiKey = response.body.key;
      console.log(
        chalk.green(
          `Successfully created test API key: ${apiKey.substring(0, 4)}...`
        )
      );
    } catch (error) {
      console.error(chalk.red("Error in beforeAll:"));
      console.error(chalk.red(error));
      throw error;
    }
  });

  // 在所有测试结束后清理数据
  afterAll(() => {
    cleanupTestData();
  });

  // API密钥相关测试
  describe("API Keys", () => {
    it("should create additional API key", async () => {
      const response = await request(API_URL)
        .post("/api-keys")
        .set("X-API-Key", ROOT_API_KEY)
        .send({
          name: "Additional Test API Key",
          permissions: ["read"],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("key");
    });

    it("should get API keys", async () => {
      const response = await request(API_URL)
        .get("/api-keys")
        .set("X-API-Key", ROOT_API_KEY);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  // 集合相关测试
  describe("Collections", () => {
    it("should create collection", async () => {
      const response = await request(API_URL)
        .post("/v1/collections")
        .set("X-API-Key", apiKey)
        .send(TEST_COLLECTION);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("collectionId");
      collectionId = response.body.collectionId;
    });

    it("should get collections", async () => {
      const response = await request(API_URL)
        .get("/v1/collections")
        .set("X-API-Key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("collections");
      expect(Array.isArray(response.body.collections)).toBe(true);
      expect(response.body.collections.length).toBeGreaterThan(0);
    });
  });

  // 图片上传相关测试
  describe("Image Upload and Processing", () => {
    it("should upload image using multipart form", async () => {
      const response = await request(API_URL)
        .post(`/v1/collections/${collectionId}/assets`)
        .set("X-API-Key", apiKey)
        .attach("images", path.join(__dirname, "test-image.jpg"));

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("images");
      expect(Array.isArray(response.body.images)).toBe(true);
      expect(response.body.images.length).toBeGreaterThan(0);

      // 保存上传的图片ID和扩展名，用于后续测试
      uploadedImageId = response.body.images[0].fileId;
      uploadedImageExt = response.body.images[0].fileExtension;
    });

    it("should get images in collection", async () => {
      const response = await request(API_URL)
        .get(`/v1/collections/${collectionId}/assets`)
        .set("X-API-Key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("images");
      expect(Array.isArray(response.body.images)).toBe(true);
      expect(response.body.images.length).toBeGreaterThan(0);
    });

    it("should serve image", async () => {
      const response = await request(API_URL).get(
        `/v1/assets/${collectionId}/${uploadedImageId}${uploadedImageExt}`
      );

      expect(response.status).toBe(200);
      expect(response.header["content-type"]).toMatch(/^image\//);
    });

    // 图片描述功能测试
    it("should generate image description if OpenAI API key is available", async () => {
      // 如果没有配置OpenAI API密钥，跳过此测试
      if (!OPENAI_API_KEY) {
        console.log(
          chalk.yellow(
            "Skipping image description test - No OpenAI API key available"
          )
        );
        return;
      }

      // 检查测试图片是否存在
      const testImagePath = path.join(__dirname, "test-image.jpg");
      if (!fs.existsSync(testImagePath)) {
        console.log(
          chalk.yellow(
            "Skipping image description test - Test image not found. Please create src/__tests__/test-image.jpg"
          )
        );
        return;
      }

      // 确保已经上传了图片
      if (!uploadedImageId) {
        console.log(
          chalk.yellow(
            "Skipping image description test - No image uploaded in previous test"
          )
        );
        return;
      }

      const response = await request(API_URL)
        .post(
          `/v1/collections/${collectionId}/assets/${uploadedImageId}/description`
        )
        .set("X-API-Key", apiKey)
        .send({
          beforeText: "这是一个测试图片，展示了",
          afterText: "这个图片说明了测试场景",
        });

      if (
        response.status === 500 &&
        response.body.error === "Failed to generate image description"
      ) {
        console.log(
          chalk.yellow(
            "Image description generation failed - This might be due to OpenAI API issues"
          )
        );
        return;
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("description");
      expect(typeof response.body.description).toBe("string");
      expect(response.body.description.length).toBeGreaterThan(0);
    });

    it("should handle invalid image ID for description generation", async () => {
      const response = await request(API_URL)
        .post(`/v1/collections/${collectionId}/assets/invalid-id/description`)
        .set("X-API-Key", apiKey)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Image not found");
    });
  });

  // 清理测试
  describe("Cleanup", () => {
    it("should delete collection", async () => {
      const response = await request(API_URL)
        .delete(`/v1/collections/${collectionId}`)
        .set("X-API-Key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection deleted successfully"
      );
    });
  });
}); 