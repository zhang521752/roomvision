import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { AIProvider, GenerationRequest, GenerationResult } from './base';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Image2BackupProvider implements AIProvider {
  name = 'image2-backup';

  private get apiKey(): string {
    return process.env.IMAGE2_BACKUP_API_KEY || '';
  }

  private get baseURL(): string {
    return process.env.IMAGE2_BACKUP_BASE_URL || 'https://api.openai.com/v1';
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    if (request.referenceImage) {
      try {
        return await this.generateWithEdit(request, startTime);
      } catch (editError: any) {
        console.log(`[Image2-Backup] Edit API failed: ${editError.message}, trying chat vision`);
        try {
          return await this.generateWithChatVision(request, startTime);
        } catch (chatError: any) {
          console.log(`[Image2-Backup] Chat vision also failed: ${chatError.message}, falling back to text`);
          return this.generateFromText(request, startTime);
        }
      }
    }

    return this.generateFromText(request, startTime);
  }

  private async generateFromText(request: GenerationRequest, startTime: number): Promise<GenerationResult> {
    const body: Record<string, any> = {
      model: 'gpt-image-2',
      prompt: request.prompt,
      n: request.n || 1,
      size: request.quality === 'ultra' ? '1792x1024' : '1024x1024',
      quality: request.quality === 'ultra' ? 'hd' : 'standard',
    };

    const response = await fetch(`${this.baseURL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const shortError = errorText.substring(0, 300).replace(/[\n\r]/g, ' ');
      throw new Error(`Image2-Backup generations ${response.status}: ${shortError}`);
    }

    const result = await response.json() as any;
    const images = this.extractImages(result);

    const duration = Date.now() - startTime;
    const cost = images.length * (request.quality === 'ultra' ? 0.08 : 0.04);

    if (images.length === 0) {
      throw new Error('Image2-Backup: no images generated');
    }

    return { provider: this.name, images, cost, duration, quality: request.quality || 'high' };
  }

  private async generateWithEdit(request: GenerationRequest, startTime: number): Promise<GenerationResult> {
    const imageBuffer = await this.resolveImageToBuffer(request.referenceImage!);
    const ext = this.getImageExt(request.referenceImage!);
    const filename = `image.${ext}`;

    const formData = new FormData();
    formData.append('model', 'gpt-image-2');
    formData.append('prompt', request.prompt);
    formData.append('n', String(request.n || 1));
    formData.append('size', request.quality === 'ultra' ? '1792x1024' : '1024x1024');

    const blob = new Blob([imageBuffer], { type: ext === 'png' ? 'image/png' : 'image/jpeg' });
    formData.append('image', blob, filename);

    const response = await fetch(`${this.baseURL}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const shortError = errorText.substring(0, 300).replace(/[\n\r]/g, ' ');
      throw new Error(`Image2-Backup edits ${response.status}: ${shortError}`);
    }

    const result = await response.json() as any;
    const images = this.extractImages(result);

    const duration = Date.now() - startTime;
    const cost = images.length * (request.quality === 'ultra' ? 0.08 : 0.04);

    if (images.length === 0) {
      throw new Error('Image2-Backup edits: no images generated');
    }

    return { provider: this.name, images, cost, duration, quality: request.quality || 'high' };
  }

  private async generateWithChatVision(request: GenerationRequest, startTime: number): Promise<GenerationResult> {
    const imageBase64 = await this.resolveImageToBase64(request.referenceImage!);

    const contentParts: any[] = [
      { type: 'image_url', image_url: { url: imageBase64 } },
    ];

    if (request.styleReferenceImage) {
      try {
        const styleBase64 = await this.resolveImageToBase64(request.styleReferenceImage);
        contentParts.push({ type: 'image_url', image_url: { url: styleBase64 } });
      } catch (e) {
        console.log(`[Image2-Backup] Could not resolve style reference: ${(e as Error).message?.substring(0, 100)}`);
      }
    }

    contentParts.push({ type: 'text', text: request.prompt });

    const chatBody: Record<string, any> = {
      model: 'gpt-image-2',
      messages: [
        {
          role: 'user',
          content: contentParts,
        },
      ],
      n: request.n || 1,
      size: request.quality === 'ultra' ? '1792x1024' : '1024x1024',
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
      const shortError = errorText.substring(0, 300).replace(/[\n\r]/g, ' ');
      throw new Error(`Image2-Backup chat ${response.status}: ${shortError}`);
    }

    const result = await response.json() as any;
    const images: string[] = [];

    const choices = result.choices || [];
    for (const choice of choices) {
      const content = choice.message?.content;
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

    if (images.length === 0 && result.data) {
      for (const img of result.data) {
        if (img.url) images.push(img.url);
        else if (img.b64_json) images.push(`data:image/png;base64,${img.b64_json}`);
      }
    }

    const duration = Date.now() - startTime;
    const cost = images.length * (request.quality === 'ultra' ? 0.08 : 0.04);

    if (images.length === 0) {
      throw new Error('Image2-Backup chat: no images generated');
    }

    return { provider: this.name, images, cost, duration, quality: request.quality || 'high' };
  }

  private extractImages(result: any): string[] {
    return (result.data || [])
      .map((img: any) => img.url || (img.b64_json ? `data:image/png;base64,${img.b64_json}` : null))
      .filter((url: string | null): url is string => url !== null);
  }

  private async resolveImageToBuffer(imageUrl: string): Promise<Buffer> {
    if (imageUrl.startsWith('data:')) {
      const base64 = imageUrl.split(',')[1];
      return Buffer.from(base64, 'base64');
    }
    if (imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../../../uploads', path.basename(imageUrl));
      if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
    }
    if (imageUrl.startsWith('http')) {
      const resp = await fetch(imageUrl);
      if (resp.ok) return Buffer.from(await resp.arrayBuffer());
    }
    throw new Error(`Cannot resolve image: ${imageUrl}`);
  }

  private async resolveImageToBase64(imageUrl: string): Promise<string> {
    if (imageUrl.startsWith('data:')) return imageUrl;
    const buffer = await this.resolveImageToBuffer(imageUrl);
    if (imageUrl.startsWith('/uploads/')) {
      const ext = this.getImageExt(imageUrl);
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${buffer.toString('base64')}`;
    }
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }

  private getImageExt(imageUrl: string): string {
    const ext = path.extname(imageUrl).toLowerCase().replace('.', '');
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return ext === 'jpg' ? 'jpeg' : ext;
    return 'jpeg';
  }

  async isAvailable(): Promise<boolean> {
    const apiKey = process.env.IMAGE2_BACKUP_API_KEY;
    return !!apiKey && apiKey.length > 10;
  }
}
