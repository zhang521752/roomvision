"""
CelMecha Studio - Poster API
海报系统API路由
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

from app.core.poster_generator import (
    PosterGenerator,
    PosterConfig,
    PosterType,
    PosterLevel,
    LayoutType,
    AspectRatio,
    get_poster_generator
)


router = APIRouter()


# ============ Pydantic Models ============

class PosterTypeEnum(str, Enum):
    """海报类型"""
    CHARACTER = "character"
    MECHA = "mecha"
    DUO = "duo"
    BATTLE = "battle"
    MOVIE = "movie"
    WORLD = "world"


class PosterLevelEnum(str, Enum):
    """海报等级"""
    LEVEL1 = "level1"
    LEVEL2 = "level2"
    LEVEL3 = "level3"
    LEVEL4 = "level4"


class LayoutEnum(str, Enum):
    """构图类型"""
    HERO = "hero"
    EPIC = "epic"


class AspectRatioEnum(str, Enum):
    """画面比例"""
    VERTICAL = "vertical"
    LANDSCAPE = "landscape"
    SQUARE = "square"


class PosterGenerateRequest(BaseModel):
    """海报生成请求"""
    poster_type: PosterTypeEnum = Field(..., description="海报类型")
    level: PosterLevelEnum = Field(PosterLevelEnum.LEVEL2, description="海报等级")
    layout: LayoutEnum = Field(LayoutEnum.HERO, description="构图类型")
    aspect_ratio: AspectRatioEnum = Field(AspectRatioEnum.LANDSCAPE, description="画面比例")
    lighting: List[str] = Field(
        default=["cinematic", "volumetric"],
        description="光影效果列表"
    )
    character_name: Optional[str] = Field(None, description="角色名称")
    mecha_name: Optional[str] = Field(None, description="机甲名称")
    title: Optional[str] = Field(None, description="海报标题")
    subtitle: Optional[str] = Field(None, description="副标题")
    faction: Optional[str] = Field(None, description="阵营")
    character_id: Optional[str] = Field(None, description="角色编号")
    tagline: Optional[str] = Field(None, description="宣传语")
    custom_prompts: List[str] = Field(default=[], description="自定义提示词")


class PosterPromptResponse(BaseModel):
    """海报提示词响应"""
    cn_prompt: str
    en_prompt: str
    config: Dict[str, Any]
    metadata: Dict[str, Any]


class PosterWorkflowRequest(BaseModel):
    """海报工作流生成请求"""
    poster_type: PosterTypeEnum
    level: PosterLevelEnum = PosterLevelEnum.LEVEL2
    layout: LayoutEnum = LayoutEnum.HERO
    aspect_ratio: AspectRatioEnum = AspectRatioEnum.LANDSCAPE
    lighting: List[str] = ["cinematic", "volumetric"]
    character_name: Optional[str] = None
    mecha_name: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    faction: Optional[str] = None
    character_id: Optional[str] = None
    tagline: Optional[str] = None
    custom_prompts: List[str] = []


class PosterPresetResponse(BaseModel):
    """海报预设响应"""
    id: str
    name: str
    config: Dict[str, Any]


# ============ API Endpoints ============

@router.get("/types", summary="获取海报类型列表")
async def get_poster_types():
    """获取所有可用的海报类型"""
    generator = get_poster_generator()
    types = generator.get_poster_types()
    return {
        "success": True,
        "data": types
    }


@router.get("/levels", summary="获取海报等级列表")
async def get_poster_levels():
    """获取所有海报等级"""
    generator = get_poster_generator()
    levels = generator.get_poster_levels()
    return {
        "success": True,
        "data": levels
    }


@router.get("/layouts", summary="获取构图系统")
async def get_layouts():
    """获取所有构图类型"""
    generator = get_poster_generator()
    layouts = generator.get_layout_system()
    return {
        "success": True,
        "data": layouts
    }


@router.get("/aspect-ratios", summary="获取画面比例")
async def get_aspect_ratios():
    """获取所有画面比例选项"""
    generator = get_poster_generator()
    ratios = generator.get_aspect_ratios()
    return {
        "success": True,
        "data": ratios
    }


@router.get("/lighting", summary="获取光影预设")
async def get_lighting_presets():
    """获取所有光影预设"""
    generator = get_poster_generator()
    lighting = generator.get_lighting_presets()
    return {
        "success": True,
        "data": lighting
    }


@router.get("/presets", summary="获取预设配置")
async def get_presets():
    """获取海报预设配置列表"""
    generator = get_poster_generator()
    presets = generator.get_preset_configs()
    return {
        "success": True,
        "data": presets,
        "total": len(presets)
    }


@router.post("/generate", summary="生成海报提示词")
async def generate_poster_prompt(request: PosterGenerateRequest):
    """
    根据配置生成海报提示词
    
    返回中英文提示词、配置信息和元数据
    """
    try:
        generator = get_poster_generator()
        
        # 构建配置
        config = PosterConfig(
            poster_type=PosterType(request.poster_type.value),
            level=PosterLevel(request.level.value),
            layout=LayoutType(request.layout.value),
            aspect_ratio=AspectRatio(request.aspect_ratio.value),
            lighting=request.lighting,
            character_name=request.character_name,
            mecha_name=request.mecha_name,
            title=request.title,
            subtitle=request.subtitle,
            faction=request.faction,
            character_id=request.character_id,
            tagline=request.tagline,
            custom_prompts=request.custom_prompts
        )
        
        # 生成提示词
        result = generator.generate_prompt(config)
        
        return {
            "success": True,
            "data": {
                "cn_prompt": result.cn_prompt,
                "en_prompt": result.en_prompt,
                "config": result.config,
                "metadata": result.metadata
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/workflow", summary="生成ComfyUI工作流")
async def generate_workflow(request: PosterWorkflowRequest):
    """
    生成ComfyUI工作流配置
    
    返回可用于ComfyUI的工作流JSON
    """
    try:
        generator = get_poster_generator()
        
        # 构建配置
        config = PosterConfig(
            poster_type=PosterType(request.poster_type.value),
            level=PosterLevel(request.level.value),
            layout=LayoutType(request.layout.value),
            aspect_ratio=AspectRatio(request.aspect_ratio.value),
            lighting=request.lighting,
            character_name=request.character_name,
            mecha_name=request.mecha_name,
            title=request.title,
            subtitle=request.subtitle,
            faction=request.faction,
            character_id=request.character_id,
            tagline=request.tagline,
            custom_prompts=request.custom_prompts
        )
        
        # 生成工作流
        workflow = generator.generate_comfyui_workflow(config)
        
        return {
            "success": True,
            "data": workflow
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/quick", summary="快速生成海报提示词")
async def quick_generate(
    poster_type: PosterTypeEnum,
    character_name: Optional[str] = None,
    mecha_name: Optional[str] = None,
    level: PosterLevelEnum = PosterLevelEnum.LEVEL2
):
    """
    快速生成海报提示词（简化接口）
    
    只需指定类型和名称即可生成
    """
    try:
        generator = get_poster_generator()
        
        # 根据类型自动选择构图
        layout = LayoutType.HERO if poster_type in [PosterTypeEnum.CHARACTER, PosterTypeEnum.DUO] else LayoutType.EPIC
        
        config = PosterConfig(
            poster_type=PosterType(poster_type.value),
            level=PosterLevel(level.value),
            layout=layout,
            aspect_ratio=AspectRatio.LANDSCAPE,
            lighting=["cinematic", "volumetric"],
            character_name=character_name,
            mecha_name=mecha_name
        )
        
        result = generator.generate_prompt(config)
        
        return {
            "success": True,
            "data": {
                "cn_prompt": result.cn_prompt,
                "en_prompt": result.en_prompt
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/health", summary="海报系统健康检查")
async def health_check():
    """检查海报系统是否正常运行"""
    generator = get_poster_generator()
    types_count = len(generator.get_poster_types())
    levels_count = len(generator.get_poster_levels())
    
    return {
        "success": True,
        "status": "healthy",
        "data": {
            "poster_types": types_count,
            "poster_levels": levels_count,
            "version": "1.0.0"
        }
    }
