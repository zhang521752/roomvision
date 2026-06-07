"""
Template API - 模板相关接口
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import os

router = APIRouter()

# 模板目录路径
TEMPLATES_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "templates")


class TemplateInfo(BaseModel):
    """模板信息"""
    id: str
    name: str
    type: str  # identity, card, poster
    description: Optional[str] = None
    preview: Optional[str] = None


class IdentitySheetRequest(BaseModel):
    """身份板生成请求"""
    sheet_type: str  # character, mecha
    character_info: Dict[str, Any]
    views: List[str] = ["front", "side", "back", "detail"]
    style: Optional[str] = "standard"


class CardRequest(BaseModel):
    """卡牌生成请求"""
    card_type: str  # character, mecha, weapon, skill
    rarity: str  # common, rare, epic, legendary
    content_info: Dict[str, Any]
    card_name: Optional[str] = None


class PosterRequest(BaseModel):
    """海报生成请求"""
    poster_style: str  # action, drama, tech
    composition: str  # center, dynamic, minimal
    content_info: Dict[str, Any]
    title: Optional[str] = None


def load_template(template_type: str, template_id: str) -> dict:
    """加载模板文件"""
    file_path = os.path.join(TEMPLATES_PATH, template_type, f"{template_id}.json")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def generate_identity_prompt(request: IdentitySheetRequest) -> dict:
    """生成身份板提示词"""
    base_prompt = "reference sheet, multiple views, consistent design"
    
    if request.sheet_type == "character":
        type_prompt = "character reference sheet, full body"
        background = "white background"
    else:
        type_prompt = "mecha reference sheet, mechanical design"
        background = "blueprint style background"
    
    views_prompt = ", ".join([f"{v} view" for v in request.views])
    
    # 收集角色/机甲信息
    info_parts = []
    for key, value in request.character_info.items():
        if isinstance(value, dict) and "en" in value:
            info_parts.append(value["en"])
        elif isinstance(value, str):
            info_parts.append(value)
    
    info_prompt = ", ".join(info_parts)
    
    prompt_en = f"{type_prompt}, {views_prompt}, {base_prompt}, {background}, {info_prompt}"
    prompt_zh = f"角色设定图，多角度视图，{', '.join(request.views)}，参考设计，白色背景，{info_prompt}"
    
    return {
        "prompt_en": prompt_en,
        "prompt_zh": prompt_zh,
        "prompt_weighted": f"({prompt_en}:1.3)"
    }


def generate_card_prompt(request: CardRequest) -> dict:
    """生成卡牌提示词"""
    base_prompt = "game card design, trading card, detailed illustration"
    
    rarity_styles = {
        "common": "simple border, gray color scheme",
        "rare": "ornate border, blue color scheme, subtle glow",
        "epic": "elaborate border, purple color scheme, magical glow",
        "legendary": "legendary border, golden color scheme, radiant glow"
    }
    
    type_prompts = {
        "character": "character card, portrait",
        "mecha": "mecha card, mechanical design",
        "weapon": "weapon card, equipment design",
        "skill": "skill card, ability visualization"
    }
    
    rarity_prompt = rarity_styles.get(request.rarity, rarity_styles["common"])
    type_prompt = type_prompts.get(request.card_type, "card design")
    
    # 收集内容信息
    info_parts = []
    for key, value in request.content_info.items():
        if isinstance(value, dict) and "en" in value:
            info_parts.append(value["en"])
        elif isinstance(value, str):
            info_parts.append(value)
    
    info_prompt = ", ".join(info_parts)
    
    prompt_en = f"{base_prompt}, {type_prompt}, {rarity_prompt}, {info_prompt}"
    prompt_zh = f"游戏卡牌设计，集换式卡牌，精细插画，{type_prompt}，{info_prompt}"
    
    return {
        "prompt_en": prompt_en,
        "prompt_zh": prompt_zh,
        "prompt_weighted": f"({prompt_en}:1.3)"
    }


def generate_poster_prompt(request: PosterRequest) -> dict:
    """生成海报提示词"""
    base_prompt = "poster design, promotional art, high quality illustration"
    
    style_prompts = {
        "action": "dynamic, intense, dramatic, high contrast, vibrant colors",
        "drama": "emotional, atmospheric, moody, muted colors, dramatic lighting",
        "tech": "futuristic, sleek, modern, neon colors, dark background"
    }
    
    composition_prompts = {
        "center": "centered composition, balanced layout",
        "dynamic": "dynamic diagonal composition, energetic",
        "minimal": "minimalist composition, clean design"
    }
    
    style_prompt = style_prompts.get(request.poster_style, style_prompts["action"])
    composition_prompt = composition_prompts.get(request.composition, composition_prompts["center"])
    
    # 收集内容信息
    info_parts = []
    for key, value in request.content_info.items():
        if isinstance(value, dict) and "en" in value:
            info_parts.append(value["en"])
        elif isinstance(value, str):
            info_parts.append(value)
    
    info_prompt = ", ".join(info_parts)
    
    prompt_en = f"{base_prompt}, {style_prompt}, {composition_prompt}, {info_prompt}"
    prompt_zh = f"海报设计，宣传艺术，高质量插画，{style_prompt}，{info_prompt}"
    
    return {
        "prompt_en": prompt_en,
        "prompt_zh": prompt_zh,
        "prompt_weighted": f"({prompt_en}:1.3)"
    }


@router.get("/list/{template_type}")
async def list_templates(template_type: str):
    """列出指定类型的模板"""
    valid_types = ["identity", "card", "poster"]
    if template_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid template type: {template_type}")
    
    template_dir = os.path.join(TEMPLATES_PATH, template_type)
    templates = []
    
    if os.path.exists(template_dir):
        for file in os.listdir(template_dir):
            if file.endswith(".json"):
                template_id = file.replace(".json", "")
                templates.append({
                    "id": template_id,
                    "type": template_type,
                    "name": template_id.replace("_", " ").title()
                })
    
    return {"templates": templates}


@router.post("/identity-sheet")
async def generate_identity_sheet(request: IdentitySheetRequest):
    """生成身份板"""
    try:
        result = generate_identity_prompt(request)
        return {
            "success": True,
            "prompt": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/card")
async def generate_card(request: CardRequest):
    """生成卡牌"""
    try:
        result = generate_card_prompt(request)
        return {
            "success": True,
            "prompt": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/poster")
async def generate_poster(request: PosterRequest):
    """生成海报"""
    try:
        result = generate_poster_prompt(request)
        return {
            "success": True,
            "prompt": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
