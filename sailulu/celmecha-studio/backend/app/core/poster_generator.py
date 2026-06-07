"""
CelMecha Studio - Poster Generator
海报生成器核心模块
"""

import json
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum


class PosterType(str, Enum):
    """海报类型枚举"""
    CHARACTER = "character"
    MECHA = "mecha"
    DUO = "duo"
    BATTLE = "battle"
    MOVIE = "movie"
    WORLD = "world"


class PosterLevel(str, Enum):
    """海报等级枚举"""
    LEVEL1 = "level1"  # 标准海报
    LEVEL2 = "level2"  # 商业海报
    LEVEL3 = "level3"  # 电影海报
    LEVEL4 = "level4"  # 旗舰海报


class LayoutType(str, Enum):
    """构图类型枚举"""
    HERO = "hero"      # 英雄构图
    EPIC = "epic"      # 史诗构图


class AspectRatio(str, Enum):
    """画面比例枚举"""
    VERTICAL = "vertical"    # 9:16
    LANDSCAPE = "landscape"  # 16:9
    SQUARE = "square"        # 1:1


@dataclass
class PosterConfig:
    """海报配置数据类"""
    poster_type: PosterType
    level: PosterLevel = PosterLevel.LEVEL2
    layout: LayoutType = LayoutType.HERO
    aspect_ratio: AspectRatio = AspectRatio.LANDSCAPE
    lighting: List[str] = None
    character_name: Optional[str] = None
    mecha_name: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    faction: Optional[str] = None
    character_id: Optional[str] = None
    tagline: Optional[str] = None
    custom_prompts: List[str] = None
    
    def __post_init__(self):
        if self.lighting is None:
            self.lighting = ["cinematic", "volumetric"]
        if self.custom_prompts is None:
            self.custom_prompts = []


@dataclass
class GeneratedPosterPrompt:
    """生成的海报提示词"""
    cn_prompt: str
    en_prompt: str
    config: Dict[str, Any]
    metadata: Dict[str, Any]


class PosterGenerator:
    """海报生成器"""
    
    def __init__(self, data_dir: str = None):
        """初始化海报生成器"""
        if data_dir is None:
            data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "prompts")
        self.data_dir = data_dir
        self.poster_data = self._load_poster_data()
    
    def _load_poster_data(self) -> Dict:
        """加载海报提示词数据"""
        poster_file = os.path.join(self.data_dir, "poster.json")
        try:
            with open(poster_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Poster data file not found at {poster_file}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing poster data: {e}")
            return {}
    
    def get_poster_types(self) -> Dict:
        """获取所有海报类型"""
        return self.poster_data.get("poster_types", {})
    
    def get_poster_levels(self) -> Dict:
        """获取所有海报等级"""
        return self.poster_data.get("poster_levels", {})
    
    def get_layout_system(self) -> Dict:
        """获取构图系统"""
        return self.poster_data.get("layout_system", {})
    
    def get_aspect_ratios(self) -> Dict:
        """获取画面比例选项"""
        return self.poster_data.get("aspect_ratios", {})
    
    def get_lighting_presets(self) -> Dict:
        """获取光影预设"""
        return self.poster_data.get("lighting_presets", {})
    
    def generate_prompt(self, config: PosterConfig) -> GeneratedPosterPrompt:
        """
        根据配置生成海报提示词
        
        Args:
            config: 海报配置
            
        Returns:
            GeneratedPosterPrompt: 生成的提示词
        """
        # 获取模板
        templates = self.poster_data.get("poster_templates", {})
        template = templates.get(config.poster_type.value, {})
        
        if not template:
            raise ValueError(f"Unknown poster type: {config.poster_type}")
        
        # 获取构图信息
        layout_info = self.poster_data.get("layout_system", {}).get(config.layout.value, {})
        layout_prompt_cn = layout_info.get("name", "")
        layout_prompt_en = layout_info.get("prompt", "")
        
        # 获取画面比例信息
        ratio_info = self.poster_data.get("aspect_ratios", {}).get(config.aspect_ratio.value, {})
        ratio_prompt_cn = ratio_info.get("name", "")
        ratio_prompt_en = ratio_info.get("prompt", "")
        
        # 获取等级质量修饰词
        level_info = self.poster_data.get("poster_levels", {}).get(config.level.value, {})
        quality_modifiers_cn = self.poster_data.get("quality_presets", {}).get(
            level_info.get("quality", "standard"), {}
        ).get("cn", [])
        quality_modifiers_en = self.poster_data.get("quality_presets", {}).get(
            level_info.get("quality", "standard"), {}
        ).get("en", [])
        
        # 获取光影提示词
        lighting_presets = self.poster_data.get("lighting_presets", {})
        lighting_cn = []
        lighting_en = []
        for light_id in config.lighting:
            light_info = lighting_presets.get(light_id, {})
            if light_info:
                lighting_cn.append(light_info.get("cn_prompt", ""))
                lighting_en.append(light_info.get("en_prompt", ""))
        
        # 构建基础风格
        style_base_cn = self.poster_data.get("style_base", {}).get("cn", [])
        style_base_en = self.poster_data.get("style_base", {}).get("en", [])
        
        # 组装中文提示词
        cn_parts = [
            template.get("cn", "").format(
                aspect_ratio=ratio_prompt_cn,
                layout=layout_prompt_cn
            ),
            " ".join(lighting_cn),
            " ".join(quality_modifiers_cn),
            " ".join(config.custom_prompts)
        ]
        cn_prompt = " ".join(filter(None, cn_parts))
        
        # 组装英文提示词
        en_parts = [
            template.get("en", "").format(
                aspect_ratio=ratio_prompt_en,
                layout=layout_prompt_en
            ),
            " ".join(lighting_en),
            " ".join(quality_modifiers_en),
            " ".join(config.custom_prompts)
        ]
        en_prompt = " ".join(filter(None, en_parts))
        
        # 添加角色/机甲名称到提示词
        if config.character_name:
            cn_prompt = f"{config.character_name} {cn_prompt}"
            en_prompt = f"{config.character_name} {en_prompt}"
        if config.mecha_name:
            cn_prompt = f"{config.mecha_name} {cn_prompt}"
            en_prompt = f"{config.mecha_name} {en_prompt}"
        
        # 构建配置信息
        config_dict = {
            "poster_type": config.poster_type.value,
            "level": config.level.value,
            "layout": config.layout.value,
            "aspect_ratio": config.aspect_ratio.value,
            "lighting": config.lighting,
            "character_name": config.character_name,
            "mecha_name": config.mecha_name
        }
        
        # 构建元数据
        metadata = {
            "title": config.title,
            "subtitle": config.subtitle,
            "faction": config.faction,
            "character_id": config.character_id,
            "tagline": config.tagline,
            "output_resolution": {
                "width": ratio_info.get("width", 1920),
                "height": ratio_info.get("height", 1080)
            }
        }
        
        return GeneratedPosterPrompt(
            cn_prompt=cn_prompt,
            en_prompt=en_prompt,
            config=config_dict,
            metadata=metadata
        )
    
    def generate_comfyui_workflow(self, config: PosterConfig, base_workflow: Dict = None) -> Dict:
        """
        生成ComfyUI工作流配置
        
        Args:
            config: 海报配置
            base_workflow: 基础工作流模板
            
        Returns:
            Dict: ComfyUI工作流配置
        """
        prompt_result = self.generate_prompt(config)
        
        ratio_info = self.poster_data.get("aspect_ratios", {}).get(config.aspect_ratio.value, {})
        
        # 如果没有提供基础工作流，创建一个默认的
        if base_workflow is None:
            base_workflow = self._create_default_workflow()
        
        # 替换工作流中的参数
        workflow = base_workflow.copy()
        
        # 更新提示词节点
        if "prompt_node" in workflow:
            workflow["prompt_node"]["inputs"]["text"] = prompt_result.en_prompt
        
        if "negative_prompt_node" in workflow:
            workflow["negative_prompt_node"]["inputs"]["text"] = "low quality, blurry, distorted, deformed"
        
        # 更新尺寸节点
        if "latent_image_node" in workflow:
            workflow["latent_image_node"]["inputs"]["width"] = ratio_info.get("width", 1024)
            workflow["latent_image_node"]["inputs"]["height"] = ratio_info.get("height", 576)
        
        # 添加元数据
        workflow["metadata"] = {
            "poster_config": prompt_result.config,
            "poster_metadata": prompt_result.metadata,
            "cn_prompt": prompt_result.cn_prompt,
            "en_prompt": prompt_result.en_prompt
        }
        
        return workflow
    
    def _create_default_workflow(self) -> Dict:
        """创建默认的ComfyUI工作流模板"""
        return {
            "prompt_node": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "",
                    "clip": ["clip_loader", 0]
                }
            },
            "negative_prompt_node": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "low quality, blurry",
                    "clip": ["clip_loader", 0]
                }
            },
            "latent_image_node": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": 1024,
                    "height": 576,
                    "batch_size": 1
                }
            },
            "sampler_node": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["model_loader", 0],
                    "positive": ["prompt_node", 0],
                    "negative": ["negative_prompt_node", 0],
                    "latent_image": ["latent_image_node", 0],
                    "seed": 0,
                    "steps": 25,
                    "cfg": 7.0,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1.0
                }
            },
            "vae_decode_node": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["sampler_node", 0],
                    "vae": ["vae_loader", 0]
                }
            },
            "save_node": {
                "class_type": "SaveImage",
                "inputs": {
                    "images": ["vae_decode_node", 0],
                    "filename_prefix": "poster"
                }
            }
        }
    
    def get_preset_configs(self) -> List[Dict]:
        """获取预设配置列表"""
        presets = []
        
        # 为每种海报类型创建预设
        for poster_type in PosterType:
            for level in [PosterLevel.LEVEL2, PosterLevel.LEVEL3]:
                preset = {
                    "id": f"{poster_type.value}_{level.value}",
                    "name": f"{self.poster_data['poster_types'][poster_type.value]['name']} - {self.poster_data['poster_levels'][level.value]['name']}",
                    "config": {
                        "poster_type": poster_type.value,
                        "level": level.value,
                        "layout": LayoutType.HERO.value if poster_type in [PosterType.CHARACTER, PosterType.DUO] else LayoutType.EPIC.value,
                        "aspect_ratio": AspectRatio.LANDSCAPE.value,
                        "lighting": ["cinematic", "volumetric"]
                    }
                }
                presets.append(preset)
        
        return presets


# 创建全局实例
poster_generator = PosterGenerator()


def get_poster_generator() -> PosterGenerator:
    """获取海报生成器实例"""
    return poster_generator
