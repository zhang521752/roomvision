# CelMecha Studio V1.0

## 赛璐璐机甲工坊

AI动漫工业设计平台 - 专注于赛璐璐风格和工业机甲设计

---

## 功能特性

- 🎨 **Prompt生成器** - 模块化选择，自动生成高质量提示词
- 🤖 **机甲设计** - 专业机甲类型、尺寸、风格选择
- 👤 **角色设计** - 性别、年龄、体型、性格等多维度选择
- 🏙️ **场景设计** - 丰富的场景类型、时间、天气选项
- 💡 **光影控制** - 专业光源类型和方向设置
- 📷 **镜头控制** - 拍摄角度和景别选择
- 🎴 **身份板生成** - 角色/机甲多角度设定图
- 🃏 **卡牌生成** - 游戏卡牌设计（支持稀有度系统）
- 🖼️ **海报生成** - 宣传海报设计
- 🎬 **视频提示词** - AI视频生成提示词

---

## 技术栈

### 前端
- Next.js 14
- React 18
- Tailwind CSS
- Shadcn/ui
- Zustand (状态管理)

### 后端
- Python
- FastAPI
- SQLite

### Prompt Engine
- Python
- JSON Database

---

## 快速开始

### 1. 启动后端

```bash
# 进入后端目录
cd backend

# 创建虚拟环境（可选）
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
python main.py
```

后端服务将在 http://localhost:8000 启动

### 2. 启动前端

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 http://localhost:3000 启动

---

## 项目结构

```
celmecha-studio/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   ├── components/         # React组件
│   │   ├── lib/                # 工具函数
│   │   ├── stores/             # Zustand状态
│   │   └── types/              # TypeScript类型
│   ├── public/                 # 静态资源
│   └── package.json
│
├── backend/                     # 后端项目
│   ├── app/
│   │   ├── api/               # API路由
│   │   ├── core/              # 核心模块
│   │   ├── models/            # 数据模型
│   │   └── services/          # 业务服务
│   ├── data/                  # 数据文件
│   │   ├── prompts/          # Prompt数据库
│   │   ├── templates/        # 模板文件
│   │   └── projects/         # 项目数据
│   ├── requirements.txt
│   └── main.py
│
└── README.md
```

---

## API接口

### Prompt API

- `POST /api/prompt/generate` - 生成提示词
- `GET /api/prompt/database/{module}` - 获取Prompt数据库模块
- `GET /api/prompt/database` - 列出所有模块

### Generate API

- `POST /api/generate/image` - 生成图像
- `GET /api/generate/status/{task_id}` - 获取生成状态
- `GET /api/generate/models` - 列出可用模型

### Template API

- `GET /api/template/list/{type}` - 列出模板
- `POST /api/template/identity-sheet` - 生成身份板
- `POST /api/template/card` - 生成卡牌
- `POST /api/template/poster` - 生成海报

### Project API

- `POST /api/project/create` - 创建项目
- `GET /api/project/list` - 列出项目
- `GET /api/project/{id}` - 获取项目详情
- `PUT /api/project/{id}` - 更新项目
- `DELETE /api/project/{id}` - 删除项目

---

## 使用指南

### 生成提示词

1. 在左侧选择面板中选择角色、发型、服装、机甲、场景等配置
2. 可选：在"特殊需求"输入框中输入额外描述
3. 点击"生成提示词"按钮
4. 在右侧查看生成的中英文提示词
5. 点击"复制中文"或"复制英文"按钮复制提示词

### 生成图像

1. 生成提示词后，选择目标AI模型（Flux/可灵/Midjourney/ComfyUI）
2. 点击"生成图像"按钮
3. 等待生成完成
4. 在预览区查看生成的图像

---

## 风格锁定

所有输出自动继承以下风格特征：

- 赛璐璐风格
- 工业机甲设计
- 动画设定集风格
- 高端商业插画
- 电影级光影
- 统一世界观
- 统一工业设计语言
- 统一色彩逻辑

---

## 开发计划

- [x] 后端API开发
- [x] Prompt数据库
- [x] 前端基础框架
- [ ] 完整UI组件库
- [ ] 身份板生成器页面
- [ ] 卡牌生成器页面
- [ ] 海报生成器页面
- [ ] 视频提示词生成器
- [ ] 项目管理功能
- [ ] 多模型API集成

---

## 许可证

MIT License

---

## 联系方式

- 项目主页：[GitHub Repository]
- 问题反馈：[Issues]

---

**CelMecha Studio** - 让AI动漫工业设计更简单 🚀
