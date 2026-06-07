"""
Project API - 项目管理接口
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import os
import uuid
from datetime import datetime

router = APIRouter()

# 项目目录路径
PROJECTS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")


class ProjectCreate(BaseModel):
    """创建项目请求"""
    name: str
    description: Optional[str] = None
    type: str = "general"  # general, character, mecha, scene


class ProjectUpdate(BaseModel):
    """更新项目请求"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectSave(BaseModel):
    """保存项目数据"""
    project_id: str
    selections: Dict[str, Any]
    prompt_zh: Optional[str] = None
    prompt_en: Optional[str] = None
    image_url: Optional[str] = None
    template_type: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None


def get_project_file_path(project_id: str) -> str:
    """获取项目文件路径"""
    return os.path.join(PROJECTS_PATH, f"{project_id}.json")


def load_project(project_id: str) -> dict:
    """加载项目"""
    file_path = get_project_file_path(project_id)
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None


def save_project_file(project_id: str, data: dict):
    """保存项目文件"""
    os.makedirs(PROJECTS_PATH, exist_ok=True)
    file_path = get_project_file_path(project_id)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@router.post("/create")
async def create_project(request: ProjectCreate):
    """创建新项目"""
    project_id = str(uuid.uuid4())
    
    project_data = {
        "id": project_id,
        "name": request.name,
        "description": request.description,
        "type": request.type,
        "status": "active",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "selections": {},
        "prompts": [],
        "images": []
    }
    
    save_project_file(project_id, project_data)
    
    return {
        "success": True,
        "project": project_data
    }


@router.get("/list")
async def list_projects():
    """列出所有项目"""
    projects = []
    
    if os.path.exists(PROJECTS_PATH):
        for file in os.listdir(PROJECTS_PATH):
            if file.endswith(".json"):
                project_id = file.replace(".json", "")
                project = load_project(project_id)
                if project:
                    projects.append({
                        "id": project["id"],
                        "name": project["name"],
                        "description": project.get("description"),
                        "type": project.get("type"),
                        "status": project.get("status"),
                        "created_at": project.get("created_at"),
                        "updated_at": project.get("updated_at")
                    })
    
    # 按更新时间排序
    projects.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    
    return {"projects": projects}


@router.get("/{project_id}")
async def get_project(project_id: str):
    """获取项目详情"""
    project = load_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    return {"project": project}


@router.put("/{project_id}")
async def update_project(project_id: str, request: ProjectUpdate):
    """更新项目"""
    project = load_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    if request.name is not None:
        project["name"] = request.name
    if request.description is not None:
        project["description"] = request.description
    if request.status is not None:
        project["status"] = request.status
    
    project["updated_at"] = datetime.now().isoformat()
    save_project_file(project_id, project)
    
    return {
        "success": True,
        "project": project
    }


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """删除项目"""
    file_path = get_project_file_path(project_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="项目不存在")
    
    os.remove(file_path)
    
    return {"success": True, "message": "项目已删除"}


@router.post("/save-selection")
async def save_project_selection(request: ProjectSave):
    """保存项目选择"""
    project = load_project(request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    # 更新选择
    project["selections"] = request.selections
    
    # 添加提示词记录
    if request.prompt_en:
        prompt_record = {
            "id": str(uuid.uuid4()),
            "prompt_zh": request.prompt_zh,
            "prompt_en": request.prompt_en,
            "template_type": request.template_type,
            "created_at": datetime.now().isoformat()
        }
        project["prompts"].append(prompt_record)
    
    # 添加图片记录
    if request.image_url:
        image_record = {
            "id": str(uuid.uuid4()),
            "url": request.image_url,
            "prompt_en": request.prompt_en,
            "created_at": datetime.now().isoformat()
        }
        project["images"].append(image_record)
    
    project["updated_at"] = datetime.now().isoformat()
    save_project_file(request.project_id, project)
    
    return {
        "success": True,
        "project": project
    }
