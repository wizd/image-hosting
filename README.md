# TypeScript 图片托管服务

一个基于TypeScript和Express的图片托管服务，允许用户创建集合并上传图片。该服务包含完整的用户认证系统，可以部署在Vercel上，提供安全且强大的图片托管功能。

## 功能特点

- 用户注册和登录系统，使用JWT进行身份验证
- 创建具有唯一ID的命名集合
- 上传多个图片到集合中
- 为集合和文件自动生成UUID
- 返回包含图片元数据的JSON响应
- 基于用户的权限控制（用户只能访问自己的集合）
- 可配置的存储路径和URL
- 支持Vercel部署

## 技术栈

- **后端**: Node.js, Express
- **语言**: TypeScript
- **身份验证**: JWT (JSON Web Tokens)
- **密码加密**: bcryptjs
- **文件处理**: Multer
- **ID生成**: UUID
- **部署**: Vercel

## 环境变量

服务需要以下环境变量:

| 变量名 | 描述 | 默认值 | 必需 |
|-------------|-------------|-------------|-------------|
| `DATA_ROOT` | 存储图片和元数据的目录路径 | `./data` | 是 |
| `IMAGE_ROOT_URL` | 访问图片的基础URL | `http://localhost:3000/images/` | 是 |
| `PORT` | 服务器端口 | `3000` | 否 |
| `JWT_SECRET` | JWT令牌的密钥 | `default-secret-key` | 是（生产环境） |

## 项目结构

\`\`\`
image-hosting-service/
├── src/
│   ├── index.ts                # 主入口文件
│   ├── auth/                   # 身份验证相关代码
│   │   ├── auth-types.ts       # 认证相关类型定义
│   │   ├── auth-controller.ts  # 认证控制器（注册、登录、获取个人资料）
│   │   ├── auth-middleware.ts  # 认证中间件（验证令牌）
│   │   └── user-service.ts     # 用户服务（创建用户、查找用户等）
│   └── middleware/             # 中间件
│       └── auth-middleware.ts  # 认证中间件
├── dist/                       # 编译后的JavaScript文件
├── data/                       # 图片和元数据存储目录
├── tsconfig.json               # TypeScript配置
├── package.json                # 项目依赖
└── vercel.json                 # Vercel部署配置
\`\`\`

## 安装与设置

1. 克隆仓库
   \`\`\`bash
   git clone <repository-url>
   cd image-hosting-service
   \`\`\`

2. 安装依赖
   \`\`\`bash
   npm install
   \`\`\`

3. 创建`.env`文件并设置环境变量
   \`\`\`
   DATA_ROOT=./data
   IMAGE_ROOT_URL=http://your-domain.com/images/
   PORT=3000
   JWT_SECRET=your-secret-key
   \`\`\`

4. 构建项目
   \`\`\`bash
   npm run build
   \`\`\`

5. 启动服务
   \`\`\`bash
   npm start
   \`\`\`

## API端点

### 用户认证

#### 注册新用户

\`\`\`
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
\`\`\`

响应:
\`\`\`json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2023-12-15T12:30:45.123Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
\`\`\`

#### 用户登录

\`\`\`
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
\`\`\`

响应:
\`\`\`json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2023-12-15T12:30:45.123Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
\`\`\`

#### 获取用户资料

\`\`\`
GET /auth/profile
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

响应:
\`\`\`json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2023-12-15T12:30:45.123Z"
  }
}
\`\`\`

### 集合管理

#### 创建集合（需要认证）

\`\`\`
POST /collections
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "name": "my-collection"
}
\`\`\`

响应:
\`\`\`json
{
  "collectionId": "550e8400-e29b-41d4-a716-446655440000",
  "collectionName": "my-collection",
  "userId": "7b52009b-bfd9-4e2b-0d93-839c55f10200"
}
\`\`\`

#### 获取用户的所有集合（需要认证）

\`\`\`
GET /collections
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

响应:
\`\`\`json
{
  "collections": [
    {
      "collectionId": "550e8400-e29b-41d4-a716-446655440000",
      "collectionName": "my-collection",
      "userId": "7b52009b-bfd9-4e2b-0d93-839c55f10200"
    },
    {
      "collectionId": "3fdba35f-04cd-4e2e-8c84-96a4413c0201",
      "collectionName": "vacation-photos",
      "userId": "7b52009b-bfd9-4e2b-0d93-839c55f10200"
    }
  ]
}
\`\`\`

#### 删除集合（需要认证）

\`\`\`
DELETE /collections/:collectionId
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

响应:
\`\`\`json
{
  "message": "Collection deleted successfully"
}
\`\`\`

### 图片管理

#### 上传图片到集合（需要认证）

\`\`\`
POST /collections/:collectionId/images
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data

images: [file1, file2, ...]
\`\`\`

响应:
\`\`\`json
{
  "collectionId": "550e8400-e29b-41d4-a716-446655440000",
  "images": [
    {
      "originalName": "image1.jpg",
      "fileId": "7b52009b-bfd9-4e2b-0d93-839c55f10200",
      "fileExtension": ".jpg",
      "fullUrl": "http://your-domain.com/images/550e8400-e29b-41d4-a716-446655440000/7b52009b-bfd9-4e2b-0d93-839c55f10200.jpg"
    },
    {
      "originalName": "image2.png",
      "fileId": "3fdba35f-04cd-4e2e-8c84-96a4413c0201",
      "fileExtension": ".png",
      "fullUrl": "http://your-domain.com/images/550e8400-e29b-41d4-a716-446655440000/3fdba35f-04cd-4e2e-8c84-96a4413c0201.png"
    }
  ]
}
\`\`\`

#### 获取集合中的所有图片（需要认证）

\`\`\`
GET /collections/:collectionId/images
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

响应:
\`\`\`json
{
  "collectionId": "550e8400-e29b-41d4-a716-446655440000",
  "images": [
    {
      "originalName": "image1.jpg",
      "fileId": "7b52009b-bfd9-4e2b-0d93-839c55f10200",
      "fileExtension": ".jpg",
      "fullUrl": "http://your-domain.com/images/550e8400-e29b-41d4-a716-446655440000/7b52009b-bfd9-4e2b-0d93-839c55f10200.jpg"
    },
    {
      "originalName": "image2.png",
      "fileId": "3fdba35f-04cd-4e2e-8c84-96a4413c0201",
      "fileExtension": ".png",
      "fullUrl": "http://your-domain.com/images/550e8400-e29b-41d4-a716-446655440000/3fdba35f-04cd-4e2e-8c84-96a4413c0201.png"
    }
  ]
}
\`\`\`

#### 访问图片（公开访问）

\`\`\`
GET /images/:collectionId/:fileId
\`\`\`

返回图片文件。

### 系统状态

#### 健康检查

\`\`\`
GET /health
\`\`\`

响应:
\`\`\`json
{
  "status": "ok",
  "environment": "production"
}
\`\`\`

## 认证系统详解

### JWT认证流程

1. **用户注册/登录**：用户提供凭据，服务器验证后生成JWT令牌
2. **令牌使用**：客户端在后续请求中通过`Authorization`头部发送令牌
3. **令牌验证**：服务器验证令牌的有效性和过期时间
4. **访问控制**：根据令牌中的用户ID确定资源访问权限

### 安全特性

- 密码使用bcrypt进行哈希处理，不会明文存储
- JWT令牌有24小时的过期时间
- 用户只能访问和修改自己的资源（集合和图片）
- 所有敏感操作都需要有效的认证令牌

### 用户数据存储

用户数据存储在`DATA_ROOT`目录下的`users.json`文件中。每个用户记录包含：

- 唯一ID
- 用户名
- 电子邮件
- 哈希密码
- 创建时间

## 在Vercel上部署

本项目已配置为可以直接部署到Vercel。

1. 在Vercel上创建新项目并连接到您的Git仓库

2. 配置环境变量:
   - `DATA_ROOT`: 在Vercel上，这应该设置为`/tmp/data`或其他可写目录
   - `IMAGE_ROOT_URL`: 设置为您的Vercel域名，例如`https://your-project.vercel.app/images/`
   - `JWT_SECRET`: 设置一个安全的密钥用于JWT令牌生成（**非常重要**：使用强密钥）

3. 部署项目

注意：由于Vercel的无服务器函数特性，本地文件存储在生产环境中可能不是最佳选择。对于生产环境，建议使用Vercel Blob或其他云存储服务。

## 本地开发

启动开发服务器:

\`\`\`bash
npm run dev
\`\`\`

服务将在`http://localhost:3000`上运行，并在代码更改时自动重启。

## 客户端集成示例

### 使用fetch API进行认证和上传

\`\`\`javascript
// 用户登录
async function login(email, password) {
  const response = await fetch('http://your-api.com/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data.user;
}

// 创建集合
async function createCollection(name) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://your-api.com/collections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name })
  });
  
  return await response.json();
}

// 上传图片
async function uploadImages(collectionId, files) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  
  for (const file of files) {
    formData.append('images', file);
  }
  
  const response = await fetch(`http://your-api.com/collections/${collectionId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}
\`\`\`

## 安全注意事项

1. **JWT密钥**: 在生产环境中，使用强密钥并保持其私密性
2. **密码策略**: 实施强密码策略，要求最小长度和复杂性
3. **HTTPS**: 确保所有API通信都通过HTTPS进行
4. **CORS**: 根据需要配置CORS策略，限制允许的来源
5. **速率限制**: 考虑实施API速率限制以防止滥用

## 扩展功能

以下是一些可以添加到项目中的扩展功能:

1. **图片处理**: 添加调整大小、压缩或转换图片格式的功能
2. **云存储集成**: 使用Vercel Blob或其他云存储服务替代本地文件存储
3. **图片搜索**: 实现基于元数据的图片搜索功能
4. **图片共享**: 添加与其他用户共享图片的功能
5. **API文档**: 使用Swagger/OpenAPI添加交互式API文档
6. **密码重置**: 实现密码重置功能
7. **电子邮件验证**: 添加新用户注册的电子邮件验证

## 贡献

欢迎贡献！请随时提交问题或拉取请求。

## 许可证

[MIT](LICENSE)
