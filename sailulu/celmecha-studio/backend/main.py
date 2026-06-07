"""
CelMecha Studio V1.0 - Backend Main Application
赛璐璐机甲工坊 - 后端主应用
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.api import prompt, generate, template, project, poster, online
from app.core.database import init_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化数据库
    await init_database()
    print("✅ CelMecha Studio Backend Started")
    yield
    # 关闭时清理资源
    print("👋 CelMecha Studio Backend Stopped")


# 创建FastAPI应用
app = FastAPI(
    title="CelMecha Studio API",
    description="赛璐璐机甲工坊 - AI美术生产平台API\n\n## 功能模块\n- **Prompt**: 提示词管理\n- **Generate**: 图像生成\n- **Template**: 模板管理\n- **Project**: 项目管理\n- **Poster**: 海报生成系统",
    version="1.0.0",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册API路由
app.include_router(prompt.router, prefix="/api/prompt", tags=["Prompt"])
app.include_router(generate.router, prefix="/api/generate", tags=["Generate"])
app.include_router(template.router, prefix="/api/template", tags=["Template"])
app.include_router(project.router, prefix="/api/project", tags=["Project"])
app.include_router(poster.router, prefix="/api/poster", tags=["Poster"])
app.include_router(online.router, prefix="/api/online", tags=["Online Models"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "CelMecha Studio API",
        "version": "1.0.0",
        "description": "赛璐璐机甲工坊 - AI美术生产平台"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
