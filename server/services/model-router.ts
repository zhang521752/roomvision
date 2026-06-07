import { GPTImageProvider } from './providers/gpt-image';
import { NanoBananaProProvider } from './providers/gemini3';
import { Image2BackupProvider } from './providers/image2-backup';
import { DoubaoProvider } from './providers/doubao';
import { registerProvider, getProvider, type AIProvider } from './providers/base';

export type UserLevel = 'free' | 'pro' | 'premium';

export interface RouteDecision {
  provider: AIProvider;
  quality: string;
  reason: string;
  fallbackChain: AIProvider[];
}

let initialized = false;

export function initModelRouter(): void {
  if (initialized) return;
  initialized = true;

  const gptImage = new GPTImageProvider();
  const nanoBananaPro = new NanoBananaProProvider();
  const image2Backup = new Image2BackupProvider();

  registerProvider(gptImage);
  registerProvider(nanoBananaPro);
  registerProvider(image2Backup);

  console.log('[ModelRouter] Providers registered: image-2 (primary) → NanoBananaPro (backup) → image2-backup (fallback)');
}

async function routeWithFallbackChain(
  providers: { provider: AIProvider; quality: string; reason: string }[],
): Promise<RouteDecision> {
  for (let i = 0; i < providers.length; i++) {
    const { provider, quality, reason } = providers[i];
    const available = await provider.isAvailable();

    if (available) {
      const fallbackChain = providers.slice(i + 1).map(p => p.provider);
      return {
        provider,
        quality,
        reason,
        fallbackChain,
      };
    }
  }

  throw new Error('No AI provider available');
}

export async function routeGeneration(userLevel: UserLevel): Promise<RouteDecision> {
  if (!initialized) initModelRouter();

  const gptImage = getProvider('gpt-image')!;
  const nanoBananaPro = getProvider('nanobananapro')!;
  const image2Backup = getProvider('image2-backup')!;

  const quality = userLevel === 'premium' ? 'ultra' : userLevel === 'pro' ? 'high' : 'standard';

  return routeWithFallbackChain([
    { provider: gptImage, quality, reason: `User(${userLevel}) → image-2 (${quality})` },
    { provider: nanoBananaPro, quality, reason: `User(${userLevel}) → NanoBananaPro (${quality})` },
    { provider: image2Backup, quality, reason: `User(${userLevel}) → image2-backup (${quality})` },
  ]);
}

export async function routeQuickPreview(): Promise<RouteDecision> {
  if (!initialized) initModelRouter();

  const gptImage = getProvider('gpt-image')!;
  const nanoBananaPro = getProvider('nanobananapro')!;
  const image2Backup = getProvider('image2-backup')!;

  return routeWithFallbackChain([
    { provider: gptImage, quality: 'standard', reason: 'Quick preview → image-2' },
    { provider: nanoBananaPro, quality: 'standard', reason: 'Quick preview → NanoBananaPro' },
    { provider: image2Backup, quality: 'standard', reason: 'Quick preview → image2-backup' },
  ]);
}

export async function routeUltraRender(): Promise<RouteDecision> {
  if (!initialized) initModelRouter();

  const gptImage = getProvider('gpt-image')!;
  const nanoBananaPro = getProvider('nanobananapro')!;
  const image2Backup = getProvider('image2-backup')!;

  return routeWithFallbackChain([
    { provider: gptImage, quality: 'ultra', reason: 'Ultra render → image-2 HD' },
    { provider: nanoBananaPro, quality: 'ultra', reason: 'Ultra render → NanoBananaPro' },
    { provider: image2Backup, quality: 'ultra', reason: 'Ultra render → image2-backup' },
  ]);
}
