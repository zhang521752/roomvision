// Layout Lock Engine - 从房间照片中提取空间结构信息
// 用于增强 AI 生成提示词，确保生成结果保持原始房间结构

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface RoomStructure {
  // 消失点
  vanishingPoint: { x: number; y: number } | null;
  vanishingPointDesc: string;

  // 墙线
  wallLines: WallLine[];
  wallLinesDesc: string;

  // 窗户
  windows: DetectedRegion[];
  windowsDesc: string;

  // 地面
  floorRegion: { topRatio: number } | null;
  floorDesc: string;

  // 天花板
  ceilingRegion: { bottomRatio: number } | null;
  ceilingDesc: string;

  // 整体空间描述
  spatialDesc: string;

  // 画面构图
  compositionDesc: string;
}

export interface WallLine {
  angle: number; // 角度（度）
  position: 'left' | 'right' | 'top' | 'bottom' | 'center';
  length: number; // 相对长度 0-1
}

export interface DetectedRegion {
  x: number; // 中心 x 比例 0-1
  y: number; // 中心 y 比例 0-1
  widthRatio: number; // 宽度比例 0-1
  heightRatio: number; // 高度比例 0-1
}

// Sobel 边缘检测核
const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

/**
 * 从图片路径提取房间结构
 */
export async function extractRoomStructure(imagePath: string): Promise<RoomStructure> {
  // 读取并预处理图片
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  // 缩小图片加速处理
  const scale = Math.min(1, 400 / Math.max(width, height));
  const procWidth = Math.round(width * scale);
  const procHeight = Math.round(height * scale);

  // 获取灰度像素数据
  const { data, info } = await image
    .resize(procWidth, procHeight)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const w = info.width;
  const h = info.height;

  // 1. 边缘检测
  const edges = sobelEdgeDetect(pixels, w, h);

  // 2. 提取主要线段（简化版 Hough）
  const lines = detectLines(edges, w, h);

  // 3. 分析消失点
  const vanishingPoint = estimateVanishingPoint(lines, w, h);

  // 4. 检测窗户区域（亮区检测）
  const windows = detectBrightRegions(pixels, w, h, width, height);

  // 5. 估计地面和天花板区域
  const floorRegion = estimateFloorRegion(edges, w, h);
  const ceilingRegion = estimateCeilingRegion(edges, w, h);

  // 6. 分类墙线
  const wallLines = classifyWallLines(lines, w, h);

  // 7. 生成描述文本
  return buildStructureReport(vanishingPoint, wallLines, windows, floorRegion, ceilingRegion, width, height);
}

/**
 * Sobel 边缘检测
 */
function sobelEdgeDetect(pixels: Uint8Array, w: number, h: number): Float32Array {
  const edges = new Float32Array(w * h);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * w + (x + kx);
          const val = pixels[idx] || 0;
          gx += val * SOBEL_X[ky + 1][kx + 1];
          gy += val * SOBEL_Y[ky + 1][kx + 1];
        }
      }
      edges[y * w + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return edges;
}

/**
 * 简化版线段检测
 * 将边缘图按角度分桶，找出主要直线方向
 */
function detectLines(edges: Float32Array, w: number, h: number): { angle: number; rho: number; strength: number }[] {
  const threshold = 50;
  const angleBins = 180;
  const rhoMax = Math.ceil(Math.sqrt(w * w + h * h));
  const accumulator: number[][] = [];

  for (let a = 0; a < angleBins; a++) {
    accumulator[a] = new Array(rhoMax * 2).fill(0);
  }

  // Hough 变换投票
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (edges[y * w + x] < threshold) continue;

      for (let a = 0; a < angleBins; a++) {
        const theta = (a * Math.PI) / angleBins;
        const rho = Math.round(x * Math.cos(theta) + y * Math.sin(theta)) + rhoMax;
        if (rho >= 0 && rho < rhoMax * 2) {
          accumulator[a][rho]++;
        }
      }
    }
  }

  // 提取峰值
  const lines: { angle: number; rho: number; strength: number }[] = [];
  const minVotes = Math.max(20, w * 0.08);

  for (let a = 0; a < angleBins; a++) {
    for (let r = 0; r < rhoMax * 2; r++) {
      if (accumulator[a][r] >= minVotes) {
        // 局部最大值检测
        const val = accumulator[a][r];
        let isMax = true;
        for (let da = -2; da <= 2 && isMax; da++) {
          for (let dr = -3; dr <= 3 && isMax; dr++) {
            if (da === 0 && dr === 0) continue;
            const na = (a + da + angleBins) % angleBins;
            const nr = r + dr;
            if (nr >= 0 && nr < rhoMax * 2 && accumulator[na][nr] > val) {
              isMax = false;
            }
          }
        }
        if (isMax) {
          lines.push({
            angle: (a * 180) / angleBins,
            rho: r - rhoMax,
            strength: val,
          });
        }
      }
    }
  }

  // 按强度排序，取前 20 条
  lines.sort((a, b) => b.strength - a.strength);
  return lines.slice(0, 20);
}

/**
 * 估计消失点
 * 通过水平线段的交点聚类
 */
function estimateVanishingPoint(
  lines: { angle: number; rho: number; strength: number }[],
  w: number,
  h: number,
): { x: number; y: number } | null {
  // 找出接近水平的线（角度在 -10° ~ 10° 或 170° ~ 190°）
  const horizontalLines = lines.filter((l) => l.angle < 15 || l.angle > 165);
  // 找出接近垂直的线
  const verticalLines = lines.filter((l) => l.angle > 75 && l.angle < 105);

  // 如果有明显的透视线条（非水平非垂直），找它们的交点
  const perspectiveLines = lines.filter((l) => {
    const a = l.angle;
    return (a > 15 && a < 75) || (a > 105 && a < 165);
  });

  if (perspectiveLines.length >= 2) {
    // 计算透视线的交点
    const intersections: { x: number; y: number }[] = [];

    for (let i = 0; i < Math.min(perspectiveLines.length, 8); i++) {
      for (let j = i + 1; j < Math.min(perspectiveLines.length, 8); j++) {
        const pt = lineIntersection(perspectiveLines[i], perspectiveLines[j], w, h);
        if (pt && pt.x > -w && pt.x < w * 2 && pt.y > -h && pt.y < h * 2) {
          intersections.push(pt);
        }
      }
    }

    if (intersections.length > 0) {
      // 取中位数作为消失点
      intersections.sort((a, b) => a.x - b.x);
      const medianX = intersections[Math.floor(intersections.length / 2)].x;
      intersections.sort((a, b) => a.y - b.y);
      const medianY = intersections[Math.floor(intersections.length / 2)].y;

      return { x: medianX / w, y: medianY / h };
    }
  }

  // 如果有水平线和垂直线，推测消失点在画面中心偏上
  if (horizontalLines.length > 0 || verticalLines.length > 0) {
    // 一点透视：消失点通常在画面中心偏上
    return { x: 0.5, y: 0.35 };
  }

  return null;
}

/**
 * 两条 Hough 线的交点
 */
function lineIntersection(
  line1: { angle: number; rho: number },
  line2: { angle: number; rho: number },
  _w: number,
  _h: number,
): { x: number; y: number } | null {
  const t1 = (line1.angle * Math.PI) / 180;
  const t2 = (line2.angle * Math.PI) / 180;
  const r1 = line1.rho;
  const r2 = line2.rho;

  const det = Math.cos(t1) * Math.sin(t2) - Math.sin(t1) * Math.cos(t2);
  if (Math.abs(det) < 0.001) return null;

  const x = (r1 * Math.sin(t2) - r2 * Math.sin(t1)) / det;
  const y = (r2 * Math.cos(t1) - r1 * Math.cos(t2)) / det;

  return { x, y };
}

/**
 * 检测亮区（可能是窗户）
 */
function detectBrightRegions(pixels: Uint8Array, w: number, h: number, origW: number, origH: number): DetectedRegion[] {
  const windows: DetectedRegion[] = [];
  const blockSize = Math.max(8, Math.floor(w / 20));

  // 计算每个块的亮度
  const blocks: { x: number; y: number; brightness: number }[] = [];
  for (let by = 0; by < h - blockSize; by += blockSize) {
    for (let bx = 0; bx < w - blockSize; bx += blockSize) {
      let sum = 0;
      let count = 0;
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          sum += pixels[(by + dy) * w + (bx + dx)];
          count++;
        }
      }
      blocks.push({ x: bx, y: by, brightness: sum / count });
    }
  }

  // 计算整体亮度
  const avgBrightness = blocks.reduce((s, b) => s + b.brightness, 0) / blocks.length;
  const brightThreshold = avgBrightness * 1.6;

  // 找出高亮区域
  const brightBlocks = blocks.filter((b) => b.brightness > brightThreshold);

  // 聚类相邻的高亮块
  const visited = new Set<number>();
  const clusters: { blocks: { x: number; y: number }[] }[] = [];

  for (let i = 0; i < brightBlocks.length; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    const cluster = { blocks: [{ x: brightBlocks[i].x, y: brightBlocks[i].y }] };
    const queue = [i];

    while (queue.length > 0) {
      const ci = queue.shift()!;
      for (let j = 0; j < brightBlocks.length; j++) {
        if (visited.has(j)) continue;
        const dx = Math.abs(brightBlocks[ci].x - brightBlocks[j].x);
        const dy = Math.abs(brightBlocks[ci].y - brightBlocks[j].y);
        if (dx <= blockSize * 1.5 && dy <= blockSize * 1.5) {
          visited.add(j);
          cluster.blocks.push({ x: brightBlocks[j].x, y: brightBlocks[j].y });
          queue.push(j);
        }
      }
    }

    clusters.push(cluster);
  }

  // 过滤：只保留面积足够大的聚类（至少 2x2 块）
  for (const cluster of clusters) {
    if (cluster.blocks.length < 4) continue;

    const xs = cluster.blocks.map((b) => b.x);
    const ys = cluster.blocks.map((b) => b.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) + blockSize;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) + blockSize;

    const cx = (minX + maxX) / 2 / w;
    const cy = (minY + maxY) / 2 / h;
    const cw = (maxX - minX) / w;
    const ch = (maxY - minY) / h;

    // 窗户通常在画面上半部分
    if (cy < 0.7 && cw > 0.05 && ch > 0.05) {
      windows.push({
        x: cx,
        y: cy,
        widthRatio: cw,
        heightRatio: ch,
      });
    }
  }

  return windows.slice(0, 4); // 最多 4 个窗户
}

/**
 * 估计地面区域
 */
function estimateFloorRegion(edges: Float32Array, w: number, h: number): { topRatio: number } | null {
  // 地面通常在画面下半部分，有较多的水平纹理
  // 从底部向上扫描，找到水平边缘密度骤降的位置
  const rowEdges: number[] = [];
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = 0; x < w; x++) {
      sum += edges[y * w + x];
    }
    rowEdges.push(sum / w);
  }

  // 从画面 50% 位置向下找地面起始线
  const startY = Math.floor(h * 0.4);
  let maxDrop = 0;
  let floorTop = h * 0.6;

  for (let y = startY; y < h * 0.8; y++) {
    const drop = rowEdges[y] - (rowEdges[y + 1] || 0);
    if (drop > maxDrop) {
      maxDrop = drop;
      floorTop = y;
    }
  }

  return { topRatio: floorTop / h };
}

/**
 * 估计天花板区域
 */
function estimateCeilingRegion(edges: Float32Array, w: number, h: number): { bottomRatio: number } | null {
  // 天花板通常在画面上方，边缘较少
  // 从顶部向下扫描，找到边缘密度增加的位置
  const rowEdges: number[] = [];
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = 0; x < w; x++) {
      sum += edges[y * w + x];
    }
    rowEdges.push(sum / w);
  }

  // 从画面 20% 位置向上找天花板底线
  let maxRise = 0;
  let ceilingBottom = h * 0.15;

  for (let y = 1; y < h * 0.4; y++) {
    const rise = rowEdges[y] - (rowEdges[y - 1] || 0);
    if (rise > maxRise) {
      maxRise = rise;
      ceilingBottom = y;
    }
  }

  return { bottomRatio: ceilingBottom / h };
}

/**
 * 分类墙线
 */
function classifyWallLines(
  lines: { angle: number; rho: number; strength: number }[],
  w: number,
  h: number,
): WallLine[] {
  const wallLines: WallLine[] = [];

  for (const line of lines) {
    const a = line.angle;
    let position: WallLine['position'];
    let length: number;

    if (a < 15 || a > 165) {
      // 水平线
      const y = Math.abs(line.rho) / h;
      position = y < 0.3 ? 'top' : y > 0.7 ? 'bottom' : 'center';
      length = 0.8;
    } else if (a > 75 && a < 105) {
      // 垂直线
      const x = Math.abs(line.rho) / w;
      position = x < 0.3 ? 'left' : x > 0.7 ? 'right' : 'center';
      length = 0.8;
    } else {
      // 透视线
      position = a < 90 ? 'left' : 'right';
      length = 0.5 + (line.strength / 100) * 0.5;
    }

    wallLines.push({ angle: a, position, length: Math.min(1, length) });
  }

  return wallLines.slice(0, 10);
}

/**
 * 生成结构描述报告
 */
function buildStructureReport(
  vanishingPoint: { x: number; y: number } | null,
  wallLines: WallLine[],
  windows: DetectedRegion[],
  floorRegion: { topRatio: number } | null,
  ceilingRegion: { bottomRatio: number } | null,
  origW: number,
  origH: number,
): RoomStructure {
  // 消失点描述
  let vanishingPointDesc = '';
  if (vanishingPoint) {
    const vx = vanishingPoint.x;
    const vy = vanishingPoint.y;

    if (vx > 0.35 && vx < 0.65 && vy < 0.5) {
      vanishingPointDesc = 'one-point perspective with vanishing point at center-upper area';
    } else if (vx < 0.35) {
      vanishingPointDesc = 'two-point perspective with primary vanishing point on the left';
    } else if (vx > 0.65) {
      vanishingPointDesc = 'two-point perspective with primary vanishing point on the right';
    } else {
      vanishingPointDesc = 'perspective view with vanishing point near center';
    }
  }

  // 墙线描述
  const leftWalls = wallLines.filter((l) => l.position === 'left').length;
  const rightWalls = wallLines.filter((l) => l.position === 'right').length;
  const topWalls = wallLines.filter((l) => l.position === 'top').length;
  const bottomWalls = wallLines.filter((l) => l.position === 'bottom').length;

  let wallLinesDesc = '';
  const wallParts: string[] = [];
  if (leftWalls > 0) wallParts.push(`left wall with ${leftWalls} edge line${leftWalls > 1 ? 's' : ''}`);
  if (rightWalls > 0) wallParts.push(`right wall with ${rightWalls} edge line${rightWalls > 1 ? 's' : ''}`);
  if (topWalls > 0) wallParts.push('ceiling line visible');
  if (bottomWalls > 0) wallParts.push('floor line visible');
  wallLinesDesc = wallParts.length > 0 ? wallParts.join(', ') : 'wall structure detected';

  // 窗户描述
  let windowsDesc = '';
  if (windows.length === 0) {
    windowsDesc = 'no windows detected';
  } else {
    const windowParts = windows.map((w, i) => {
      const hPos = w.x < 0.35 ? 'left' : w.x > 0.65 ? 'right' : 'center';
      const vPos = w.y < 0.35 ? 'upper' : w.y > 0.65 ? 'lower' : 'middle';
      const size = w.widthRatio > 0.3 ? 'large' : w.widthRatio > 0.15 ? 'medium' : 'small';
      return `${size} window ${i + 1} at ${hPos}-${vPos} area`;
    });
    windowsDesc = `${windows.length} window${windows.length > 1 ? 's' : ''} detected: ${windowParts.join(', ')}`;
  }

  // 地面描述
  let floorDesc = '';
  if (floorRegion) {
    const floorPct = Math.round((1 - floorRegion.topRatio) * 100);
    floorDesc = `floor occupies approximately ${floorPct}% of the frame from bottom`;
  } else {
    floorDesc = 'floor region detected';
  }

  // 天花板描述
  let ceilingDesc = '';
  if (ceilingRegion) {
    const ceilPct = Math.round(ceilingRegion.bottomRatio * 100);
    ceilingDesc = `ceiling occupies approximately ${ceilPct}% of the frame from top`;
  } else {
    ceilingDesc = 'ceiling region detected';
  }

  // 构图描述
  const aspectRatio = origW / origH;
  let compositionDesc = '';
  if (aspectRatio > 1.5) {
    compositionDesc = 'wide panoramic composition';
  } else if (aspectRatio > 1.1) {
    compositionDesc = 'standard landscape composition';
  } else if (aspectRatio > 0.9) {
    compositionDesc = 'square composition';
  } else {
    compositionDesc = 'portrait composition';
  }

  // 整体空间描述
  const spatialParts: string[] = [];

  if (vanishingPointDesc) spatialParts.push(vanishingPointDesc);
  if (wallLinesDesc) spatialParts.push(wallLinesDesc);
  if (windowsDesc !== 'no windows detected') spatialParts.push(windowsDesc);
  if (floorDesc) spatialParts.push(floorDesc);
  if (ceilingDesc) spatialParts.push(ceilingDesc);

  const spatialDesc = spatialParts.join('. ');

  return {
    vanishingPoint,
    vanishingPointDesc,
    wallLines,
    wallLinesDesc,
    windows,
    windowsDesc,
    floorRegion,
    floorDesc,
    ceilingRegion,
    ceilingDesc,
    spatialDesc,
    compositionDesc,
  };
}

/**
 * 使用 GPT-4o-mini Vision 进行深度结构分析
 * 补充 OpenCV 无法精确提取的信息
 */
export async function aiDepthAnalysis(imageUrl: string, port: number): Promise<AIDepthResult | null> {
  const baseURL = process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!baseURL || !apiKey) return null;

  try {
    const fullImageUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `http://localhost:${port}${imageUrl}`;

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this room photo for spatial structure. Return ONLY a JSON object with these fields:
1. "perspective": "one-point" | "two-point" | "three-point"
2. "wallCount": number of visible walls (1-4)
3. "windowCount": number of windows visible
4. "windowPositions": array of positions like ["left wall", "right wall", "back wall"]
5. "doorCount": number of doors visible
6. "doorPositions": array of positions
7. "floorType": "wood" | "tile" | "carpet" | "concrete" | "marble" | "other"
8. "ceilingType": "flat" | "vaulted" | "dropped" | "exposed beams"
9. "roomShape": "rectangular" | "square" | "L-shaped" | "open plan"
10. "dominantViewDirection": "toward window" | "toward door" | "along wall" | "corner view"
11. "spatialDescription": one precise English sentence describing the spatial layout (e.g., "rectangular room viewed from the doorway, with a large window on the right wall and the back wall straight ahead")
12. "depthZones": array of 3 zones from near to far, each with {"range": "0-30%", "content": "description of what's in this depth zone"}

Return ONLY valid JSON, no other text.`,
              },
              {
                type: 'image_url',
                image_url: { url: fullImageUrl },
              },
            ],
          },
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as AIDepthResult;
  } catch (error: any) {
    console.error('[LayoutLock] AI depth analysis failed:', error.message);
    return null;
  }
}

export interface AIDepthResult {
  perspective: string;
  wallCount: number;
  windowCount: number;
  windowPositions: string[];
  doorCount: number;
  doorPositions: string[];
  floorType: string;
  ceilingType: string;
  roomShape: string;
  dominantViewDirection: string;
  spatialDescription: string;
  depthZones: { range: string; content: string }[];
}

/**
 * 将结构信息转化为精确的 Layout Lock 提示词
 */
export function buildLayoutLockPrompt(
  structure: RoomStructure,
  aiDepth?: AIDepthResult | null,
): string {
  const parts: string[] = [];

  // === 核心结构锁定 ===
  parts.push('LAYOUT LOCK - CRITICAL STRUCTURAL CONSTRAINTS:');

  // 透视
  if (structure.vanishingPointDesc) {
    parts.push(`Camera perspective: ${structure.vanishingPointDesc}`);
  }
  if (aiDepth?.perspective) {
    parts.push(`Perspective type: ${aiDepth.perspective} perspective`);
  }

  // 墙壁
  if (structure.wallLinesDesc) {
    parts.push(`Wall structure: ${structure.wallLinesDesc}`);
  }
  if (aiDepth?.wallCount) {
    parts.push(`${aiDepth.wallCount} wall${aiDepth.wallCount > 1 ? 's' : ''} visible`);
  }
  if (aiDepth?.roomShape) {
    parts.push(`Room shape: ${aiDepth.roomShape}`);
  }

  // 窗户 - 精确位置锁定
  if (structure.windows.length > 0) {
    parts.push(`Window lock: ${structure.windowsDesc}`);
    parts.push('MUST keep all windows in their exact positions and sizes');
  }
  if (aiDepth?.windowCount) {
    const positions = aiDepth.windowPositions?.join(', ') || '';
    parts.push(`${aiDepth.windowCount} window${aiDepth.windowCount > 1 ? 's' : ''}${positions ? ` on ${positions}` : ''}, positions must remain unchanged`);
  }

  // 门
  if (aiDepth?.doorCount) {
    const positions = aiDepth.doorPositions?.join(', ') || '';
    parts.push(`${aiDepth.doorCount} door${aiDepth.doorCount > 1 ? 's' : ''}${positions ? ` on ${positions}` : ''}, positions must remain unchanged`);
  }

  // 地面
  if (structure.floorDesc) {
    parts.push(`Floor: ${structure.floorDesc}`);
  }
  if (aiDepth?.floorType) {
    parts.push(`Floor type: ${aiDepth.floorType} floor`);
  }

  // 天花板
  if (structure.ceilingDesc) {
    parts.push(`Ceiling: ${structure.ceilingDesc}`);
  }
  if (aiDepth?.ceilingType) {
    parts.push(`Ceiling type: ${aiDepth.ceilingType}`);
  }

  // 深度区域
  if (aiDepth?.depthZones && aiDepth.depthZones.length > 0) {
    parts.push('Depth zones (near to far):');
    for (const zone of aiDepth.depthZones) {
      parts.push(`  - ${zone.range} depth: ${zone.content}`);
    }
  }

  // 视线方向
  if (aiDepth?.dominantViewDirection) {
    parts.push(`View direction: ${aiDepth.dominantViewDirection}`);
  }

  // 构图
  if (structure.compositionDesc) {
    parts.push(`Composition: ${structure.compositionDesc}`);
  }

  // AI 空间描述（最高优先级）
  if (aiDepth?.spatialDescription) {
    parts.push(`Spatial layout: ${aiDepth.spatialDescription}`);
  }

  // === 强制约束 ===
  parts.push('MANDATORY: The generated image MUST preserve the exact room geometry, wall positions, window positions, door positions, and ceiling height from the reference photo. Only change interior decoration, furniture, colors, and materials.');

  return parts.join('. ');
}

/**
 * 从 URL 或本地路径解析图片并提取结构
 */
export async function extractStructureFromUrl(
  imageUrl: string,
  uploadsDir: string,
): Promise<RoomStructure | null> {
  try {
    let filePath: string;

    if (imageUrl.startsWith('/uploads/')) {
      filePath = path.join(uploadsDir, path.basename(imageUrl));
    } else if (imageUrl.startsWith('http')) {
      // 下载远程图片到临时文件
      const resp = await fetch(imageUrl);
      if (!resp.ok) return null;
      const buffer = Buffer.from(await resp.arrayBuffer());
      const tmpPath = path.join(uploadsDir, `tmp-structure-${Date.now()}.jpg`);
      fs.writeFileSync(tmpPath, buffer);
      filePath = tmpPath;
      // 清理会在后面做
    } else if (imageUrl.startsWith('data:')) {
      // base64 图片
      const matches = imageUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (!matches) return null;
      const buffer = Buffer.from(matches[1], 'base64');
      const tmpPath = path.join(uploadsDir, `tmp-structure-${Date.now()}.jpg`);
      fs.writeFileSync(tmpPath, buffer);
      filePath = tmpPath;
    } else {
      return null;
    }

    if (!fs.existsSync(filePath)) return null;

    const structure = await extractRoomStructure(filePath);

    // 清理临时文件
    if (filePath.includes('tmp-structure-')) {
      try { fs.unlinkSync(filePath); } catch {}
    }

    return structure;
  } catch (error: any) {
    console.error('[LayoutLock] Structure extraction failed:', error.message);
    return null;
  }
}
