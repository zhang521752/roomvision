import { type RoomStructure, type AIDepthResult } from './layout-lock';
import { STYLE_MAP } from './prompt-engine';
import { generate, type GatewayRequest } from './ai-gateway';

export interface StageResult {
  stage: number;
  stageName: string;
  imageUrl: string;
  prompt: string;
  structureData?: RoomStructure;
  depthData?: AIDepthResult;
  metadata: Record<string, any>;
}

export interface ThreeStageResult {
  stages: StageResult[];
  finalImageUrl: string;
  totalCost: number;
  layoutLockPrompt: string;
}

export interface RefinementOptions {
  upscale: boolean;
  detailEnhance: boolean;
  realisticTexture: boolean;
  lightingPolish: boolean;
  targetResolution: '1K' | '2K' | '4K';
}

export interface RefinementResult {
  originalUrl: string;
  refinedImageUrl: string;
  appliedRefinements: string[];
  cost: number;
  stages: {
    upscale?: { applied: boolean; prompt: string };
    detailEnhance?: { applied: boolean; prompt: string };
    realisticTexture?: { applied: boolean; prompt: string };
    lightingPolish?: { applied: boolean; prompt: string };
  };
}

const STAGE_PROMPTS = {
  stage1_layout: {
    system: 'You are an architectural layout designer. Generate a clean spatial layout that preserves the exact room geometry, wall positions, window positions, and door positions from the original photo. Focus ONLY on spatial arrangement - furniture placement, flow, and proportions. Do NOT add decorative elements, colors, or materials yet. Output should look like a clean architectural rendering with minimal styling.',
    suffix: 'SPATIAL LAYOUT ONLY: Preserve exact room dimensions, wall angles, window positions, door positions. Show furniture placement and spatial flow. No decoration, no colors, no materials. Clean architectural rendering style.'
  },
  stage2_style: {
    system: 'You are an interior design stylist. Take the spatial layout from the previous stage and apply the selected design style. Add colors, materials, textures, and decorative elements according to the style. Maintain the exact spatial arrangement and furniture positions from the layout stage.',
    suffix: 'STYLE APPLICATION: Apply the selected style with full colors, materials, and decorative elements. Maintain exact spatial arrangement from layout stage. Add textiles, art, plants, and accessories appropriate to the style.'
  },
  stage3_refine: {
    upscale: 'UPSCALE: Increase resolution while preserving all details. Enhance edge sharpness and clarity. Remove any compression artifacts. Maintain exact composition and colors. Target resolution: {resolution}.',
    detailEnhance: 'DETAIL ENHANCE: Add fine architectural details - crown molding, baseboard profiles, hardware finishes, fabric weave patterns, wood grain, stone veining, tile grout lines, light switch plates, door handle details. Every surface should show material-specific micro-details visible in real interior photography.',
    realisticTexture: 'REALISTIC TEXTURE: Apply photorealistic material textures - marble should show natural veining and translucency, wood should show grain and subtle color variation, fabric should show weave and drape, metal should show reflection and patina, concrete should show aggregate and surface variation. All textures must be physically accurate and consistent with lighting.',
    lightingPolish: 'LIGHTING POLISH: Refine all lighting to professional interior photography standards. Add natural window light with proper falloff, ambient fill light, accent lighting on key features, soft shadows with proper penumbra, light bounce and color bleed between surfaces, subtle specular highlights on appropriate materials. The result should look like a professional architectural photograph shot with a wide-angle lens on a medium format camera.'
  }
};

export function buildStage1Prompt(layoutLockPrompt: string, roomDescription: string): string {
  return `${STAGE_PROMPTS.stage1_layout.suffix}\n\nLAYOUT LOCK: ${layoutLockPrompt}\n\nROOM CONTEXT: ${roomDescription}`;
}

export function buildStage2Prompt(stylePrompt: string, layoutLockPrompt: string): string {
  return `${STAGE_PROMPTS.stage2_style.suffix}\n\nSTYLE: ${stylePrompt}\n\nLAYOUT LOCK: ${layoutLockPrompt}`;
}

export function buildStage3Prompt(options: RefinementOptions, styleName: string): string {
  const parts: string[] = [];
  if (options.upscale) parts.push(STAGE_PROMPTS.stage3_refine.upscale.replace('{resolution}', options.targetResolution));
  if (options.detailEnhance) parts.push(STAGE_PROMPTS.stage3_refine.detailEnhance);
  if (options.realisticTexture) parts.push(STAGE_PROMPTS.stage3_refine.realisticTexture);
  if (options.lightingPolish) parts.push(STAGE_PROMPTS.stage3_refine.lightingPolish);
  if (parts.length === 0) parts.push(STAGE_PROMPTS.stage3_refine.detailEnhance, STAGE_PROMPTS.stage3_refine.lightingPolish);
  return parts.join('\n\n') + `\n\nSTYLE CONTEXT: ${styleName} interior design. Output must look like a real architectural photograph from a professional interior design magazine.`;
}

export function calculateRefinementCost(options: RefinementOptions): number {
  let cost = 0;
  if (options.upscale) cost += 15;
  if (options.detailEnhance) cost += 10;
  if (options.realisticTexture) cost += 10;
  if (options.lightingPolish) cost += 10;
  if (cost === 0) cost = 20;
  return cost;
}

export function getRefinementDescription(options: RefinementOptions): string[] {
  const descs: string[] = [];
  if (options.upscale) descs.push('超清放大');
  if (options.detailEnhance) descs.push('细节增强');
  if (options.realisticTexture) descs.push('真实材质');
  if (options.lightingPolish) descs.push('光影精修');
  return descs;
}

export async function executeThreeStagePipeline(
  imageUrl: string,
  style: string,
  roomDescription: string,
  layoutLockPrompt: string,
  userLevel: 'free' | 'pro' | 'premium' = 'free',
  roomType: string = 'living_room',
): Promise<ThreeStageResult> {
  const stylePrompt = STYLE_MAP[style] || STYLE_MAP['现代简约'] || style;

  const stage1Prompt = buildStage1Prompt(layoutLockPrompt, roomDescription);
  const stage1Request: GatewayRequest = {
    promptInput: {
      roomType,
      style,
      customPrompt: stage1Prompt,
      hasReferenceImage: !!imageUrl,
      layoutLockPrompt,
    },
    userLevel,
    mode: 'quick_preview',
    imageUrl: imageUrl || undefined,
  };
  const stage1Result = await generate(stage1Request);

  const stage1OutputUrl = stage1Result.images[0] || imageUrl;
  const stage2Prompt = buildStage2Prompt(stylePrompt, layoutLockPrompt);
  const stage2Request: GatewayRequest = {
    promptInput: {
      roomType,
      style,
      customPrompt: stage2Prompt,
      hasReferenceImage: true,
      layoutLockPrompt,
    },
    userLevel,
    mode: userLevel === 'free' ? 'auto' : 'ultra_render',
    imageUrl: stage1OutputUrl || undefined,
  };
  const stage2Result = await generate(stage2Request);

  const finalImageUrl = stage2Result.images[0] || stage1Result.images[0] || '';

  return {
    stages: [
      {
        stage: 1,
        stageName: '空间布局',
        imageUrl: stage1Result.images[0] || '',
        prompt: stage1Prompt,
        metadata: { provider: stage1Result.provider, cost: stage1Result.cost, duration: stage1Result.duration },
      },
      {
        stage: 2,
        stageName: '风格生成',
        imageUrl: stage2Result.images[0] || '',
        prompt: stage2Prompt,
        metadata: { provider: stage2Result.provider, cost: stage2Result.cost, duration: stage2Result.duration },
      },
    ],
    finalImageUrl,
    totalCost: stage1Result.cost + stage2Result.cost,
    layoutLockPrompt,
  };
}

export async function executeRefinement(
  imageUrl: string,
  style: string,
  options: RefinementOptions,
  userLevel: 'free' | 'pro' | 'premium' = 'free',
  roomType: string = 'living_room',
): Promise<RefinementResult> {
  const prompt = buildStage3Prompt(options, style);
  const request: GatewayRequest = {
    promptInput: {
      roomType,
      style,
      customPrompt: prompt,
      hasReferenceImage: true,
    },
    userLevel,
    mode: 'ultra_render',
    imageUrl,
  };
  const result = await generate(request);

  const appliedRefinements: string[] = [];
  if (options.upscale) appliedRefinements.push('超清放大');
  if (options.detailEnhance) appliedRefinements.push('细节增强');
  if (options.realisticTexture) appliedRefinements.push('真实材质');
  if (options.lightingPolish) appliedRefinements.push('光影精修');

  return {
    originalUrl: imageUrl,
    refinedImageUrl: result.images[0] || imageUrl,
    appliedRefinements,
    cost: result.cost,
    stages: {
      upscale: options.upscale ? { applied: true, prompt: STAGE_PROMPTS.stage3_refine.upscale.replace('{resolution}', options.targetResolution) } : undefined,
      detailEnhance: options.detailEnhance ? { applied: true, prompt: STAGE_PROMPTS.stage3_refine.detailEnhance } : undefined,
      realisticTexture: options.realisticTexture ? { applied: true, prompt: STAGE_PROMPTS.stage3_refine.realisticTexture } : undefined,
      lightingPolish: options.lightingPolish ? { applied: true, prompt: STAGE_PROMPTS.stage3_refine.lightingPolish } : undefined,
    },
  };
}
