# TypeScript 图片托管服务

一个基于TypeScript和Express的图片托管服务，允许用户创建集合并上传图片。该服务包含完整的用户认证系统，可以部署在Vercel上，提供安全且强大的图片托管功能。

## 功能特点

- 用户注册和登录系统，使用JWT进行身份验证
- API密钥认证，用于自动化脚本和集成
- 创建具有唯一ID的命名集合
- 上传多个图片到集合中
- 为集合和文件自动生成UUID
- 返回包含图片元数据的JSON响应
- 基于用户的权限控制（用户只能访问自己的集合）
- 可配置的存储路径和URL
- 支持Vercel部署
- **新增**: 使用AI（OpenAI或Grok）为图片生成描述

## 技术栈

- **后端**: Node.js, Express
- **语言**: TypeScript
- **身份验证**: JWT (JSON Web Tokens) 和 API密钥
- **密码加密**: bcryptjs
- **文件处理**: Multer
- **ID生成**: UUID
- **部署**: Vercel
- **AI集成**: Vercel AI SDK, OpenAI, Grok

## 环境变量

服务需要以下环境变量:

| 变量名 | 描述 | 默认值 | 必需 |
|-------------|-------------|-------------|-------------|
| `DATA_ROOT` | 存储图片和元数据的目录路径 | `./data` | 是 |
| `IMAGE_ROOT_URL` | 访问图片的基础URL | `http://localhost:3000/images/` | 是 |
| `PORT` | 服务器端口 | `3000` | 否 |
| `JWT_SECRET` | JWT令牌的密钥 | `default-secret-key` | 是（生产环境） |
| `API_KEY` | 默认API密钥（可选） | - | 否 |
| `AI_PROVIDER` | AI提供商（openai或xai） | `openai` | 否（仅图片描述功能） |
| `OPENAI_API_KEY` | OpenAI API密钥 | - | 否（使用OpenAI时需要） |
| `XAI_API_KEY` | Grok (XAI) API密钥 | - | 否（使用Grok时需要） |

## 项目结构

\`\`\`
image-hosting-service/
├── src/
│   ├── index.ts                # 主入口文件
│   ├── config.ts               # 配置文件
│   ├── auth/                   # 身份验证相关代码
│   │   ├── auth-types.ts       # 认证相关类型定义
│   │   ├── auth-controller.ts  # 认证控制器（注册、登录、获取个人资料）
│   │   └── user-service.ts     # 用户服务（创建用户、查找用户等）
│   ├── api-key/                # API密钥相关代码
│   │   ├── api-key-types.ts    # API密钥类型定义
│   │   ├── api-key-controller.ts # API密钥控制器
│   │   └── api-key-service.ts  # API密钥服务
│   └── middleware/             # 中间件
│       ├── auth-middleware.ts  # JWT认证中间件
│       └── api-key-middleware.ts # API密钥认证中间件
├── client/                     # 客户端工具
│   ├── src/                    # 客户端源代码
│   │   ├── index.ts            # 客户端入口文件
│   │   ├── api-client.ts       # API客户端
│   │   ├── markdown-processor.ts # Markdown处理器
│   │   └── image-describer.ts  # 图片描述生成器
│   ├── package.json            # 客户端依赖
│   └── tsconfig.json           # 客户端TypeScript配置
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
   
   # 可选：默认API密钥
   API_KEY=your-api-key
   
   # 可选：AI配置
   AI_PROVIDER=openai
   OPENAI_API_KEY=your-openai-api-key
   XAI_API_KEY=your-xai-api-key
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

### API密钥管理

#### 创建API密钥（需要JWT认证）

\`\`\`
POST /api-keys
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "name": "My Script Key",
  "permissions": ["read", "write"],
  "expiresAt": "2024-12-31T23:59:59Z"  // 可选
}
\`\`\`

响应:
\`\`\`json
{
  "apiKey": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Script Key",
    "key": "YourFullApiKeyHere_OnlyShownOnce",
    "createdAt": "2023-12-15T12:30:45.123Z",
    "expiresAt": "2024-12-31T23:59:59Z",
    "isActive": true,
    "permissions": ["read", "write"]
  }
}
\`\`\`

**注意**: 完整的API密钥只会在创建时返回一次，请妥善保存。

#### 获取用户的所有API密钥（需要JWT认证）

\`\`\`
GET /api-keys
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

响应:
\`\`\`json
{
  "apiKeys": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "My Script Key",
      "key": "YourFull...",  // 部分隐藏
      "createdAt": "2023-12-15T12:30:45.123Z",
      "lastUsedAt": "2023-12-16T10:20:30.123Z",
      "expiresAt": "2024-12-31T23:59:59Z",
      "isActive": true,
      "permissions": ["read", "write"]
    }
  ]
}
\`\`\`

#### 更新API密钥状态（需要JWT认证）

\`\`\`
PATCH /api-keys/:id
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "isActive": false
}
\`\`\`

响应:
\`\`\`json
{
  "apiKey": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Script Key",
    "key": "YourFull...",
    "createdAt": "2023-12-15T12:30:45.123Z",
    "lastUsedAt": "2023-12-16T10:20:30.123Z",
    "expiresAt": "2024-12-31T23:59:59Z",
    "isActive": false,
    "permissions": ["read", "write"]
  }
}
\`\`\`

#### 删除API密钥（需要JWT认证）

\`\`\`
DELETE /api-keys/:id
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

响应:
\`\`\`json
{
  "message": "API key deleted successfully"
}
\`\`\`

### 集合管理

#### 创建集合（需要认证）

\`\`\`
POST /collections
Authorization: Bearer YOUR_TOKEN_HERE
# 或者使用API密钥
X-API-Key: YOUR_API_KEY
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
# 或者使用API密钥
X-API-Key: YOUR_API_KEY
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
# 或者使用API密钥
X-API-Key: YOUR_API_KEY
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
# 或者使用API密钥
X-API-Key: YOUR_API_KEY
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
# 或者使用API密钥
X-API-Key: YOUR_API_KEY
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

## 客户端工具

### Markdown图片处理器

我们提供了一个客户端工具，用于处理Markdown文件中的图片，将它们上传到图片托管服务，并更新Markdown中的图片链接。

#### 安装客户端工具

\`\`\`bash
cd client
npm install
npm run build
\`\`\`

#### 配置客户端

创建`.env`文件：

\`\`\`
API_URL=http://localhost:3000

# 认证方式（二选一）
API_KEY=your-api-key-here
# 或者使用邮箱密码认证
# API_EMAIL=your-email@example.com
# API_PASSWORD=your-password

COLLECTION_NAME=markdown-images

# AI配置（可选）
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
XAI_API_KEY=your-xai-api-key
\`\`\`

#### 使用客户端工具

##### 基本用法

\`\`\`bash
# 处理Markdown文件，覆盖原文件
node dist/index.js path/to/markdown.md

# 处理Markdown文件，输出到新文件
node dist/index.js path/to/markdown.md -o path/to/output.md

# 指定集合名称
node dist/index.js path/to/markdown.md -c my-collection

# 使用API密钥认证
node dist/index.js path/to/markdown.md -k your-api-key

# 使用邮箱密码认证
node dist/index.js path/to/markdown.md -e user@example.com -p password
\`\`\`

##### 使用AI生成图片描述

\`\`\`bash
# 使用OpenAI生成图片描述
node dist/index.js path/to/markdown.md --describe --ai-provider openai --openai-key your-api-key

# 使用Grok (XAI) 生成图片描述
node dist/index.js path/to/markdown.md --describe --ai-provider xai --xai-key your-api-key

# 使用环境变量中的AI配置
node dist/index.js path/to/markdown.md --describe
\`\`\`

##### 命令行选项

- `-o, --output <file>`: 输出文件（默认覆盖输入文件）
- `-c, --collection <name>`: 图片集合名称（默认为环境变量中的COLLECTION_NAME或'markdown-images'）
- `-u, --url <url>`: API URL（默认为环境变量中的API_URL或'http://localhost:3000'）
- `-k, --api-key <key>`: API密钥（默认为环境变量中的API_KEY）
- `-e, --email <email>`: API邮箱（默认为环境变量中的API_EMAIL）
- `-p, --password <password>`: API密码（默认为环境变量中的API_PASSWORD）
- `-d, --describe`: 使用AI为图片生成描述
- `--ai-provider <provider>`: AI提供商（openai或xai，默认为环境变量中的AI_PROVIDER或'openai'）
- `--openai-key <key>`: OpenAI API密钥（默认为环境变量中的OPENAI_API_KEY）
- `--xai-key <key>`: Grok (XAI) API密钥（默认为环境变量中的XAI_API_KEY）

## API密钥认证详解

### API密钥权限

每个API密钥可以有以下权限：

- `read`: 允许读取数据（GET请求）
- `write`: 允许创建和更新数据（POST, PUT, PATCH请求）
- `delete`: 允许删除数据（DELETE请求）
- `admin`: 授予所有权限

创建API密钥时，可以指定要授予的权限：

\`\`\`json
{
  "name": "Read-Only Key",
  "permissions": ["read"]
}
\`\`\`

如果不指定权限，默认会授予`read`和`write`权限。

### API密钥过期

创建API密钥时，可以设置过期时间：

\`\`\`json
{
  "name": "Temporary Key",
  "permissions": ["read", "write"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
\`\`\`

如果不设置过期时间，API密钥将永不过期，直到被手动停用或删除。

### API密钥安全最佳实践

1. **永不共享API密钥**: 将API密钥视为密码
2. **使用环境变量**: 将API密钥存储在环境变量中，而不是代码中
3. **限制权限**: 为每个API密钥只授予所需的最小权限
4. **设置过期日期**: 对于敏感操作，考虑设置过期日期
5. **定期轮换密钥**: 定期创建新密钥并删除旧密钥
6. **监控使用情况**: 跟踪API密钥的使用时间和方式
7. **立即撤销**: 如果密钥泄露，立即撤销它

## 认证系统详解

### JWT认证流程

1. **用户注册/登录**：用户提供凭据，服务器验证后生成JWT令牌
2. **令牌使用**：客户端在后续请求中通过`Authorization`头部发送令牌
3. **令牌验证**：服务器验证令牌的有效性和过期时间
4. **访问控制**：根据令牌中的用户ID确定资源访问权限

### API密钥认证流程

1. **创建API密钥**：用户通过JWT认证创建API密钥
2. **密钥使用**：客户端在请求中通过`X-API-Key`头部发送密钥
3. **密钥验证**：服务器验证密钥的有效性、权限和过期时间
4. **访问控制**：根据密钥关联的用户ID和权限确定资源访问权限

### 安全特性

- 密码使用bcrypt进行哈希处理，不会明文存储
- JWT令牌有24小时的过期时间
- API密钥可以设置自定义过期时间
- 用户只能访问和修改自己的资源（集合和图片）
- 所有敏感操作都需要有效的认证

### 用户数据存储

用户数据存储在`DATA_ROOT`目录下的`users.json`文件中。每个用户记录包含：

- 唯一ID
- 用户名
- 电子邮件
- 哈希密码
- 创建时间

### API密钥存储

API密钥存储在`DATA_ROOT`目录下的`api-keys.json`文件中。每个API密钥记录包含：

- 唯一ID
- 密钥值
- 名称
- 关联的用户ID
- 创建时间
- 最后使用时间
- 过期时间（可选）
- 活动状态
- 权限列表

## 在Vercel上部署

本项目已配置为可以直接部署到Vercel。

1. 在Vercel上创建新项目并连接到您的Git仓库

2. 配置环境变量:
   - `DATA_ROOT`: 在Vercel上，这应该设置为`/tmp/data`或其他可写目录
   - `IMAGE_ROOT_URL`: 设置为您的Vercel域名，例如`https://your-project.vercel.app/images/`
   - `JWT_SECRET`: 设置一个安全的密钥用于JWT令牌生成（**非常重要**：使用强密钥）
   - `API_KEY`: 可选，设置一个默认的API密钥
   - `AI_PROVIDER`: 设置为`openai`或`xai`（如果使用图片描述功能）
   - `OPENAI_API_KEY`: 设置您的OpenAI API密钥（如果使用OpenAI）
   - `XAI_API_KEY`: 设置您的Grok API密钥（如果使用Grok）

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
// 使用API密钥认证
async function uploadWithApiKey() {
  const apiKey = 'your-api-key';
  const formData = new FormData();
  formData.append('images', fileInput.files[0]);
  
  const response = await fetch(`http://your-api.com/collections/your-collection-id/images`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey
    },
    body: formData
  });
  
  return await response.json();
}

// 使用JWT认证
async function uploadWithJWT() {
  // 先登录获取JWT令牌
  const loginResponse = await fetch('http://your-api.com/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      email: 'user@example.com', 
      password: 'password123' 
    })
  });
  
  const { token } = await loginResponse.json();
  
  // 使用JWT令牌上传图片
  const formData = new FormData();
  formData.append('images', fileInput.files[0]);
  
  const response = await fetch(`http://your-api.com/collections/your-collection-id/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return await response.json();
}
\`\`\`

## 扩展功能

以下是一些可以添加到项目中的扩展功能:

1. **图片处理**: 添加调整大小、压缩或转换图片格式的功能
2. **云存储集成**: 使用Vercel Blob或其他云存储服务替代本地文件存储
3. **图片搜索**: 实现基于元数据的图片搜索功能
4. **图片共享**: 添加与其他用户共享图片的功能
5. **API文档**: 使用Swagger/OpenAPI添加交互式API文档
6. **密码重置**: 实现密码重置功能
7. **电子邮件验证**: 添加新用户注册的电子邮件验证
8. **批量处理**: 添加批量处理多个Markdown文件的功能
9. **图片描述缓存**: 实现图片描述缓存，避免重复处理相同图片
10. **API密钥使用分析**: 添加API密钥使用情况的分析和报告功能

## 贡献

欢迎贡献！请随时提交问题或拉取请求。

## 许可证

[MIT](LICENSE)
\`\`\`

现在，让我们更新客户端的README.md文件，添加API密钥认证的说明：
