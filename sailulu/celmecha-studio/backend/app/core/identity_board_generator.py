"""
CelMecha Studio - 身份板自动生成器
Identity Board Auto-Generator: 100+ board configurations

结构:
- Board Type × Level × Layout = 8 × 4 × 4 = 128 configurations
Each configuration includes specific views and studies
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
    """加载身份板维度库"""
    filepath = DATA_DIR / "identity_board_dimensions.json"
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_views_for_board_type(board_type: str, data: Dict[str, Any]) -> List[Dict]:
    """根据身份板类型获取视图列表"""
    views = data.get('views', {})
    
    if board_type in ['character_identity', 'expression', 'silhouette', 'costume', 'ai_training', 'video_character']:
        return views.get('character', [])
    elif board_type == 'mecha_identity':
        return views.get('mecha', [])
    elif board_type == 'character_mecha':
        # 组合板包含角色和机甲视图
        character_views = views.get('character', [])[:4]  # 前4个角色视图
        mecha_views = views.get('mecha', [])[:4]  # 前4个机甲视图
        return character_views + mecha_views
    else:
        return views.get('character', [])


def get_studies_for_board_type(board_type: str, data: Dict[str, Any]) -> List[Dict]:
    """根据身份板类型获取研究板列表"""
    studies = data.get('studies', {})
    
    if board_type == 'character_identity':
        return studies.get('expressions', []) + studies.get('costume', [])
    elif board_type == 'expression':
        return studies.get('expressions', [])
    elif board_type == 'costume':
        return studies.get('costume', [])
    elif board_type == 'ai_training':
        return studies.get('expressions', []) + studies.get('costume', [])
    elif board_type == 'video_character':
        return studies.get('expressions', [])
    else:
        return studies.get('expressions', [])[:3]


def get_views_count_for_level(level: str) -> int:
    """根据等级获取视图数量"""
    level_counts = {
        'level_1': 3,
        'level_2': 5,
        'level_3': 8,
        'level_4': 12
    }
    return level_counts.get(level, 5)


def generate_single_board(
    board_type: Dict,
    level: Dict,
    layout: Dict,
    index: int
) -> Dict[str, Any]:
    """生成单个身份板配置"""
    
    # 生成ID
    board_id = f"{board_type['id']}_{level['id']}_{layout['id']}_{index:03d}"
    
    # 生成名称
    name_cn = f"{board_type['name_cn']}{level['name_cn']}{layout['name_cn']}{index:02d}"
    name_en = f"{board_type['name_en']} {level['name_en']} {layout['name_en']} {index:02d}"
    
    # 获取视图数量
    views_count = get_views_count_for_level(level['id'])
    
    # 生成中文Prompt
    prompt_cn = (
        f"{board_type['name_cn']}，"
        f"{level['name_cn']}，"
        f"{layout['prompt_cn']}，"
        f"包含{views_count}个视图，"
        f"16:9比例，"
        f"纯白背景，"
        f"高级动画设定集风格，"
        f"电影级光影，"
        f"赛璐璐渲染，"
        f"工业机甲风格，"
        f"大量留白，"
        f"艺术化布局，"
        f"高级排版，"
        f"角色ID区块，"
        f"视觉标识"
    )
    
    # 生成英文Prompt
    prompt_en = (
        f"{board_type['name_en']}, "
        f"{level['name_en']}, "
        f"{layout['prompt_en']}, "
        f"includes {views_count} views, "
        f"16:9 aspect ratio, "
        f"clean white background, "
        f"premium animation artbook style, "
        f"cinematic lighting, "
        f"cel-shaded rendering, "
        f"industrial mecha style, "
        f"elegant negative space, "
        f"artistic layout, "
        f"premium editorial design, "
        f"character ID block, "
        f"visual emblem"
    )
    
    # 生成标签
    tags = list(set(
        board_type.get('tags', []) +
        level.get('tags', []) +
        layout.get('tags', []) +
        ["identity_board", "character_design", "artbook"]
    ))
    
    return {
        "id": board_id,
        "name_cn": name_cn,
        "name_en": name_en,
        "prompt_cn": prompt_cn,
        "prompt_en": prompt_en,
        "tags": tags,
        "board_type": board_type['id'],
        "level": level['id'],
        "layout": layout['id'],
        "views_count": views_count,
        "metadata": {
            "generated": True,
            "version": "1.0.0"
        }
    }


def generate_all_boards(max_count: int = 128) -> List[Dict[str, Any]]:
    """生成所有身份板配置"""
    
    data = load_dimensions()
    board_types = data['board_types']
    levels = data['levels']
    layouts = data['layouts']
    
    boards = []
    seen_ids = set()
    
    # 生成所有组合
    all_combinations = list(itertools.product(
        range(len(board_types)),
        range(len(levels)),
        range(len(layouts))
    ))
    
    random.seed(42)
    random.shuffle(all_combinations)
    
    for idx, (bt_idx, level_idx, layout_idx) in enumerate(all_combinations):
        if len(boards) >= max_count:
            break
        
        board_type = board_types[bt_idx]
        level = levels[level_idx]
        layout = layouts[layout_idx]
        
        global_index = len(boards) + 1
        board = generate_single_board(board_type, level, layout, global_index)
        
        if board['id'] not in seen_ids:
            boards.append(board)
            seen_ids.add(board['id'])
    
    return boards


def generate_boards_by_filter(
    board_type_filter: Optional[str] = None,
    level_filter: Optional[str] = None,
    layout_filter: Optional[str] = None,
    max_count: int = 20
) -> List[Dict[str, Any]]:
    """根据筛选条件生成身份板"""
    
    data = load_dimensions()
    board_types = [bt for bt in data['board_types'] if not board_type_filter or bt['id'] == board_type_filter]
    levels = [l for l in data['levels'] if not level_filter or l['id'] == level_filter]
    layouts = [la for la in data['layouts'] if not layout_filter or la['id'] == layout_filter]
    
    boards = []
    seen_ids = set()
    
    for board_type in board_types:
        for level in levels:
            for layout in layouts:
                if len(boards) >= max_count:
                    break
                
                global_index = len(boards) + 1
                board = generate_single_board(board_type, level, layout, global_index)
                
                if board['id'] not in seen_ids:
                    boards.append(board)
                    seen_ids.add(board['id'])
            
            if len(boards) >= max_count:
                break
        if len(boards) >= max_count:
            break
    
    return boards[:max_count]


def get_board_template(
    board_type: str,
    level: str,
    data: Dict[str, Any]
) -> Dict[str, Any]:
    """获取身份板模板，包含视图和研究板"""
    
    views = get_views_for_board_type(board_type, data)
    studies = get_studies_for_board_type(board_type, data)
    views_count = get_views_count_for_level(level)
    
    # 根据等级选择视图
    selected_views = views[:min(views_count, len(views))]
    
    return {
        "board_type": board_type,
        "level": level,
        "views": [{"id": v['id'], "name_cn": v['name_cn'], "name_en": v['name_en']} for v in selected_views],
        "studies": [{"id": s['id'], "name_cn": s['name_cn'], "name_en": s['name_en']} for s in studies[:5]],
        "total_elements": len(selected_views) + min(5, len(studies))
    }


def save_generated_boards(boards: List[Dict[str, Any]]) -> str:
    """保存生成的身份板到JSON文件"""
    filepath = DATA_DIR / "identity_board_generated.json"
    
    data = {
        "module": "identity_board_generated",
        "version": "1.0.0",
        "description": "自动生成的身份板配置数据库",
        "description_en": "Auto-generated Identity Board Configuration Database",
        "total_count": len(boards),
        "updated_at": "2026-05-31T21:30:00Z",
        "boards": boards
    }
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return str(filepath)


def get_statistics(boards: List[Dict[str, Any]]) -> Dict[str, Any]:
    """获取身份板分布统计"""
    stats = {
        "total": len(boards),
        "by_board_type": {},
        "by_level": {},
        "by_layout": {}
    }
    
    for board in boards:
        board_type = board.get('board_type', 'unknown')
        level = board.get('level', 'unknown')
        layout = board.get('layout', 'unknown')
        
        stats['by_board_type'][board_type] = stats['by_board_type'].get(board_type, 0) + 1
        stats['by_level'][level] = stats['by_level'].get(level, 0) + 1
        stats['by_layout'][layout] = stats['by_layout'].get(layout, 0) + 1
    
    return stats


if __name__ == "__main__":
    # 生成所有身份板
    print("开始生成身份板配置数据库...")
    boards = generate_all_boards(max_count=128)
    
    # 保存到文件
    filepath = save_generated_boards(boards)
    print(f"已保存 {len(boards)} 个身份板配置到: {filepath}")
    
    # 输出统计信息
    stats = get_statistics(boards)
    print("\n=== 身份板分布统计 ===")
    print(f"总数: {stats['total']}")
    
    print("\n按类型分布:")
    for k, v in sorted(stats['by_board_type'].items()):
        print(f"  {k}: {v}")
    
    print("\n按等级分布:")
    for k, v in sorted(stats['by_level'].items()):
        print(f"  {k}: {v}")
    
    print("\n按布局分布:")
    for k, v in sorted(stats['by_layout'].items()):
        print(f"  {k}: {v}")
    
    # 输出示例
    print("\n=== 示例身份板 ===")
    for board in boards[:3]:
        print(f"\nID: {board['id']}")
        print(f"名称: {board['name_cn']} / {board['name_en']}")
        print(f"视图数量: {board['views_count']}")
        print(f"中文Prompt: {board['prompt_cn'][:80]}...")
        print(f"英文Prompt: {board['prompt_en'][:80]}...")
    
    # 测试模板生成
    print("\n=== 模板测试 ===")
    data = load_dimensions()
    template = get_board_template('character_identity', 'level_3', data)
    print(f"角色身份板 Level 3 模板:")
    print(f"  视图: {[v['name_cn'] for v in template['views']]}")
    print(f"  研究板: {[s['name_cn'] for s in template['studies']]}")
    print(f"  总元素数: {template['total_elements']}")
