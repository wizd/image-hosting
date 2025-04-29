import request from 'supertest'
import path from 'path'
import fs from "fs";
import { CONFIG } from "../config";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 测试数据
const ROOT_API_KEY = process.env.ROOT_API_KEY || "test-root-key"; // 需要在环境变量中设置一个根API Key

const TEST_API_KEY = {
  name: "Test API Key",
  permissions: ["read", "write"],
};

const TEST_COLLECTION = {
  name: "Test Collection",
};

let apiKey: string;
let collectionId: string;

// 清理测试数据
const cleanupTestData = () => {
  if (collectionId) {
    const testDir = path.join(CONFIG.DATA_ROOT, collectionId);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }
};

// 使用实际运行的服务器URL
const serverUrl = `http://localhost:${CONFIG.PORT}`;

describe("Image Hosting API Integration Tests", () => {
  // 在所有测试开始前创建API Key
  beforeAll(async () => {
    // 使用ROOT_API_KEY创建一个测试用的API Key
    const response = await request(serverUrl)
      .post("/api-keys")
      .set("X-API-Key", ROOT_API_KEY)
      .send(TEST_API_KEY);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("key");
    apiKey = response.body.key;
  });

  // 在所有测试结束后清理数据
  afterAll(() => {
    cleanupTestData();
  });

  // API密钥相关测试
  describe("API Keys", () => {
    it("should create additional API key", async () => {
      const response = await request(serverUrl)
        .post("/api-keys")
        .set("X-API-Key", ROOT_API_KEY) // 使用ROOT_API_KEY来创建新的API key
        .send({
          name: "Additional Test API Key",
          permissions: ["read"],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("key");
    });

    it("should get API keys", async () => {
      const response = await request(serverUrl)
        .get("/api-keys")
        .set("X-API-Key", ROOT_API_KEY); // 使用ROOT_API_KEY来获取所有API keys

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  // 集合相关测试
  describe("Collections", () => {
    it("should create collection", async () => {
      const response = await request(serverUrl)
        .post("/collections")
        .set("X-API-Key", apiKey)
        .send(TEST_COLLECTION);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("collectionId");
      collectionId = response.body.collectionId;
    });

    it("should get collections", async () => {
      const response = await request(serverUrl)
        .get("/collections")
        .set("X-API-Key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("collections");
      expect(Array.isArray(response.body.collections)).toBe(true);
      expect(response.body.collections.length).toBeGreaterThan(0);
    });
  });

  // 图片上传相关测试
  describe("Image Upload", () => {
    it("should upload image using multipart form", async () => {
      const response = await request(serverUrl)
        .post(`/collections/${collectionId}/images`)
        .set("X-API-Key", apiKey)
        .attach("images", path.join(__dirname, "test-image.jpg"));

      console.log("Multipart upload response:", response.body);
      console.log("Multipart upload status:", response.status);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("images");
      expect(Array.isArray(response.body.images)).toBe(true);
      expect(response.body.images.length).toBeGreaterThan(0);
    });

    it("should get images in collection", async () => {
      const response = await request(serverUrl)
        .get(`/collections/${collectionId}/images`)
        .set("X-API-Key", apiKey);

      console.log("Get images response:", response.body);
      console.log("Get images status:", response.status);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("images");
      expect(Array.isArray(response.body.images)).toBe(true);
      expect(response.body.images.length).toBeGreaterThan(0);
    });

    it("should serve image", async () => {
      // 首先获取集合中的图片列表
      const listResponse = await request(serverUrl)
        .get(`/collections/${collectionId}/images`)
        .set("X-API-Key", apiKey);

      console.log("List images response:", listResponse.body);
      console.log("List images status:", listResponse.status);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveProperty("images");
      expect(Array.isArray(listResponse.body.images)).toBe(true);
      expect(listResponse.body.images.length).toBeGreaterThan(0);

      const image = listResponse.body.images[0];
      console.log("Image to serve:", image);

      // 然后尝试访问图片
      const response = await request(serverUrl).get(
        `/images/${collectionId}/${image.fileId}`
      );

      console.log("Serve image status:", response.status);
      console.log("Serve image headers:", response.headers);

      expect(response.status).toBe(200);
      expect(response.header["content-type"]).toMatch(/^image\//);
    });
  });

  // 清理测试
  describe("Cleanup", () => {
    it("should delete collection", async () => {
      const response = await request(serverUrl)
        .delete(`/collections/${collectionId}`)
        .set("X-API-Key", apiKey);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Collection deleted successfully"
      );
    });
  });
}); 