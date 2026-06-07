"""
Generate API - 图像生成接口
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import asyncio

router = APIRouter()

# 任务存储（内存中，生产环境应使用数据库）
tasks = {}


class GenerateRequest(BaseModel):
    """图像生成请求"""
    prompt: str
    prompt_zh: Optional[str] = None
    model: str = "flux"  # flux, kling, midjourney, comfyui
    params: Optional[Dict[str, Any]] = None


class GenerateResponse(BaseModel):
    """图像生成响应"""
    task_id: str
    status: str
    message: str


class TaskStatus(BaseModel):
    """任务状态"""
    task_id: str
    status: str  # pending, processing, completed, failed
    progress: Optional[int] = None
    image_url: Optional[str] = None
    error: Optional[str] = None


# 模拟的图像生成器
async def simulate_generation(task_id: str, prompt: str, model: str):
    """模拟图像生成过程"""
    global tasks
    
    try:
        tasks[task_id]["status"] = "processing"
        tasks[task_id]["progress"] = 0
        
        # 模拟生成过程
        for i in range(10):
            await asyncio.sleep(0.5)
            tasks[task_id]["progress"] = (i + 1) * 10
        
        # 模拟完成
        tasks[task_id]["status"] = "completed"
        tasks[task_id]["progress"] = 100
        tasks[task_id]["image_url"] = f"/api/images/{task_id}.png"
    
    except Exception as e:
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)


@router.post("/image", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """生成图像"""
    task_id = str(uuid.uuid4())
    
    # 创建任务
    tasks[task_id] = {
        "task_id": task_id,
        "status": "pending",
        "progress": 0,
        "prompt": request.prompt,
        "prompt_zh": request.prompt_zh,
        "model": request.model,
        "params": request.params,
        "image_url": None,
        "error": None
    }
    
    # 异步启动生成任务
    asyncio.create_task(simulate_generation(task_id, request.prompt, request.model))
    
    return GenerateResponse(
        task_id=task_id,
        status="pending",
        message="任务已创建，开始生成"
    )


@router.get("/status/{task_id}", response_model=TaskStatus)
async def get_generation_status(task_id: str):
    """获取生成状态"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务不存在")
    
    task = tasks[task_id]
    return TaskStatus(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        image_url=task["image_url"],
        error=task["error"]
    )


@router.get("/models")
async def list_models():
    """列出可用的生成模型"""
    return {
        "models": [
            {
                "id": "flux",
                "name": "Flux",
                "description": "高质量图像生成模型",
                "status": "available"
            },
            {
                "id": "kling",
                "name": "可灵",
                "description": "国产AI图像生成模型",
                "status": "available"
            },
            {
                "id": "midjourney",
                "name": "Midjourney",
                "description": "Discord集成的AI图像生成",
                "status": "available"
            },
            {
                "id": "comfyui",
                "name": "ComfyUI",
                "description": "本地部署的节点式AI生成",
                "status": "available"
            }
        ]
    }
