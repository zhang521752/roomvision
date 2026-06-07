"""
CelMecha Studio - 场景自动生成器
Scene Auto-Generator: 500+ scene combinations from 8 dimensions

公式: Environment × Building × Prop × Time × Weather × Lighting × Camera × Style
8 × 7 × 6 × 6 × 6 × 5 × 7 × 4 = 846,720 potential combinations
Target: 500+ actual scenes with even distribution across ALL dimensions
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
    """加载场景维度库"""
    filepath = DATA_DIR / "scene_dimensions.json"
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_single_scene(
    env_item: Dict,
    building_item: Dict,
    prop_item: Dict,
    time_item: Dict,
    weather_item: Dict,
    lighting_item: Dict,
    camera_item: Dict,
    style_item: Dict,
    scene_name: Dict,
    index: int
) -> Dict[str, Any]:
    """生成单个场景"""
    
    # 生成ID
    scene_id = f"{env_item['id']}_{scene_name['en'].lower().replace(' ', '_')}_{index:03d}"
    
    # 生成名称
    name_cn = f"{scene_name['cn']}{index:02d}"
    name_en = f"{scene_name['en']} {index:02d}"
    
    # 生成中文Prompt
    prompt_cn = (
        f"{env_item['prompt_cn']}, "
        f"{building_item['prompt_cn']}, "
        f"{prop_item['prompt_cn']}, "
        f"{time_item['prompt_cn']}, "
        f"{weather_item['prompt_cn']}, "
        f"{lighting_item['prompt_cn']}, "
        f"{camera_item['prompt_cn']}, "
        f"{style_item['prompt_cn']}, "
        f"赛璐璐渲染, 工业机甲风格, 高级设定集, 电影光影"
    )
    
    # 生成英文Prompt
    prompt_en = (
        f"{env_item['prompt_en']}, "
        f"{building_item['prompt_en']}, "
        f"{prop_item['prompt_en']}, "
        f"{time_item['prompt_en']}, "
        f"{weather_item['prompt_en']}, "
        f"{lighting_item['prompt_en']}, "
        f"{camera_item['prompt_en']}, "
        f"{style_item['prompt_en']}, "
        f"cel-shaded rendering, industrial mecha style, premium concept art, cinematic lighting"
    )
    
    # 生成标签
    tags = list(set(
        env_item.get('tags', []) +
        building_item.get('tags', []) +
        prop_item.get('tags', []) +
        time_item.get('tags', []) +
        weather_item.get('tags', []) +
        lighting_item.get('tags', []) +
        camera_item.get('tags', []) +
        style_item.get('tags', []) +
        scene_name.get('tags', [])
    ))
    
    return {
        "id": scene_id,
        "name_cn": name_cn,
        "name_en": name_en,
        "prompt_cn": prompt_cn,
        "prompt_en": prompt_en,
        "tags": tags,
        "dimensions": {
            "environment": env_item['id'],
            "building": building_item['id'],
            "prop": prop_item['id'],
            "time": time_item['id'],
            "weather": weather_item['id'],
            "lighting": lighting_item['id'],
            "camera": camera_item['id'],
            "style": style_item['id']
        },
        "metadata": {
            "generated": True,
            "version": "1.0.0"
        }
    }


def generate_all_scenes(max_count: int = 500) -> List[Dict[str, Any]]:
    """生成所有场景组合，确保各维度均匀分布
    
    策略: 生成所有可能的组合，然后随机采样
    这样可以确保每个维度的值都有机会被选中
    """
    
    data = load_dimensions()
    dims = data['dimensions']
    scene_names = data['scene_names']
    
    environments = dims['environment']
    buildings = dims['building']
    props = dims['prop']
    times = dims['time']
    weathers = dims['weather']
    lightings = dims['lighting']
    cameras = dims['camera']
    styles = dims['style']
    
    # 生成所有可能的组合索引
    all_combinations = list(itertools.product(
        range(len(environments)),
        range(len(buildings)),
        range(len(props)),
        range(len(times)),
        range(len(weathers)),
        range(len(lightings)),
        range(len(cameras)),
        range(len(styles))
    ))
    
    # 随机打乱组合顺序，确保均匀分布
    random.seed(42)  # 固定种子以保证可重现性
    random.shuffle(all_combinations)
    
    # 取前max_count个组合
    selected_combinations = all_combinations[:max_count]
    
    scenes = []
    seen_ids = set()
    
    for idx, (env_idx, building_idx, prop_idx, time_idx, weather_idx, lighting_idx, camera_idx, style_idx) in enumerate(selected_combinations):
        env_item = environments[env_idx]
        building_item = buildings[building_idx]
        prop_item = props[prop_idx]
        time_item = times[time_idx]
        weather_item = weathers[weather_idx]
        lighting_item = lightings[lighting_idx]
        camera_item = cameras[camera_idx]
        style_item = styles[style_idx]
        
        # 获取场景名称
        env_names = scene_names.get(env_item['id'], [])
        if env_names:
            scene_name = env_names[idx % len(env_names)]
        else:
            scene_name = {"cn": "场景", "en": "Scene", "tags": []}
        
        # 生成索引
        global_index = idx + 1
        
        scene = generate_single_scene(
            env_item, building_item, prop_item,
            time_item, weather_item, lighting_item, camera_item, style_item,
            scene_name, global_index
        )
        
        if scene['id'] not in seen_ids:
            scenes.append(scene)
            seen_ids.add(scene['id'])
    
    return scenes


def generate_scenes_by_filter(
    environment_filter: Optional[str] = None,
    building_filter: Optional[str] = None,
    prop_filter: Optional[str] = None,
    time_filter: Optional[str] = None,
    weather_filter: Optional[str] = None,
    lighting_filter: Optional[str] = None,
    camera_filter: Optional[str] = None,
    style_filter: Optional[str] = None,
    max_count: int = 50
) -> List[Dict[str, Any]]:
    """根据筛选条件生成场景"""
    
    data = load_dimensions()
    dims = data['dimensions']
    scene_names = data['scene_names']
    
    # 筛选维度
    environments = [e for e in dims['environment'] if not environment_filter or e['id'] == environment_filter]
    buildings = [b for b in dims['building'] if not building_filter or b['id'] == building_filter]
    props = [p for p in dims['prop'] if not prop_filter or p['id'] == prop_filter]
    times = [t for t in dims['time'] if not time_filter or t['id'] == time_filter]
    weathers = [w for w in dims['weather'] if not weather_filter or w['id'] == weather_filter]
    lightings = [l for l in dims['lighting'] if not lighting_filter or l['id'] == lighting_filter]
    cameras = [c for c in dims['camera'] if not camera_filter or c['id'] == camera_filter]
    styles = [s for s in dims['style'] if not style_filter or s['id'] == style_filter]
    
    # 生成所有可能的组合
    all_combinations = list(itertools.product(
        range(len(environments)),
        range(len(buildings)),
        range(len(props)),
        range(len(times)),
        range(len(weathers)),
        range(len(lightings)),
        range(len(cameras)),
        range(len(styles))
    ))
    
    # 随机打乱
    random.seed(42)
    random.shuffle(all_combinations)
    
    scenes = []
    seen_ids = set()
    
    for idx, (env_idx, building_idx, prop_idx, time_idx, weather_idx, lighting_idx, camera_idx, style_idx) in enumerate(all_combinations):
        if len(scenes) >= max_count:
            break
        
        env_item = environments[env_idx]
        building_item = buildings[building_idx]
        prop_item = props[prop_idx]
        time_item = times[time_idx]
        weather_item = weathers[weather_idx]
        lighting_item = lightings[lighting_idx]
        camera_item = cameras[camera_idx]
        style_item = styles[style_idx]
        
        env_names = scene_names.get(env_item['id'], [])
        scene_name = env_names[idx % len(env_names)] if env_names else {"cn": "场景", "en": "Scene", "tags": []}
        
        global_index = idx + 1
        
        scene = generate_single_scene(
            env_item, building_item, prop_item,
            time_item, weather_item, lighting_item, camera_item, style_item,
            scene_name, global_index
        )
        
        if scene['id'] not in seen_ids:
            scenes.append(scene)
            seen_ids.add(scene['id'])
    
    return scenes[:max_count]


def save_generated_scenes(scenes: List[Dict[str, Any]]) -> str:
    """保存生成的场景到JSON文件"""
    filepath = DATA_DIR / "scene_generated.json"
    
    data = {
        "module": "scene_generated",
        "version": "1.0.0",
        "description": "自动生成的场景数据库",
        "description_en": "Auto-generated Scene Database",
        "total_count": len(scenes),
        "updated_at": "2026-05-31T19:30:00Z",
        "scenes": scenes
    }
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return str(filepath)


def get_statistics(scenes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """获取场景分布统计"""
    stats = {
        "total": len(scenes),
        "by_environment": {},
        "by_building": {},
        "by_prop": {},
        "by_time": {},
        "by_weather": {},
        "by_lighting": {},
        "by_camera": {},
        "by_style": {}
    }
    
    for scene in scenes:
        dims = scene.get('dimensions', {})
        
        for dim_name in ['environment', 'building', 'prop', 'time', 'weather', 'lighting', 'camera', 'style']:
            dim_value = dims.get(dim_name, 'unknown')
            key = f"by_{dim_name}"
            stats[key][dim_value] = stats[key].get(dim_value, 0) + 1
    
    return stats


if __name__ == "__main__":
    # 生成所有场景
    print("开始生成场景数据库...")
    scenes = generate_all_scenes(max_count=500)
    
    # 保存到文件
    filepath = save_generated_scenes(scenes)
    print(f"已保存 {len(scenes)} 个场景到: {filepath}")
    
    # 输出统计信息
    stats = get_statistics(scenes)
    print("\n=== 场景分布统计 ===")
    print(f"总数: {stats['total']}")
    
    print("\n按环境分布:")
    for k, v in sorted(stats['by_environment'].items()):
        print(f"  {k}: {v}")
    
    print("\n按建筑分布:")
    for k, v in sorted(stats['by_building'].items()):
        print(f"  {k}: {v}")
    
    print("\n按道具分布:")
    for k, v in sorted(stats['by_prop'].items()):
        print(f"  {k}: {v}")
    
    print("\n按时间分布:")
    for k, v in sorted(stats['by_time'].items()):
        print(f"  {k}: {v}")
    
    print("\n按天气分布:")
    for k, v in sorted(stats['by_weather'].items()):
        print(f"  {k}: {v}")
    
    print("\n按光影分布:")
    for k, v in sorted(stats['by_lighting'].items()):
        print(f"  {k}: {v}")
    
    print("\n按摄影机分布:")
    for k, v in sorted(stats['by_camera'].items()):
        print(f"  {k}: {v}")
    
    print("\n按风格分布:")
    for k, v in sorted(stats['by_style'].items()):
        print(f"  {k}: {v}")
    
    # 输出示例
    print("\n=== 示例场景 ===")
    for scene in scenes[:3]:
        print(f"\nID: {scene['id']}")
        print(f"名称: {scene['name_cn']} / {scene['name_en']}")
        print(f"中文Prompt: {scene['prompt_cn']}")
        print(f"英文Prompt: {scene['prompt_en']}")
        print(f"标签: {', '.join(scene['tags'][:5])}...")
