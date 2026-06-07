import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { AIProvider, GenerationRequest, GenerationResult } from './base';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 火山引擎方舟平台 API
const DOUBAO_API_BASE = 'https://ark.cn-beijing.volces.com/api/v3';

export class DoubaoProvider implements AIProvider {
  name = 'doubao';

  private get apiKey(): string {
    return process.env.DOUBAO_API_KEY || '';
  }

  private get model(): string {
    return process.env.DOUBAO_MODEL || 'doubao-seedream-4-5-251128';
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    // 如果有参考图，使用图生图模式
    if (request.referenceImage) {
      return this.generateWithReference(request, startTime);
    }

    // 无参考图，纯文生图
    return this.generateFromText(request, startTime);
  }

  private async generateFromText(request: GenerationRequest, startTime: number): Promise<GenerationResult> {
    const body: Record<string, any> = {
      model: this.model,
      prompt: request.prompt,
      size: request.quality === 'ultra' ? '4K' : '2K',
      n: request.n || 1,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      watermark: false,
    };

    const response = await fetch(`${DOUBAO_API_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Doubao API error: ${response.status} - ${err.substring(0, 300).replace(/[\n\r]/g, ' ')}`);
    }

    const data = await response.json() as any;
    const images = this.extractImages(data);

    const duration = Date.now() - startTime;
    const cost = images.length * 0.01;

    if (images.length === 0) {
      throw new Error('Doubao: no images generated');
    }

    return {
      provider: this.name,
      images,
      cost,
      duration,
      quality: request.quality || 'medium',
    };
  }

  private async generateWithReference(request: GenerationRequest, startTime: number): Promise<GenerationResult> {
    // 豆包 Seedream 4.5 图生图：使用 image 参数传入参考图
    const imageBase64 = await this.resolveImageToBase64(request.referenceImage!);

    const body: Record<string, any> = {
      model: this.model,
      prompt: request.prompt,
      image: imageBase64,  // Seedream 4.5 用 image 参数，支持 URL 或 Base64
      size: request.quality === 'ultra' ? '4K' : '2K',
      n: request.n || 1,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      watermark: false,
    };

    const response = await fetch(`${DOUBAO_API_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Doubao] Image reference failed: ${response.status} ${err}`);
      // fallback 到纯文生图
      return this.generateFromText(request, startTime);
    }

    const data = await response.json() as any;
    const images = this.extractImages(data);

    const duration = Date.now() - startTime;
    const cost = images.length * 0.01;

    if (images.length === 0) {
      console.log('[Doubao] Image reference returned no images, falling back to text generation');
      return this.generateFromText(request, startTime);
    }

    return {
      provider: this.name,
      images,
      cost,
      duration,
      quality: request.quality || 'medium',
    };
  }

  private extractImages(data: any): string[] {
    return (data.data || [])
      .map((img: any) => img.url || (img.b64_json ? `data:image/png;base64,${img.b64_json}` : null))
      .filter((url: string | null): url is string => url !== null);
  }

  private async resolveImageToBase64(imageUrl: string): Promise<string> {
    if (imageUrl.startsWith('data:')) return imageUrl;

    if (imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../../uploads', path.basename(imageUrl));
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        return `data:${mime};base64,${buffer.toString('base64')}`;
      }
    }

    if (imageUrl.startsWith('http')) {
      const resp = await fetch(imageUrl);
      if (resp.ok) {
        const buffer = Buffer.from(await resp.arrayBuffer());
        const contentType = resp.headers.get('content-type') || 'image/jpeg';
        return `data:${contentType};base64,${buffer.toString('base64')}`;
      }
    }

    throw new Error(`Cannot resolve image: ${imageUrl}`);
  }

  async isAvailable(): Promise<boolean> {
    const key = process.env.DOUBAO_API_KEY || '';
    if (!key) return false;
    if (key === 'your_doubao_api_key_here') return false;
    return true;
  }
}
