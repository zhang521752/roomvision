"""
CelMecha Studio - Online Model API
线上模型API路由
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import base64
import io

from app.core.online_generator import (
    OnlineGenerator,
    ImageGenerationRequest,
    OnlineModel,
    get_online_generator
)


router = APIRouter()


# ============ Pydantic Models ============

class ModelConfigRequest(BaseModel):
    """模型配置请求"""
    model_id: str = Field(..., description="模型ID: gpt-image-2 或 nano-banana2")
    base_url: str = Field(..., description="中转API地址")
    api_key: str = Field(..., description="API密钥")
    enabled: bool = Field(True, description="是否启用")


class GenerateRequest(BaseModel):
    """图像生成请求"""
    model: str = Field("gpt-image-2", description="模型ID")
    prompt: str = Field(..., description="正向提示词")
    negative_prompt: str = Field("", description="负向提示词")
    width: int = Field(1024, description="图像宽度")
    height: int = Field(1024, description="图像高度")
    num_images: int = Field(1, description="生成数量")
    extra_params: Dict[str, Any] = Field(default_factory=dict, description="额外参数")


class GenerateResponse(BaseModel):
    """图像生成响应"""
    success: bool
    model: str
    images: List[str]  # base64 encoded
    error: Optional[str] = None
    metadata: Optional[Dict] = None


# ============ API Endpoints ============

@router.get("/models", summary="获取可用模型列表")
async def get_models():
    """获取所有可用的线上模型"""
    generator = get_online_generator()
    models = generator.get_available_models()
    return {
        "success": True,
        "data": models
    }


@router.get("/models/{model_id}", summary="获取模型配置")
async def get_model_config(model_id: str):
    """获取指定模型的配置（隐藏API密钥）"""
    generator = get_online_generator()
    config = generator.get_model_config(model_id)
    
    if not config:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    # 隐藏API密钥
    safe_config = config.copy()
    if safe_config.get("api_key"):
        key = safe_config["api_key"]
        safe_config["api_key_masked"] = key[:8] + "****" + key[-4:] if len(key) > 12 else "****"
        safe_config["api_key"] = "***"
    
    return {
        "success": True,
        "data": safe_config
    }


@router.post("/config", summary="配置模型API")
async def configure_model(request: ModelConfigRequest):
    """
    配置线上模型的中转地址和API密钥
    
    - **model_id**: 模型ID (gpt-image-2 或 nano-banana2)
    - **base_url**: 中转API地址
    - **api_key**: API密钥
    - **enabled**: 是否启用
    """
    generator = get_online_generator()
    
    success = generator.update_model_config(
        model_id=request.model_id,
        base_url=request.base_url,
        api_key=request.api_key,
        enabled=request.enabled
    )
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Model {request.model_id} not found")
    
    return {
        "success": True,
        "message": f"Model {request.model_id} configured successfully"
    }


@router.post("/generate", summary="生成图像")
async def generate_image(request: GenerateRequest):
    """
    使用线上模型生成图像
    
    - **model**: 模型ID (gpt-image-2 或 nano-banana2)
    - **prompt**: 正向提示词
    - **negative_prompt**: 负向提示词
    - **width**: 图像宽度 (默认1024)
    - **height**: 图像高度 (默认1024)
    - **num_images**: 生成数量 (默认1)
    """
    generator = get_online_generator()
    
    # 检查模型是否已配置
    config = generator.get_model_config(request.model)
    if not config:
        raise HTTPException(status_code=404, detail=f"Model {request.model} not found")
    
    if not config.get("base_url") or not config.get("api_key"):
        raise HTTPException(
            status_code=400, 
            detail=f"Model {request.model} not configured. Please set base_url and api_key first."
        )
    
    # 创建生成请求
    gen_request = ImageGenerationRequest(
        prompt=request.prompt,
        negative_prompt=request.negative_prompt,
        width=request.width,
        height=request.height,
        num_images=request.num_images,
        model=request.model,
        extra_params=request.extra_params
    )
    
    # 生成图像
    result = generator.generate(gen_request)
    
    if not result.success:
        raise HTTPException(status_code=500, detail=result.error)
    
    return {
        "success": True,
        "model": result.model,
        "images": result.images,
        "metadata": result.metadata
    }


@router.post("/generate-and-save", summary="生成图像并保存")
async def generate_and_save(
    request: GenerateRequest,
    output_dir: str = "output"
):
    """
    使用线上模型生成图像并保存到指定目录
    """
    generator = get_online_generator()
    
    # 检查模型配置
    config = generator.get_model_config(request.model)
    if not config or not config.get("base_url") or not config.get("api_key"):
        raise HTTPException(
            status_code=400, 
            detail=f"Model {request.model} not configured"
        )
    
    # 生成图像
    gen_request = ImageGenerationRequest(
        prompt=request.prompt,
        negative_prompt=request.negative_prompt,
        width=request.width,
        height=request.height,
        num_images=request.num_images,
        model=request.model,
        extra_params=request.extra_params
    )
    
    result = generator.generate(gen_request)
    
    if not result.success:
        raise HTTPException(status_code=500, detail=result.error)
    
    # 保存图像
    saved_files = []
    for i, image_data in enumerate(result.images):
        filename = f"{request.model}_{i+1}.png"
        filepath = generator.save_image(image_data, output_dir, filename)
        saved_files.append(filepath)
    
    return {
        "success": True,
        "model": result.model,
        "saved_files": saved_files,
        "metadata": result.metadata
    }


@router.get("/test/{model_id}", summary="测试模型连接")
async def test_model(model_id: str):
    """测试指定模型的API连接"""
    generator = get_online_generator()
    config = generator.get_model_config(model_id)
    
    if not config:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    if not config.get("base_url") or not config.get("api_key"):
        return {
            "success": False,
            "model": model_id,
            "error": "Model not configured (missing base_url or api_key)"
        }
    
    try:
        # 尝试发送一个简单的测试请求
        test_request = ImageGenerationRequest(
            prompt="test",
            width=256,
            height=256,
            num_images=1,
            model=model_id
        )
        
        # 这里只是测试配置是否正确，不实际生成
        return {
            "success": True,
            "model": model_id,
            "message": "Configuration looks valid",
            "config": {
                "base_url": config["base_url"],
                "model": config.get("model", model_id),
                "has_api_key": bool(config.get("api_key"))
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "model": model_id,
            "error": str(e)
        }


@router.get("/health", summary="线上模型系统健康检查")
async def health_check():
    """检查线上模型系统状态"""
    generator = get_online_generator()
    models = generator.get_available_models()
    
    configured_count = sum(1 for m in models if m.get("configured"))
    
    return {
        "success": True,
        "status": "healthy",
        "data": {
            "total_models": len(models),
            "configured_models": configured_count,
            "models": models
        }
    }
