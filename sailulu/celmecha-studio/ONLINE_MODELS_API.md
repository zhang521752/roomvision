# CelMecha Studio - 线上模型API文档

## 概述

线上模型系统支持通过中转API调用 **GPT-Image-2** 和 **Nano-Banana2** 等云端图像生成模型，无需本地GPU即可生成高质量图像。

**Base URL**: `http://localhost:8000/api/online`

---

## 快速开始

### 1. 配置API

编辑配置文件：
```
g:\WK\roomvision\sailulu\celmecha-studio\backend\data\config\api_config.json
```

填入你的中转地址和API密钥：
```json
{
  "online_models": {
    "gpt-image-2": {
      "base_url": "https://your-proxy-url.com",
      "api_key": "your-api-key-here"
    },
    "nano-banana2": {
      "base_url": "https://your-proxy-url.com", 
      "api_key": "your-api-key-here"
    }
  }
}
```

### 2. 生成图像

```bash
curl -X POST "http://localhost:8000/api/online/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "male half-mecha character, cyborg warrior, cel-shaded rendering",
    "width": 1024,
    "height": 1024
  }'
```

---

## API端点

### 1. 获取模型列表

**GET** `/models`

```json
{
  "success": true,
  "data": [
    {
      "id": "gpt-image-2",
      "name": "GPT-Image-2",
      "description": "OpenAI GPT-Image-2 图像生成模型",
      "enabled": true,
      "configured": true
    },
    {
      "id": "nano-banana2",
      "name": "Nano-Banana2",
      "description": "Nano-Banana2 图像生成模型",
      "enabled": true,
      "configured": false
    }
  ]
}
```

### 2. 获取模型配置

**GET** `/models/{model_id}`

返回模型配置（API密钥会被隐藏）。

### 3. 配置模型API

**POST** `/config`

```json
{
  "model_id": "gpt-image-2",
  "base_url": "https://your-proxy-url.com",
  "api_key": "your-api-key",
  "enabled": true
}
```

### 4. 生成图像

**POST** `/generate`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model | string | ✅ | 模型ID: gpt-image-2 或 nano-banana2 |
| prompt | string | ✅ | 正向提示词 |
| negative_prompt | string | ❌ | 负向提示词 |
| width | int | ❌ | 图像宽度 (默认1024) |
| height | int | ❌ | 图像高度 (默认1024) |
| num_images | int | ❌ | 生成数量 (默认1) |
| extra_params | object | ❌ | 额外参数 |

**响应**:
```json
{
  "success": true,
  "model": "gpt-image-2",
  "images": ["base64_encoded_image_data..."],
  "metadata": {
    "size": "1024x1024",
    "quality": "hd"
  }
}
```

### 5. 生成并保存

**POST** `/generate-and-save`

生成图像并保存到服务器指定目录。

### 6. 测试连接

**GET** `/test/{model_id}`

测试模型API配置是否正确。

### 7. 健康检查

**GET** `/health`

```json
{
  "success": true,
  "status": "healthy",
  "data": {
    "total_models": 2,
    "configured_models": 1,
    "models": [...]
  }
}
```

---

## 使用示例

### Python示例

```python
import requests
import base64
from PIL import Image
import io

# 配置API
API_BASE = "http://localhost:8000/api/online"

# 生成图像
response = requests.post(f"{API_BASE}/generate", json={
    "model": "gpt-image-2",
    "prompt": "male half-mecha character, cyborg warrior, cel-shaded rendering, industrial mecha style, cinematic lighting",
    "negative_prompt": "low quality, blurry",
    "width": 1024,
    "height": 1024
})

result = response.json()

if result["success"]:
    # 解码base64图像
    image_data = base64.b64decode(result["images"][0])
    image = Image.open(io.BytesIO(image_data))
    image.save("output.png")
    print("图像已保存: output.png")
else:
    print(f"错误: {result['error']}")
```

### cURL示例

**GPT-Image-2**:
```bash
curl -X POST "http://localhost:8000/api/online/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "male half-mecha character poster, cyborg warrior, cel-shaded rendering, cinematic lighting, hero composition",
    "width": 1024,
    "height": 1024
  }'
```

**Nano-Banana2**:
```bash
curl -X POST "http://localhost:8000/api/online/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nano-banana2",
    "prompt": "mecha robot, industrial design, cel-shaded",
    "negative_prompt": "low quality",
    "width": 1024,
    "height": 1024,
    "extra_params": {
      "steps": 30,
      "guidance_scale": 7.5
    }
  }'
```

---

## 模型说明

### GPT-Image-2

- **类型**: OpenAI图像生成模型
- **优势**: 高质量、理解复杂提示词、支持多种风格
- **参数**:
  - `size`: 1024x1024, 1024x1792, 1792x1024
  - `quality`: standard, hd
  - `style`: vivid, natural

### Nano-Banana2

- **类型**: 开源图像生成模型
- **优势**: 快速生成、支持自定义参数
- **参数**:
  - `steps`: 采样步数 (默认30)
  - `guidance_scale`: 引导强度 (默认7.5)

---

## 与海报系统集成

线上模型可以与海报系统配合使用：

```python
# 1. 使用海报系统生成提示词
from app.core.poster_generator import PosterGenerator, PosterConfig, PosterType

generator = PosterGenerator()
config = PosterConfig(
    poster_type=PosterType.CHARACTER,
    character_name="Cyborg Warrior"
)
prompt_result = generator.generate_prompt(config)

# 2. 使用线上模型生成图像
from app.core.online_generator import OnlineGenerator, ImageGenerationRequest

online = OnlineGenerator()
request = ImageGenerationRequest(
    prompt=prompt_result.en_prompt,
    width=1920,
    height=1080,
    model="gpt-image-2"
)
result = online.generate(request)
```

---

## 常见问题

### Q: 如何获取API密钥？

A: 
- **GPT-Image-2**: 需要OpenAI API密钥或中转服务密钥
- **Nano-Banana2**: 需要对应服务的API密钥

### Q: 中转地址格式？

A: 
```
https://your-proxy-url.com
```
不需要包含 `/v1/images/generations` 等路径，系统会自动添加。

### Q: 支持哪些图像尺寸？

A:
- **GPT-Image-2**: 1024x1024, 1024x1792, 1792x1024
- **Nano-Banana2**: 自定义尺寸（建议512-2048）

### Q: 生成失败怎么办？

A: 
1. 检查API配置是否正确
2. 使用 `/test/{model_id}` 测试连接
3. 查看错误信息进行排查

---

## 配置文件位置

```
celmecha-studio/
└── backend/
    └── data/
        └── config/
            └── api_config.json  <-- API配置文件
```

---

**文档版本**: 1.0.0  
**最后更新**: 2026-05-31
