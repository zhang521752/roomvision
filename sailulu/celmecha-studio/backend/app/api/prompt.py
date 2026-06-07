"""
Prompt API - 提示词相关接口
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import os

router = APIRouter()

# 数据目录路径
PROMPT_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "prompts")


class PromptRequest(BaseModel):
    """提示词生成请求"""
    character: Optional[Dict[str, Any]] = None
    hairstyle: Optional[Dict[str, Any]] = None
    costume: Optional[Dict[str, Any]] = None
    expression: Optional[Dict[str, Any]] = None
    mecha: Optional[Dict[str, Any]] = None
    weapon: Optional[Dict[str, Any]] = None
    prop: Optional[Dict[str, Any]] = None
    scene: Optional[Dict[str, Any]] = None
    lighting: Optional[Dict[str, Any]] = None
    camera: Optional[Dict[str, Any]] = None
    effect: Optional[Dict[str, Any]] = None
    custom_input: Optional[str] = None


class PromptResponse(BaseModel):
    """提示词生成响应"""
    prompt_zh: str
    prompt_en: str
    prompt_weighted: str


def load_prompt_db(module_name: str) -> dict:
    """加载提示词数据库文件"""
    file_path = os.path.join(PROMPT_DB_PATH, f"{module_name}.json")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def generate_prompt_from_selection(selections: dict, custom_input: str = None) -> dict:
    """根据用户选择生成提示词"""
    
    # 风格核心（必选）
    style_core_zh = "赛璐璐风格，工业机甲设计，动画设定集风格，高端商业插画，电影级光影"
    style_core_en = "cel-shading style, industrial mecha design, anime setting sheet style, high-end commercial illustration, cinematic lighting"
    
    # 质量标签
    quality_zh = "杰作，最佳质量，超高细节"
    quality_en = "masterpiece, best quality, ultra detailed"
    
    # 一致性规则
    consistency_zh = "统一世界观，统一工业设计语言，统一色彩逻辑"
    consistency_en = "consistent worldbuilding, unified industrial design language, unified color logic"
    
    # 收集各模块提示词
    zh_parts = [style_core_zh, quality_zh, consistency_zh]
    en_parts = [style_core_en, quality_en, consistency_en]
    
    # 角色
    if selections.get("character"):
        char = selections["character"]
        if char.get("gender"):
            zh_parts.append(char["gender"].get("zh", ""))
            en_parts.append(char["gender"].get("en", ""))
        if char.get("age"):
            zh_parts.append(char["age"].get("zh", ""))
            en_parts.append(char["age"].get("en", ""))
        if char.get("body_type"):
            zh_parts.append(char["body_type"].get("zh", ""))
            en_parts.append(char["body_type"].get("en", ""))
        if char.get("personality"):
            for p in char["personality"]:
                zh_parts.append(p.get("zh", ""))
                en_parts.append(p.get("en", ""))
    
    # 发型
    if selections.get("hairstyle"):
        hs = selections["hairstyle"]
        zh_parts.append(hs.get("zh", ""))
        en_parts.append(hs.get("en", ""))
    
    # 服装
    if selections.get("costume"):
        cos = selections["costume"]
        zh_parts.append(cos.get("zh", ""))
        en_parts.append(cos.get("en", ""))
    
    # 表情
    if selections.get("expression"):
        exp = selections["expression"]
        zh_parts.append(exp.get("zh", ""))
        en_parts.append(exp.get("en", ""))
    
    # 机甲
    if selections.get("mecha"):
        mecha = selections["mecha"]
        if mecha.get("type"):
            zh_parts.append(mecha["type"].get("zh", ""))
            en_parts.append(mecha["type"].get("en", ""))
        if mecha.get("size"):
            zh_parts.append(mecha["size"].get("zh", ""))
            en_parts.append(mecha["size"].get("en", ""))
        if mecha.get("style"):
            zh_parts.append(mecha["style"].get("zh", ""))
            en_parts.append(mecha["style"].get("en", ""))
        if mecha.get("color"):
            zh_parts.append(mecha["color"].get("zh", ""))
            en_parts.append(mecha["color"].get("en", ""))
    
    # 武器
    if selections.get("weapon"):
        wep = selections["weapon"]
        zh_parts.append(wep.get("zh", ""))
        en_parts.append(wep.get("en", ""))
    
    # 道具
    if selections.get("prop"):
        prop = selections["prop"]
        zh_parts.append(prop.get("zh", ""))
        en_parts.append(prop.get("en", ""))
    
    # 场景
    if selections.get("scene"):
        scene = selections["scene"]
        if scene.get("type"):
            zh_parts.append(scene["type"].get("zh", ""))
            en_parts.append(scene["type"].get("en", ""))
        if scene.get("time"):
            zh_parts.append(scene["time"].get("zh", ""))
            en_parts.append(scene["time"].get("en", ""))
        if scene.get("weather"):
            zh_parts.append(scene["weather"].get("zh", ""))
            en_parts.append(scene["weather"].get("en", ""))
    
    # 光影
    if selections.get("lighting"):
        light = selections["lighting"]
        zh_parts.append(light.get("zh", ""))
        en_parts.append(light.get("en", ""))
    
    # 镜头
    if selections.get("camera"):
        cam = selections["camera"]
        zh_parts.append(cam.get("zh", ""))
        en_parts.append(cam.get("en", ""))
    
    # 特效
    if selections.get("effect"):
        eff = selections["effect"]
        zh_parts.append(eff.get("zh", ""))
        en_parts.append(eff.get("en", ""))
    
    # 用户自定义输入
    if custom_input:
        zh_parts.append(custom_input)
        en_parts.append(custom_input)
    
    # 过滤空值并组合
    prompt_zh = "，".join([p for p in zh_parts if p])
    prompt_en = ", ".join([p for p in en_parts if p])
    
    # 生成带权重的提示词
    prompt_weighted = f"(cel-shading style, industrial mecha design:1.5), (masterpiece, best quality:1.3), {prompt_en}"
    
    return {
        "prompt_zh": prompt_zh,
        "prompt_en": prompt_en,
        "prompt_weighted": prompt_weighted
    }


@router.post("/generate", response_model=PromptResponse)
async def generate_prompt(request: PromptRequest):
    """生成提示词"""
    try:
        selections = {}
        
        if request.character:
            selections["character"] = request.character
        if request.hairstyle:
            selections["hairstyle"] = request.hairstyle
        if request.costume:
            selections["costume"] = request.costume
        if request.expression:
            selections["expression"] = request.expression
        if request.mecha:
            selections["mecha"] = request.mecha
        if request.weapon:
            selections["weapon"] = request.weapon
        if request.prop:
            selections["prop"] = request.prop
        if request.scene:
            selections["scene"] = request.scene
        if request.lighting:
            selections["lighting"] = request.lighting
        if request.camera:
            selections["camera"] = request.camera
        if request.effect:
            selections["effect"] = request.effect
        
        result = generate_prompt_from_selection(selections, request.custom_input)
        return PromptResponse(**result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/database/{module_name}")
async def get_prompt_database(module_name: str):
    """获取提示词数据库模块"""
    valid_modules = [
        "style_core", "character", "hairstyle", "costume", "expression",
        "mecha", "weapon", "prop", "building", "scene", "lighting",
        "camera", "effect", "identity_sheet", "card_template",
        "poster_template", "video_template"
    ]
    
    if module_name not in valid_modules:
        raise HTTPException(status_code=400, detail=f"Invalid module: {module_name}")
    
    data = load_prompt_db(module_name)
    if not data:
        raise HTTPException(status_code=404, detail=f"Module {module_name} not found")
    
    return data


@router.get("/database")
async def list_prompt_databases():
    """列出所有提示词数据库模块"""
    modules = []
    if os.path.exists(PROMPT_DB_PATH):
        for file in os.listdir(PROMPT_DB_PATH):
            if file.endswith(".json"):
                modules.append(file.replace(".json", ""))
    return {"modules": modules}


# 角色生成相关接口
class CharacterGenerateRequest(BaseModel):
    """角色生成请求"""
    age: Optional[str] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    personality: Optional[str] = None
    faction: Optional[str] = None
    max_count: int = 50


@router.get("/character/dimensions")
async def get_character_dimensions():
    """获取角色维度库"""
    data = load_prompt_db("character_dimensions")
    if not data:
        raise HTTPException(status_code=404, detail="Character dimensions not found")
    return data


@router.post("/character/generate")
async def generate_characters(request: CharacterGenerateRequest):
    """根据维度生成角色"""
    try:
        # 导入角色生成器
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), "..", "core"))
        from character_generator import generate_characters_by_filter
        
        characters = generate_characters_by_filter(
            age=request.age,
            gender=request.gender,
            occupation=request.occupation,
            personality=request.personality,
            faction=request.faction,
            max_count=request.max_count
        )
        
        return {
            "total": len(characters),
            "characters": characters
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/character/all")
async def get_all_characters():
    """获取所有生成的角色"""
    data = load_prompt_db("character_generated")
    if not data:
        raise HTTPException(status_code=404, detail="Generated characters not found")
    return data


# 机甲生成相关接口
class MechaGenerateRequest(BaseModel):
    """机甲生成请求"""
    type: Optional[str] = None
    size: Optional[str] = None
    power: Optional[str] = None
    weapon: Optional[str] = None
    color: Optional[str] = None
    module: Optional[str] = None
    style: Optional[str] = None
    max_count: int = 50


@router.get("/mecha/dimensions")
async def get_mecha_dimensions():
    """获取机甲维度库"""
    data = load_prompt_db("mecha_dimensions")
    if not data:
        raise HTTPException(status_code=404, detail="Mecha dimensions not found")
    return data


@router.post("/mecha/generate")
async def generate_mechas(request: MechaGenerateRequest):
    """根据维度生成机甲"""
    try:
        # 导入机甲生成器
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), "..", "core"))
        from mecha_generator import generate_mechas_by_filter
        
        mechas = generate_mechas_by_filter(
            type_filter=request.type,
            size_filter=request.size,
            power_filter=request.power,
            weapon_filter=request.weapon,
            color_filter=request.color,
            module_filter=request.module,
            style_filter=request.style,
            max_count=request.max_count
        )
        
        return {
            "total": len(mechas),
            "mechas": mechas
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mecha/all")
async def get_all_mechas():
    """获取所有生成的机甲"""
    data = load_prompt_db("mecha_generated")
    if not data:
        raise HTTPException(status_code=404, detail="Generated mechas not found")
    return data


# 场景生成相关接口
class SceneGenerateRequest(BaseModel):
    """场景生成请求"""
    environment: Optional[str] = None
    building: Optional[str] = None
    prop: Optional[str] = None
    time: Optional[str] = None
    weather: Optional[str] = None
    lighting: Optional[str] = None
    camera: Optional[str] = None
    style: Optional[str] = None
    max_count: int = 50


@router.get("/scene/dimensions")
async def get_scene_dimensions():
    """获取场景维度库"""
    data = load_prompt_db("scene_dimensions")
    if not data:
        raise HTTPException(status_code=404, detail="Scene dimensions not found")
    return data


@router.post("/scene/generate")
async def generate_scenes(request: SceneGenerateRequest):
    """根据维度生成场景"""
    try:
        # 导入场景生成器
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), "..", "core"))
        from scene_generator import generate_scenes_by_filter
        
        scenes = generate_scenes_by_filter(
            environment_filter=request.environment,
            building_filter=request.building,
            prop_filter=request.prop,
            time_filter=request.time,
            weather_filter=request.weather,
            lighting_filter=request.lighting,
            camera_filter=request.camera,
            style_filter=request.style,
            max_count=request.max_count
        )
        
        return {
            "total": len(scenes),
            "scenes": scenes
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scene/all")
async def get_all_scenes():
    """获取所有生成的场景"""
    data = load_prompt_db("scene_generated")
    if not data:
        raise HTTPException(status_code=404, detail="Generated scenes not found")
    return data


# 道具生成相关接口
class PropGenerateRequest(BaseModel):
    """道具生成请求"""
    category: Optional[str] = None
    max_count: int = 50


@router.get("/prop/dimensions")
async def get_prop_dimensions():
    """获取道具维度库"""
    data = load_prompt_db("prop_dimensions")
    if not data:
        raise HTTPException(status_code=404, detail="Prop dimensions not found")
    return data


@router.post("/prop/generate")
async def generate_props(request: PropGenerateRequest):
    """根据维度生成道具"""
    try:
        # 导入道具生成器
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), "..", "core"))
        from prop_generator import generate_props_by_filter
        
        props = generate_props_by_filter(
            category_filter=request.category,
            max_count=request.max_count
        )
        
        return {
            "total": len(props),
            "props": props
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prop/all")
async def get_all_props():
    """获取所有生成的道具"""
    data = load_prompt_db("prop_generated")
    if not data:
        raise HTTPException(status_code=404, detail="Generated props not found")
    return data


# 光影镜头生成相关接口
class LightingCameraGenerateRequest(BaseModel):
    """光影镜头生成请求"""
    preset_type: Optional[str] = None  # "image" or "video"
    lighting: Optional[str] = None
    composition: Optional[str] = None
    camera: Optional[str] = None
    max_count: int = 50


@router.get("/lighting-camera/dimensions")
async def get_lighting_camera_dimensions():
    """获取光影镜头维度库"""
    data = load_prompt_db("lighting_camera_dimensions")
    if not data:
        raise HTTPException(status_code=404, detail="Lighting camera dimensions not found")
    return data


@router.post("/lighting-camera/generate")
async def generate_lighting_camera_presets(request: LightingCameraGenerateRequest):
    """根据维度生成光影镜头预设"""
    try:
        # 导入光影镜头生成器
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), "..", "core"))
        from lighting_camera_generator import generate_presets_by_filter
        
        presets = generate_presets_by_filter(
            preset_type=request.preset_type,
            lighting_filter=request.lighting,
            composition_filter=request.composition,
            camera_filter=request.camera,
            max_count=request.max_count
        )
        
        return {
            "total": len(presets),
            "presets": presets
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lighting-camera/all")
async def get_all_lighting_camera_presets():
    """获取所有生成的光影镜头预设"""
    data = load_prompt_db("lighting_camera_generated")
    if not data:
        raise HTTPException(status_code=404, detail="Generated lighting camera presets not found")
    return data


# 风格锁定相关接口
class StyleInjectRequest(BaseModel):
    """风格注入请求"""
    prompt: str
    content_type: str = "general"  # character/mecha/scene/identity_sheet/general
    language: str = "cn"  # cn/en
    faction: Optional[str] = None  # military/research/corporate/relic


@router.get("/style-lock/config")
async def get_style_lock_config():
    """获取风格锁定配置"""
    data = load_prompt_db("style_lock")
    if not data:
        raise HTTPException(status_code=404, detail="Style lock config not found")
    return data


@router.post("/style-lock/inject")
async def inject_style_lock(request: StyleInjectRequest):
    """注入风格锁定到提示词"""
    try:
        # 导入风格锁定引擎
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), "..", "core"))
        from style_lock_engine import get_full_style_prompt
        
        result = get_full_style_prompt(
            prompt=request.prompt,
            content_type=request.content_type,
            language=request.language,
            faction=request.faction
        )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/style-lock/negative-prompt")
async def get_negative_prompt(language: str = "cn"):
    """获取负面提示词"""
    try:
        # 导入风格锁定引擎
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), "..", "core"))
        from style_lock_engine import get_style_lock_engine
        
        engine = get_style_lock_engine()
        negative_prompt = engine.get_negative_prompt(language)
        
        return {
            "language": language,
            "negative_prompt": negative_prompt
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/style-lock/core")
async def get_style_core(language: str = "cn"):
    """获取风格核心"""
    try:
        # 导入风格锁定引擎
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), "..", "core"))
        from style_lock_engine import get_style_lock_engine
        
        engine = get_style_lock_engine()
        style_core = engine.get_style_core(language)
        weight = engine.get_style_core_weight()
        
        return {
            "language": language,
            "style_core": style_core,
            "weight": weight
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
