import { generate, type GatewayRequest } from './ai-gateway';

export interface RoomUpload {
  id: string;
  imageUrl: string;
  roomType: string;
  roomTypeEn: string;
  analysis?: RoomAnalysis;
}

export interface RoomAnalysis {
  roomType: string;
  currentStyle: string;
  colorPalette: string[];
  materials: string[];
  lightingType: string;
  description: string;
}

export interface UnifiedStyleConfig {
  style: string;
  styleEn: string;
  colorTone: string;
  materialPalette: string[];
  lightingMood: string;
  furnitureDensity: string;
  keyElements: string[];
}

export interface WholeHouseResult {
  rooms: RoomUpload[];
  unifiedConfig: UnifiedStyleConfig;
  styleLanguage: string;
  consistencyScore: number;
}

export interface UnifiedRoomResult {
  roomId: string;
  roomType: string;
  imageUrl: string;
  prompt: string;
  cost: number;
  provider: string;
  error?: string;
}

const STYLE_LANGUAGE_TEMPLATES: Record<string, { materials: string[]; colors: string[]; lighting: string; elements: string[] }> = {
  '现代简约': {
    materials: ['哑光漆面', '不锈钢', '大理石', '玻璃', '木饰面'],
    colors: ['#F5F5F0', '#2C2C2C', '#C8A97E', '#E8E4DF', '#8B8B8B'],
    lighting: '无主灯设计，嵌入式射灯+线性灯带',
    elements: ['隐藏式收纳', '通顶柜体', '悬浮设计', '极简把手', '大面积留白']
  },
  '奶油风': {
    materials: ['哑光乳胶漆', '棉麻布艺', '原木', '绒面', '藤编'],
    colors: ['#F5E6D3', '#E8D5C4', '#D4B896', '#FFF8F0', '#C9A882'],
    lighting: '暖色温主灯+落地灯+氛围灯',
    elements: ['弧形家具', '奶白色系', '柔软织物', '圆润线条', '温柔过渡']
  },
  '北欧': {
    materials: ['白橡木', '棉麻', '羊毛', '陶瓷', '黄铜'],
    colors: ['#FFFFFF', '#F0EDE8', '#B8C4B8', '#D4B896', '#6B7B6B'],
    lighting: '自然光最大化+简约吊灯+蜡烛',
    elements: ['天然材质', '功能主义', '植物点缀', '几何图案', '留白呼吸']
  },
  '日式': {
    materials: ['桧木', '和纸', '榻榻米', '亚麻', '陶器'],
    colors: ['#F5EDE0', '#D4C5A9', '#8B7D6B', '#E8DFD0', '#A69279'],
    lighting: '和纸灯罩+间接照明+自然光',
    elements: ['障子门', '榻榻米', '低矮家具', '留白之美', '自然素材']
  },
  '轻奢': {
    materials: ['大理石', '黄铜', '丝绒', '镜面', '皮革'],
    colors: ['#1A1A2E', '#C8A97E', '#F5F0EB', '#8B6F47', '#E8D5C4'],
    lighting: '水晶吊灯+壁灯+灯带层次',
    elements: ['金属点缀', '大理石台面', '丝绒面料', '镜面反射', '对称布局']
  },
  '新中式': {
    materials: ['红木', '宣纸', '青石', '丝绸', '铜器'],
    colors: ['#8B0000', '#C8A97E', '#2C2C2C', '#F5F0EB', '#4A6741'],
    lighting: '中式灯笼+铜灯+竹帘滤光',
    elements: ['屏风隔断', '榫卯结构', '水墨意境', '对称美学', '留白题跋']
  },
  '工业风': {
    materials: ['水泥', '裸砖', '黑钢', '原木', '皮革'],
    colors: ['#3C3C3C', '#8B7D6B', '#C8A97E', '#5C5C5C', '#A0A0A0'],
    lighting: '轨道射灯+工厂吊灯+裸灯泡',
    elements: ['裸露管道', '金属框架', '做旧质感', '开放空间', '粗犷线条']
  },
  '原木风': {
    materials: ['白蜡木', '松木', '棉麻', '石材', '藤编'],
    colors: ['#D4B896', '#E8DFD0', '#8B7D6B', '#F5EDE0', '#C9A882'],
    lighting: '木质灯罩+暖色射灯+自然光',
    elements: ['大量原木', '自然纹理', '植物绿意', '手工质感', '温润色调']
  }
};

export function generateStyleLanguage(style: string, rooms: RoomUpload[]): string {
  const template = STYLE_LANGUAGE_TEMPLATES[style] || STYLE_LANGUAGE_TEMPLATES['现代简约'];

  const roomList = rooms.map(r => r.roomType).join('、');

  return `全屋统一风格语言 — ${style}

【空间范围】${roomList}

【核心材质体系】${template.materials.join(' → ')}
全屋统一使用以上材质组合，确保每个空间触感一致。

【色彩体系】主色 ${template.colors[0]}，辅色 ${template.colors[1]}，点缀 ${template.colors[2]}
色彩比例：主色60% + 辅色25% + 点缀15%，全屋严格执行。

【灯光体系】${template.lighting}
所有空间统一灯光色温3000K-3500K，确保氛围连贯。

【关键元素】${template.elements.join('、')}
每个空间至少包含2-3个关键元素，形成视觉呼应。

【过渡原则】
空间之间通过材质延续、色彩呼应、元素重复实现无缝过渡。
走廊/过道作为风格缓冲区，承上启下。`;
}

export function buildUnifiedRoomPrompt(room: RoomUpload, styleLanguage: string, styleEn: string): string {
  const template = STYLE_LANGUAGE_TEMPLATES[styleEn] || STYLE_LANGUAGE_TEMPLATES['现代简约'];

  return `UNIFIED WHOLE-HOUSE DESIGN — ${styleEn} style

ROOM: ${room.roomType} (${room.roomTypeEn})

MANDATORY STYLE CONSISTENCY:
- Materials: ${template.materials.join(', ')}
- Color palette: ${template.colors.join(', ')}
- Lighting: ${template.lighting}
- Key elements: ${template.elements.join(', ')}

${styleLanguage}

PRESERVE: Original room geometry, wall positions, window positions, door positions.
APPLY: ${styleEn} interior design with whole-house material and color consistency.
OUTPUT: Professional architectural photograph, as if shot for a design magazine feature on this entire home.`;
}

export function calculateWholeHouseCost(roomCount: number, resolution: string): number {
  const baseCost = resolution === '4K' ? 50 : resolution === '2K' ? 20 : 5;
  const discount = roomCount >= 3 ? 0.8 : roomCount >= 2 ? 0.9 : 1;
  return Math.ceil(baseCost * roomCount * discount);
}

export function getRoomTypeOptions(): { value: string; label: string; icon: string }[] {
  return [
    { value: 'living_room', label: '客厅', icon: '🛋️' },
    { value: 'bedroom', label: '卧室', icon: '🛏️' },
    { value: 'kitchen', label: '厨房', icon: '🍳' },
    { value: 'bathroom', label: '卫生间', icon: '🚿' },
    { value: 'study', label: '书房', icon: '📚' },
    { value: 'dining', label: '餐厅', icon: '🍽️' },
    { value: 'balcony', label: '阳台', icon: '🌿' },
    { value: 'kids_room', label: '儿童房', icon: '🧸' }
  ];
}

export async function executeWholeHouseGeneration(
  rooms: RoomUpload[],
  style: string,
  resolution: string,
  userLevel: 'free' | 'pro' | 'premium' = 'free',
): Promise<{ results: UnifiedRoomResult[]; totalCost: number; styleLanguage: string }> {
  const styleLanguage = generateStyleLanguage(style, rooms);

  const promises = rooms.map(async (room) => {
    const prompt = buildUnifiedRoomPrompt(room, styleLanguage, style);
    const request: GatewayRequest = {
      promptInput: {
        roomType: room.roomTypeEn || 'living_room',
        style,
        customPrompt: prompt,
        hasReferenceImage: !!room.imageUrl,
      },
      userLevel,
      mode: userLevel === 'free' ? 'auto' : 'ultra_render',
      imageUrl: room.imageUrl || undefined,
    };

    try {
      const result = await generate(request);
      return {
        roomId: room.id,
        roomType: room.roomType,
        imageUrl: result.images[0] || '',
        prompt,
        cost: result.cost,
        provider: result.provider,
      } as UnifiedRoomResult;
    } catch (e: any) {
      return {
        roomId: room.id,
        roomType: room.roomType,
        imageUrl: '',
        prompt,
        cost: 0,
        provider: 'failed',
        error: e.message,
      } as UnifiedRoomResult;
    }
  });

  const settled = await Promise.allSettled(promises);
  const results: UnifiedRoomResult[] = settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      roomId: rooms[i].id,
      roomType: rooms[i].roomType,
      imageUrl: '',
      prompt: '',
      cost: 0,
      provider: 'failed',
      error: r.reason?.message || 'Unknown error',
    };
  });

  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  return { results, totalCost, styleLanguage };
}
