"""
Database Module - 数据库初始化
"""

import os
import json

# 数据目录路径
BASE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data")
PROMPTS_PATH = os.path.join(BASE_PATH, "prompts")
TEMPLATES_PATH = os.path.join(BASE_PATH, "templates")
PROJECTS_PATH = os.path.join(BASE_PATH, "projects")


async def init_database():
    """初始化数据库目录和基础数据"""
    
    # 创建目录
    os.makedirs(PROMPTS_PATH, exist_ok=True)
    os.makedirs(TEMPLATES_PATH, exist_ok=True)
    os.makedirs(PROJECTS_PATH, exist_ok=True)
    os.makedirs(os.path.join(TEMPLATES_PATH, "identity"), exist_ok=True)
    os.makedirs(os.path.join(TEMPLATES_PATH, "card"), exist_ok=True)
    os.makedirs(os.path.join(TEMPLATES_PATH, "poster"), exist_ok=True)
    
    # 初始化Prompt数据库
    await init_prompt_database()
    
    print("✅ Database initialized successfully")


async def init_prompt_database():
    """初始化Prompt数据库"""
    
    # 风格核心
    style_core = {
        "metadata": {
            "version": "1.0.0",
            "name": "风格核心",
            "description": "所有输出必须继承的核心风格"
        },
        "core_style": {
            "id": "cel_mecha_core",
            "name": {
                "zh": "赛璐璐机甲核心风格",
                "en": "Cel-Shading Mecha Core Style"
            },
            "prompt": {
                "zh": "赛璐璐风格，工业机甲设计，动画设定集风格，高端商业插画，电影级光影",
                "en": "cel-shading style, industrial mecha design, anime setting sheet style, high-end commercial illustration, cinematic lighting"
            },
            "locked": True,
            "weight": 1.5
        },
        "quality_tags": {
            "zh": "杰作，最佳质量，超高细节，精细渲染",
            "en": "masterpiece, best quality, ultra detailed, fine rendering"
        }
    }
    
    # 角色模块
    character = {
        "metadata": {
            "version": "1.0.0",
            "name": "角色模块",
            "description": "角色相关提示词"
        },
        "gender": {
            "label": {"zh": "性别", "en": "Gender"},
            "options": [
                {"id": "male", "label": {"zh": "男性", "en": "Male"}, "prompt": {"zh": "男性角色", "en": "male character"}},
                {"id": "female", "label": {"zh": "女性", "en": "Female"}, "prompt": {"zh": "女性角色", "en": "female character"}}
            ]
        },
        "age": {
            "label": {"zh": "年龄", "en": "Age"},
            "options": [
                {"id": "child", "label": {"zh": "儿童", "en": "Child"}, "prompt": {"zh": "儿童", "en": "child"}},
                {"id": "teen", "label": {"zh": "少年", "en": "Teenager"}, "prompt": {"zh": "少年", "en": "teenage"}},
                {"id": "young", "label": {"zh": "青年", "en": "Young Adult"}, "prompt": {"zh": "青年", "en": "young adult"}},
                {"id": "adult", "label": {"zh": "成年", "en": "Adult"}, "prompt": {"zh": "成年人", "en": "adult"}}
            ]
        },
        "body_type": {
            "label": {"zh": "体型", "en": "Body Type"},
            "options": [
                {"id": "slim", "label": {"zh": "纤细", "en": "Slim"}, "prompt": {"zh": "纤细体型", "en": "slim build"}},
                {"id": "athletic", "label": {"zh": "健美", "en": "Athletic"}, "prompt": {"zh": "健美体型", "en": "athletic build"}},
                {"id": "muscular", "label": {"zh": "强壮", "en": "Muscular"}, "prompt": {"zh": "强壮体型", "en": "muscular build"}}
            ]
        },
        "personality": {
            "label": {"zh": "性格", "en": "Personality"},
            "multi_select": True,
            "max_select": 2,
            "options": [
                {"id": "cool", "label": {"zh": "冷酷", "en": "Cool"}, "prompt": {"zh": "冷酷的", "en": "cool, aloof"}},
                {"id": "cheerful", "label": {"zh": "开朗", "en": "Cheerful"}, "prompt": {"zh": "开朗的", "en": "cheerful"}},
                {"id": "serious", "label": {"zh": "严肃", "en": "Serious"}, "prompt": {"zh": "严肃的", "en": "serious"}},
                {"id": "mysterious", "label": {"zh": "神秘", "en": "Mysterious"}, "prompt": {"zh": "神秘的", "en": "mysterious"}},
                {"id": "gentle", "label": {"zh": "温柔", "en": "Gentle"}, "prompt": {"zh": "温柔的", "en": "gentle"}}
            ]
        }
    }
    
    # 发型模块
    hairstyle = {
        "metadata": {
            "version": "1.0.0",
            "name": "发型模块",
            "description": "发型相关提示词"
        },
        "style": {
            "label": {"zh": "发型", "en": "Hair Style"},
            "options": [
                {"id": "long", "label": {"zh": "长发", "en": "Long Hair"}, "prompt": {"zh": "长发", "en": "long hair"}},
                {"id": "short", "label": {"zh": "短发", "en": "Short Hair"}, "prompt": {"zh": "短发", "en": "short hair"}},
                {"id": "ponytail", "label": {"zh": "马尾", "en": "Ponytail"}, "prompt": {"zh": "马尾", "en": "ponytail"}},
                {"id": "twintails", "label": {"zh": "双马尾", "en": "Twintails"}, "prompt": {"zh": "双马尾", "en": "twintails"}},
                {"id": "bun", "label": {"zh": "丸子头", "en": "Bun"}, "prompt": {"zh": "丸子头", "en": "hair bun"}}
            ]
        },
        "color": {
            "label": {"zh": "发色", "en": "Hair Color"},
            "options": [
                {"id": "black", "label": {"zh": "黑色", "en": "Black"}, "prompt": {"zh": "黑色头发", "en": "black hair"}, "hex": "#000000"},
                {"id": "brown", "label": {"zh": "棕色", "en": "Brown"}, "prompt": {"zh": "棕色头发", "en": "brown hair"}, "hex": "#8B4513"},
                {"id": "blonde", "label": {"zh": "金色", "en": "Blonde"}, "prompt": {"zh": "金色头发", "en": "blonde hair"}, "hex": "#FFD700"},
                {"id": "red", "label": {"zh": "红色", "en": "Red"}, "prompt": {"zh": "红色头发", "en": "red hair"}, "hex": "#FF0000"},
                {"id": "blue", "label": {"zh": "蓝色", "en": "Blue"}, "prompt": {"zh": "蓝色头发", "en": "blue hair"}, "hex": "#0000FF"},
                {"id": "white", "label": {"zh": "白色", "en": "White"}, "prompt": {"zh": "白色头发", "en": "white hair"}, "hex": "#FFFFFF"}
            ]
        }
    }
    
    # 服装模块
    costume = {
        "metadata": {
            "version": "1.0.0",
            "name": "服装模块",
            "description": "服装相关提示词"
        },
        "type": {
            "label": {"zh": "服装类型", "en": "Costume Type"},
            "options": [
                {"id": "pilot_suit", "label": {"zh": "驾驶员服", "en": "Pilot Suit"}, "prompt": {"zh": "机甲驾驶员服", "en": "mecha pilot suit"}},
                {"id": "armor", "label": {"zh": "盔甲", "en": "Armor"}, "prompt": {"zh": "盔甲", "en": "armor"}},
                {"id": "military", "label": {"zh": "军装", "en": "Military"}, "prompt": {"zh": "军装", "en": "military uniform"}},
                {"id": "casual", "label": {"zh": "休闲装", "en": "Casual"}, "prompt": {"zh": "休闲装", "en": "casual clothes"}},
                {"id": "school", "label": {"zh": "校服", "en": "School"}, "prompt": {"zh": "校服", "en": "school uniform"}}
            ]
        }
    }
    
    # 机甲模块
    mecha = {
        "metadata": {
            "version": "1.0.0",
            "name": "机甲模块",
            "description": "机甲相关提示词"
        },
        "type": {
            "label": {"zh": "机甲类型", "en": "Mecha Type"},
            "options": [
                {"id": "humanoid", "label": {"zh": "人形机甲", "en": "Humanoid Mecha"}, "prompt": {"zh": "人形机甲", "en": "humanoid mecha"}},
                {"id": "beast", "label": {"zh": "兽形机甲", "en": "Beast Mecha"}, "prompt": {"zh": "兽形机甲", "en": "beast-type mecha"}},
                {"id": "aircraft", "label": {"zh": "飞行机甲", "en": "Aerial Mecha"}, "prompt": {"zh": "飞行机甲", "en": "aerial mecha"}},
                {"id": "armor", "label": {"zh": "装甲服", "en": "Power Armor"}, "prompt": {"zh": "装甲服", "en": "power armor suit"}}
            ]
        },
        "size": {
            "label": {"zh": "机甲尺寸", "en": "Mecha Size"},
            "options": [
                {"id": "light", "label": {"zh": "轻型", "en": "Light"}, "prompt": {"zh": "轻型机甲", "en": "light mecha"}},
                {"id": "medium", "label": {"zh": "中型", "en": "Medium"}, "prompt": {"zh": "中型机甲", "en": "medium mecha"}},
                {"id": "heavy", "label": {"zh": "重型", "en": "Heavy"}, "prompt": {"zh": "重型机甲", "en": "heavy mecha"}},
                {"id": "super", "label": {"zh": "超级", "en": "Super"}, "prompt": {"zh": "超级机甲", "en": "super mecha"}}
            ]
        },
        "style": {
            "label": {"zh": "设计风格", "en": "Design Style"},
            "options": [
                {"id": "real_robot", "label": {"zh": "真实系", "en": "Real Robot"}, "prompt": {"zh": "真实系机甲设计", "en": "real robot design"}},
                {"id": "super_robot", "label": {"zh": "超级系", "en": "Super Robot"}, "prompt": {"zh": "超级系机甲设计", "en": "super robot design"}},
                {"id": "industrial", "label": {"zh": "工业风", "en": "Industrial"}, "prompt": {"zh": "工业风格机甲", "en": "industrial style mecha"}},
                {"id": "futuristic", "label": {"zh": "未来风", "en": "Futuristic"}, "prompt": {"zh": "未来风格机甲", "en": "futuristic mecha"}}
            ]
        },
        "color": {
            "label": {"zh": "主色调", "en": "Main Color"},
            "options": [
                {"id": "white", "label": {"zh": "白色", "en": "White"}, "prompt": {"zh": "白色涂装", "en": "white color scheme"}, "hex": "#FFFFFF"},
                {"id": "black", "label": {"zh": "黑色", "en": "Black"}, "prompt": {"zh": "黑色涂装", "en": "black color scheme"}, "hex": "#000000"},
                {"id": "red", "label": {"zh": "红色", "en": "Red"}, "prompt": {"zh": "红色涂装", "en": "red color scheme"}, "hex": "#FF0000"},
                {"id": "blue", "label": {"zh": "蓝色", "en": "Blue"}, "prompt": {"zh": "蓝色涂装", "en": "blue color scheme"}, "hex": "#0000FF"},
                {"id": "military", "label": {"zh": "军绿", "en": "Military"}, "prompt": {"zh": "军绿色涂装", "en": "military green color scheme"}, "hex": "#4B5320"}
            ]
        }
    }
    
    # 场景模块
    scene = {
        "metadata": {
            "version": "1.0.0",
            "name": "场景模块",
            "description": "场景相关提示词"
        },
        "type": {
            "label": {"zh": "场景类型", "en": "Scene Type"},
            "options": [
                {"id": "city", "label": {"zh": "城市", "en": "City"}, "prompt": {"zh": "未来城市", "en": "futuristic city"}},
                {"id": "ruins", "label": {"zh": "废墟", "en": "Ruins"}, "prompt": {"zh": "废墟场景", "en": "ruins scene"}},
                {"id": "factory", "label": {"zh": "工厂", "en": "Factory"}, "prompt": {"zh": "工业工厂", "en": "industrial factory"}},
                {"id": "hangar", "label": {"zh": "机库", "en": "Hangar"}, "prompt": {"zh": "机甲机库", "en": "mecha hangar"}},
                {"id": "space", "label": {"zh": "太空", "en": "Space"}, "prompt": {"zh": "太空场景", "en": "space scene"}},
                {"id": "battlefield", "label": {"zh": "战场", "en": "Battlefield"}, "prompt": {"zh": "战场场景", "en": "battlefield scene"}}
            ]
        },
        "time": {
            "label": {"zh": "时间", "en": "Time"},
            "options": [
                {"id": "dawn", "label": {"zh": "黎明", "en": "Dawn"}, "prompt": {"zh": "黎明时分", "en": "at dawn"}},
                {"id": "day", "label": {"zh": "白天", "en": "Day"}, "prompt": {"zh": "白天", "en": "daytime"}},
                {"id": "sunset", "label": {"zh": "黄昏", "en": "Sunset"}, "prompt": {"zh": "黄昏", "en": "sunset"}},
                {"id": "night", "label": {"zh": "夜晚", "en": "Night"}, "prompt": {"zh": "夜晚", "en": "nighttime"}}
            ]
        },
        "weather": {
            "label": {"zh": "天气", "en": "Weather"},
            "options": [
                {"id": "clear", "label": {"zh": "晴天", "en": "Clear"}, "prompt": {"zh": "晴朗天气", "en": "clear weather"}},
                {"id": "rain", "label": {"zh": "雨天", "en": "Rain"}, "prompt": {"zh": "雨天", "en": "rainy weather"}},
                {"id": "storm", "label": {"zh": "暴风雨", "en": "Storm"}, "prompt": {"zh": "暴风雨", "en": "stormy weather"}},
                {"id": "snow", "label": {"zh": "雪天", "en": "Snow"}, "prompt": {"zh": "雪天", "en": "snowy weather"}}
            ]
        }
    }
    
    # 光影模块
    lighting = {
        "metadata": {
            "version": "1.0.0",
            "name": "光影模块",
            "description": "光影相关提示词"
        },
        "type": {
            "label": {"zh": "光源类型", "en": "Light Type"},
            "options": [
                {"id": "cinematic", "label": {"zh": "电影光", "en": "Cinematic"}, "prompt": {"zh": "电影级打光", "en": "cinematic lighting"}},
                {"id": "natural", "label": {"zh": "自然光", "en": "Natural"}, "prompt": {"zh": "自然光", "en": "natural lighting"}},
                {"id": "neon", "label": {"zh": "霓虹灯", "en": "Neon"}, "prompt": {"zh": "霓虹灯光", "en": "neon lighting"}},
                {"id": "volumetric", "label": {"zh": "体积光", "en": "Volumetric"}, "prompt": {"zh": "体积光", "en": "volumetric lighting"}}
            ]
        },
        "direction": {
            "label": {"zh": "光线方向", "en": "Light Direction"},
            "options": [
                {"id": "front", "label": {"zh": "正面光", "en": "Front"}, "prompt": {"zh": "正面光", "en": "front lighting"}},
                {"id": "side", "label": {"zh": "侧光", "en": "Side"}, "prompt": {"zh": "侧光", "en": "side lighting"}},
                {"id": "back", "label": {"zh": "背光", "en": "Back"}, "prompt": {"zh": "背光", "en": "backlighting"}},
                {"id": "top", "label": {"zh": "顶光", "en": "Top"}, "prompt": {"zh": "顶光", "en": "top lighting"}}
            ]
        }
    }
    
    # 镜头模块
    camera = {
        "metadata": {
            "version": "1.0.0",
            "name": "镜头模块",
            "description": "镜头相关提示词"
        },
        "angle": {
            "label": {"zh": "拍摄角度", "en": "Camera Angle"},
            "options": [
                {"id": "low", "label": {"zh": "仰视", "en": "Low Angle"}, "prompt": {"zh": "仰视角度", "en": "low angle view"}},
                {"id": "high", "label": {"zh": "俯视", "en": "High Angle"}, "prompt": {"zh": "俯视角度", "en": "high angle view"}},
                {"id": "front", "label": {"zh": "正面", "en": "Front"}, "prompt": {"zh": "正面", "en": "front view"}},
                {"id": "side", "label": {"zh": "侧面", "en": "Side"}, "prompt": {"zh": "侧面", "en": "side view"}}
            ]
        },
        "shot": {
            "label": {"zh": "景别", "en": "Shot Type"},
            "options": [
                {"id": "close_up", "label": {"zh": "特写", "en": "Close-up"}, "prompt": {"zh": "特写", "en": "close-up shot"}},
                {"id": "medium", "label": {"zh": "中景", "en": "Medium"}, "prompt": {"zh": "中景", "en": "medium shot"}},
                {"id": "full", "label": {"zh": "全身", "en": "Full Body"}, "prompt": {"zh": "全身", "en": "full body shot"}},
                {"id": "wide", "label": {"zh": "远景", "en": "Wide"}, "prompt": {"zh": "远景", "en": "wide shot"}}
            ]
        }
    }
    
    # 保存所有数据库文件
    db_files = {
        "style_core": style_core,
        "character": character,
        "hairstyle": hairstyle,
        "costume": costume,
        "mecha": mecha,
        "scene": scene,
        "lighting": lighting,
        "camera": camera
    }
    
    for filename, data in db_files.items():
        file_path = os.path.join(PROMPTS_PATH, f"{filename}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Prompt database initialized with {len(db_files)} modules")
