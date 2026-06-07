// Prompt Engine - 自动构建专业提示词

export const STYLE_MAP: Record<string, string> = {
  // 前端 Step3 中文风格名匹配
  '奶油风': 'cream style interior, soft warm beige tones, rounded furniture, gentle lighting, cozy and sweet atmosphere',
  '现代简约': 'modern minimalist interior, clean lines, neutral tones, sleek furniture',
  '原木风': 'natural wood interior, warm timber textures, organic shapes, earthy and warm',
  '北欧': 'scandinavian interior, natural light, clean lines, white and wood, hygge atmosphere',
  '工业风': 'industrial interior, exposed brick, metal pipes, concrete floor, vintage leather',
  '日式': 'japanese zen interior, minimalist tatami, shoji screens, natural materials, wabi-sabi',
  '波西米亚': 'bohemian interior, colorful textiles, macrame, plants, eclectic patterns, warm tones',
  '装饰艺术': 'art deco interior, geometric patterns, gold accents, velvet furniture, glamorous',
  '极简主义': 'minimalist interior, pure white space, single statement piece, no clutter, zen simplicity',
  '轻奢': 'luxury interior, premium materials, marble, gold fixtures, elegant composition',
  '乡村田园': 'rustic farmhouse interior, wooden beams, stone fireplace, vintage decor, warm country',
  '新中式': 'modern chinese interior, dark wood, ink painting, porcelain, bamboo, contemporary oriental',
  '自定义': 'custom style interior design based on user provided reference image',
  // 英文 id 兼容
  modern: 'modern minimalist interior, clean lines, neutral tones, sleek furniture',
  scandinavian: 'scandinavian interior, natural light, clean lines, white and wood, hygge atmosphere',
  industrial: 'industrial interior, exposed brick, metal pipes, concrete floor, vintage leather',
  japanese: 'japanese zen interior, minimalist tatami, shoji screens, natural materials, wabi-sabi',
  bohemian: 'bohemian interior, colorful textiles, macrame, plants, eclectic patterns, warm tones',
  art_deco: 'art deco interior, geometric patterns, gold accents, velvet furniture, glamorous',
  minimalist: 'minimalist interior, pure white space, single statement piece, no clutter, zen simplicity',
  rustic: 'rustic farmhouse interior, wooden beams, stone fireplace, vintage decor, warm country',
  luxury: 'luxury interior, premium materials, marble, gold fixtures, elegant composition',
  chinese: 'modern chinese interior, dark wood, ink painting, porcelain, bamboo, contemporary oriental',
  cream_style: 'cream style interior, soft warm beige tones, rounded furniture, gentle lighting',
  modern_minimalist: 'modern minimalist interior, clean lines, neutral tones, sleek furniture',
  nordic: 'scandinavian interior, natural light, clean lines, white and wood, hygge atmosphere',
  wabi_sabi: 'wabi-sabi interior, natural imperfections, earthy tones',
  vintage: 'vintage interior, classic details, nostalgic warmth',
  natural_wood: 'natural wood interior, warm timber textures, organic shapes, earthy and warm',
};

const ATMOSPHERE_MAP: Record<string, string> = {
  cozy: 'cozy warm atmosphere',
  luxury_hotel: 'luxury hotel ambiance, sophisticated elegance',
  soft_natural_light: 'soft natural sunlight, airy bright space',
  dark_premium: 'dark premium mood, dramatic lighting',
  warm_home: 'warm home atmosphere, inviting comfort',
};

const MATERIAL_MAP: Record<string, string> = {
  walnut_wood: 'walnut wood',
  marble: 'marble',
  microcement: 'microcement',
  natural_wood: 'natural wood',
  concrete: 'polished concrete',
};

const LIGHTING_MAP: Record<string, string> = {
  warm_light: 'warm lighting',
  ambient_light: 'ambient lighting',
  minimal_linear_light: 'minimal linear light fixtures',
  no_main_light: 'no main light, layered indirect lighting',
};

const BUDGET_MAP: Record<string, string> = {
  budget: 'budget-friendly',
  mid_range: 'mid-range',
  luxury_budget: 'luxury high-end',
};

const SYSTEM_PROMPT = [
  'Photorealistic luxury residential interior',
  'architectural digest photography',
  'natural soft shadows',
  'premium interior styling',
  'high-end furniture composition',
  'professional interior design photography',
];

const ROOM_STRUCTURE = [
  'CRITICAL: Redesign this exact room shown in the reference photo',
  'preserve the original room architecture and layout',
  'maintain the exact room perspective and camera angle',
  'keep all window positions and sizes unchanged',
  'keep all door positions unchanged',
  'do not alter room dimensions or ceiling height',
  'maintain the original floor plan and wall structure',
  'only change the interior decoration, furniture, and color scheme',
  'the result must look like the same room with new decoration',
];

const IMAGE_TO_IMAGE_PROMPT = [
  'This is an interior design renovation task',
  'Redesign the room in the reference photo with the specified style',
  'Keep the room structure identical - same walls, windows, doors, and layout',
  'Only replace furniture, decor, colors, and materials to match the target style',
  'The result must be recognizable as the same room',
];

export interface PromptInput {
  roomType: string;
  style: string;
  atmosphere?: string;
  materials?: string[];
  lighting?: string;
  budget?: string;
  hasReferenceImage?: boolean;
  customPrompt?: string;
  layoutLockPrompt?: string;
  styleReferenceImage?: string;
}

export function buildPrompt(input: PromptInput): {
  systemPrompt: string;
  stylePrompt: string;
  structurePrompt: string;
  fullPrompt: string;
} {
  const room = input.roomType.replace(/_/g, ' ');

  // 清理 style 字符串，去除后缀和多余空格
  let styleKey = input.style
    .replace(/\s+interior\s*design\s*$/i, '')
    .replace(/\s+style\s*$/i, '')
    .replace(/\s+风\s*$/i, '')
    .trim();

  const styleDesc = STYLE_MAP[styleKey] || STYLE_MAP[input.style] || input.style;

  const styleParts: string[] = [styleDesc];

  if (input.atmosphere && ATMOSPHERE_MAP[input.atmosphere]) {
    styleParts.push(ATMOSPHERE_MAP[input.atmosphere]);
  }

  if (input.materials && input.materials.length > 0) {
    const matList = input.materials
      .filter((m) => MATERIAL_MAP[m])
      .map((m) => MATERIAL_MAP[m])
      .join(', ');
    if (matList) styleParts.push(`${matList} materials`);
  }

  if (input.lighting && LIGHTING_MAP[input.lighting]) {
    styleParts.push(LIGHTING_MAP[input.lighting]);
  }

  if (input.budget && BUDGET_MAP[input.budget]) {
    styleParts.push(`${BUDGET_MAP[input.budget]} design`);
  }

  const stylePrompt = `${room} room, ${styleParts.join(', ')}`;
  const systemPrompt = SYSTEM_PROMPT.join(', ');
  const structurePrompt = ROOM_STRUCTURE.join(', ');

  const fullParts: string[] = [systemPrompt];

  // 如果有参考图，加入图生图专用提示
  if (input.hasReferenceImage) {
    fullParts.push(IMAGE_TO_IMAGE_PROMPT.join(', '));
  }

  if (input.layoutLockPrompt) {
    fullParts.push(input.layoutLockPrompt);
  } else {
    fullParts.push(structurePrompt);
  }

  fullParts.push(stylePrompt);

  if (input.styleReferenceImage) {
    fullParts.push('IMPORTANT: The user has provided a custom style reference image. Analyze the style, color palette, materials, and atmosphere from the reference image and apply that exact same style to the room. Match the reference style as closely as possible while adapting it to fit the room structure.');
  }

  // 如果有自定义提示词，追加到末尾（最高优先级）
  if (input.customPrompt && input.customPrompt.trim()) {
    fullParts.push(`CUSTOM USER REQUIREMENTS: ${input.customPrompt.trim()}`);
  }

  const fullPrompt = fullParts.join(', ');

  return { systemPrompt, stylePrompt, structurePrompt, fullPrompt };
}

export function buildChinesePrompt(input: PromptInput): string {
  const room = input.roomType.replace(/_/g, ' ');
  const styleMapCN: Record<string, string> = {
    modern_minimalist: '现代简约风格',
    cream_style: '奶油风',
    nordic: '北欧风',
    japanese: '日式禅意风格',
    wabi_sabi: '侘寂风',
    luxury: '轻奢风格',
    vintage: '复古风格',
    natural_wood: '原木风',
  };

  const style = styleMapCN[input.style] || input.style;
  let prompt = `${room}${style}室内设计效果图，`;

  if (input.atmosphere) {
    const atmCN: Record<string, string> = {
      cozy: '温馨氛围', luxury_hotel: '奢华酒店感', soft_natural_light: '柔和自然光',
      dark_premium: '暗黑高级感', warm_home: '温暖居家',
    };
    if (atmCN[input.atmosphere]) prompt += `${atmCN[input.atmosphere]}，`;
  }

  prompt += `高品质室内设计，建筑摄影级画质，柔和阴影，保持原始房间结构`;

  if (input.hasReferenceImage) {
    prompt += `，基于参考照片中的原始房间进行改造设计，保持房间结构不变，仅更换装修风格和家具`;
  }

  if (input.layoutLockPrompt) {
    prompt += `，结构锁定：${input.layoutLockPrompt}`;
  }

  if (input.customPrompt && input.customPrompt.trim()) {
    prompt += `，用户特别要求：${input.customPrompt.trim()}`;
  }

  return prompt;
}