// AI Gateway - 统一入口，抽象所有 AI 模型调用

import { buildPrompt, buildChinesePrompt, type PromptInput } from './prompt-engine';
import { routeGeneration, routeQuickPreview, routeUltraRender, initModelRouter, type UserLevel } from './model-router';

export interface GatewayRequest {
  promptInput: PromptInput;
  userLevel: UserLevel;
  mode: 'auto' | 'quick_preview' | 'ultra_render';
  imageUrl?: string;
  styleReferenceImage?: string;
}

export interface GatewayResult {
  success: boolean;
  images: string[];
  provider: string;
  quality: string;
  cost: number;
  duration: number;
  prompt: string;
  mode: string;
  upgradeAvailable?: boolean;
}

// 确保初始化
initModelRouter();

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function generate(gatewayRequest: GatewayRequest): Promise<GatewayResult> {
  const { promptInput, userLevel, mode, imageUrl, styleReferenceImage } = gatewayRequest;

  // 构建提示词
  const { fullPrompt } = buildPrompt(promptInput);

  let routeDecision;
  let generationMode = mode;

  if (mode === 'quick_preview') {
    routeDecision = await routeQuickPreview();
    generationMode = 'quick_preview';
  } else if (mode === 'ultra_render') {
    routeDecision = await routeUltraRender();
    generationMode = 'ultra_render';
  } else {
    routeDecision = await routeGeneration(userLevel);
    generationMode = userLevel === 'free' ? 'quick_preview' : 'premium_render';
  }

  try {
    const result = await withTimeout(
      routeDecision.provider.generate({
        prompt: fullPrompt,
        n: 4,
        quality: routeDecision.quality as 'low' | 'medium' | 'high' | 'ultra',
        referenceImage: imageUrl,
        styleReferenceImage,
      }),
      120_000,
      routeDecision.provider.name,
    );

    return {
      success: true,
      images: result.images,
      provider: result.provider,
      quality: result.quality,
      cost: result.cost,
      duration: result.duration,
      prompt: fullPrompt,
      mode: generationMode,
      upgradeAvailable: userLevel === 'free',
    };
  } catch (error: any) {
    console.error(`[AI Gateway] ${routeDecision.provider.name} failed:`, error.message);

    // 按链路依次尝试后备 Provider
    for (const fallbackProvider of routeDecision.fallbackChain) {
      try {
        console.log(`[AI Gateway] Trying fallback: ${fallbackProvider.name}`);
        const fallbackResult = await withTimeout(
          fallbackProvider.generate({
            prompt: fullPrompt,
            n: 4,
            quality: generationMode === 'ultra_render' ? 'high' : 'medium',
            referenceImage: imageUrl,
            styleReferenceImage,
          }),
          90_000,
          fallbackProvider.name,
        );

        return {
          success: true,
          images: fallbackResult.images,
          provider: fallbackResult.provider,
          quality: fallbackResult.quality,
          cost: fallbackResult.cost,
          duration: fallbackResult.duration,
          prompt: fullPrompt,
          mode: generationMode,
          upgradeAvailable: userLevel === 'free',
        };
      } catch (fallbackError: any) {
        console.error(`[AI Gateway] ${fallbackProvider.name} also failed:`, fallbackError.message);
      }
    }

    throw error;
  }
}

// 两阶段生成：快速预览 → 超清渲染
export async function twoStageGenerate(
  promptInput: PromptInput,
  userLevel: UserLevel,
): Promise<{
  preview: GatewayResult;
  ultraRender?: GatewayResult;
}> {
  // 阶段1：快速预览
  const preview = await generate({
    promptInput,
    userLevel,
    mode: 'quick_preview',
  });

  // 如果用户是付费用户，直接进行阶段2
  if (userLevel === 'pro' || userLevel === 'premium') {
    const ultraRender = await generate({
      promptInput,
      userLevel,
      mode: 'ultra_render',
    });
    return { preview, ultraRender };
  }

  return { preview };
}