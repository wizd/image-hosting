# Markdown Image Processor

这个工具用于处理Markdown文件中的图片，将它们上传到图片托管服务，并更新Markdown中的图片链接。它还可以使用AI为图片生成简短的描述。

## 功能

- 处理本地图片引用（相对路径和绝对路径）
- 处理远程图片URL
- 处理内嵌的base64编码图片
- 将所有图片上传到指定的图片托管服务
- 更新Markdown文件中的图片链接为托管URL
- 使用AI（OpenAI或Grok/XAI）为图片生成简短描述（可选功能）
- 使用API密钥进行认证

## 安装

1. 安装依赖：

\`\`\`bash
npm install
\`\`\`

2. 构建项目：

\`\`\`bash
npm run build
\`\`\`

3. 创建`.env`文件并设置环境变量：

\`\`\`
API_URL=http://localhost:3000
API_KEY=your-api-key-here
COLLECTION_NAME=markdown-images

# AI配置（可选）
AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
XAI_API_KEY=your-xai-api-key
\`\`\`

## API密钥认证

工具使用API密钥进行认证。API密钥可以通过以下方式获取：

1. 使用Root API密钥创建新的API密钥：
\`\`\`bash
curl -X POST http://localhost:3000/api-keys \
  -H "X-API-Key: your-root-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "My API Key", "permissions": ["read", "write"]}'
\`\`\`

2. 将获取到的API密钥设置到环境变量或在命令行中使用。

API密钥权限说明：
- `read`: 允许读取图片和集合
- `write`: 允许上传图片和创建集合

## 使用方法

### 基本用法

\`\`\`bash
# 处理Markdown文件，覆盖原文件
node dist/index.js path/to/markdown.md -k your-api-key

# 处理Markdown文件，输出到新文件
node dist/index.js path/to/markdown.md -o path/to/output.md -k your-api-key

# 指定集合名称
node dist/index.js path/to/markdown.md -c my-collection -k your-api-key

# 使用环境变量中的API密钥
export API_KEY=your-api-key
node dist/index.js path/to/markdown.md
\`\`\`

### 使用AI生成图片描述

\`\`\`bash
# 使用OpenAI生成图片描述
node dist/index.js path/to/markdown.md -k your-api-key --describe --ai-provider openai --openai-key your-openai-api-key

# 使用Grok (XAI) 生成图片描述
node dist/index.js path/to/markdown.md -k your-api-key --describe --ai-provider xai --xai-key your-xai-api-key

# 使用环境变量中的AI配置
node dist/index.js path/to/markdown.md -k your-api-key --describe
\`\`\`

### 命令行选项

- `-o, --output <file>`: 输出文件（默认覆盖输入文件）
- `-c, --collection <name>`: 图片集合名称（默认为环境变量中的COLLECTION_NAME或'markdown-images'）
- `-u, --url <url>`: API URL（默认为环境变量中的API_URL或'http://localhost:3000'）
- `-k, --api-key <key>`: API密钥（默认为环境变量中的API_KEY）
- `-d, --describe`: 使用AI为图片生成描述
- `--ai-provider <provider>`: AI提供商（openai或xai，默认为环境变量中的AI_PROVIDER或'openai'）
- `--openai-key <key>`: OpenAI API密钥（默认为环境变量中的OPENAI_API_KEY）
- `--xai-key <key>`: Grok (XAI) API密钥（默认为环境变量中的XAI_API_KEY）

## 示例

假设有以下Markdown文件：

\`\`\`markdown
# 我的文档

这是一个没有alt文本的本地图片：
![][./images/local.png]

这是一个有alt文本的远程图片：
![远程图片](https://example.com/image.jpg)

这是一个base64图片：
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJ5gMtggQAAAABJRU5ErkJggg==)
\`\`\`

使用工具处理后，结果可能如下：

\`\`\`markdown
# 我的文档

这是一个没有alt文本的本地图片：
![一只橙色猫咪坐在窗台上](http://localhost:3000/images/550e8400-e29b-41d4-a716-446655440000/7b52009b-bfd9-4e2b-0d93-839c55f10200.png)

这是一个有alt文本的远程图片：
![远程图片](http://localhost:3000/images/550e8400-e29b-41d4-a716-446655440000/3fdba35f-04cd-4e2e-8c84-96a4413c0201.jpg)

这是一个base64图片：
![简单的白色背景上的黑点](http://localhost:3000/images/550e8400-e29b-41d4-a716-446655440000/ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d.png)
\`\`\`

注意：只有原始alt文本为空的图片才会生成新的描述。

## 在代码中使用

### 基本用法

\`\`\`typescript
import { ApiClient } from "./api-client";

// 创建API客户端
const client = new ApiClient("http://localhost:3000", {
  apiKey: "your-api-key"
});

// 上传本地图片
const result = await client.uploadLocalImage("./image.jpg", "my-collection");
console.log(result.fullUrl);

// 上传远程图片
const result = await client.uploadRemoteImage("https://example.com/image.jpg", "my-collection");
console.log(result.fullUrl);

// 上传base64图片
const result = await client.uploadBase64Image(base64Data, "image.png", "my-collection");
console.log(result.fullUrl);

// 生成图片描述（带上下文）
const description = await client.generateImageDescription("collection-id", "image-id", {
  beforeText: "在讨论系统架构时",
  afterText: "这张图展示了具体的实现细节"
});
console.log(description);
\`\`\`

### 错误处理

\`\`\`typescript
try {
  const result = await client.uploadLocalImage("./image.jpg", "my-collection");
  console.log(result.fullUrl);
} catch (error) {
  if (error instanceof Error) {
    console.error("上传失败:", error.message);
  }
}
\`\`\`

### 图片描述生成

图片描述功能使用Vercel AI SDK实现，支持两种AI提供商。API支持传入图片的上下文信息，以生成更准确的描述：

\`\`\`typescript
// 生成图片描述
const description = await client.generateImageDescription(imageId, {
  beforeText: "在讨论系统架构时",
  afterText: "这张图展示了具体的实现细节"
})

// API实现
async generateImageDescription(imageId: string, context?: {
  beforeText?: string;
  afterText?: string;
}) {
  const response = await fetch(`${this.baseUrl}/v1/collections/${collectionId}/assets/${imageId}/description`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey
    },
    body: JSON.stringify(context)
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate description');
  }
  
  const data = await response.json();
  return data.description;
}
\`\`\`

生成的描述会考虑图片在文档中的上下文，从而提供更准确和相关的描述。例如：

- 没有上下文时：`"一张数据库架构图"`
- 有上下文时：`"系统架构中的主要数据流程图"`

### 图片优化

在发送到AI之前，图片会使用Sharp库进行优化，以减少API调用的大小：

\`\`\`typescript
// 优化图片
const optimizedBuffer = await sharp(buffer)
  .resize({
    width: 800,
    height: 800,
    fit: "inside",
    withoutEnlargement: true,
  })
  .jpeg({ quality: 80 })
  .toBuffer()
\`\`\`

## 未来改进

1. **批量处理**：添加处理目录中多个Markdown文件的功能
2. **图片缓存**：实现图片描述缓存，避免重复处理相同图片
3. **自定义提示词**：允许用户自定义AI描述生成的提示词
4. **支持更多AI模型**：添加对其他AI模型和提供商的支持
5. **Web界面**：开发一个Web界面来上传和处理Markdown文件
6. **权限管理**：支持更细粒度的API密钥权限控制

## 许可证

[MIT](LICENSE)
