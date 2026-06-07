"""
CelMecha Studio - 道具自动生成器
Prop Auto-Generator: 300+ prop combinations from category × variation

结构: Category × Item × Style
6 categories × 4-7 items each × style variations = 300+ props
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
    """加载道具维度库"""
    filepath = DATA_DIR / "prop_dimensions.json"
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_single_prop(
    category: Dict,
    item: Dict,
    variation_index: int
) -> Dict[str, Any]:
    """生成单个道具"""
    
    # 生成ID
    prop_id = f"{item['id']}_{variation_index:03d}"
    
    # 生成名称
    name_cn = f"{item['name_cn']}{variation_index:02d}"
    name_en = f"{item['name_en']} {variation_index:02d}"
    
    # 生成中文Prompt
    prompt_cn = (
        f"{category['name_cn']}, "
        f"{item['prompt_cn']}, "
        f"高科技工业道具, "
        f"赛璐璐渲染, "
        f"工业机甲风格, "
        f"高级设定集风格, "
        f"电影光影"
    )
    
    # 生成英文Prompt
    prompt_en = (
        f"{category['name_en']}, "
        f"{item['prompt_en']}, "
        f"high-tech industrial prop, "
        f"cel-shaded rendering, "
        f"industrial mecha style, "
        f"premium concept art style, "
        f"cinematic lighting"
    )
    
    # 生成标签
    tags = list(set(
        category.get('tags', []) +
        item.get('tags', []) +
        ["prop", "industrial", "mecha-world"]
    ))
    
    return {
        "id": prop_id,
        "name_cn": name_cn,
        "name_en": name_en,
        "prompt_cn": prompt_cn,
        "prompt_en": prompt_en,
        "tags": tags,
        "category": category['id'],
        "item_type": item['id'],
        "metadata": {
            "generated": True,
            "version": "1.0.0"
        }
    }


def generate_all_props(max_count: int = 300) -> List[Dict[str, Any]]:
    """生成所有道具组合"""
    
    data = load_dimensions()
    categories = data['dimensions']['category']
    items_map = data['dimensions']['items']
    
    props = []
    seen_ids = set()
    
    # 计算每个类别应分配的数量
    props_per_category = max_count // len(categories)
    
    for category in categories:
        category_id = category['id']
        items = items_map.get(category_id, [])
        
        if not items:
            continue
        
        # 每个道具生成多个变体
        variations_per_item = max(1, props_per_category // len(items))
        
        for item in items:
            for var_idx in range(variations_per_item):
                if len(props) >= max_count:
                    break
                
                variation_index = len([p for p in props if p['item_type'] == item['id']]) + 1
                
                prop = generate_single_prop(category, item, variation_index)
                
                if prop['id'] not in seen_ids:
                    props.append(prop)
                    seen_ids.add(prop['id'])
            
            if len(props) >= max_count:
                break
    
    return props


def generate_props_by_filter(
    category_filter: Optional[str] = None,
    max_count: int = 50
) -> List[Dict[str, Any]]:
    """根据筛选条件生成道具"""
    
    data = load_dimensions()
    categories = data['dimensions']['category']
    items_map = data['dimensions']['items']
    
    # 筛选类别
    if category_filter:
        categories = [c for c in categories if c['id'] == category_filter]
    
    props = []
    seen_ids = set()
    
    for category in categories:
        category_id = category['id']
        items = items_map.get(category_id, [])
        
        for item in items:
            if len(props) >= max_count:
                break
            
            variation_index = len([p for p in props if p['item_type'] == item['id']]) + 1
            
            prop = generate_single_prop(category, item, variation_index)
            
            if prop['id'] not in seen_ids:
                props.append(prop)
                seen_ids.add(prop['id'])
    
    return props[:max_count]


def save_generated_props(props: List[Dict[str, Any]]) -> str:
    """保存生成的道具到JSON文件"""
    filepath = DATA_DIR / "prop_generated.json"
    
    data = {
        "module": "prop_generated",
        "version": "1.0.0",
        "description": "自动生成的道具数据库",
        "description_en": "Auto-generated Prop Database",
        "total_count": len(props),
        "updated_at": "2026-05-31T20:00:00Z",
        "props": props
    }
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return str(filepath)


def get_statistics(props: List[Dict[str, Any]]) -> Dict[str, Any]:
    """获取道具分布统计"""
    stats = {
        "total": len(props),
        "by_category": {},
        "by_item_type": {}
    }
    
    for prop in props:
        category = prop.get('category', 'unknown')
        item_type = prop.get('item_type', 'unknown')
        
        stats['by_category'][category] = stats['by_category'].get(category, 0) + 1
        stats['by_item_type'][item_type] = stats['by_item_type'].get(item_type, 0) + 1
    
    return stats


if __name__ == "__main__":
    # 生成所有道具
    print("开始生成道具数据库...")
    props = generate_all_props(max_count=300)
    
    # 保存到文件
    filepath = save_generated_props(props)
    print(f"已保存 {len(props)} 个道具到: {filepath}")
    
    # 输出统计信息
    stats = get_statistics(props)
    print("\n=== 道具分布统计 ===")
    print(f"总数: {stats['total']}")
    
    print("\n按类别分布:")
    for k, v in sorted(stats['by_category'].items()):
        print(f"  {k}: {v}")
    
    print("\n按道具类型分布:")
    for k, v in sorted(stats['by_item_type'].items()):
        print(f"  {k}: {v}")
    
    # 输出示例
    print("\n=== 示例道具 ===")
    for prop in props[:3]:
        print(f"\nID: {prop['id']}")
        print(f"名称: {prop['name_cn']} / {prop['name_en']}")
        print(f"中文Prompt: {prop['prompt_cn']}")
        print(f"英文Prompt: {prop['prompt_en']}")
        print(f"标签: {', '.join(prop['tags'][:5])}...")
