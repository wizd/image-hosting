import request from 'supertest'
import path from 'path'
import fs from 'fs'
import app from '../index'
import { CONFIG } from '../config'
import { v4 as uuidv4 } from 'uuid'

// 测试数据
const TEST_USER = {
  username: `test-user-${uuidv4()}`,
  email: `test-${uuidv4()}@example.com`,
  password: 'testPassword123!',
}

const TEST_COLLECTION = {
  name: 'Test Collection',
}

let authToken: string
let apiKey: string
let collectionId: string

// 清理测试数据
const cleanupTestData = () => {
  if (collectionId) {
    const testDir = path.join(CONFIG.DATA_ROOT, collectionId)
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  }
}

describe('Image Hosting API Integration Tests', () => {
  // 在所有测试开始前注册用户并登录
  beforeAll(async () => {
    // 注册用户
    await request(app)
      .post('/auth/register')
      .send(TEST_USER)

    // 登录获取token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      })
    
    authToken = loginResponse.body.token
  })

  // 在所有测试结束后清理数据
  afterAll(() => {
    cleanupTestData()
  })

  // 认证相关测试
  describe('Authentication', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('email', TEST_USER.email)
    })
  })

  // API密钥相关测试
  describe('API Keys', () => {
    it('should create API key', async () => {
      const response = await request(app)
        .post('/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test API Key',
          permissions: ['read', 'write'],
        })
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('key')
      apiKey = response.body.key
    })

    it('should get user API keys', async () => {
      const response = await request(app)
        .get('/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })
  })

  // 集合相关测试
  describe('Collections', () => {
    it('should create collection using JWT', async () => {
      const response = await request(app)
        .post('/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(TEST_COLLECTION)
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('collectionId')
      collectionId = response.body.collectionId
    })

    it('should create collection using API key', async () => {
      const response = await request(app)
        .post('/collections')
        .set('X-API-Key', apiKey)
        .send({
          name: 'Test Collection API Key',
        })
      
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('collectionId')
    })

    it('should get user collections', async () => {
      const response = await request(app)
        .get('/collections')
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('collections')
      expect(Array.isArray(response.body.collections)).toBe(true)
      expect(response.body.collections.length).toBeGreaterThan(0)
    })
  })

  // 图片上传相关测试
  describe('Image Upload', () => {
    it('should upload image using multipart form', async () => {
      const response = await request(app)
        .post(`/collections/${collectionId}/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('images', path.join(__dirname, 'test-image.jpg'))
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('images')
      expect(Array.isArray(response.body.images)).toBe(true)
      expect(response.body.images.length).toBeGreaterThan(0)
    })

    it('should upload base64 image', async () => {
      // 创建一个简单的测试图片的base64数据
      const testImagePath = path.join(__dirname, 'test-image.jpg')
      console.log('Test image path:', testImagePath)
      
      const imageBuffer = fs.readFileSync(testImagePath)
      console.log('Image buffer size:', imageBuffer.length)
      
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
      console.log('Base64 image length:', base64Image.length)
      console.log('Base64 image prefix:', base64Image.substring(0, 50))

      const requestBody = {
        images: [{
          data: base64Image,
          filename: 'test-image.jpg'
        }]
      }
      console.log('Request body:', JSON.stringify(requestBody, null, 2))

      const response = await request(app)
        .post(`/collections/${collectionId}/base64`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
      
      console.log('Base64 upload response:', response.body)
      console.log('Base64 upload status:', response.status)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('images')
      expect(Array.isArray(response.body.images)).toBe(true)
      expect(response.body.images.length).toBeGreaterThan(0)
    })

    it('should get images in collection', async () => {
      const response = await request(app)
        .get(`/collections/${collectionId}/images`)
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('images')
      expect(Array.isArray(response.body.images)).toBe(true)
      expect(response.body.images.length).toBeGreaterThan(0)
    })

    it('should serve image', async () => {
      // 首先获取集合中的图片列表
      const listResponse = await request(app)
        .get(`/collections/${collectionId}/images`)
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(listResponse.status).toBe(200)
      expect(listResponse.body).toHaveProperty('images')
      expect(Array.isArray(listResponse.body.images)).toBe(true)
      expect(listResponse.body.images.length).toBeGreaterThan(0)

      const image = listResponse.body.images[0]
      
      // 然后尝试访问图片
      const response = await request(app)
        .get(`/images/${collectionId}/${image.fileId}`)
      
      expect(response.status).toBe(200)
      expect(response.header['content-type']).toMatch(/^image\//)
    })
  })

  // 清理测试
  describe('Cleanup', () => {
    it('should delete collection', async () => {
      const response = await request(app)
        .delete(`/collections/${collectionId}`)
        .set('Authorization', `Bearer ${authToken}`)
      
      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Collection deleted successfully')
    })
  })
}) 