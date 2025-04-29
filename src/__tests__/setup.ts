import path from 'path'

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.PORT = '3001'
process.env.JWT_SECRET = 'test-secret-key'
process.env.DATA_ROOT = path.join(__dirname, '../../test-data')
process.env.IMAGE_ROOT_URL = 'http://localhost:3001/images/'

// 设置测试超时时间
jest.setTimeout(30000) 