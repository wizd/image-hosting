# TypeScript 图片托管服务

一个基于TypeScript和Express的图片托管服务，允许用户创建集合并上传图片。该服务包含完整的用户认证系统和API密钥认证，可以部署在Vercel上，提供安全且强大的图片托管功能。

## 快速开始

1. 克隆仓库
   \`\`\`bash
   git clone <repository-url>
   cd typescript-image-server
   \`\`\`

2. 安装依赖
   \`\`\`bash
   npm install
   \`\`\`

3. 创建`.env`文件（参考`.env.example`）

4. 构建项目
   \`\`\`bash
   npm run build
   \`\`\`

5. 启动服务
   \`\`\`bash
   npm start
   \`\`\`

服务将在`http://localhost:3000`上运行。

## 客户端工具

客户端工具位于`client`目录中，用于处理Markdown文件中的图片。

\`\`\`bash
cd client
npm install
npm run build
\`\`\`

详细文档请参阅[完整README](README.md)。
