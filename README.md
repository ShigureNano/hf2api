# Hugging Face API Proxy on Cloudflare Workers

这个项目提供了一个在Cloudflare Workers上运行的Hugging Face API代理。它允许你通过Cloudflare的全球网络来调用Hugging Face的模型推理API，提供了额外的安全层和潜在的性能优势。

## 快速开始

### 1. 登录Cloudflare

访问 https://www.cloudflare.com/ 并登录您的账户。如果没有账户，请先注册。

### 2. 创建Workers应用程序

1. 在Cloudflare控制台中，导航到"Workers & Pages"部分。
2. 点击"创建应用程序"按钮。
3. 选择"创建Worker"选项。

### 3. 部署Worker

1. 在创建Worker的页面上，点击"部署"按钮。
2. 这将为您的新Worker创建一个基本模板。

### 4. 编辑代码

1. 在Worker的编辑界面，删除默认的代码。
2. 将本项目中`index.js`文件的内容复制并粘贴到编辑器中。
3. 点击"保存并部署"按钮来更新您的Worker。

### 5. 配置环境变量

1. 在Worker的设置页面中，找到"环境变量"部分。
2. 添加以下两个环境变量：
   - `HUGGINGFACE_API_KEY`: 您的Hugging Face API密钥
   - `API_KEY`: 您为此代理服务设置的自定义API密钥

### 6. （可选）添加自定义域

如果您希望使用自己的域名来访问这个Worker：

1. 在Worker的设置页面中，找到"触发器"部分。
2. 点击"添加自定义域"。
3. 按照提示设置您的自定义域名。

## 使用方法

部署完成后，您可以通过发送POST请求到您的Worker URL来使用这个API代理。请确保在请求头中包含正确的API密钥。

例如：

```bash
curl 'https://your-worker.your-subdomain.workers.dev/v1/chat/completions' \
-H "Authorization: Bearer YOUR_API_KEY" \
-H 'Content-Type: application/json' \
-d '{
    "model": "Qwen/Qwen2.5-72B-Instruct",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "max_tokens": 500,
    "stream": false
}'
