// AI Provider 接口定义 - 所有 AI 模型提供商的抽象层

export interface GenerationRequest {
  prompt: string;
  n?: number;
  size?: string;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  referenceImage?: string;
  styleReferenceImage?: string;
}

export interface GenerationResult {
  provider: string;
  images: string[];
  cost: number;
  duration: number;
  quality: string;
}

export interface AIProvider {
  name: string;
  generate(request: GenerationRequest): Promise<GenerationResult>;
  isAvailable(): Promise<boolean>;
}

// Provider 注册表
const providerRegistry: Map<string, AIProvider> = new Map();

export function registerProvider(provider: AIProvider): void {
  providerRegistry.set(provider.name, provider);
}

export function getProvider(name: string): AIProvider | undefined {
  return providerRegistry.get(name);
}

export function getAllProviders(): AIProvider[] {
  return Array.from(providerRegistry.values());
}