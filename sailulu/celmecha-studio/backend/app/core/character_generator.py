"""
CelMecha Studio - Character Generator
角色自动生成器 - 通过维度组合生成300+角色
"""

import json
import os
import itertools
from typing import List, Dict, Any

# 数据目录路径
PROMPTS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "prompts")


def load_dimensions() -> Dict[str, Any]:
    """加载角色维度库"""
    file_path = os.path.join(PROMPTS_PATH, "character_dimensions.json")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_character_id(age: str, gender: str, occupation: str, personality: str, faction: str) -> str:
    """生成角色ID"""
    return f"char_{age}_{gender}_{occupation}_{personality}_{faction}"


def generate_character_name_cn(age: str, gender: str, occupation: str, faction: str) -> str:
    """生成中文角色名称"""
    age_names = {
        "child": "少年",
        "teen": "青年",
        "young_adult": "",
        "adult": "",
        "senior": "老"
    }
    
    gender_names = {
        "male": "",
        "female": "女",
        "neutral": ""
    }
    
    occupation_names = {
        "pilot": "驾驶员",
        "commander": "指挥官",
        "researcher": "科研员",
        "soldier": "战士",
        "engineer": "工程师",
        "assassin": "刺客",
        "pilot_elite": "精英驾驶员"
    }
    
    faction_names = {
        "military": "",
        "rebel": "反抗军",
        "corporation": "企业",
        "royal": "皇室",
        "unknown": ""
    }
    
    age_prefix = age_names.get(age, "")
    gender_prefix = gender_names.get(gender, "")
    occupation_suffix = occupation_names.get(occupation, "")
    faction_prefix = faction_names.get(faction, "")
    
    # 组合名称
    name_parts = [age_prefix, faction_prefix, gender_prefix, occupation_suffix]
    return "".join([p for p in name_parts if p])


def generate_character_name_en(age: str, gender: str, occupation: str, faction: str) -> str:
    """生成英文角色名称"""
    age_names = {
        "child": "Young",
        "teen": "Teen",
        "young_adult": "",
        "adult": "",
        "senior": "Veteran"
    }
    
    gender_names = {
        "male": "",
        "female": "Female",
        "neutral": ""
    }
    
    occupation_names = {
        "pilot": "Pilot",
        "commander": "Commander",
        "researcher": "Researcher",
        "soldier": "Soldier",
        "engineer": "Engineer",
        "assassin": "Assassin",
        "pilot_elite": "Elite Pilot"
    }
    
    faction_names = {
        "military": "Military",
        "rebel": "Rebel",
        "corporation": "Corporate",
        "royal": "Royal",
        "unknown": ""
    }
    
    age_prefix = age_names.get(age, "")
    gender_prefix = gender_names.get(gender, "")
    occupation_suffix = occupation_names.get(occupation, "")
    faction_prefix = faction_names.get(faction, "")
    
    # 组合名称
    name_parts = [age_prefix, gender_prefix, faction_prefix, occupation_suffix]
    return " ".join([p for p in name_parts if p])


def generate_prompt_cn(age: str, gender: str, occupation: str, personality: str, faction: str) -> str:
    """生成中文提示词"""
    dimensions = load_dimensions()
    
    # 获取维度中文名
    age_cn = next((d["cn"] for d in dimensions["dimensions"]["age"] if d["id"] == age), age)
    gender_cn = next((d["cn"] for d in dimensions["dimensions"]["gender"] if d["id"] == gender), gender)
    occupation_cn = next((d["cn"] for d in dimensions["dimensions"]["occupation"] if d["id"] == occupation), occupation)
    personality_cn = next((d["cn"] for d in dimensions["dimensions"]["personality"] if d["id"] == personality), personality)
    faction_cn = next((d["cn"] for d in dimensions["dimensions"]["faction"] if d["id"] == faction), faction)
    
    # 组合提示词
    prompt_parts = [age_cn, gender_cn, occupation_cn, personality_cn, faction_cn]
    character_desc = " ".join([p for p in prompt_parts if p])
    
    # 添加风格标签
    style_tags = "赛璐璐渲染, 工业机甲风格, 高级设定集风格, 电影光影"
    
    return f"{character_desc}, {style_tags}"


def generate_prompt_en(age: str, gender: str, occupation: str, personality: str, faction: str) -> str:
    """生成英文提示词"""
    dimensions = load_dimensions()
    
    # 获取维度英文名
    age_en = next((d["en"] for d in dimensions["dimensions"]["age"] if d["id"] == age), age)
    gender_en = next((d["en"] for d in dimensions["dimensions"]["gender"] if d["id"] == gender), gender)
    occupation_en = next((d["en"] for d in dimensions["dimensions"]["occupation"] if d["id"] == occupation), occupation)
    personality_en = next((d["en"] for d in dimensions["dimensions"]["personality"] if d["id"] == personality), personality)
    faction_en = next((d["en"] for d in dimensions["dimensions"]["faction"] if d["id"] == faction), faction)
    
    # 组合提示词
    prompt_parts = [age_en, gender_en, occupation_en, personality_en, faction_en]
    character_desc = " ".join([p for p in prompt_parts if p])
    
    # 添加风格标签
    style_tags = "cel-shaded rendering, industrial mecha style, premium concept art, cinematic lighting"
    
    return f"{character_desc}, {style_tags}"


def generate_tags(age: str, gender: str, occupation: str, personality: str, faction: str) -> List[str]:
    """生成标签列表"""
    dimensions = load_dimensions()
    
    tags = []
    
    # 收集各维度标签
    for dim_name, dim_list in dimensions["dimensions"].items():
        dim_value = locals().get(dim_name)
        if dim_value:
            dim_data = next((d for d in dim_list if d["id"] == dim_value), None)
            if dim_data and "tags" in dim_data:
                tags.extend(dim_data["tags"])
    
    # 去重
    return list(set(tags))


def generate_single_character(age: str, gender: str, occupation: str, personality: str, faction: str) -> Dict[str, Any]:
    """生成单个角色"""
    return {
        "id": generate_character_id(age, gender, occupation, personality, faction),
        "category": {
            "age": age,
            "gender": gender,
            "occupation": occupation,
            "personality": personality,
            "faction": faction
        },
        "name_cn": generate_character_name_cn(age, gender, occupation, faction),
        "name_en": generate_character_name_en(age, gender, occupation, faction),
        "tags": generate_tags(age, gender, occupation, personality, faction),
        "prompt_cn": generate_prompt_cn(age, gender, occupation, personality, faction),
        "prompt_en": generate_prompt_en(age, gender, occupation, personality, faction)
    }


def generate_all_characters(max_count: int = 350) -> List[Dict[str, Any]]:
    """生成所有角色组合，确保各维度均匀分布"""
    dimensions = load_dimensions()
    
    # 获取所有维度值
    ages = [d["id"] for d in dimensions["dimensions"]["age"]]
    genders = [d["id"] for d in dimensions["dimensions"]["gender"]]
    occupations = [d["id"] for d in dimensions["dimensions"]["occupation"]]
    personalities = [d["id"] for d in dimensions["dimensions"]["personality"]]
    factions = [d["id"] for d in dimensions["dimensions"]["faction"]]
    
    characters = []
    seen_ids = set()
    
    # 计算每个年龄+性别+职业组合应分配的角色数
    age_gender_occ_combos = len(ages) * len(genders) * len(occupations)
    chars_per_combo = max_count // age_gender_occ_combos
    
    # 为每个年龄+性别+职业组合生成角色
    for age in ages:
        for gender in genders:
            for occupation in occupations:
                combo_count = 0
                
                for personality, faction in itertools.product(
                    personalities, factions
                ):
                    if combo_count >= chars_per_combo:
                        break
                    
                    character = generate_single_character(age, gender, occupation, personality, faction)
                    
                    # 避免重复
                    if character["id"] not in seen_ids:
                        characters.append(character)
                        seen_ids.add(character["id"])
                        combo_count += 1
    
    return characters


def generate_characters_by_filter(
    age: str = None,
    gender: str = None,
    occupation: str = None,
    personality: str = None,
    faction: str = None,
    max_count: int = 50
) -> List[Dict[str, Any]]:
    """根据筛选条件生成角色"""
    dimensions = load_dimensions()
    
    # 获取维度值，如果未指定则使用所有值
    ages = [age] if age else [d["id"] for d in dimensions["dimensions"]["age"]]
    genders = [gender] if gender else [d["id"] for d in dimensions["dimensions"]["gender"]]
    occupations = [occupation] if occupation else [d["id"] for d in dimensions["dimensions"]["occupation"]]
    personalities = [personality] if personality else [d["id"] for d in dimensions["dimensions"]["personality"]]
    factions = [faction] if faction else [d["id"] for d in dimensions["dimensions"]["faction"]]
    
    characters = []
    
    for a, g, o, p, f in itertools.product(ages, genders, occupations, personalities, factions):
        if len(characters) >= max_count:
            break
        
        character = generate_single_character(a, g, o, p, f)
        characters.append(character)
    
    return characters


def save_characters_to_file(characters: List[Dict[str, Any]], filename: str = "character_generated.json"):
    """保存生成的角色到文件"""
    output_path = os.path.join(PROMPTS_PATH, filename)
    
    data = {
        "metadata": {
            "version": "1.0.0",
            "module": "character",
            "description": "角色模块 - 自动生成的角色数据库",
            "total_items": len(characters),
            "generation_method": "dimension_combination"
        },
        "characters": characters
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Generated {len(characters)} characters and saved to {output_path}")
    return output_path


def main():
    """主函数 - 生成角色数据库"""
    print("🚀 Starting character generation...")
    
    # 生成350个角色
    characters = generate_all_characters(max_count=350)
    
    # 保存到文件
    save_characters_to_file(characters)
    
    # 打印统计信息
    print(f"\n📊 Generation Statistics:")
    print(f"   Total characters: {len(characters)}")
    
    # 按维度统计
    age_counts = {}
    gender_counts = {}
    occupation_counts = {}
    
    for char in characters:
        cat = char["category"]
        age_counts[cat["age"]] = age_counts.get(cat["age"], 0) + 1
        gender_counts[cat["gender"]] = gender_counts.get(cat["gender"], 0) + 1
        occupation_counts[cat["occupation"]] = occupation_counts.get(cat["occupation"], 0) + 1
    
    print(f"\n   By Age:")
    for age, count in age_counts.items():
        print(f"     {age}: {count}")
    
    print(f"\n   By Gender:")
    for gender, count in gender_counts.items():
        print(f"     {gender}: {count}")
    
    print(f"\n   By Occupation:")
    for occupation, count in occupation_counts.items():
        print(f"     {occupation}: {count}")
    
    # 打印示例
    print(f"\n📝 Sample Characters:")
    for i, char in enumerate(characters[:5]):
        print(f"\n   {i+1}. {char['name_cn']} ({char['name_en']})")
        print(f"      ID: {char['id']}")
        print(f"      Prompt CN: {char['prompt_cn']}")
        print(f"      Prompt EN: {char['prompt_en']}")


if __name__ == "__main__":
    main()
