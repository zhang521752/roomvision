import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { AIProvider, GenerationRequest, GenerationResult } from './base';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class NanoBananaProProvider implements AIProvider {
  name = 'nanobananapro';

  private get apiKey(): string {
    return process.env.GEMINI3_API_KEY || '';
  }

  private get baseURL(): string {
    return process.env.GEMINI3_BASE_URL || 'https://api.openai.com/v1';
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    if (request.referenceImage) {
      return this.generateWithReference(request, startTime);
    }

    return this.generateFromText(request, startTime);
  }

  private async generateFromText(request: GenerationRequest, startTime: number): Promise<GenerationResult> {
    // 尝试使用 images/generations 接口
    try {
      const imageBody: Record<string, any> = {
        model: 'NanoBanana',
        prompt: request.prompt,
        n: 1,
        size: '1024x1024',
      };

      const imageResponse = await fetch(`${this.baseURL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(imageBody),
      });

      if (imageResponse.ok) {
        const imageResult = await imageResponse.json() as any;
        const images = (imageResult.data || [])
          .map((d: any) => d.url || d.b64_json)
          .filter((url: string | null): url is string => url !== null);

        if (images.length > 0) {
          const duration = Date.now() - startTime;
          const cost = images.length * 0.03;
          return { provider: this.name, images, cost, duration, quality: request.quality || 'high' };
        }
      }
    } catch (_err: any) {
      console.log(`[NanoBananaPro] Images API failed, trying chat completions`);
    }

    // 通过 chat completions 出图
    const chatBody: Record<string, any> = {
      model: 'NanoBanana',
      messages: [
        { role: 'user', content: `Generate an image: ${request.prompt}` },
      ],
    };

    const chatResponse = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(chatBody),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      throw new Error(`NanoBananaPro ${chatResponse.status}: ${errorText.substring(0, 300).replace(/[\n\r]/g, ' ')}`);
    }

    const chatResult = await chatResponse.json() as any;
    const images = this.extractImagesFromChat(chatResult);

    const duration = Date.now() - startTime;
    const cost = images.length * 0.03;

    if (images.length === 0) {
      throw new Error('NanoBananaPro: no images generated');
    }

    return { provider: this.name, images, cost, duration, quality: request.quality || 'high' };
  }

  private async generateWithReference(request: GenerationRequest, startTime: number): Promise<GenerationResult> {
    const imageBase64 = await this.resolveImageToBase64(request.referenceImage!);

    const contentParts: any[] = [
      {
        type: 'image_url',
        image_url: { url: imageBase64 },
      },
    ];

    if (request.styleReferenceImage) {
      try {
        const styleBase64 = await this.resolveImageToBase64(request.styleReferenceImage);
        contentParts.push({
          type: 'image_url',
          image_url: { url: styleBase64 },
        });
      } catch (e) {
        console.log(`[NanoBananaPro] Could not resolve style reference: ${(e as Error).message?.substring(0, 100)}`);
      }
    }

    contentParts.push({
      type: 'text',
      text: request.prompt,
    });

    const chatBody: Record<string, any> = {
      model: 'NanoBanana',
      messages: [
        {
          role: 'user',
          content: contentParts,
        },
      ],
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(chatBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NanoBananaPro] Chat+vision failed: ${response.status} ${errorText}`);
      // fallback 到纯文生图
      return this.generateFromText(request, startTime);
    }

    const result = await response.json() as any;
    const images = this.extractImagesFromChat(result);

    const duration = Date.now() - startTime;
    const cost = images.length * 0.03;

    if (images.length === 0) {
      console.log('[NanoBananaPro] Chat+vision returned no images, falling back to text generation');
      return this.generateFromText(request, startTime);
    }

    return { provider: this.name, images, cost, duration, quality: request.quality || 'high' };
  }

  private extractImagesFromChat(chatResult: any): string[] {
    const images: string[] = [];
    const choice = chatResult.choices?.[0];
    if (choice?.message?.content) {
      const content = choice.message.content;
      if (typeof content === 'string') {
        const urlMatch = content.match(/https?:\/\/[^\s"')\]]+/);
        if (urlMatch) images.push(urlMatch[0]);
        const b64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (b64Match) images.push(b64Match[0]);
      } else if (Array.isArray(content)) {
        for (const part of content as any[]) {
          if (part.type === 'image_url' && part.image_url?.url) images.push(part.image_url.url);
          else if (part.type === 'image' && part.source?.url) images.push(part.source.url);
          else if (part.type === 'image' && part.source?.data) images.push(`data:image/png;base64,${part.source.data}`);
        }
      }
    }
    return images;
  }

  private async resolveImageToBase64(imageUrl: string): Promise<string> {
    if (imageUrl.startsWith('data:')) return imageUrl;

    if (imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../../uploads', path.basename(imageUrl));
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext === 'png' ? 'png' : ext === 'webp' ? 'webp' : 'jpeg';
        return `data:image/${mime};base64,${buffer.toString('base64')}`;
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
    return !!(process.env.GEMINI3_API_KEY && process.env.GEMINI3_BASE_URL);
  }
}
