# CelMecha Studio - 启动与打包指南

## 快速启动

### 方式一：一键启动（推荐）

双击运行 `start.bat`

```
celmecha-studio/
├── start.bat           <-- 双击这个文件
├── backend/
└── frontend/
```

**功能**：
- 自动检查Python和Node.js环境
- 自动安装依赖
- 启动后端服务（端口8000）
- 启动前端服务（端口3000）
- 自动打开浏览器

### 方式二：单独启动后端

双击运行 `start-backend.bat`

```
celmecha-studio/
├── start-backend.bat   <-- 只启动后端
├── backend/
└── frontend/
```

**访问地址**：
- API文档：http://localhost:8000/docs
- API接口：http://localhost:8000/api

---

## 打包成EXE

### 前置条件

1. **Python 3.10+**
2. **Node.js 18+**（如果需要前端）
3. **PyInstaller**（会自动安装）

### 打包步骤

双击运行 `build.bat`

```
celmecha-studio/
├── build.bat           <-- 双击这个文件
├── backend/
├── frontend/
└── dist/               <-- 打包输出目录
```

### 打包输出

```
dist/
├── CelMechaStudio/
│   ├── CelMechaStudio.exe  (后端服务)
│   ├── data/               (数据文件)
│   └── app/                (应用模块)
├── frontend/               (前端文件)
└── start.bat               (一键启动)
```

### 使用打包版本

1. 将 `dist` 目录复制到目标电脑
2. 双击 `start.bat` 启动
3. 或直接运行 `CelMechaStudio.exe`

---

## 环境要求

### 开发环境

| 软件 | 版本 | 用途 |
|------|------|------|
| Python | 3.10+ | 后端服务 |
| Node.js | 18+ | 前端服务 |
| pip | 最新版 | Python包管理 |
| npm | 最新版 | Node.js包管理 |

### 运行环境（打包版本）

| 软件 | 版本 | 用途 |
|------|------|------|
| Windows | 10/11 | 操作系统 |
| Node.js | 18+ | 前端服务（可选） |

---

## 常见问题

### Q: 启动失败怎么办？

A: 检查以下几点：
1. Python是否安装：`python --version`
2. Node.js是否安装：`node --version`
3. 端口是否被占用：8000和3000

### Q: 如何修改端口？

A: 
- 后端端口：编辑 `backend/main.py` 中的 `port=8000`
- 前端端口：编辑 `frontend/package.json` 中的 `dev` 脚本

### Q: 打包后无法运行？

A: 
1. 确保所有依赖已安装
2. 检查是否有杀毒软件拦截
3. 尝试以管理员身份运行

### Q: 如何配置线上模型API？

A: 编辑配置文件：
```
backend/data/config/api_config.json
```

填入你的中转地址和API密钥。

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `start.bat` | 一键启动脚本（启动前后端） |
| `start-backend.bat` | 只启动后端服务 |
| `build.bat` | 打包成EXE的脚本 |
| `backend/main.py` | 后端主程序 |
| `backend/data/config/api_config.json` | API配置文件 |

---

## 目录结构

```
celmecha-studio/
├── start.bat                   # 一键启动
├── start-backend.bat           # 启动后端
├── build.bat                   # 打包脚本
├── README_STARTUP.md           # 本文件
│
├── backend/                    # 后端服务
│   ├── main.py                 # 主程序
│   ├── requirements.txt        # Python依赖
│   ├── celmecha_studio.spec    # PyInstaller配置
│   ├── app/
│   │   ├── api/                # API路由
│   │   └── core/               # 核心模块
│   └── data/
│       ├── prompts/            # 提示词库
│       └── config/             # 配置文件
│
├── frontend/                   # 前端服务
│   ├── package.json
│   └── src/
│
└── dist/                       # 打包输出
    └── CelMechaStudio/
        └── CelMechaStudio.exe
```

---

## 快捷命令

### 启动后端
```bash
cd backend
python main.py
```

### 启动前端
```bash
cd frontend
npm run dev
```

### 打包EXE
```bash
cd backend
pyinstaller --clean --noconfirm celmecha_studio.spec
```

---

## 技术支持

如有问题，请查看：
- API文档：http://localhost:8000/docs
- 日志输出：查看控制台日志

---

**版本**: 1.0.0  
**更新日期**: 2026-05-31
