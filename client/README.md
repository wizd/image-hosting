# Markdown Image Processor

这个工具用于处理Markdown文件中的图片，将它们上传到图片托管服务，并更新Markdown中的图片链接。它还可以使用AI为图片生成简短的描述。

## 功能

- 处理本地图片引用（相对路径和绝对路径）
- 处理远程图片URL
- 处理内嵌的base64编码图片
- 将所有图片上传到指定的图片托管服务
- 更新Markdown文件中的图片链接为托管URL
- 使用AI（OpenAI或Grok/XAI）为图片生成简短描述（可选功能）
- 支持API密钥认证或邮箱密码认证

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

## 使用方法

### 基本用法

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

### 使用AI生成图片描述

\`\`\`bash
# 使用OpenAI生成图片描述
node dist/index.js path/to/markdown.md --describe --ai-provider openai --openai-key your-api-key

# 使用Grok (XAI) 生成图片描述
node dist/index.js path/to/markdown.md --describe --ai-provider xai --xai-key your-api-key

# 使用环境变量中的AI配置
node dist/index.js path/to/markdown.md --describe
\`\`\`

### 命令行选项

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

## 认证方式

工具支持两种认证方式：

1. **API密钥认证**：使用API密钥进行认证，适合自动化脚本和集成
2. **邮箱密码认证**：使用邮箱和密码进行认证，适合交互式使用

您可以通过命令行选项或环境变量选择使用哪种认证方式。如果同时提供了API密钥和邮箱密码，将优先使用API密钥认证。

### API密钥认证

API密钥认证是一种更安全、更方便的认证方式，特别适合自动化脚本和集成。要使用API密钥认证：

1. 通过服务器的API创建一个API密钥（需要先使用邮箱密码登录）
2. 将API密钥保存在环境变量或直接在命令行中提供

\`\`\`bash
# 使用环境变量中的API密钥
export API_KEY=your-api-key
node dist/index.js path/to/markdown.md

# 或者在命令行中提供API密钥
node dist/index.js path/to/markdown.md -k your-api-key
\`\`\`

### 邮箱密码认证

邮箱密码认证是传统的认证方式，需要提供注册时使用的邮箱和密码：

\`\`\`bash
# 使用环境变量中的邮箱和密码
export API_EMAIL=user@example.com
export API_PASSWORD=your-password
node dist/index.js path/to/markdown.md

# 或者在命令行中提供邮箱和密码
node dist/index.js path/to/markdown.md -e user@example.com -p your-password
\`\`\`

## 图片描述功能

当启用图片描述功能（使用`--describe`选项）时，工具会为没有alt文本的图片生成简短描述。这对于以下场景特别有用：

1. 提高Markdown文档的可访问性
2. 为RAG（检索增强生成）系统提供更好的图片上下文
3. 改善SEO和内容索引

描述生成过程：

1. 对于本地图片，工具会读取文件并发送到AI进行分析
2. 对于远程图片，工具会下载图片并发送到AI进行分析
3. 对于base64图片，工具会解码数据并发送到AI进行分析

生成的描述会替换原始alt文本（如果为空），并保留在更新后的Markdown中。

### AI提供商

工具支持两种AI提供商：

1. **OpenAI (GPT-4o)**：提供高质量的图片描述，需要OpenAI API密钥
2. **Grok (XAI)**：提供快速的图片描述，需要Grok API密钥

您可以通过`--ai-provider`选项或环境变量`AI_PROVIDER`选择使用哪个提供商。

### 性能考虑

当使用AI描述功能处理大量图片时，请注意以下几点：

1. **处理时间**：每个图片都需要进行API调用，这会增加处理时间
2. **API限制**：注意OpenAI和Grok的API调用限制
3. **成本**：每次图片描述都会产生API调用费用

对于包含大量图片的文档，可以考虑：

1. **分批处理**：将文档分成多个部分进行处理
2. **实现缓存**：缓存已处理过的图片描述，避免重复处理相同图片
3. **选择性处理**：只为特定的图片生成描述

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

使用图片描述功能处理后，结果可能如下：

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

## 技术实现

### 图片描述生成

图片描述功能使用Vercel AI SDK实现，支持两种AI提供商：

\`\`\`typescript
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { xai } from "@ai-sdk/xai"

// 使用OpenAI
const { text } = await generateText({
  model: openai("gpt-4o", { apiKey: this.apiKey }),
  prompt: "Describe this image in a brief phrase (10 words or less):",
  images: [dataUri],
})

// 使用Grok (XAI)
const { text } = await generateText({
  model: xai("grok-1", { apiKey: this.apiKey }),
  prompt: "Describe this image in a brief phrase (10 words or less):",
  images: [dataUri],
})
\`\`\`

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

### API认证

客户端支持两种认证方式：

\`\`\`typescript
// API密钥认证
const client = new ApiClient("http://localhost:3000", {
  apiKey: "your-api-key"
});

// 邮箱密码认证
const client = new ApiClient("http://localhost:3000", {
  email: "user@example.com",
  password: "your-password"
});
\`\`\`

## 未来改进

1. **批量处理**：添加处理目录中多个Markdown文件的功能
2. **图片缓存**：实现图片描述缓存，避免重复处理相同图片
3. **自定义提示词**：允许用户自定义AI描述生成的提示词
4. **支持更多AI模型**：添加对其他AI模型和提供商的支持
5. **Web界面**：开发一个Web界面来上传和处理Markdown文件
6. **API密钥管理**：添加API密钥管理功能，允许用户创建、查看和撤销API密钥

## 许可证

[MIT](LICENSE)
