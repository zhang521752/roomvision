# CelMecha Studio V1.0

## 赛璐璐工业机甲美术工坊 - 完整开发规划

---

## 一、项目概述

### 1.1 产品定义

**产品名称**：CelMecha Studio  
**中文名称**：赛璐璐机甲工坊  
**版本**：V1.0  

### 1.2 产品定位

AI 动漫工业设计平台，专注于：
- 赛璐璐风格
- 动漫机甲风格
- 工业设计美学

### 1.3 目标用户

| 用户类型 | 需求场景 |
|---------|---------|
| AI绘画玩家 | 快速生成高质量赛璐璐风格图像 |
| AI短视频创作者 | 生成视频提示词，制作动画素材 |
| AI卡牌创作者 | 批量生成卡牌角色和模板 |
| AI漫画创作者 | 生成角色设定、场景、道具 |
| AI游戏独立开发者 | 生成游戏角色、机甲、场景素材 |

### 1.4 核心理念

**用户无需学习提示词**

用户操作流程：
```
选择角色 → 选择服装 → 选择机甲 → 选择场景 → 填写特殊需求 → 点击生成 → 自动获得完整提示词
```

---

## 二、产品功能

### 2.1 输出类型

| 输出类型 | 说明 |
|---------|------|
| 角色图 | 角色立绘、角色设定 |
| 机甲图 | 机甲设计、机甲设定 |
| 场景图 | 场景背景、环境设计 |
| 道具图 | 武器、装备、配件 |
| 身份板 | 角色身份板、机甲身份板 |
| 卡牌 | 游戏卡牌、收藏卡 |
| 海报 | 宣传海报、封面设计 |
| 视频提示词 | 用于AI视频生成的提示词 |

### 2.2 核心模块

```
┌─────────────────────────────────────────────────────────────┐
│                    CelMecha Studio V1.0                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Prompt      │  │ Prompt      │  │ 风格锁定    │        │
│  │ 数据库      │  │ 生成器      │  │ 系统        │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ 身份板      │  │ 卡牌        │  │ 海报        │        │
│  │ 生成器      │  │ 生成器      │  │ 生成器      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ 视频提示词  │  │ 项目管理    │                          │
│  │ 生成器      │  │ 器          │                          │
│  └─────────────┘  └─────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、技术架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (Frontend)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js + React + Tailwind CSS + Shadcn/ui         │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      API 网关                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FastAPI (Python)                                    │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      后端服务 (Backend)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Prompt   │ │ 图像生成 │ │ 模板管理 │ │ 项目管理 │     │
│  │ Engine   │ │ Service  │ │ Service  │ │ Service  │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
├─────────────────────────────────────────────────────────────┤
│                      数据层 (Data)                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SQLite + JSON Files                                 │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      外部API (External)                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ MJ   │ │ Flux │ │Comfy │ │ 即梦 │ │ 可灵 │ │Seedr│  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 技术选型

| 层级 | 技术栈 | 说明 |
|------|--------|------|
| 前端框架 | Next.js 14+ | React全栈框架，SSR/SSG支持 |
| UI框架 | React 18+ | 组件化开发 |
| 样式方案 | Tailwind CSS | 原子化CSS，快速开发 |
| 组件库 | Shadcn/ui | 高质量React组件 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 后端框架 | FastAPI | 高性能Python API框架 |
| 数据库 | SQLite | 轻量级，无需额外服务 |
| 数据存储 | JSON | Prompt数据库存储 |
| HTTP客户端 | httpx | 异步HTTP请求 |
| WebSocket | websockets | ComfyUI通信 |

### 3.3 项目结构

```
celmecha-studio/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── page.tsx        # 首页
│   │   │   ├── generator/      # 生成器页面
│   │   │   ├── identity/       # 身份板页面
│   │   │   ├── card/           # 卡牌页面
│   │   │   ├── poster/         # 海报页面
│   │   │   └── video/          # 视频提示词页面
│   │   ├── components/         # React组件
│   │   │   ├── ui/            # Shadcn组件
│   │   │   ├── character/     # 角色选择组件
│   │   │   ├── mecha/         # 机甲选择组件
│   │   │   ├── scene/         # 场景选择组件
│   │   │   └── preview/       # 预览组件
│   │   ├── lib/               # 工具函数
│   │   ├── stores/            # Zustand状态
│   │   └── types/             # TypeScript类型
│   ├── public/                # 静态资源
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                     # 后端项目
│   ├── app/
│   │   ├── api/               # API路由
│   │   │   ├── prompt.py      # Prompt API
│   │   │   ├── generate.py    # 生成API
│   │   │   ├── template.py    # 模板API
│   │   │   └── project.py     # 项目API
│   │   ├── core/              # 核心模块
│   │   │   ├── prompt_engine.py
│   │   │   ├── style_lock.py
│   │   │   └── generator.py
│   │   ├── models/            # 数据模型
│   │   ├── services/          # 业务服务
│   │   └── utils/             # 工具函数
│   ├── data/                  # 数据文件
│   │   ├── prompts/          # Prompt数据库
│   │   ├── templates/        # 模板文件
│   │   └── projects/         # 项目数据
│   ├── requirements.txt
│   └── main.py
│
├── prompt-database/             # Prompt数据库
│   ├── style_core.json
│   ├── character.json
│   ├── hairstyle.json
│   ├── costume.json
│   ├── expression.json
│   ├── mecha.json
│   ├── weapon.json
│   ├── prop.json
│   ├── building.json
│   ├── scene.json
│   ├── lighting.json
│   ├── camera.json
│   ├── effect.json
│   ├── identity_sheet.json
│   ├── card_template.json
│   ├── poster_template.json
│   └── video_template.json
│
├── templates/                   # 模板资源
│   ├── identity/              # 身份板模板
│   ├── card/                  # 卡牌模板
│   └── poster/                # 海报模板
│
└── docs/                        # 文档
    ├── api.md
    └── user-guide.md
```

---

## 四、Prompt数据库设计

### 4.1 数据库结构

Prompt数据库采用模块化JSON结构，每个模块独立存储：

```
prompt-database/
├── style_core.json      # 风格核心（必选）
├── character.json       # 角色模块
├── hairstyle.json       # 发型模块
├── costume.json         # 服装模块
├── expression.json      # 表情模块
├── mecha.json           # 机甲模块
├── weapon.json          # 武器模块
├── prop.json            # 道具模块
├── building.json        # 建筑模块
├── scene.json           # 场景模块
├── lighting.json        # 光影模块
├── camera.json          # 镜头模块
├── effect.json          # 特效模块
├── identity_sheet.json  # 身份板模板
├── card_template.json   # 卡牌模板
├── poster_template.json # 海报模板
└── video_template.json  # 视频模板
```

### 4.2 风格核心 (style_core.json)

```json
{
  "metadata": {
    "version": "1.0.0",
    "name": "风格核心",
    "description": "所有输出必须继承的核心风格"
  },
  "core_style": {
    "id": "cel_mecha_core",
    "name": {
      "zh": "赛璐璐机甲核心风格",
      "en": "Cel-Shading Mecha Core Style"
    },
    "prompt": {
      "zh": "赛璐璐风格，工业机甲设计，动画设定集风格，高端商业插画，电影级光影",
      "en": "cel-shading style, industrial mecha design, anime setting sheet style, high-end commercial illustration, cinematic lighting"
    },
    "locked": true,
    "weight": 1.5
  },
  "world_setting": {
    "consistency": {
      "zh": "统一世界观，统一工业设计语言，统一色彩逻辑",
      "en": "consistent worldbuilding, unified industrial design language, unified color logic"
    }
  },
  "quality_tags": {
    "zh": "杰作，最佳质量，超高细节，精细渲染",
    "en": "masterpiece, best quality, ultra detailed, fine rendering"
  }
}
```

### 4.3 角色模块 (character.json)

```json
{
  "metadata": {
    "version": "1.0.0",
    "name": "角色模块",
    "description": "角色相关提示词"
  },
  "gender": {
    "label": {"zh": "性别", "en": "Gender"},
    "options": [
      {"id": "male", "label": {"zh": "男性", "en": "Male"}, "prompt": {"zh": "男性角色", "en": "male character"}},
      {"id": "female", "label": {"zh": "女性", "en": "Female"}, "prompt": {"zh": "女性角色", "en": "female character"}}
    ]
  },
  "age": {
    "label": {"zh": "年龄", "en": "Age"},
    "options": [
      {"id": "teen", "label": {"zh": "少年", "en": "Teenager"}, "prompt": {"zh": "少年", "en": "teenage"}},
      {"id": "young", "label": {"zh": "青年", "en": "Young Adult"}, "prompt": {"zh": "青年", "en": "young adult"}},
      {"id": "adult", "label": {"zh": "成年", "en": "Adult"}, "prompt": {"zh": "成年人", "en": "adult"}}
    ]
  },
  "body_type": {
    "label": {"zh": "体型", "en": "Body Type"},
    "options": [
      {"id": "slim", "label": {"zh": "纤细", "en": "Slim"}, "prompt": {"zh": "纤细体型", "en": "slim build"}},
      {"id": "athletic", "label": {"zh": "健美", "en": "Athletic"}, "prompt": {"zh": "健美体型", "en": "athletic build"}},
      {"id": "muscular", "label": {"zh": "强壮", "en": "Muscular"}, "prompt": {"zh": "强壮体型", "en": "muscular build"}}
    ]
  },
  "personality": {
    "label": {"zh": "性格", "en": "Personality"},
    "multi_select": true,
    "max_select": 2,
    "options": [
      {"id": "cool", "label": {"zh": "冷酷", "en": "Cool"}, "prompt": {"zh": "冷酷的", "en": "cool, aloof"}},
      {"id": "cheerful", "label": {"zh": "开朗", "en": "Cheerful"}, "prompt": {"zh": "开朗的", "en": "cheerful"}},
      {"id": "serious", "label": {"zh": "严肃", "en": "Serious"}, "prompt": {"zh": "严肃的", "en": "serious"}},
      {"id": "mysterious", "label": {"zh": "神秘", "en": "Mysterious"}, "prompt": {"zh": "神秘的", "en": "mysterious"}}
    ]
  }
}
```

### 4.4 机甲模块 (mecha.json)

```json
{
  "metadata": {
    "version": "1.0.0",
    "name": "机甲模块",
    "description": "机甲相关提示词"
  },
  "mecha_type": {
    "label": {"zh": "机甲类型", "en": "Mecha Type"},
    "options": [
      {"id": "humanoid", "label": {"zh": "人形机甲", "en": "Humanoid Mecha"}, "prompt": {"zh": "人形机甲", "en": "humanoid mecha"}},
      {"id": "beast", "label": {"zh": "兽形机甲", "en": "Beast Mecha"}, "prompt": {"zh": "兽形机甲", "en": "beast-type mecha"}},
      {"id": "aircraft", "label": {"zh": "飞行机甲", "en": "Aerial Mecha"}, "prompt": {"zh": "飞行机甲", "en": "aerial mecha"}},
      {"id": "armor", "label": {"zh": "装甲服", "en": "Power Armor"}, "prompt": {"zh": "装甲服", "en": "power armor suit"}}
    ]
  },
  "mecha_size": {
    "label": {"zh": "机甲尺寸", "en": "Mecha Size"},
    "options": [
      {"id": "light", "label": {"zh": "轻型", "en": "Light"}, "prompt": {"zh": "轻型机甲", "en": "light mecha"}},
      {"id": "medium", "label": {"zh": "中型", "en": "Medium"}, "prompt": {"zh": "中型机甲", "en": "medium mecha"}},
      {"id": "heavy", "label": {"zh": "重型", "en": "Heavy"}, "prompt": {"zh": "重型机甲", "en": "heavy mecha"}},
      {"id": "super", "label": {"zh": "超级", "en": "Super"}, "prompt": {"zh": "超级机甲", "en": "super mecha"}}
    ]
  },
  "mecha_style": {
    "label": {"zh": "设计风格", "en": "Design Style"},
    "options": [
      {"id": "real_robot", "label": {"zh": "真实系", "en": "Real Robot"}, "prompt": {"zh": "真实系机甲设计", "en": "real robot design"}},
      {"id": "super_robot", "label": {"zh": "超级系", "en": "Super Robot"}, "prompt": {"zh": "超级系机甲设计", "en": "super robot design"}},
      {"id": "industrial", "label": {"zh": "工业风", "en": "Industrial"}, "prompt": {"zh": "工业风格机甲", "en": "industrial style mecha"}},
      {"id": "futuristic", "label": {"zh": "未来风", "en": "Futuristic"}, "prompt": {"zh": "未来风格机甲", "en": "futuristic mecha"}}
    ]
  },
  "mecha_color": {
    "label": {"zh": "主色调", "en": "Main Color"},
    "options": [
      {"id": "white", "label": {"zh": "白色", "en": "White"}, "prompt": {"zh": "白色涂装", "en": "white color scheme"}, "hex": "#FFFFFF"},
      {"id": "black", "label": {"zh": "黑色", "en": "Black"}, "prompt": {"zh": "黑色涂装", "en": "black color scheme"}, "hex": "#000000"},
      {"id": "red", "label": {"zh": "红色", "en": "Red"}, "prompt": {"zh": "红色涂装", "en": "red color scheme"}, "hex": "#FF0000"},
      {"id": "blue", "label": {"zh": "蓝色", "en": "Blue"}, "prompt": {"zh": "蓝色涂装", "en": "blue color scheme"}, "hex": "#0000FF"},
      {"id": "military", "label": {"zh": "军绿", "en": "Military"}, "prompt": {"zh": "军绿色涂装", "en": "military green color scheme"}, "hex": "#4B5320"}
    ]
  }
}
```

### 4.5 场景模块 (scene.json)

```json
{
  "metadata": {
    "version": "1.0.0",
    "name": "场景模块",
    "description": "场景相关提示词"
  },
  "scene_type": {
    "label": {"zh": "场景类型", "en": "Scene Type"},
    "options": [
      {"id": "city", "label": {"zh": "城市", "en": "City"}, "prompt": {"zh": "未来城市", "en": "futuristic city"}},
      {"id": "ruins", "label": {"zh": "废墟", "en": "Ruins"}, "prompt": {"zh": "废墟场景", "en": "ruins scene"}},
      {"id": "factory", "label": {"zh": "工厂", "en": "Factory"}, "prompt": {"zh": "工业工厂", "en": "industrial factory"}},
      {"id": "hangar", "label": {"zh": "机库", "en": "Hangar"}, "prompt": {"zh": "机甲机库", "en": "mecha hangar"}},
      {"id": "space", "label": {"zh": "太空", "en": "Space"}, "prompt": {"zh": "太空场景", "en": "space scene"}},
      {"id": "battlefield", "label": {"zh": "战场", "en": "Battlefield"}, "prompt": {"zh": "战场场景", "en": "battlefield scene"}}
    ]
  },
  "time_of_day": {
    "label": {"zh": "时间", "en": "Time"},
    "options": [
      {"id": "dawn", "label": {"zh": "黎明", "en": "Dawn"}, "prompt": {"zh": "黎明时分", "en": "at dawn"}},
      {"id": "day", "label": {"zh": "白天", "en": "Day"}, "prompt": {"zh": "白天", "en": "daytime"}},
      {"id": "sunset", "label": {"zh": "黄昏", "en": "Sunset"}, "prompt": {"zh": "黄昏", "en": "sunset"}},
      {"id": "night", "label": {"zh": "夜晚", "en": "Night"}, "prompt": {"zh": "夜晚", "en": "nighttime"}}
    ]
  },
  "weather": {
    "label": {"zh": "天气", "en": "Weather"},
    "options": [
      {"id": "clear", "label": {"zh": "晴天", "en": "Clear"}, "prompt": {"zh": "晴朗天气", "en": "clear weather"}},
      {"id": "rain", "label": {"zh": "雨天", "en": "Rain"}, "prompt": {"zh": "雨天", "en": "rainy weather"}},
      {"id": "storm", "label": {"zh": "暴风雨", "en": "Storm"}, "prompt": {"zh": "暴风雨", "en": "stormy weather"}},
      {"id": "snow", "label": {"zh": "雪天", "en": "Snow"}, "prompt": {"zh": "雪天", "en": "snowy weather"}}
    ]
  }
}
```

---

## 五、Prompt生成逻辑

### 5.1 生成公式

```
最终提示词 = 风格核心 × 角色 × 服装 × 机甲 × 武器 × 场景 × 光影 × 镜头 × 用户需求
```

### 5.2 提示词模板

```python
def generate_prompt(selections: dict, custom_input: str = "") -> str:
    """
    生成最终提示词
    
    Args:
        selections: 用户选择的各个模块
        custom_input: 用户自定义输入
    
    Returns:
        完整的提示词字符串
    """
    prompt_parts = []
    
    # 1. 风格核心（必选，高权重）
    prompt_parts.append("(cel-shading style, industrial mecha design:1.5)")
    prompt_parts.append("(masterpiece, best quality:1.3)")
    
    # 2. 角色描述
    if selections.get("character"):
        char = selections["character"]
        char_parts = []
        if char.get("gender"):
            char_parts.append(char["gender"]["prompt_en"])
        if char.get("age"):
            char_parts.append(char["age"]["prompt_en"])
        if char.get("body_type"):
            char_parts.append(char["body_type"]["prompt_en"])
        prompt_parts.append(", ".join(char_parts))
    
    # 3. 发型描述
    if selections.get("hairstyle"):
        prompt_parts.append(selections["hairstyle"]["prompt_en"])
    
    # 4. 服装描述
    if selections.get("costume"):
        prompt_parts.append(selections["costume"]["prompt_en"])
    
    # 5. 机甲描述
    if selections.get("mecha"):
        mecha = selections["mecha"]
        mecha_parts = []
        if mecha.get("type"):
            mecha_parts.append(mecha["type"]["prompt_en"])
        if mecha.get("size"):
            mecha_parts.append(mecha["size"]["prompt_en"])
        if mecha.get("style"):
            mecha_parts.append(mecha["style"]["prompt_en"])
        prompt_parts.append(", ".join(mecha_parts))
    
    # 6. 武器描述
    if selections.get("weapon"):
        prompt_parts.append(selections["weapon"]["prompt_en"])
    
    # 7. 场景描述
    if selections.get("scene"):
        scene = selections["scene"]
        scene_parts = []
        if scene.get("type"):
            scene_parts.append(scene["type"]["prompt_en"])
        if scene.get("time"):
            scene_parts.append(scene["time"]["prompt_en"])
        if scene.get("weather"):
            scene_parts.append(scene["weather"]["prompt_en"])
        prompt_parts.append(", ".join(scene_parts))
    
    # 8. 光影描述
    if selections.get("lighting"):
        prompt_parts.append(selections["lighting"]["prompt_en"])
    
    # 9. 镜头描述
    if selections.get("camera"):
        prompt_parts.append(selections["camera"]["prompt_en"])
    
    # 10. 用户自定义需求
    if custom_input:
        prompt_parts.append(custom_input)
    
    return ", ".join(filter(None, prompt_parts))
```

### 5.3 提示词示例

**用户选择**：
- 角色：女性、青年、健美体型
- 发型：长发、蓝色
- 服装：机甲驾驶员服
- 机甲：人形机甲、中型、真实系、蓝色涂装
- 场景：机库、黄昏
- 光影：电影光、侧光
- 镜头：中景、仰视

**生成的英文提示词**：
```
(cel-shading style, industrial mecha design:1.5), (masterpiece, best quality:1.3),
female character, young adult, athletic build,
long blue hair,
pilot suit,
humanoid mecha, medium size, real robot design, blue color scheme,
mecha hangar, sunset,
cinematic lighting, side lighting,
medium shot, low angle view,
detailed mechanical parts, dynamic pose
```

**生成的中文提示词**：
```
(赛璐璐风格，工业机甲设计:1.5)，(杰作，最佳质量:1.3)，
女性角色，青年，健美体型，
蓝色长发，
机甲驾驶员服，
人形机甲，中型，真实系机甲设计，蓝色涂装，
机甲机库，黄昏时分，
电影级打光，侧光，
中景，仰视角度，
精细机械部件，动态姿势
```

---

## 六、风格锁定系统

### 6.1 设计理念

所有输出必须继承以下风格特征，确保整体视觉一致性：

```
┌─────────────────────────────────────────────────────────────┐
│                      风格锁定系统                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  核心风格（必选）                                     │   │
│  │  • 赛璐璐风格                                        │   │
│  │  • 工业机甲设计                                      │   │
│  │  • 动画设定集风格                                    │   │
│  │  • 高端商业插画                                      │   │
│  │  • 电影级光影                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  世界观一致性                                        │   │
│  │  • 统一世界观                                        │   │
│  │  • 统一工业设计语言                                  │   │
│  │  • 统一色彩逻辑                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 实现方式

```python
class StyleLockSystem:
    """风格锁定系统"""
    
    CORE_STYLE = {
        "zh": [
            "赛璐璐风格",
            "工业机甲设计",
            "动画设定集风格",
            "高端商业插画",
            "电影级光影"
        ],
        "en": [
            "cel-shading style",
            "industrial mecha design",
            "anime setting sheet style",
            "high-end commercial illustration",
            "cinematic lighting"
        ]
    }
    
    CONSISTENCY_RULES = {
        "zh": [
            "统一世界观",
            "统一工业设计语言",
            "统一色彩逻辑"
        ],
        "en": [
            "consistent worldbuilding",
            "unified industrial design language",
            "unified color logic"
        ]
    }
    
    @staticmethod
    def apply_style_lock(prompt: str, lang: str = "en") -> str:
        """
        应用风格锁定，将核心风格添加到提示词开头
        
        Args:
            prompt: 原始提示词
            lang: 语言（zh/en）
        
        Returns:
            添加风格锁定后的提示词
        """
        core = StyleLockSystem.CORE_STYLE[lang]
        consistency = StyleLockSystem.CONSISTENCY_RULES[lang]
        
        # 核心风格添加高权重
        core_prompt = f"({', '.join(core)}:1.5)"
        consistency_prompt = ", ".join(consistency)
        
        return f"{core_prompt}, {consistency_prompt}, {prompt}"
```

### 6.3 风格预设

| 预设名称 | 说明 | 适用场景 |
|---------|------|---------|
| 标准赛璐璐 | 平衡的赛璐璐风格 | 通用角色、机甲 |
| 硬核工业 | 强调机械质感 | 机甲设定、工业场景 |
| 动画剧场版 | 高质量动画风格 | 海报、宣传图 |
| 设定集风格 | 参考线、多角度 | 身份板、设定图 |

---

## 七、生成器模块设计

### 7.1 身份板生成器

#### 功能说明

生成角色或机甲的身份板（Character Sheet / Mecha Sheet），包含：
- 正面视图
- 侧面视图
- 背面视图
- 细节特写
- 基本信息

#### 模板结构

```json
{
  "identity_sheet": {
    "character_sheet": {
      "layout": "4_view",
      "views": ["front", "side", "back", "detail"],
      "info_fields": ["name", "age", "height", "weight", "ability"],
      "prompt_template": "character reference sheet, multiple views, {views}, {info}, cel-shading style, white background, consistent design"
    },
    "mecha_sheet": {
      "layout": "4_view",
      "views": ["front", "side", "back", "detail"],
      "info_fields": ["model", "height", "weight", "armor", "weapon", "engine"],
      "prompt_template": "mecha reference sheet, multiple views, {views}, {info}, industrial design, cel-shading style, blueprint style background"
    }
  }
}
```

#### 提示词生成

```python
def generate_identity_sheet_prompt(
    sheet_type: str,
    character_info: dict,
    views: list = ["front", "side", "back", "detail"]
) -> str:
    """
    生成身份板提示词
    
    Args:
        sheet_type: 类型（character/mecha）
        character_info: 角色/机甲信息
        views: 视图列表
    
    Returns:
        身份板提示词
    """
    base_prompt = "reference sheet, multiple views, consistent design"
    
    if sheet_type == "character":
        type_prompt = "character reference sheet, full body"
        background = "white background"
    else:
        type_prompt = "mecha reference sheet, mechanical design"
        background = "blueprint style background"
    
    views_prompt = ", ".join(views) + " view"
    
    # 组合提示词
    prompt = f"{type_prompt}, {views_prompt}, {base_prompt}, {background}"
    
    # 添加角色/机甲信息
    if character_info:
        info_parts = []
        for key, value in character_info.items():
            if isinstance(value, dict) and "prompt_en" in value:
                info_parts.append(value["prompt_en"])
        prompt += ", " + ", ".join(info_parts)
    
    return prompt
```

---

### 7.2 卡牌生成器

#### 功能说明

生成游戏卡牌，包含：
- 卡牌边框
- 角色/机甲图像
- 卡牌名称
- 属性数值
- 技能描述

#### 模板结构

```json
{
  "card_template": {
    "rarity": {
      "common": {
        "border_style": "simple",
        "color_scheme": "gray"
      },
      "rare": {
        "border_style": "ornate",
        "color_scheme": "blue"
      },
      "epic": {
        "border_style": "elaborate",
        "color_scheme": "purple"
      },
      "legendary": {
        "border_style": "legendary",
        "color_scheme": "gold"
      }
    },
    "card_type": {
      "character": "character card",
      "mecha": "mecha card",
      "weapon": "weapon card",
      "skill": "skill card"
    }
  }
}
```

#### 提示词生成

```python
def generate_card_prompt(
    card_type: str,
    rarity: str,
    content_info: dict,
    card_name: str = ""
) -> str:
    """
    生成卡牌提示词
    
    Args:
        card_type: 卡牌类型（character/mecha/weapon/skill）
        rarity: 稀有度（common/rare/epic/legendary）
        content_info: 内容信息
        card_name: 卡牌名称
    
    Returns:
        卡牌提示词
    """
    # 基础卡牌提示词
    base_prompt = "game card design, trading card, detailed illustration"
    
    # 稀有度样式
    rarity_styles = {
        "common": "simple border, gray color scheme",
        "rare": "ornate border, blue color scheme, subtle glow",
        "epic": "elaborate border, purple color scheme, magical glow",
        "legendary": "legendary border, golden color scheme, radiant glow"
    }
    
    rarity_prompt = rarity_styles.get(rarity, rarity_styles["common"])
    
    # 卡牌类型
    type_prompts = {
        "character": "character card, portrait",
        "mecha": "mecha card, mechanical design",
        "weapon": "weapon card, equipment design",
        "skill": "skill card, ability visualization"
    }
    
    type_prompt = type_prompts.get(card_type, "card design")
    
    # 组合提示词
    prompt = f"{base_prompt}, {type_prompt}, {rarity_prompt}"
    
    # 添加内容信息
    if content_info:
        content_parts = []
        for key, value in content_info.items():
            if isinstance(value, dict) and "prompt_en" in value:
                content_parts.append(value["prompt_en"])
        prompt += ", " + ", ".join(content_parts)
    
    return prompt
```

---

### 7.3 海报生成器

#### 功能说明

生成宣传海报，包含：
- 主视觉
- 标题文字
- 副标题
- 背景设计
- 特效

#### 模板结构

```json
{
  "poster_template": {
    "style": {
      "action": {
        "mood": "dynamic, intense, dramatic",
        "color": "high contrast, vibrant colors"
      },
      "drama": {
        "mood": "emotional, atmospheric, moody",
        "color": "muted colors, dramatic lighting"
      },
      "tech": {
        "mood": "futuristic, sleek, modern",
        "color": "neon colors, dark background"
      }
    },
    "composition": {
      "center": "centered composition",
      "dynamic": "dynamic diagonal composition",
      "minimal": "minimalist composition"
    }
  }
}
```

#### 提示词生成

```python
def generate_poster_prompt(
    poster_style: str,
    composition: str,
    content_info: dict,
    title: str = ""
) -> str:
    """
    生成海报提示词
    
    Args:
        poster_style: 海报风格（action/drama/tech）
        composition: 构图方式（center/dynamic/minimal）
        content_info: 内容信息
        title: 标题文字
    
    Returns:
        海报提示词
    """
    # 基础海报提示词
    base_prompt = "poster design, promotional art, high quality illustration"
    
    # 风格样式
    style_prompts = {
        "action": "dynamic, intense, dramatic, high contrast, vibrant colors",
        "drama": "emotional, atmospheric, moody, muted colors, dramatic lighting",
        "tech": "futuristic, sleek, modern, neon colors, dark background"
    }
    
    style_prompt = style_prompts.get(poster_style, style_prompts["action"])
    
    # 构图方式
    composition_prompts = {
        "center": "centered composition, balanced layout",
        "dynamic": "dynamic diagonal composition, energetic",
        "minimal": "minimalist composition, clean design"
    }
    
    composition_prompt = composition_prompts.get(composition, composition_prompts["center"])
    
    # 组合提示词
    prompt = f"{base_prompt}, {style_prompt}, {composition_prompt}"
    
    # 添加内容信息
    if content_info:
        content_parts = []
        for key, value in content_info.items():
            if isinstance(value, dict) and "prompt_en" in value:
                content_parts.append(value["prompt_en"])
        prompt += ", " + ", ".join(content_parts)
    
    return prompt
```

---

### 7.4 视频提示词生成器

#### 功能说明

生成用于AI视频生成的提示词，支持：
- 角色动画
- 机甲动作
- 场景运镜
- 特效展示

#### 模板结构

```json
{
  "video_template": {
    "duration": {
      "short": "3-5 seconds",
      "medium": "5-10 seconds",
      "long": "10-30 seconds"
    },
    "motion": {
      "static": "static camera, subject in motion",
      "tracking": "tracking shot, following subject",
      "pan": "panning shot, horizontal movement",
      "zoom": "zoom in/out",
      "orbit": "orbital shot, circling around subject"
    },
    "transition": {
      "none": "no transition",
      "fade": "fade in/out",
      "cut": "hard cut",
      "dissolve": "dissolve transition"
    }
  }
}
```

#### 提示词生成

```python
def generate_video_prompt(
    content_info: dict,
    motion_type: str = "static",
    duration: str = "medium",
    camera_movement: str = "tracking"
) -> str:
    """
    生成视频提示词
    
    Args:
        content_info: 内容信息
        motion_type: 运动类型
        duration: 时长
        camera_movement: 镜头运动
    
    Returns:
        视频提示词
    """
    # 基础视频提示词
    base_prompt = "animated, smooth motion, cinematic video"
    
    # 运动类型
    motion_prompts = {
        "static": "static camera, subject in motion",
        "tracking": "tracking shot, following subject",
        "pan": "panning shot, horizontal movement",
        "zoom": "zoom in/out effect",
        "orbit": "orbital shot, circling around subject"
    }
    
    motion_prompt = motion_prompts.get(motion_type, motion_prompts["static"])
    
    # 时长描述
    duration_prompts = {
        "short": "short clip, 3-5 seconds",
        "medium": "medium clip, 5-10 seconds",
        "long": "long clip, 10-30 seconds"
    }
    
    duration_prompt = duration_prompts.get(duration, duration_prompts["medium"])
    
    # 组合提示词
    prompt = f"{base_prompt}, {motion_prompt}, {duration_prompt}"
    
    # 添加内容信息
    if content_info:
        content_parts = []
        for key, value in content_info.items():
            if isinstance(value, dict) and "prompt_en" in value:
                content_parts.append(value["prompt_en"])
        prompt += ", " + ", ".join(content_parts)
    
    return prompt
```

---

## 八、前端界面设计

### 8.1 页面结构

```
┌─────────────────────────────────────────────────────────────┐
│  导航栏                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Logo  │  生成器  │  身份板  │  卡牌  │  海报  │  视频  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────────────────────────┐   │
│  │              │  │                                  │   │
│  │  选择面板    │  │          预览区域                │   │
│  │              │  │                                  │   │
│  │  ┌────────┐  │  │  ┌──────────────────────────┐   │   │
│  │  │ 角色   │  │  │  │                          │   │   │
│  │  ├────────┤  │  │  │                          │   │   │
│  │  │ 服装   │  │  │  │      图像预览            │   │   │
│  │  ├────────┤  │  │  │                          │   │   │
│  │  │ 机甲   │  │  │  │                          │   │   │
│  │  ├────────┤  │  │  │                          │   │   │
│  │  │ 场景   │  │  │  └──────────────────────────┘   │   │
│  │  ├────────┤  │  │                                  │   │
│  │  │ 光影   │  │  │  ┌──────────────────────────┐   │   │
│  │  ├────────┤  │  │  │  提词器                  │   │   │
│  │  │ 镜头   │  │  │  │  [中文] [英文] [复制]    │   │   │
│  │  └────────┘  │  │  │                          │   │   │
│  │              │  │  │  [提示词内容...]          │   │   │
│  │  ┌────────┐  │  │  └──────────────────────────┘   │   │
│  │  │ 特殊   │  │  │                                  │   │
│  │  │ 需求   │  │  │  ┌──────────────────────────┐   │   │
│  │  │        │  │  │  │  [生成按钮]              │   │   │
│  │  └────────┘  │  │  └──────────────────────────┘   │   │
│  │              │  │                                  │   │
│  └──────────────┘  └──────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 组件设计

#### 标签选择器组件

```tsx
// components/ui/tag-selector.tsx
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TagOption {
  id: string
  label: { zh: string; en: string }
  prompt: { zh: string; en: string }
}

interface TagSelectorProps {
  options: TagOption[]
  selected: string[]
  multiSelect?: boolean
  maxSelect?: number
  onChange: (selected: string[]) => void
}

export function TagSelector({
  options,
  selected,
  multiSelect = false,
  maxSelect,
  onChange
}: TagSelectorProps) {
  const handleClick = (id: string) => {
    if (multiSelect) {
      if (selected.includes(id)) {
        onChange(selected.filter(s => s !== id))
      } else if (!maxSelect || selected.length < maxSelect) {
        onChange([...selected, id])
      }
    } else {
      onChange([id])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <Button
          key={option.id}
          variant={selected.includes(option.id) ? "default" : "outline"}
          size="sm"
          onClick={() => handleClick(option.id)}
        >
          {option.label.zh}
        </Button>
      ))}
    </div>
  )
}
```

#### 颜色选择器组件

```tsx
// components/ui/color-selector.tsx
import { Button } from "@/components/ui/button"

interface ColorOption {
  id: string
  label: { zh: string; en: string }
  hex: string
}

interface ColorSelectorProps {
  options: ColorOption[]
  selected: string
  onChange: (selected: string) => void
}

export function ColorSelector({
  options,
  selected,
  onChange
}: ColorSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <Button
          key={option.id}
          variant={selected === option.id ? "default" : "outline"}
          size="sm"
          className="w-10 h-10 p-0"
          style={{ backgroundColor: option.hex }}
          onClick={() => onChange(option.id)}
        >
          {selected === option.id && (
            <span className="text-white">✓</span>
          )}
        </Button>
      ))}
    </div>
  )
}
```

---

## 九、API设计

### 9.1 API端点

```python
# backend/app/api/prompt.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/prompt", tags=["prompt"])

class PromptRequest(BaseModel):
    character: Optional[dict] = None
    hairstyle: Optional[dict] = None
    costume: Optional[dict] = None
    expression: Optional[dict] = None
    mecha: Optional[dict] = None
    weapon: Optional[dict] = None
    prop: Optional[dict] = None
    scene: Optional[dict] = None
    lighting: Optional[dict] = None
    camera: Optional[dict] = None
    custom_input: Optional[str] = None

class PromptResponse(BaseModel):
    prompt_zh: str
    prompt_en: str
    prompt_weighted: str

@router.post("/generate", response_model=PromptResponse)
async def generate_prompt(request: PromptRequest):
    """生成提示词"""
    # 实现提示词生成逻辑
    pass

@router.get("/database/{module}")
async def get_prompt_database(module: str):
    """获取提示词数据库"""
    # 返回指定模块的提示词数据
    pass
```

### 9.2 生成API

```python
# backend/app/api/generate.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/generate", tags=["generate"])

class GenerateRequest(BaseModel):
    prompt: str
    model: str  # flux, kling, midjourney, comfyui
    params: Optional[dict] = None

class GenerateResponse(BaseModel):
    task_id: str
    status: str
    image_url: Optional[str] = None

@router.post("/image", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """生成图像"""
    # 调用相应的AI模型API
    pass

@router.get("/status/{task_id}")
async def get_generation_status(task_id: str):
    """获取生成状态"""
    # 查询任务状态
    pass
```

---

## 十、开发计划

### 10.1 阶段划分

| 阶段 | 时间 | 目标 | 交付物 |
|------|------|------|--------|
| 第一阶段 | 第1-3周 | 基础架构搭建 | 前后端框架、数据库结构 |
| 第二阶段 | 第4-6周 | Prompt系统开发 | Prompt数据库、生成器 |
| 第三阶段 | 第7-9周 | 生成器模块开发 | 身份板、卡牌、海报生成器 |
| 第四阶段 | 第10-11周 | API集成与测试 | 多模型API支持、测试 |
| 第五阶段 | 第12周 | 优化与发布 | 性能优化、文档、发布 |

### 10.2 详细任务

#### 第一阶段：基础架构搭建（第1-3周）

| 任务 | 工时 | 依赖 |
|------|------|------|
| 前端项目初始化（Next.js + Tailwind + Shadcn） | 4h | - |
| 后端项目初始化（FastAPI + SQLite） | 4h | - |
| 数据库设计与创建 | 6h | - |
| 基础UI组件开发 | 8h | 前端初始化 |
| API基础架构搭建 | 6h | 后端初始化 |
| 前后端联调环境搭建 | 4h | 前后端初始化 |

#### 第二阶段：Prompt系统开发（第4-6周）

| 任务 | 工时 | 依赖 |
|------|------|------|
| Prompt数据库JSON文件创建 | 12h | 数据库设计 |
| Prompt生成引擎开发 | 12h | Prompt数据库 |
| 风格锁定系统开发 | 8h | Prompt生成引擎 |
| 标签选择器组件开发 | 6h | 基础UI组件 |
| 颜色选择器组件开发 | 4h | 基础UI组件 |
| Prompt预览组件开发 | 6h | Prompt生成引擎 |

#### 第三阶段：生成器模块开发（第7-9周）

| 任务 | 工时 | 依赖 |
|------|------|------|
| 身份板模板设计 | 8h | Prompt系统 |
| 身份板生成器开发 | 12h | 身份板模板 |
| 卡牌模板设计 | 8h | Prompt系统 |
| 卡牌生成器开发 | 12h | 卡牌模板 |
| 海报模板设计 | 8h | Prompt系统 |
| 海报生成器开发 | 12h | 海报模板 |
| 视频提示词生成器开发 | 8h | Prompt系统 |

#### 第四阶段：API集成与测试（第10-11周）

| 任务 | 工时 | 依赖 |
|------|------|------|
| Flux API集成 | 8h | API基础架构 |
| 可灵API集成 | 8h | API基础架构 |
| ComfyUI集成 | 12h | API基础架构 |
| 功能测试 | 12h | 所有模块 |
| 性能测试 | 6h | 功能测试 |
| Bug修复 | 8h | 测试结果 |

#### 第五阶段：优化与发布（第12周）

| 任务 | 工时 | 依赖 |
|------|------|------|
| UI优化 | 8h | 测试完成 |
| 性能优化 | 6h | 性能测试 |
| 用户文档编写 | 8h | 所有功能 |
| API文档编写 | 4h | API开发完成 |
| 打包与部署 | 6h | 所有优化 |
| 发布与监控 | 4h | 部署完成 |

---

## 十一、总结

CelMecha Studio V1.0 是一款专注于赛璐璐风格和工业机甲设计的AI美术生产软件，具有以下特点：

1. **用户友好**：无需学习提示词，通过模块化选择即可生成高质量提示词
2. **风格统一**：风格锁定系统确保所有输出保持一致的视觉风格
3. **多功能输出**：支持角色图、机甲图、场景图、身份板、卡牌、海报、视频提示词等多种输出类型
4. **技术先进**：采用Next.js + FastAPI现代技术栈，支持多模型API集成
5. **可扩展性**：模块化设计，便于扩展新的功能和提示词库

通过这套完整的规划，CelMecha Studio将成为AI动漫工业设计领域的专业工具，帮助创作者快速生成高质量的赛璐璐风格机甲设计作品。