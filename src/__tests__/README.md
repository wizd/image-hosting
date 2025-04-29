# 测试说明

## 测试图片设置

为了运行完整的集成测试，你需要在 `src/__tests__/` 目录下创建一个测试图片：

1. 创建文件 `test-image.jpg`
2. 可以使用任何有效的JPG图片，建议使用简单的、小尺寸的图片
3. 图片大小应该小于10MB（API限制）

示例：
```bash
# Windows
copy your-test-image.jpg src/__tests__/test-image.jpg

# Linux/Mac
cp your-test-image.jpg src/__tests__/test-image.jpg
```

## 环境变量

确保在 `.env.test` 文件中设置了必要的环境变量：

```env
ROOT_API_KEY=your-root-api-key
OPENAI_API_KEY=your-openai-api-key  # 可选，用于测试图片描述功能
API_URL=http://localhost:3000        # 或者你的API地址
```

如果没有设置 `OPENAI_API_KEY`，图片描述相关的测试会被跳过。 