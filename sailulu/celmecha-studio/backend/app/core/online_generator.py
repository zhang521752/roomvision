"""
CelMecha Studio - Online Model Generator
线上模型API调用模块
支持 GPT-Image-2、Nano-Banana2 等线上中转模型
"""

import json
import os
import base64
import urllib.request
import urllib.error
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import time
import uuid


class OnlineModel(str, Enum):
    """线上模型枚举"""
    GPT_IMAGE_2 = "gpt-image-2"
    NANO_BANANA2 = "nano-banana2"


@dataclass
class ImageGenerationRequest:
    """图像生成请求"""
    prompt: str
    negative_prompt: str = ""
    width: int = 1024
    height: int = 1024
    num_images: int = 1
    model: str = "gpt-image-2"
    extra_params: Dict = None
    
    def __post_init__(self):
        if self.extra_params is None:
            self.extra_params = {}


@dataclass
class ImageGenerationResult:
    """图像生成结果"""
    success: bool
    model: str
    images: List[str]  # base64 encoded images or URLs
    error: Optional[str] = None
    metadata: Optional[Dict] = None


class OnlineGenerator:
    """线上模型生成器"""
    
    def __init__(self, config_dir: str = None):
        """初始化线上生成器"""
        if config_dir is None:
            config_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "config")
        self.config_dir = config_dir
        self.config = self._load_config()
    
    def _load_config(self) -> Dict:
        """加载API配置"""
        config_file = os.path.join(self.config_dir, "api_config.json")
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Config file not found at {config_file}")
            return {"online_models": {}}
        except json.JSONDecodeError as e:
            print(f"Error parsing config: {e}")
            return {"online_models": {}}
    
    def _save_config(self):
        """保存API配置"""
        config_file = os.path.join(self.config_dir, "api_config.json")
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving config: {e}")
    
    def update_model_config(self, model_id: str, base_url: str = None, api_key: str = None, enabled: bool = None):
        """更新模型配置"""
        if model_id in self.config.get("online_models", {}):
            if base_url is not None:
                self.config["online_models"][model_id]["base_url"] = base_url
            if api_key is not None:
                self.config["online_models"][model_id]["api_key"] = api_key
            if enabled is not None:
                self.config["online_models"][model_id]["enabled"] = enabled
            self._save_config()
            return True
        return False
    
    def get_model_config(self, model_id: str) -> Optional[Dict]:
        """获取模型配置"""
        return self.config.get("online_models", {}).get(model_id)
    
    def get_available_models(self) -> List[Dict]:
        """获取可用模型列表"""
        models = []
        for model_id, model_config in self.config.get("online_models", {}).items():
            models.append({
                "id": model_id,
                "name": model_config.get("name", model_id),
                "description": model_config.get("description", ""),
                "enabled": model_config.get("enabled", False),
                "configured": bool(model_config.get("base_url") and model_config.get("api_key"))
            })
        return models
    
    def generate(self, request: ImageGenerationRequest) -> ImageGenerationResult:
        """生成图像"""
        model_id = request.model
        
        if model_id == "gpt-image-2":
            return self._generate_gpt_image2(request)
        elif model_id == "nano-banana2":
            return self._generate_nano_banana2(request)
        else:
            return ImageGenerationResult(
                success=False,
                model=model_id,
                images=[],
                error=f"Unknown model: {model_id}"
            )
    
    def _generate_gpt_image2(self, request: ImageGenerationRequest) -> ImageGenerationResult:
        """使用 GPT-Image-2 生成图像"""
        config = self.get_model_config("gpt-image-2")
        
        if not config:
            return ImageGenerationResult(
                success=False,
                model="gpt-image-2",
                images=[],
                error="GPT-Image-2 config not found"
            )
        
        if not config.get("base_url") or not config.get("api_key"):
            return ImageGenerationResult(
                success=False,
                model="gpt-image-2",
                images=[],
                error="Please configure GPT-Image-2 base_url and api_key first"
            )
        
        try:
            # 构建请求
            url = f"{config['base_url'].rstrip('/')}/v1/images/generations"
            
            # 尺寸映射
            size_map = {
                (1024, 1024): "1024x1024",
                (1024, 1792): "1024x1792",
                (1792, 1024): "1792x1024"
            }
            size = size_map.get((request.width, request.height), "1024x1024")
            
            payload = {
                "model": config.get("model", "gpt-image-2"),
                "prompt": request.prompt,
                "n": request.num_images,
                "size": size,
                "quality": request.extra_params.get("quality", "hd"),
                "style": request.extra_params.get("style", "vivid"),
                "response_format": "b64_json"
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {config['api_key']}"
            }
            
            # 发送请求
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers=headers)
            
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            # 提取图像
            images = []
            for item in result.get("data", []):
                if "b64_json" in item:
                    images.append(item["b64_json"])
                elif "url" in item:
                    images.append(item["url"])
            
            return ImageGenerationResult(
                success=True,
                model="gpt-image-2",
                images=images,
                metadata={
                    "size": size,
                    "quality": payload["quality"],
                    "style": payload["style"]
                }
            )
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.readable() else str(e)
            return ImageGenerationResult(
                success=False,
                model="gpt-image-2",
                images=[],
                error=f"HTTP Error {e.code}: {error_body}"
            )
        except Exception as e:
            return ImageGenerationResult(
                success=False,
                model="gpt-image-2",
                images=[],
                error=str(e)
            )
    
    def _generate_nano_banana2(self, request: ImageGenerationRequest) -> ImageGenerationResult:
        """使用 Nano-Banana2 生成图像"""
        config = self.get_model_config("nano-banana2")
        
        if not config:
            return ImageGenerationResult(
                success=False,
                model="nano-banana2",
                images=[],
                error="Nano-Banana2 config not found"
            )
        
        if not config.get("base_url") or not config.get("api_key"):
            return ImageGenerationResult(
                success=False,
                model="nano-banana2",
                images=[],
                error="Please configure Nano-Banana2 base_url and api_key first"
            )
        
        try:
            # 构建请求 - 兼容多种中转API格式
            url = f"{config['base_url'].rstrip('/')}/v1/images/generations"
            
            payload = {
                "model": config.get("model", "nano-banana2"),
                "prompt": request.prompt,
                "negative_prompt": request.negative_prompt,
                "width": request.width,
                "height": request.height,
                "num_inference_steps": request.extra_params.get("steps", 30),
                "guidance_scale": request.extra_params.get("guidance_scale", 7.5),
                "num_images": request.num_images
            }
            
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {config['api_key']}"
            }
            
            # 发送请求
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers=headers)
            
            with urllib.request.urlopen(req, timeout=180) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            # 提取图像 - 兼容多种响应格式
            images = []
            
            # 格式1: data[].b64_json 或 data[].url
            if "data" in result:
                for item in result["data"]:
                    if "b64_json" in item:
                        images.append(item["b64_json"])
                    elif "url" in item:
                        images.append(item["url"])
            
            # 格式2: images[].b64_json
            elif "images" in result:
                for item in result["images"]:
                    if isinstance(item, dict):
                        if "b64_json" in item:
                            images.append(item["b64_json"])
                        elif "url" in item:
                            images.append(item["url"])
                    elif isinstance(item, str):
                        images.append(item)
            
            return ImageGenerationResult(
                success=True,
                model="nano-banana2",
                images=images,
                metadata={
                    "width": request.width,
                    "height": request.height,
                    "steps": payload["num_inference_steps"],
                    "guidance_scale": payload["guidance_scale"]
                }
            )
            
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.readable() else str(e)
            return ImageGenerationResult(
                success=False,
                model="nano-banana2",
                images=[],
                error=f"HTTP Error {e.code}: {error_body}"
            )
        except Exception as e:
            return ImageGenerationResult(
                success=False,
                model="nano-banana2",
                images=[],
                error=str(e)
            )
    
    def save_image(self, image_data: str, output_dir: str, filename: str = None) -> str:
        """保存图像到文件"""
        os.makedirs(output_dir, exist_ok=True)
        
        if filename is None:
            filename = f"{uuid.uuid4().hex[:8]}.png"
        
        filepath = os.path.join(output_dir, filename)
        
        # 判断是base64还是URL
        if image_data.startswith(('http://', 'https://')):
            # 下载URL图像
            urllib.request.urlretrieve(image_data, filepath)
        else:
            # 解码base64
            image_bytes = base64.b64decode(image_data)
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
        
        return filepath


# 创建全局实例
online_generator = OnlineGenerator()


def get_online_generator() -> OnlineGenerator:
    """获取线上生成器实例"""
    return online_generator
