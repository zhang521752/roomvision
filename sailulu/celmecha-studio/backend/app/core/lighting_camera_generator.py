"""
CelMecha Studio - 光影与镜头自动生成器
Lighting & Camera Auto-Generator: 300+ combinations

结构:
- Image: Lighting × Composition × Camera = 6 × 4 × 8 = 192 combinations
- Video: Lighting × Video Camera = 6 × 7 = 42 combinations
Total: 234+ cinematic presets
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
    """加载光影镜头维度库"""
    filepath = DATA_DIR / "lighting_camera_dimensions.json"
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def generate_single_image_preset(
    lighting: Dict,
    composition: Dict,
    camera: Dict,
    index: int
) -> Dict[str, Any]:
    """生成单个图片光影镜头预设"""
    
    # 生成ID
    preset_id = f"img_{lighting['id']}_{camera['id']}_{index:03d}"
    
    # 生成名称
    name_cn = f"{lighting['name_cn']}{camera['name_cn']}{index:02d}"
    name_en = f"{lighting['name_en']} {camera['name_en']} {index:02d}"
    
    # 生成中文Prompt
    prompt_cn = (
        f"{lighting['prompt_cn']}, "
        f"{composition['prompt_cn']}, "
        f"{camera['prompt_cn']}, "
        f"赛璐璐渲染, "
        f"工业机甲风格, "
        f"高级动画设定集"
    )
    
    # 生成英文Prompt
    prompt_en = (
        f"{lighting['prompt_en']}, "
        f"{composition['prompt_en']}, "
        f"{camera['prompt_en']}, "
        f"cel-shaded rendering, "
        f"industrial mecha style, "
        f"premium animation artbook"
    )
    
    # 生成标签
    tags = list(set(
        lighting.get('tags', []) +
        composition.get('tags', []) +
        camera.get('tags', []) +
        ["image", "static", "cinematic"]
    ))
    
    return {
        "id": preset_id,
        "name_cn": name_cn,
        "name_en": name_en,
        "prompt_cn": prompt_cn,
        "prompt_en": prompt_en,
        "tags": tags,
        "type": "image",
        "dimensions": {
            "lighting": lighting['id'],
            "composition": composition['id'],
            "camera": camera['id']
        },
        "metadata": {
            "generated": True,
            "version": "1.0.0"
        }
    }


def generate_single_video_preset(
    lighting: Dict,
    video_camera: Dict,
    index: int
) -> Dict[str, Any]:
    """生成单个视频光影镜头预设"""
    
    # 生成ID
    preset_id = f"vid_{lighting['id']}_{video_camera['id']}_{index:03d}"
    
    # 生成名称
    name_cn = f"{lighting['name_cn']}{video_camera['name_cn']}{index:02d}"
    name_en = f"{lighting['name_en']} {video_camera['name_en']} {index:02d}"
    
    # 生成中文Prompt
    prompt_cn = (
        f"{lighting['prompt_cn']}, "
        f"{video_camera['prompt_cn']}, "
        f"赛璐璐渲染, "
        f"工业机甲风格, "
        f"高级动画设定集, "
        f"动态镜头"
    )
    
    # 生成英文Prompt
    prompt_en = (
        f"{lighting['prompt_en']}, "
        f"{video_camera['prompt_en']}, "
        f"cel-shaded rendering, "
        f"industrial mecha style, "
        f"premium animation artbook, "
        f"dynamic camera"
    )
    
    # 生成标签
    tags = list(set(
        lighting.get('tags', []) +
        video_camera.get('tags', []) +
        ["video", "motion", "cinematic"]
    ))
    
    return {
        "id": preset_id,
        "name_cn": name_cn,
        "name_en": name_en,
        "prompt_cn": prompt_cn,
        "prompt_en": prompt_en,
        "tags": tags,
        "type": "video",
        "dimensions": {
            "lighting": lighting['id'],
            "video_camera": video_camera['id']
        },
        "metadata": {
            "generated": True,
            "version": "1.0.0"
        }
    }


def generate_all_presets(max_count: int = 300) -> List[Dict[str, Any]]:
    """生成所有光影镜头预设"""
    
    data = load_dimensions()
    lightings = data['dimensions']['lighting']
    compositions = data['dimensions']['composition']
    cameras = data['dimensions']['camera']
    video_cameras = data['dimensions']['video_camera']
    
    presets = []
    seen_ids = set()
    
    # 生成图片预设: Lighting × Composition × Camera
    image_combinations = list(itertools.product(
        range(len(lightings)),
        range(len(compositions)),
        range(len(cameras))
    ))
    
    random.seed(42)
    random.shuffle(image_combinations)
    
    for idx, (light_idx, comp_idx, cam_idx) in enumerate(image_combinations):
        if len(presets) >= max_count * 0.8:  # 80% 图片预设
            break
        
        lighting = lightings[light_idx]
        composition = compositions[comp_idx]
        camera = cameras[cam_idx]
        
        global_index = len(presets) + 1
        preset = generate_single_image_preset(lighting, composition, camera, global_index)
        
        if preset['id'] not in seen_ids:
            presets.append(preset)
            seen_ids.add(preset['id'])
    
    # 生成视频预设: Lighting × Video Camera
    video_combinations = list(itertools.product(
        range(len(lightings)),
        range(len(video_cameras))
    ))
    
    random.shuffle(video_combinations)
    
    for idx, (light_idx, vid_idx) in enumerate(video_combinations):
        if len(presets) >= max_count:
            break
        
        lighting = lightings[light_idx]
        video_camera = video_cameras[vid_idx]
        
        global_index = len(presets) + 1
        preset = generate_single_video_preset(lighting, video_camera, global_index)
        
        if preset['id'] not in seen_ids:
            presets.append(preset)
            seen_ids.add(preset['id'])
    
    return presets


def generate_presets_by_filter(
    preset_type: Optional[str] = None,
    lighting_filter: Optional[str] = None,
    composition_filter: Optional[str] = None,
    camera_filter: Optional[str] = None,
    max_count: int = 50
) -> List[Dict[str, Any]]:
    """根据筛选条件生成光影镜头预设"""
    
    data = load_dimensions()
    lightings = [l for l in data['dimensions']['lighting'] if not lighting_filter or l['id'] == lighting_filter]
    compositions = [c for c in data['dimensions']['composition'] if not composition_filter or c['id'] == composition_filter]
    cameras = [cam for cam in data['dimensions']['camera'] if not camera_filter or cam['id'] == camera_filter]
    video_cameras = data['dimensions']['video_camera']
    
    presets = []
    seen_ids = set()
    
    # 图片预设
    if not preset_type or preset_type == "image":
        for lighting in lightings:
            for composition in compositions:
                for camera in cameras:
                    if len(presets) >= max_count:
                        break
                    
                    global_index = len(presets) + 1
                    preset = generate_single_image_preset(lighting, composition, camera, global_index)
                    
                    if preset['id'] not in seen_ids:
                        presets.append(preset)
                        seen_ids.add(preset['id'])
    
    # 视频预设
    if not preset_type or preset_type == "video":
        for lighting in lightings:
            for video_camera in video_cameras:
                if len(presets) >= max_count:
                    break
                
                global_index = len(presets) + 1
                preset = generate_single_video_preset(lighting, video_camera, global_index)
                
                if preset['id'] not in seen_ids:
                    presets.append(preset)
                    seen_ids.add(preset['id'])
    
    return presets[:max_count]


def save_generated_presets(presets: List[Dict[str, Any]]) -> str:
    """保存生成的光影镜头预设到JSON文件"""
    filepath = DATA_DIR / "lighting_camera_generated.json"
    
    data = {
        "module": "lighting_camera_generated",
        "version": "1.0.0",
        "description": "自动生成的光影镜头预设数据库",
        "description_en": "Auto-generated Lighting & Camera Preset Database",
        "total_count": len(presets),
        "updated_at": "2026-05-31T20:30:00Z",
        "presets": presets
    }
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return str(filepath)


def get_statistics(presets: List[Dict[str, Any]]) -> Dict[str, Any]:
    """获取光影镜头预设分布统计"""
    stats = {
        "total": len(presets),
        "by_type": {"image": 0, "video": 0},
        "by_lighting": {},
        "by_composition": {},
        "by_camera": {},
        "by_video_camera": {}
    }
    
    for preset in presets:
        preset_type = preset.get('type', 'unknown')
        stats['by_type'][preset_type] = stats['by_type'].get(preset_type, 0) + 1
        
        dims = preset.get('dimensions', {})
        
        if 'lighting' in dims:
            stats['by_lighting'][dims['lighting']] = stats['by_lighting'].get(dims['lighting'], 0) + 1
        
        if 'composition' in dims:
            stats['by_composition'][dims['composition']] = stats['by_composition'].get(dims['composition'], 0) + 1
        
        if 'camera' in dims:
            stats['by_camera'][dims['camera']] = stats['by_camera'].get(dims['camera'], 0) + 1
        
        if 'video_camera' in dims:
            stats['by_video_camera'][dims['video_camera']] = stats['by_video_camera'].get(dims['video_camera'], 0) + 1
    
    return stats


if __name__ == "__main__":
    # 生成所有预设
    print("开始生成光影镜头预设数据库...")
    presets = generate_all_presets(max_count=300)
    
    # 保存到文件
    filepath = save_generated_presets(presets)
    print(f"已保存 {len(presets)} 个光影镜头预设到: {filepath}")
    
    # 输出统计信息
    stats = get_statistics(presets)
    print("\n=== 光影镜头预设分布统计 ===")
    print(f"总数: {stats['total']}")
    
    print("\n按类型分布:")
    for k, v in sorted(stats['by_type'].items()):
        print(f"  {k}: {v}")
    
    print("\n按光影分布:")
    for k, v in sorted(stats['by_lighting'].items()):
        print(f"  {k}: {v}")
    
    print("\n按构图分布:")
    for k, v in sorted(stats['by_composition'].items()):
        print(f"  {k}: {v}")
    
    print("\n按镜头分布:")
    for k, v in sorted(stats['by_camera'].items()):
        print(f"  {k}: {v}")
    
    print("\n按视频镜头分布:")
    for k, v in sorted(stats['by_video_camera'].items()):
        print(f"  {k}: {v}")
    
    # 输出示例
    print("\n=== 示例光影镜头预设 ===")
    for preset in presets[:3]:
        print(f"\nID: {preset['id']}")
        print(f"类型: {preset['type']}")
        print(f"名称: {preset['name_cn']} / {preset['name_en']}")
        print(f"中文Prompt: {preset['prompt_cn']}")
        print(f"英文Prompt: {preset['prompt_en']}")
        print(f"标签: {', '.join(preset['tags'][:5])}...")
