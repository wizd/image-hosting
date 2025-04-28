# Markdown Image Processor

这个工具用于处理Markdown文件中的图片，将它们上传到图片托管服务，并更新Markdown中的图片链接。

## 功能

- 处理本地图片引用（相对路径和绝对路径）
- 处理远程图片URL
- 处理内嵌的base64编码图片
- 将所有图片上传到指定的图片托管服务
- 更新Markdown文件中的图片链接为托管URL

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
API_EMAIL=your-email@example.com
API_PASSWORD=your-password
COLLECTION_NAME=markdown-images
\`\`\`

## 使用方法

\`\`\`bash
# 处理Markdown文件，覆盖原文件
node dist/index.js path/to/markdown.md

# 处理Markdown文件，输出到新文件
node dist/index.js path/to/markdown.md -o path/to/output.md

# 指定集合名称
node dist/index.js path/to/markdown.md -c my-collection

# 指定API URL和凭据
node dist/index.js path/to/markdown.md -u http://api.example.com -e user@example.com -p password
\`\`\`

### 命令行选项

- `-o, --output <file>`: 输出文件（默认覆盖输入文件）
- `-c, --collection <name>`: 图片集合名称（默认为环境变量中的COLLECTION_NAME或'markdown-images'）
- `-u, --url <url>`: API URL（默认为环境变量中的API_URL或'http://localhost:3000'）
- `-e, --email <email>`: API邮箱（默认为环境变量中的API_EMAIL）
- `-p, --password <password>`: API密码（默认为环境变量中的API_PASSWORD）

## 示例

假设有以下Markdown文件：

\`\`\`markdown
# 我的文档

这是一个本地图片：
![本地图片](./images/local.png)

这是一个远程图片：
![远程图片](https://example.com/image.jpg)

这是一个base64图片：
![base64图片](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJ5gMtggQAAAABJRU5ErkJggg==)
\`\`\`

处理后，图片链接将被替换为托管服务的URL：

\`\`\`markdown
# 我的文档

这是一个本地图片：
![本地图片](http://localhost:3000/images/550e8400-e29b-41d4-a716-446655440000/7b52009b-bfd9-4e2b-0d93-839c55f10200.png)

这是一个远程图片：
![远程图片](http://localhost:3000/images/550e8400-e29b-41d4-a716-446655440000/3fdba35f-04cd-4e2e-8c84-96a4413c0201.jpg)

这是一个base64图片：
![base64图片](http://localhost:3000/images/550e8400-e29b-41d4-a716-446655440000/ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d.png)
