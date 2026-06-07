"""
CelMecha Studio - 风格锁定引擎
Style Lock Engine: 确保所有生成内容的一致性

核心功能:
1. 自动注入风格核心 (Style Core)
2. 角色锁定 (Character Lock)
3. 机甲锁定 (Mecha Lock)
4. 颜色锁定 (Color Lock)
5. 世界观锁定 (World Lock)
6. 材质锁定 (Material Lock)
7. 品质锁定 (Quality Lock)
8. 负面提示词 (Negative Prompt)
"""

import json
import os
from typing import Dict, Any, Optional, List
from pathlib import Path

# 获取数据目录路径
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "prompts"


def load_style_lock() -> Dict[str, Any]:
    """加载风格锁定配置"""
    filepath = DATA_DIR / "style_lock.json"
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


class StyleLockEngine:
    """风格锁定引擎"""
    
    def __init__(self):
        self.config = load_style_lock()
        self.style_core = self.config['style_core']
        self.locks = self.config['locks']
        self.negative_prompt = self.config['negative_prompt']
    
    def get_style_core(self, language: str = 'both') -> Dict[str, str]:
        """获取风格核心"""
        if language == 'cn':
            return {"cn": self.style_core['cn']}
        elif language == 'en':
            return {"en": self.style_core['en']}
        else:
            return {
                "cn": self.style_core['cn'],
                "en": self.style_core['en']
            }
    
    def get_style_core_prompt(self, language: str = 'cn') -> str:
        """获取风格核心提示词"""
        return self.style_core.get(language, self.style_core['cn'])
    
    def get_style_core_weight(self) -> float:
        """获取风格核心权重"""
        return self.style_core.get('weight', 1.5)
    
    def get_negative_prompt(self, language: str = 'cn') -> str:
        """获取负面提示词"""
        return self.negative_prompt.get(language, self.negative_prompt['cn'])
    
    def get_character_consistency_block(self, language: str = 'cn') -> str:
        """获取角色一致性模块"""
        lock = self.locks.get('character_lock', {})
        block = lock.get('consistency_block', {})
        return block.get(language, block.get('cn', ''))
    
    def get_world_building_prompt(self, language: str = 'cn') -> str:
        """获取世界观提示词"""
        lock = self.locks.get('world_lock', {})
        return lock.get(f'prompt_{language}', lock.get('prompt_cn', ''))
    
    def get_material_prompt(self, language: str = 'cn') -> str:
        """获取材质提示词"""
        lock = self.locks.get('material_lock', {})
        return lock.get(f'prompt_{language}', lock.get('prompt_cn', ''))
    
    def get_faction_color_prompt(self, faction: str, language: str = 'cn') -> str:
        """获取阵营颜色提示词"""
        color_lock = self.locks.get('color_lock', {})
        factions = color_lock.get('factions', {})
        faction_data = factions.get(faction, {})
        return faction_data.get(f'prompt_{language}', faction_data.get('prompt_cn', ''))
    
    def get_quality_requirements(self, language: str = 'cn') -> List[str]:
        """获取品质要求"""
        quality_lock = self.locks.get('quality_lock', {})
        required = quality_lock.get('required', [])
        return [item.get(language, item.get('cn', '')) for item in required]
    
    def get_quality_forbidden(self, language: str = 'cn') -> List[str]:
        """获取禁止项"""
        quality_lock = self.locks.get('quality_lock', {})
        forbidden = quality_lock.get('forbidden', [])
        return [item.get(language, item.get('cn', '')) for item in forbidden]
    
    def inject_style(
        self,
        prompt: str,
        language: str = 'cn',
        include_character_lock: bool = False,
        include_mecha_lock: bool = False,
        include_world_lock: bool = True,
        include_material_lock: bool = True,
        include_quality_lock: bool = True,
        include_negative: bool = True,
        faction: Optional[str] = None
    ) -> Dict[str, str]:
        """
        注入风格锁定到提示词
        
        Args:
            prompt: 原始提示词
            language: 语言 (cn/en)
            include_character_lock: 是否包含角色锁定
            include_mecha_lock: 是否包含机甲锁定
            include_world_lock: 是否包含世界观锁定
            include_material_lock: 是否包含材质锁定
            include_quality_lock: 是否包含品质锁定
            include_negative: 是否包含负面提示词
            faction: 阵营 (military/research/corporate/relic)
        
        Returns:
            包含注入后提示词的字典
        """
        # 风格核心（必选）
        style_core = self.get_style_core_prompt(language)
        
        # 构建各部分
        parts = [style_core, prompt]
        
        # 角色锁定
        if include_character_lock:
            character_consistency = self.get_character_consistency_block(language)
            if character_consistency:
                parts.append(character_consistency)
        
        # 世界观锁定
        if include_world_lock:
            world_prompt = self.get_world_building_prompt(language)
            if world_prompt:
                parts.append(world_prompt)
        
        # 材质锁定
        if include_material_lock:
            material_prompt = self.get_material_prompt(language)
            if material_prompt:
                parts.append(material_prompt)
        
        # 阵营颜色
        if faction:
            faction_prompt = self.get_faction_color_prompt(faction, language)
            if faction_prompt:
                parts.append(faction_prompt)
        
        # 品质要求
        if include_quality_lock:
            quality_reqs = self.get_quality_requirements(language)
            if quality_reqs:
                parts.extend(quality_reqs)
        
        # 组合提示词
        if language == 'cn':
            separator = '，'
        else:
            separator = ', '
        
        injected_prompt = separator.join([p for p in parts if p])
        
        # 构建带权重的提示词
        weight = self.get_style_core_weight()
        if language == 'en':
            weighted_prompt = f"({style_core}:{weight}), {prompt}"
        else:
            weighted_prompt = f"({style_core}:{weight})，{prompt}"
        
        result = {
            f"prompt_{language}": injected_prompt,
            f"prompt_weighted_{language}": weighted_prompt,
            "style_core": style_core,
            "style_core_weight": weight
        }
        
        # 负面提示词
        if include_negative:
            negative = self.get_negative_prompt(language)
            result[f"negative_prompt_{language}"] = negative
        
        return result
    
    def inject_for_character(
        self,
        prompt: str,
        language: str = 'cn',
        faction: Optional[str] = None
    ) -> Dict[str, str]:
        """为角色生成注入风格"""
        return self.inject_style(
            prompt=prompt,
            language=language,
            include_character_lock=True,
            include_mecha_lock=False,
            include_world_lock=True,
            include_material_lock=True,
            include_quality_lock=True,
            include_negative=True,
            faction=faction
        )
    
    def inject_for_mecha(
        self,
        prompt: str,
        language: str = 'cn',
        faction: Optional[str] = None
    ) -> Dict[str, str]:
        """为机甲生成注入风格"""
        return self.inject_style(
            prompt=prompt,
            language=language,
            include_character_lock=False,
            include_mecha_lock=True,
            include_world_lock=True,
            include_material_lock=True,
            include_quality_lock=True,
            include_negative=True,
            faction=faction
        )
    
    def inject_for_scene(
        self,
        prompt: str,
        language: str = 'cn'
    ) -> Dict[str, str]:
        """为场景生成注入风格"""
        return self.inject_style(
            prompt=prompt,
            language=language,
            include_character_lock=False,
            include_mecha_lock=False,
            include_world_lock=True,
            include_material_lock=True,
            include_quality_lock=True,
            include_negative=True,
            faction=None
        )
    
    def inject_for_identity_sheet(
        self,
        prompt: str,
        language: str = 'cn',
        character_name: Optional[str] = None
    ) -> Dict[str, str]:
        """为身份板生成注入风格"""
        # 角色一致性模块特别重要
        result = self.inject_style(
            prompt=prompt,
            language=language,
            include_character_lock=True,
            include_mecha_lock=False,
            include_world_lock=True,
            include_material_lock=True,
            include_quality_lock=True,
            include_negative=True,
            faction=None
        )
        
        # 添加身份板特定要求
        if language == 'cn':
            result['identity_sheet_requirements'] = "官方设定集风格，多视图展示，表情研究，轮廓清晰，身份特征明确"
        else:
            result['identity_sheet_requirements'] = "official artbook style, multi-view showcase, expression study, clear silhouette, distinct identity features"
        
        return result


# 全局实例
_style_lock_engine = None


def get_style_lock_engine() -> StyleLockEngine:
    """获取风格锁定引擎单例"""
    global _style_lock_engine
    if _style_lock_engine is None:
        _style_lock_engine = StyleLockEngine()
    return _style_lock_engine


def inject_style_core(prompt: str, language: str = 'cn') -> str:
    """快速注入风格核心"""
    engine = get_style_lock_engine()
    style_core = engine.get_style_core_prompt(language)
    
    if language == 'cn':
        return f"{style_core}，{prompt}"
    else:
        return f"{style_core}, {prompt}"


def get_full_style_prompt(
    prompt: str,
    content_type: str = 'general',
    language: str = 'cn',
    faction: Optional[str] = None
) -> Dict[str, str]:
    """
    获取完整的风格化提示词
    
    Args:
        prompt: 原始提示词
        content_type: 内容类型 (character/mecha/scene/identity_sheet/general)
        language: 语言 (cn/en)
        faction: 阵营
    
    Returns:
        风格化后的提示词字典
    """
    engine = get_style_lock_engine()
    
    if content_type == 'character':
        return engine.inject_for_character(prompt, language, faction)
    elif content_type == 'mecha':
        return engine.inject_for_mecha(prompt, language, faction)
    elif content_type == 'scene':
        return engine.inject_for_scene(prompt, language)
    elif content_type == 'identity_sheet':
        return engine.inject_for_identity_sheet(prompt, language)
    else:
        return engine.inject_style(prompt, language, faction=faction)


if __name__ == "__main__":
    # 测试风格锁定引擎
    engine = StyleLockEngine()
    
    print("=== 风格锁定引擎测试 ===\n")
    
    # 测试风格核心
    print("1. 风格核心:")
    print(f"   中文: {engine.get_style_core_prompt('cn')[:50]}...")
    print(f"   英文: {engine.get_style_core_prompt('en')[:50]}...")
    print(f"   权重: {engine.get_style_core_weight()}")
    
    # 测试负面提示词
    print("\n2. 负面提示词:")
    print(f"   中文: {engine.get_negative_prompt('cn')}")
    print(f"   英文: {engine.get_negative_prompt('en')}")
    
    # 测试角色注入
    print("\n3. 角色生成注入测试:")
    result = engine.inject_for_character("少女，长发，蓝色眼睛", "cn", "research")
    print(f"   注入后: {result['prompt_cn'][:80]}...")
    
    # 测试机甲注入
    print("\n4. 机甲生成注入测试:")
    result = engine.inject_for_mecha("人形机甲，重型，核能", "cn", "military")
    print(f"   注入后: {result['prompt_cn'][:80]}...")
    
    # 测试场景注入
    print("\n5. 场景生成注入测试:")
    result = engine.inject_for_scene("城市，夜晚，霓虹灯光", "cn")
    print(f"   注入后: {result['prompt_cn'][:80]}...")
    
    # 测试阵营颜色
    print("\n6. 阵营颜色:")
    for faction in ['military', 'research', 'corporate', 'relic']:
        print(f"   {faction}: {engine.get_faction_color_prompt(faction, 'cn')}")
    
    print("\n=== 测试完成 ===")
