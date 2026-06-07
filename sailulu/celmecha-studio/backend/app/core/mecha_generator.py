"""
CelMecha Studio - 机甲自动生成器
Mecha Auto-Generator: 200+ mecha combinations from 7 dimensions

公式: Type × Size × Power × Weapon × Color × Module × Style
5 × 5 × 5 × 6 × 5 × 5 × 4 = 15,000 potential combinations
Target: 200+ actual mecha with even distribution across ALL dimensions
"""

import json
import os
import itertools
import random
from typing import List, Dict, Any, Optional
from pathlib import Path

# 获取数据目录路径
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "prompts"


def load_dimensions() -> Dict[str, Any]:
    """加载机甲维度库"""
    filepath = DATA_DIR / "mecha_dimensions.json"
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_single_mecha(
    type_item: Dict,
    size_item: Dict,
    power_item: Dict,
    weapon_item: Dict,
    color_item: Dict,
    module_item: Dict,
    style_item: Dict,
    name_prefix: Dict,
    index: int
) -> Dict[str, Any]:
    """生成单个机甲"""
    
    # 生成ID
    mecha_id = f"{type_item['id']}_{size_item['id']}_{index:03d}"
    
    # 生成名称
    name_cn = f"{name_prefix['cn']}{size_item['name_cn']}{type_item['name_cn'].replace('机甲', '')}"
    name_en = f"{name_prefix['en']} {size_item['name_en']} {type_item['name_en'].replace(' Mecha', '')}"
    
    # 生成中文Prompt
    prompt_cn = (
        f"{type_item['prompt_cn']}, "
        f"{size_item['prompt_cn']}, "
        f"{power_item['prompt_cn']}, "
        f"{weapon_item['prompt_cn']}, "
        f"{color_item['prompt_cn']}, "
        f"{module_item['prompt_cn']}, "
        f"{style_item['prompt_cn']}, "
        f"赛璐璐渲染, 工业机甲风格, 高级设定集, 电影光影, 全身展示"
    )
    
    # 生成英文Prompt
    prompt_en = (
        f"{type_item['prompt_en']}, "
        f"{size_item['prompt_en']}, "
        f"{power_item['prompt_en']}, "
        f"{weapon_item['prompt_en']}, "
        f"{color_item['prompt_en']}, "
        f"{module_item['prompt_en']}, "
        f"{style_item['prompt_en']}, "
        f"cel-shaded rendering, industrial mecha style, premium concept art, cinematic lighting, full body showcase"
    )
    
    # 生成标签
    tags = list(set(
        type_item.get('tags', []) +
        size_item.get('tags', []) +
        power_item.get('tags', []) +
        weapon_item.get('tags', []) +
        color_item.get('tags', []) +
        module_item.get('tags', []) +
        style_item.get('tags', []) +
        name_prefix.get('tags', [])
    ))
    
    return {
        "id": mecha_id,
        "name_cn": name_cn,
        "name_en": name_en,
        "prompt_cn": prompt_cn,
        "prompt_en": prompt_en,
        "tags": tags,
        "dimensions": {
            "type": type_item['id'],
            "size": size_item['id'],
            "power": power_item['id'],
            "weapon": weapon_item['id'],
            "color": color_item['id'],
            "module": module_item['id'],
            "style": style_item['id']
        },
        "metadata": {
            "generated": True,
            "version": "1.0.0"
        }
    }


def generate_all_mechas(max_count: int = 250) -> List[Dict[str, Any]]:
    """生成所有机甲组合，确保各维度均匀分布
    
    策略: 生成所有可能的组合，然后随机采样
    这样可以确保每个维度的值都有机会被选中
    """
    
    data = load_dimensions()
    dims = data['dimensions']
    name_prefixes = data['name_prefixes']
    
    types = dims['type']
    sizes = dims['size']
    powers = dims['power']
    weapons = dims['weapon']
    colors = dims['color']
    modules = dims['module']
    styles = dims['style']
    
    # 生成所有可能的组合索引
    all_combinations = list(itertools.product(
        range(len(types)),
        range(len(sizes)),
        range(len(powers)),
        range(len(weapons)),
        range(len(colors)),
        range(len(modules)),
        range(len(styles))
    ))
    
    # 随机打乱组合顺序，确保均匀分布
    random.seed(42)  # 固定种子以保证可重现性
    random.shuffle(all_combinations)
    
    # 取前max_count个组合
    selected_combinations = all_combinations[:max_count]
    
    mechas = []
    seen_ids = set()
    
    for idx, (type_idx, size_idx, power_idx, weapon_idx, color_idx, module_idx, style_idx) in enumerate(selected_combinations):
        type_item = types[type_idx]
        size_item = sizes[size_idx]
        power_item = powers[power_idx]
        weapon_item = weapons[weapon_idx]
        color_item = colors[color_idx]
        module_item = modules[module_idx]
        style_item = styles[style_idx]
        
        # 获取名称前缀
        type_prefixes = name_prefixes.get(type_item['id'], [])
        if type_prefixes:
            name_prefix = type_prefixes[idx % len(type_prefixes)]
        else:
            name_prefix = {"cn": "机甲", "en": "Mecha", "tags": []}
        
        # 生成索引
        global_index = idx + 1
        
        mecha = generate_single_mecha(
            type_item, size_item, power_item,
            weapon_item, color_item, module_item, style_item,
            name_prefix, global_index
        )
        
        if mecha['id'] not in seen_ids:
            mechas.append(mecha)
            seen_ids.add(mecha['id'])
    
    return mechas


def generate_mechas_by_filter(
    type_filter: Optional[str] = None,
    size_filter: Optional[str] = None,
    power_filter: Optional[str] = None,
    weapon_filter: Optional[str] = None,
    color_filter: Optional[str] = None,
    module_filter: Optional[str] = None,
    style_filter: Optional[str] = None,
    max_count: int = 50
) -> List[Dict[str, Any]]:
    """根据筛选条件生成机甲"""
    
    data = load_dimensions()
    dims = data['dimensions']
    name_prefixes = data['name_prefixes']
    
    # 筛选维度
    types = [t for t in dims['type'] if not type_filter or t['id'] == type_filter]
    sizes = [s for s in dims['size'] if not size_filter or s['id'] == size_filter]
    powers = [p for p in dims['power'] if not power_filter or p['id'] == power_filter]
    weapons = [w for w in dims['weapon'] if not weapon_filter or w['id'] == weapon_filter]
    colors = [c for c in dims['color'] if not color_filter or c['id'] == color_filter]
    modules = [m for m in dims['module'] if not module_filter or m['id'] == module_filter]
    styles = [st for st in dims['style'] if not style_filter or st['id'] == style_filter]
    
    # 生成所有可能的组合
    all_combinations = list(itertools.product(
        range(len(types)),
        range(len(sizes)),
        range(len(powers)),
        range(len(weapons)),
        range(len(colors)),
        range(len(modules)),
        range(len(styles))
    ))
    
    # 随机打乱
    random.seed(42)
    random.shuffle(all_combinations)
    
    mechas = []
    seen_ids = set()
    
    for idx, (type_idx, size_idx, power_idx, weapon_idx, color_idx, module_idx, style_idx) in enumerate(all_combinations):
        if len(mechas) >= max_count:
            break
        
        type_item = types[type_idx]
        size_item = sizes[size_idx]
        power_item = powers[power_idx]
        weapon_item = weapons[weapon_idx]
        color_item = colors[color_idx]
        module_item = modules[module_idx]
        style_item = styles[style_idx]
        
        type_prefixes = name_prefixes.get(type_item['id'], [])
        name_prefix = type_prefixes[idx % len(type_prefixes)] if type_prefixes else {"cn": "机甲", "en": "Mecha", "tags": []}
        
        global_index = idx + 1
        
        mecha = generate_single_mecha(
            type_item, size_item, power_item,
            weapon_item, color_item, module_item, style_item,
            name_prefix, global_index
        )
        
        if mecha['id'] not in seen_ids:
            mechas.append(mecha)
            seen_ids.add(mecha['id'])
    
    return mechas[:max_count]


def save_generated_mechas(mechas: List[Dict[str, Any]]) -> str:
    """保存生成的机甲到JSON文件"""
    filepath = DATA_DIR / "mecha_generated.json"
    
    data = {
        "module": "mecha_generated",
        "version": "1.0.0",
        "description": "自动生成的机甲数据库",
        "description_en": "Auto-generated Mecha Database",
        "total_count": len(mechas),
        "updated_at": "2026-05-31T19:00:00Z",
        "mechas": mechas
    }
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return str(filepath)


def get_statistics(mechas: List[Dict[str, Any]]) -> Dict[str, Any]:
    """获取机甲分布统计"""
    stats = {
        "total": len(mechas),
        "by_type": {},
        "by_size": {},
        "by_power": {},
        "by_weapon": {},
        "by_color": {},
        "by_module": {},
        "by_style": {}
    }
    
    for mecha in mechas:
        dims = mecha.get('dimensions', {})
        
        for dim_name in ['type', 'size', 'power', 'weapon', 'color', 'module', 'style']:
            dim_value = dims.get(dim_name, 'unknown')
            key = f"by_{dim_name}"
            stats[key][dim_value] = stats[key].get(dim_value, 0) + 1
    
    return stats


if __name__ == "__main__":
    # 生成所有机甲
    print("开始生成机甲数据库...")
    mechas = generate_all_mechas(max_count=250)
    
    # 保存到文件
    filepath = save_generated_mechas(mechas)
    print(f"已保存 {len(mechas)} 个机甲到: {filepath}")
    
    # 输出统计信息
    stats = get_statistics(mechas)
    print("\n=== 机甲分布统计 ===")
    print(f"总数: {stats['total']}")
    
    print("\n按类型分布:")
    for k, v in sorted(stats['by_type'].items()):
        print(f"  {k}: {v}")
    
    print("\n按体型分布:")
    for k, v in sorted(stats['by_size'].items()):
        print(f"  {k}: {v}")
    
    print("\n按能源分布:")
    for k, v in sorted(stats['by_power'].items()):
        print(f"  {k}: {v}")
    
    print("\n按武器分布:")
    for k, v in sorted(stats['by_weapon'].items()):
        print(f"  {k}: {v}")
    
    print("\n按色彩分布:")
    for k, v in sorted(stats['by_color'].items()):
        print(f"  {k}: {v}")
    
    print("\n按模块分布:")
    for k, v in sorted(stats['by_module'].items()):
        print(f"  {k}: {v}")
    
    print("\n按风格分布:")
    for k, v in sorted(stats['by_style'].items()):
        print(f"  {k}: {v}")
    
    # 输出示例
    print("\n=== 示例机甲 ===")
    for mecha in mechas[:3]:
        print(f"\nID: {mecha['id']}")
        print(f"名称: {mecha['name_cn']} / {mecha['name_en']}")
        print(f"中文Prompt: {mecha['prompt_cn']}")
        print(f"英文Prompt: {mecha['prompt_en']}")
        print(f"标签: {', '.join(mecha['tags'][:5])}...")
