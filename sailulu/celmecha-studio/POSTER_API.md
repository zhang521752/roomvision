# CelMecha Studio - 海报系统 API 文档

## 概述

海报系统API提供完整的海报生成功能，包括提示词生成、ComfyUI工作流配置等。

**Base URL**: `http://localhost:8000/api/poster`

---

## API 端点

### 1. 获取海报类型

**GET** `/types`

获取所有可用的海报类型。

**响应示例**:
```json
{
  "success": true,
  "data": {
    "character": {
      "name": "角色海报",
      "name_en": "Character Poster",
      "description": "突出角色魅力和身份感",
      "subject": "单角色"
    },
    "mecha": {
      "name": "机甲海报",
      "name_en": "Mecha Poster",
      "description": "突出体量感和工业设计",
      "subject": "单机甲"
    }
  }
}
```

---

### 2. 获取海报等级

**GET** `/levels`

获取所有海报等级（Level 1-4）。

**响应示例**:
```json
{
  "success": true,
  "data": {
    "level1": {
      "name": "标准海报",
      "name_en": "Standard Poster",
      "suitable": ["社交媒体", "公众号", "小红书"]
    },
    "level2": {
      "name": "商业海报",
      "name_en": "Commercial Poster",
      "suitable": ["产品宣传", "角色宣传", "活动宣传"]
    }
  }
}
```

---

### 3. 获取构图系统

**GET** `/layouts`

获取所有构图类型。

**响应示例**:
```json
{
  "success": true,
  "data": {
    "hero": {
      "name": "英雄构图",
      "name_en": "Hero Layout",
      "subject_ratio": 70,
      "background_ratio": 30,
      "description": "主体占70%，适合角色"
    },
    "epic": {
      "name": "史诗构图",
      "name_en": "Epic Layout",
      "subject_ratio": 40,
      "background_ratio": 60,
      "description": "主体占40%，适合机甲"
    }
  }
}
```

---

### 4. 获取画面比例

**GET** `/aspect-ratios`

获取所有画面比例选项。

**响应示例**:
```json
{
  "success": true,
  "data": {
    "vertical": {
      "name": "竖版",
      "ratio": "9:16",
      "width": 1080,
      "height": 1920,
      "suitable": "短视频封面"
    },
    "landscape": {
      "name": "横版",
      "ratio": "16:9",
      "width": 1920,
      "height": 1080,
      "suitable": "横屏海报"
    }
  }
}
```

---

### 5. 获取光影预设

**GET** `/lighting`

获取所有光影效果预设。

**响应示例**:
```json
{
  "success": true,
  "data": {
    "golden_backlight": {
      "name": "黄金逆光",
      "name_en": "Golden Backlight",
      "cn_prompt": "黄金逆光",
      "en_prompt": "golden backlight, warm rim light",
      "mood": "史诗、神圣"
    }
  }
}
```

---

### 6. 获取预设配置

**GET** `/presets`

获取海报预设配置列表。

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "character_level2",
      "name": "角色海报 - 商业海报",
      "config": {
        "poster_type": "character",
        "level": "level2",
        "layout": "hero",
        "aspect_ratio": "landscape",
        "lighting": ["cinematic", "volumetric"]
      }
    }
  ],
  "total": 12
}
```

---

### 7. 生成海报提示词

**POST** `/generate`

根据配置生成完整的海报提示词。

**请求体**:
```json
{
  "poster_type": "character",
  "level": "level3",
  "layout": "hero",
  "aspect_ratio": "landscape",
  "lighting": ["golden_backlight", "volumetric"],
  "character_name": "RX-78",
  "title": "GUNDAM",
  "subtitle": "THE ORIGIN",
  "faction": "E.F.S.F.",
  "character_id": "RX-78-2",
  "tagline": "THE LEGEND BEGINS",
  "custom_prompts": ["8k resolution", "highly detailed"]
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| poster_type | string | ✅ | 海报类型: character, mecha, duo, battle, movie, world |
| level | string | ❌ | 海报等级: level1, level2, level3, level4 (默认: level2) |
| layout | string | ❌ | 构图类型: hero, epic (默认: hero) |
| aspect_ratio | string | ❌ | 画面比例: vertical, landscape, square (默认: landscape) |
| lighting | array | ❌ | 光影效果列表 (默认: ["cinematic", "volumetric"]) |
| character_name | string | ❌ | 角色名称 |
| mecha_name | string | ❌ | 机甲名称 |
| title | string | ❌ | 海报标题 |
| subtitle | string | ❌ | 副标题 |
| faction | string | ❌ | 阵营 |
| character_id | string | ❌ | 角色编号 |
| tagline | string | ❌ | 宣传语 |
| custom_prompts | array | ❌ | 自定义提示词 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "cn_prompt": "RX-78 角色海报 横版 电影级光影 大量留白 高级动画设定集风格 赛璐璐渲染 工业机甲风格 英雄构图 角色视觉中心 商业级品质 黄金逆光 体积光 电影级品质 电影海报 电影级别 8k resolution highly detailed",
    "en_prompt": "RX-78 character poster landscape composition, widescreen, cinematic aspect ratio cinematic lighting elegant negative space premium animation artbook style cel-shaded rendering industrial mecha style hero composition, dominant subject, strong visual impact visual focal point commercial quality golden backlight, warm rim light volumetric lighting, god rays, atmospheric lighting cinematic quality, film poster, movie grade 8k resolution highly detailed",
    "config": {
      "poster_type": "character",
      "level": "level3",
      "layout": "hero",
      "aspect_ratio": "landscape",
      "lighting": ["golden_backlight", "volumetric"],
      "character_name": "RX-78",
      "mecha_name": null
    },
    "metadata": {
      "title": "GUNDAM",
      "subtitle": "THE ORIGIN",
      "faction": "E.F.S.F.",
      "character_id": "RX-78-2",
      "tagline": "THE LEGEND BEGINS",
      "output_resolution": {
        "width": 1920,
        "height": 1080
      }
    }
  }
}
```

---

### 8. 生成ComfyUI工作流

**POST** `/workflow`

生成可用于ComfyUI的工作流配置。

**请求体**: 与 `/generate` 相同

**响应示例**:
```json
{
  "success": true,
  "data": {
    "prompt_node": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "RX-78 character poster...",
        "clip": ["clip_loader", 0]
      }
    },
    "negative_prompt_node": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": "low quality, blurry, distorted, deformed",
        "clip": ["clip_loader", 0]
      }
    },
    "latent_image_node": {
      "class_type": "EmptyLatentImage",
      "inputs": {
        "width": 1920,
        "height": 1080,
        "batch_size": 1
      }
    },
    "metadata": {
      "poster_config": {...},
      "poster_metadata": {...},
      "cn_prompt": "...",
      "en_prompt": "..."
    }
  }
}
```

---

### 9. 快速生成

**POST** `/quick`

快速生成海报提示词（简化接口）。

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| poster_type | string | ✅ | 海报类型 |
| character_name | string | ❌ | 角色名称 |
| mecha_name | string | ❌ | 机甲名称 |
| level | string | ❌ | 海报等级 (默认: level2) |

**示例请求**:
```
POST /api/poster/quick?poster_type=character&character_name=RX-78&level=level3
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "cn_prompt": "RX-78 角色海报...",
    "en_prompt": "RX-78 character poster..."
  }
}
```

---

### 10. 健康检查

**GET** `/health`

检查海报系统是否正常运行。

**响应示例**:
```json
{
  "success": true,
  "status": "healthy",
  "data": {
    "poster_types": 6,
    "poster_levels": 4,
    "version": "1.0.0"
  }
}
```

---

## 使用示例

### cURL 示例

**生成角色海报提示词**:
```bash
curl -X POST "http://localhost:8000/api/poster/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "poster_type": "character",
    "level": "level3",
    "layout": "hero",
    "aspect_ratio": "landscape",
    "lighting": ["golden_backlight", "volumetric"],
    "character_name": "RX-78",
    "title": "GUNDAM"
  }'
```

**快速生成**:
```bash
curl -X POST "http://localhost:8000/api/poster/quick?poster_type=mecha&mecha_name=Zaku&level=level4"
```

### Python 示例

```python
import requests

# 生成海报提示词
response = requests.post(
    "http://localhost:8000/api/poster/generate",
    json={
        "poster_type": "movie",
        "level": "level3",
        "layout": "epic",
        "aspect_ratio": "landscape",
        "lighting": ["golden_backlight", "volumetric", "cinematic"],
        "title": "Mobile Suit Gundam",
        "subtitle": "The Movie",
        "tagline": "THE LEGEND BEGINS"
    }
)

result = response.json()
print(f"中文提示词: {result['data']['cn_prompt']}")
print(f"英文提示词: {result['data']['en_prompt']}")
```

---

## 海报类型说明

| 类型 | 说明 | 推荐构图 |
|------|------|----------|
| character | 角色海报 | hero (英雄构图) |
| mecha | 机甲海报 | epic (史诗构图) |
| duo | 角色+机甲 | hero (英雄构图) |
| battle | 战斗海报 | epic (史诗构图) |
| movie | 电影海报 | epic (史诗构图) |
| world | 世界观海报 | epic (史诗构图) |

## 海报等级说明

| 等级 | 适用场景 | 品质 |
|------|----------|------|
| level1 | 社交媒体、公众号、小红书 | 标准 |
| level2 | 产品宣传、角色宣传、活动宣传 | 商业 |
| level3 | 动画项目、游戏项目、影视项目 | 电影 |
| level4 | 首页KV、封面、广告投放、品牌视觉 | 旗舰 |

## 光影效果说明

| ID | 名称 | 效果 |
|----|------|------|
| golden_backlight | 黄金逆光 | 史诗、神圣感 |
| rim_light | 轮廓光 | 神秘、戏剧性 |
| volumetric | 体积光 | 神圣、壮观 |
| cinematic | 电影级光影 | 电影感、专业 |

---

## 错误处理

所有错误响应格式:
```json
{
  "detail": "错误信息"
}
```

常见HTTP状态码:
- `200`: 成功
- `400`: 请求参数错误
- `500`: 服务器内部错误

---

**文档版本**: 1.0.0  
**最后更新**: 2026-05-31
