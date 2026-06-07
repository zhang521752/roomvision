// Inspiration Feed 数据源 - 精选室内设计灵感
// 每条灵感包含：图片、风格标签、房间类型、描述、AI 提示词

function proxyUrl(url: string): string {
  if (url.startsWith('https://images.unsplash.com')) {
    return '/api/image-proxy?url=' + encodeURIComponent(url);
  }
  return url;
}

export interface InspirationItem {
  id: string;
  imageUrl: string;
  style: string;
  styleEn: string;
  roomType: string;
  roomTypeEn: string;
  title: string;
  description: string;
  tags: string[];
  promptHint: string; // 用于 AI 生成的提示词片段
  aspectRatio: number; // 宽高比，用于瀑布流布局
  likes: number;
  source: 'ai' | 'curated'; // AI 生成或人工精选
}

// 风格对应的背景图（使用已有的 public/styles 目录）
const STYLE_IMAGES: Record<string, string> = {
  '现代简约': '/styles/现代简约.png',
  '北欧': '/styles/北欧风格.png',
  '工业风': '/styles/工业风格.png',
  '日式': '/styles/日式和风.png',
  '极简主义': '/styles/极简主义.png',
  '波西米亚': '/styles/波西米亚.png',
  '装饰艺术': '/styles/装饰艺术.png',
  '轻奢': '/styles/轻奢风格.png',
  '乡村田园': '/styles/乡村田园.png',
  '新中式': '/styles/新中式.png',
  '原木风': '/styles/日式和风.png',
  '奶油风': '/styles/奶油风.png',
};

// 使用本地设计稿 + Unsplash 高质量室内设计图片
const INSPIRATIONS: InspirationItem[] = [
  // === 现代简约（本地设计稿） ===
  {
    id: 'insp-local-001',
    imageUrl: '/styles/现代简约.png',
    style: '现代简约',
    styleEn: 'modern_minimalist',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '现代简约客厅',
    description: '简洁线条与中性色调，现代都市生活的理想空间',
    tags: ['简洁', '中性', '都市', '线条'],
    promptHint: 'modern minimalist living room, clean lines, neutral tones, contemporary urban lifestyle',
    aspectRatio: 1.5,
    likes: 3847,
    source: 'curated',
  },
  // === 北欧（本地设计稿） ===
  {
    id: 'insp-local-002',
    imageUrl: '/styles/北欧风格.png',
    style: '北欧',
    styleEn: 'nordic',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '北欧温馨客厅',
    description: '白色基调搭配天然木质，Hygge 式的温暖与惬意',
    tags: ['白色', '木质', 'Hygge', '温暖'],
    promptHint: 'scandinavian living room, white base, natural wood, hygge atmosphere, cozy textiles',
    aspectRatio: 1.5,
    likes: 4210,
    source: 'curated',
  },
  {
    id: 'insp-local-nordic-01',
    imageUrl: '/styles/北欧风01.png',
    style: '北欧',
    styleEn: 'nordic',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '北欧明亮客厅',
    description: '大面积采光与浅色调，营造通透明亮的北欧生活空间',
    tags: ['明亮', '采光', '浅色调', '通透'],
    promptHint: 'bright scandinavian living room, large windows, light color palette, airy and spacious',
    aspectRatio: 1.5,
    likes: 3847,
    source: 'curated',
  },
  {
    id: 'insp-local-nordic-02',
    imageUrl: '/styles/北欧风02.png',
    style: '北欧',
    styleEn: 'nordic',
    roomType: '卧室',
    roomTypeEn: 'bedroom',
    title: '北欧舒适卧室',
    description: '柔软织物与温润木质，打造舒适惬意的睡眠空间',
    tags: ['柔软', '织物', '温润', '舒适'],
    promptHint: 'cozy scandinavian bedroom, soft textiles, warm wood tones, comfortable bedding',
    aspectRatio: 1.5,
    likes: 2567,
    source: 'curated',
  },
  {
    id: 'insp-local-nordic-03',
    imageUrl: '/styles/北欧风03.png',
    style: '北欧',
    styleEn: 'nordic',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '北欧温馨餐厅',
    description: '简约餐桌与温暖灯光，享受北欧式的用餐时光',
    tags: ['餐厅', '温暖灯光', '简约', '用餐'],
    promptHint: 'scandinavian dining room, simple dining table, warm pendant lighting, cozy mealtime',
    aspectRatio: 1.5,
    likes: 3123,
    source: 'curated',
  },
  {
    id: 'insp-local-nordic-04',
    imageUrl: '/styles/北欧风04.png',
    style: '北欧',
    styleEn: 'nordic',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '北欧简约书房',
    description: '简洁书桌与充足收纳，高效而宁静的工作空间',
    tags: ['书房', '简洁', '收纳', '高效'],
    promptHint: 'scandinavian home office, clean desk, ample storage, efficient and serene workspace',
    aspectRatio: 1.5,
    likes: 2789,
    source: 'curated',
  },
  // === 日式（本地设计稿） ===
  {
    id: 'insp-local-003',
    imageUrl: '/styles/日式和风.png',
    style: '日式',
    styleEn: 'japanese',
    roomType: '卧室',
    roomTypeEn: 'bedroom',
    title: '日式禅意空间',
    description: '榻榻米与障子门，侘寂美学的极致表达',
    tags: ['榻榻米', '障子门', '禅意', '侘寂'],
    promptHint: 'japanese zen bedroom, tatami floor, shoji screens, wabi-sabi aesthetic',
    aspectRatio: 1.5,
    likes: 2890,
    source: 'curated',
  },
  {
    id: 'insp-local-japanese-01',
    imageUrl: '/styles/日式01.png',
    style: '日式',
    styleEn: 'japanese',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '日式侘寂客厅',
    description: '原木与白墙的极简搭配，侘寂美学的宁静空间',
    tags: ['原木', '白墙', '侘寂', '宁静'],
    promptHint: 'japanese wabi-sabi living room, natural wood and white walls, minimalist zen space, tranquil atmosphere',
    aspectRatio: 1.5,
    likes: 3456,
    source: 'curated',
  },
  {
    id: 'insp-local-japanese-02',
    imageUrl: '/styles/日式02.png',
    style: '日式',
    styleEn: 'japanese',
    roomType: '卧室',
    roomTypeEn: 'bedroom',
    title: '日式和室卧室',
    description: '榻榻米与纸灯笼，传统和室的温馨与雅致',
    tags: ['榻榻米', '纸灯笼', '和室', '雅致'],
    promptHint: 'japanese tatami bedroom, paper lantern, traditional washitsu room, warm and elegant',
    aspectRatio: 1.5,
    likes: 2890,
    source: 'curated',
  },
  {
    id: 'insp-local-japanese-03',
    imageUrl: '/styles/日式03.png',
    style: '日式',
    styleEn: 'japanese',
    roomType: '餐厅',
    roomTypeEn: 'dining',
    title: '日式禅意餐厅',
    description: '低矮餐桌与坐垫，体验日式用餐的仪式感',
    tags: ['低矮餐桌', '坐垫', '仪式感', '禅意'],
    promptHint: 'japanese zen dining room, low table, floor cushions, ritual dining experience, minimalist',
    aspectRatio: 1.5,
    likes: 2567,
    source: 'curated',
  },

  // === 工业风（本地设计稿） ===
  {
    id: 'insp-local-004',
    imageUrl: '/styles/工业风格.png',
    style: '工业风',
    styleEn: 'industrial',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: 'Loft 工业客厅',
    description: '裸露砖墙与金属管道，粗犷中透着艺术气息',
    tags: ['砖墙', '金属', 'Loft', '粗犷'],
    promptHint: 'industrial loft living room, exposed brick, metal pipes, concrete floor',
    aspectRatio: 1.5,
    likes: 2678,
    source: 'curated',
  },
  {
    id: 'insp-local-industrial-01',
    imageUrl: '/styles/工业风01.png',
    style: '工业风',
    styleEn: 'industrial',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '工业风 Loft 客厅',
    description: '高挑空间与复古家具，展现 Loft 的独特魅力',
    tags: ['Loft', '高挑', '复古', '魅力'],
    promptHint: 'industrial loft living room, high ceilings, vintage furniture, unique loft charm',
    aspectRatio: 1.5,
    likes: 3123,
    source: 'curated',
  },
  {
    id: 'insp-local-industrial-02',
    imageUrl: '/styles/工业风02.png',
    style: '工业风',
    styleEn: 'industrial',
    roomType: '厨房',
    roomTypeEn: 'kitchen',
    title: '工业风开放式厨房',
    description: '不锈钢与混凝土的冷酷美学，功能与风格兼备',
    tags: ['不锈钢', '混凝土', '冷酷', '功能'],
    promptHint: 'industrial open kitchen, stainless steel, concrete aesthetics, functional and stylish',
    aspectRatio: 1.5,
    likes: 2456,
    source: 'curated',
  },
  {
    id: 'insp-local-industrial-03',
    imageUrl: '/styles/工业风03.png',
    style: '工业风',
    styleEn: 'industrial',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '工业风工作室',
    description: '创意工作空间与工业元素融合，激发无限灵感',
    tags: ['工作室', '创意', '工业元素', '灵感'],
    promptHint: 'industrial style studio, creative workspace, industrial elements, inspiring environment',
    aspectRatio: 1.5,
    likes: 2789,
    source: 'curated',
  },
  // === 轻奢（本地设计稿） ===
  {
    id: 'insp-local-005',
    imageUrl: '/styles/轻奢风格.png',
    style: '轻奢',
    styleEn: 'luxury',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '轻奢大理石客厅',
    description: '大理石与金属元素碰撞，低调中彰显品质',
    tags: ['大理石', '金属', '品质', '低调'],
    promptHint: 'luxury living room, marble accents, gold fixtures, velvet furniture, elegant',
    aspectRatio: 1.5,
    likes: 4890,
    source: 'curated',
  },
  // === 新中式（本地设计稿） ===
  {
    id: 'insp-local-006',
    imageUrl: '/styles/新中式.png',
    style: '新中式',
    styleEn: 'chinese',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '新中式雅居',
    description: '水墨意境与现代设计融合，东方韵味的新表达',
    tags: ['水墨', '东方', '韵味', '融合'],
    promptHint: 'modern chinese living room, dark wood, ink painting aesthetic, bamboo, contemporary oriental',
    aspectRatio: 1.5,
    likes: 3340,
    source: 'curated',
  },
  {
    id: 'insp-local-chinese-01',
    imageUrl: '/styles/新中式01.png',
    style: '新中式',
    styleEn: 'chinese',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '新中式雅致客厅',
    description: '深色实木与水墨意境，东方韵味的现代演绎',
    tags: ['深色实木', '水墨', '东方', '雅致'],
    promptHint: 'modern chinese living room, dark solid wood, ink painting aesthetic, oriental elegance, contemporary',
    aspectRatio: 1.5,
    likes: 3678,
    source: 'curated',
  },
  {
    id: 'insp-local-chinese-02',
    imageUrl: '/styles/新中式02.png',
    style: '新中式',
    styleEn: 'chinese',
    roomType: '卧室',
    roomTypeEn: 'bedroom',
    title: '新中式禅意卧室',
    description: '屏风与中式床品，营造宁静致远的睡眠空间',
    tags: ['屏风', '中式', '禅意', '宁静'],
    promptHint: 'modern chinese bedroom, folding screen, chinese style bedding, zen tranquility, serene sleep',
    aspectRatio: 1.5,
    likes: 2890,
    source: 'curated',
  },
  {
    id: 'insp-local-chinese-03',
    imageUrl: '/styles/新中式03.png',
    style: '新中式',
    styleEn: 'chinese',
    roomType: '书房',
    roomTypeEn: 'study',
    title: '新中式文雅书房',
    description: '红木书桌与文房四宝，传承千年的书香气息',
    tags: ['红木', '文房', '书香', '传承'],
    promptHint: 'modern chinese study room, rosewood desk, traditional scholar items, literary atmosphere, heritage',
    aspectRatio: 1.5,
    likes: 2456,
    source: 'curated',
  },
  {
    id: 'insp-local-chinese-04',
    imageUrl: '/styles/新中式04.png',
    style: '新中式',
    styleEn: 'chinese',
    roomType: '餐厅',
    roomTypeEn: 'dining',
    title: '新中式团圆餐厅',
    description: '圆桌与中式餐具，承载家人团聚的温馨时光',
    tags: ['圆桌', '中式餐具', '团圆', '温馨'],
    promptHint: 'modern chinese dining room, round table, chinese tableware, family reunion, warm gathering',
    aspectRatio: 1.5,
    likes: 3123,
    source: 'curated',
  },
  {
    id: 'insp-local-chinese-05',
    imageUrl: '/styles/新中式05.png',
    style: '新中式',
    styleEn: 'chinese',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '新中式山水客厅',
    description: '山水画背景与中式家具，诗意栖居的东方美学',
    tags: ['山水画', '中式家具', '诗意', '美学'],
    promptHint: 'modern chinese living room, landscape painting backdrop, chinese furniture, poetic oriental aesthetic',
    aspectRatio: 1.5,
    likes: 3789,
    source: 'curated',
  },

  {
    id: 'insp-local-cream-01',
    imageUrl: '/styles/奶油风.png',
    style: '奶油风',
    styleEn: 'cream_style',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '奶油温柔客厅',
    description: '奶白色调与柔软材质，打造温柔治愈的居家氛围',
    tags: ['奶白', '柔软', '温柔', '治愈'],
    promptHint: 'cream style living room, milky white tones, soft materials, gentle healing atmosphere',
    aspectRatio: 1.5,
    likes: 4234,
    source: 'curated',
  },
  {
    id: 'insp-local-cream-02',
    imageUrl: '/styles/奶油风01.png',
    style: '奶油风',
    styleEn: 'cream_style',
    roomType: '卧室',
    roomTypeEn: 'bedroom',
    title: '奶油治愈卧室',
    description: '温暖奶咖色调与舒适床品，营造治愈系睡眠空间',
    tags: ['奶咖', '床品', '治愈', '温暖'],
    promptHint: 'cream style bedroom, warm milk coffee tones, comfortable bedding, healing sleep space',
    aspectRatio: 1.5,
    likes: 3678,
    source: 'curated',
  },
  {
    id: 'insp-local-cream-03',
    imageUrl: '/styles/奶油风02.png',
    style: '奶油风',
    styleEn: 'cream_style',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '奶油甜美餐厅',
    description: '甜美奶油色调搭配精致餐具，享受温馨的用餐时光',
    tags: ['甜美', '餐具', '温馨', '用餐'],
    promptHint: 'cream style dining room, sweet cream tones, exquisite tableware, warm dining experience',
    aspectRatio: 1.5,
    likes: 2987,
    source: 'curated',
  },


  {
    id: 'insp-local-wood-01',
    imageUrl: '/styles/原木风01.png',
    style: '原木风',
    styleEn: 'natural_wood',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '原木自然客厅',
    description: '大量实木元素与绿植，把自然搬进家里的温暖设计',
    tags: ['实木', '绿植', '自然', '温暖'],
    promptHint: 'natural wood living room, solid wood furniture, indoor plants, warm earthy tones, organic shapes',
    aspectRatio: 1.5,
    likes: 3567,
    source: 'curated',
  },
  {
    id: 'insp-local-wood-02',
    imageUrl: '/styles/原木风02.png',
    style: '原木风',
    styleEn: 'natural_wood',
    roomType: '卧室',
    roomTypeEn: 'bedroom',
    title: '原木温馨卧室',
    description: '温润木质与棉麻织物，回归自然的安眠空间',
    tags: ['木质', '棉麻', '安眠', '自然'],
    promptHint: 'natural wood bedroom, warm wood tones, cotton linen textiles, nature inspired sleep space',
    aspectRatio: 1.5,
    likes: 2890,
    source: 'curated',
  },
  {
    id: 'insp-local-wood-03',
    imageUrl: '/styles/原木风03.png',
    style: '原木风',
    styleEn: 'natural_wood',
    roomType: '餐厅',
    roomTypeEn: 'dining',
    title: '原木质朴餐厅',
    description: '实木餐桌与藤编座椅，享受质朴自然的用餐时光',
    tags: ['实木', '藤编', '质朴', '用餐'],
    promptHint: 'natural wood dining room, solid wood table, rattan chairs, rustic natural dining experience',
    aspectRatio: 1.5,
    likes: 2345,
    source: 'curated',
  },

  // === 极简主义（本地设计稿） ===
  {
    id: 'insp-local-007',
    imageUrl: '/styles/极简主义.png',
    style: '极简主义',
    styleEn: 'minimalist',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '纯白极简空间',
    description: '极致留白与单一焦点，少即是多的哲学实践',
    tags: ['纯白', '留白', '极简', '哲学'],
    promptHint: 'minimalist living room, pure white space, single statement piece, zen simplicity',
    aspectRatio: 1.5,
    likes: 2567,
    source: 'curated',
  },
  {
    id: 'insp-local-minimalist-01',
    imageUrl: '/styles/极简主义01.png',
    style: '极简主义',
    styleEn: 'minimalist',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '极简白空间',
    description: '极致留白与单一焦点，少即是多的哲学实践',
    tags: ['纯白', '留白', '极简', '哲学'],
    promptHint: 'minimalist living room, pure white space, single statement piece, zen simplicity',
    aspectRatio: 1.5,
    likes: 2789,
    source: 'curated',
  },
  {
    id: 'insp-local-minimalist-02',
    imageUrl: '/styles/极简主义02.png',
    style: '极简主义',
    styleEn: 'minimalist',
    roomType: '卧室',
    roomTypeEn: 'bedroom',
    title: '极简静谧卧室',
    description: '去除一切多余装饰，让睡眠回归最纯粹的状态',
    tags: ['纯粹', '静谧', '去除', '回归'],
    promptHint: 'minimalist bedroom, no unnecessary decor, pure and serene, back to essentials, peaceful sleep',
    aspectRatio: 1.5,
    likes: 2234,
    source: 'curated',
  },
  {
    id: 'insp-local-minimalist-03',
    imageUrl: '/styles/极简主义03.png',
    style: '极简主义',
    styleEn: 'minimalist',
    roomType: '厨房',
    roomTypeEn: 'kitchen',
    title: '极简功能厨房',
    description: '隐藏式收纳与简洁线条，功能至上的厨房美学',
    tags: ['隐藏收纳', '简洁', '功能', '美学'],
    promptHint: 'minimalist kitchen, hidden storage, clean lines, function first kitchen aesthetics',
    aspectRatio: 1.5,
    likes: 1987,
    source: 'curated',
  },
  // === 波西米亚（本地设计稿） ===
  {
    id: 'insp-local-008',
    imageUrl: '/styles/波西米亚.png',
    style: '波西米亚',
    styleEn: 'bohemian',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '波西米亚风情',
    description: '丰富色彩与纹理，自由不羁的异域风情',
    tags: ['色彩', '纹理', '异域', '自由'],
    promptHint: 'bohemian living room, colorful textiles, macrame, plants, eclectic patterns',
    aspectRatio: 1.5,
    likes: 2987,
    source: 'curated',
  },
  {
    id: 'insp-local-bohemian-01',
    imageUrl: '/styles/波西米亚01.png',
    style: '波西米亚',
    styleEn: 'bohemian',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '波西米亚色彩客厅',
    description: '大胆色彩碰撞与手工织物，展现自由奔放的生活态度',
    tags: ['大胆', '色彩', '手工', '自由'],
    promptHint: 'bohemian colorful living room, bold color clashes, handmade textiles, free spirited lifestyle',
    aspectRatio: 1.5,
    likes: 3456,
    source: 'curated',
  },
  {
    id: 'insp-local-bohemian-02',
    imageUrl: '/styles/波西米亚02.png',
    style: '波西米亚',
    styleEn: 'bohemian',
    roomType: '卧室',
    roomTypeEn: 'bedroom',
    title: '波西米亚异域卧室',
    description: '异域图案与柔软织物，打造梦幻般的睡眠空间',
    tags: ['异域', '图案', '柔软', '梦幻'],
    promptHint: 'bohemian exotic bedroom, exotic patterns, soft textiles, dreamy sleep space',
    aspectRatio: 1.5,
    likes: 2890,
    source: 'curated',
  },
  // === 装饰艺术（本地设计稿） ===
  {
    id: 'insp-local-009',
    imageUrl: '/styles/装饰艺术.png',
    style: '装饰艺术',
    styleEn: 'art_deco',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: 'Art Deco 奢华客厅',
    description: '几何图案与金色装饰，致敬黄金时代的华丽风格',
    tags: ['几何', '金色', '华丽', '复古'],
    promptHint: 'art deco living room, geometric patterns, gold accents, velvet, glamorous 1920s style',
    aspectRatio: 1.5,
    likes: 2234,
    source: 'curated',
  },
  {
    id: 'insp-local-artdeco-01',
    imageUrl: '/styles/装饰艺术01.png',
    style: '装饰艺术',
    styleEn: 'art_deco',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: 'Art Deco 华丽客厅',
    description: '对称几何线条与金属光泽，1920年代复古奢华的极致演绎',
    tags: ['对称', '金属', '复古', '奢华'],
    promptHint: 'art deco glamorous living room, symmetrical geometric lines, metallic sheen, 1920s vintage luxury',
    aspectRatio: 1.5,
    likes: 3456,
    source: 'curated',
  },
  {
    id: 'insp-local-artdeco-02',
    imageUrl: '/styles/装饰艺术02.png',
    style: '装饰艺术',
    styleEn: 'art_deco',
    roomType: '卧室',
    roomTypeEn: 'bedroom',
    title: 'Art Deco 奢华卧室',
    description: '丝绒与黄铜的碰撞，打造好莱坞黄金时代的梦幻卧室',
    tags: ['丝绒', '黄铜', '好莱坞', '梦幻'],
    promptHint: 'art deco luxury bedroom, velvet and brass, hollywood golden age dream bedroom, glamorous',
    aspectRatio: 1.5,
    likes: 2890,
    source: 'curated',
  },
  {
    id: 'insp-local-artdeco-03',
    imageUrl: '/styles/装饰艺术03.png',
    style: '装饰艺术',
    styleEn: 'art_deco',
    roomType: '餐厅',
    roomTypeEn: 'dining',
    title: 'Art Deco 典雅餐厅',
    description: '扇形纹样与镜面装饰，营造优雅精致的用餐仪式感',
    tags: ['扇形纹样', '镜面', '优雅', '仪式感'],
    promptHint: 'art deco elegant dining room, fan patterns, mirror decor, refined dining ceremony',
    aspectRatio: 1.5,
    likes: 2567,
    source: 'curated',
  },
  // === 乡村田园（本地设计稿） ===
  {
    id: 'insp-local-010',
    imageUrl: '/styles/乡村田园.png',
    style: '乡村田园',
    styleEn: 'rustic',
    roomType: '厨房',
    roomTypeEn: 'kitchen',
    title: '田园风厨房',
    description: '木质横梁与石材壁炉，回归自然的乡村浪漫',
    tags: ['木质', '石材', '乡村', '浪漫'],
    promptHint: 'rustic farmhouse kitchen, wooden beams, stone fireplace, vintage decor, warm country',
    aspectRatio: 1.5,
    likes: 2678,
    source: 'curated',
  },
  {
    id: 'insp-local-rustic-01',
    imageUrl: '/styles/乡村田园01.png',
    style: '乡村田园',
    styleEn: 'rustic',
    roomType: '客厅',
    roomTypeEn: 'living_room',
    title: '田园温馨客厅',
    description: '碎花布艺与木质家具，打造温馨的乡村客厅',
    tags: ['碎花', '布艺', '木质', '温馨'],
    promptHint: 'rustic cottage living room, floral fabrics, wooden furniture, warm country atmosphere',
    aspectRatio: 1.5,
    likes: 3234,
    source: 'curated',
  },
  {
    id: 'insp-local-rustic-02',
    imageUrl: '/styles/乡村田园02.png',
    style: '乡村田园',
    styleEn: 'rustic',
    roomType: '卧室',
    roomTypeEn: 'bedroom',
    title: '田园浪漫卧室',
    description: '花卉壁纸与棉质床品，浪漫田园的安眠空间',
    tags: ['花卉', '棉质', '浪漫', '安眠'],
    promptHint: 'rustic romantic bedroom, floral wallpaper, cotton bedding, romantic countryside sleep space',
    aspectRatio: 1.5,
    likes: 2789,
    source: 'curated',
  },
  {
    id: 'insp-local-rustic-03',
    imageUrl: '/styles/乡村田园03.png',
    style: '乡村田园',
    styleEn: 'rustic',
    roomType: '餐厅',
    roomTypeEn: 'dining',
    title: '田园质朴餐厅',
    description: '实木长桌与陶瓷餐具，享受质朴的田园用餐时光',
    tags: ['实木', '陶瓷', '质朴', '用餐'],
    promptHint: 'rustic farmhouse dining room, solid wood table, ceramic tableware, rustic dining experience',
    aspectRatio: 1.5,
    likes: 2456,
    source: 'curated',
  },
];

/**
 * 获取灵感列表
 */
export function getInspirations(filters?: {
  style?: string;
  roomType?: string;
  limit?: number;
  offset?: number;
}): InspirationItem[] {
  let items = [...INSPIRATIONS];

  if (filters?.style) {
    items = items.filter((i) => i.style === filters.style || i.styleEn === filters.style);
  }

  if (filters?.roomType) {
    items = items.filter((i) => i.roomType === filters.roomType || i.roomTypeEn === filters.roomType);
  }

  // 随机打乱顺序（每次刷新不同）
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const offset = filters?.offset || 0;
  const limit = filters?.limit || 20;

  return items.slice(offset, offset + limit).map(item => ({
    ...item,
    imageUrl: proxyUrl(item.imageUrl),
  }));
}

/**
 * 获取单个灵感
 */
export function getInspirationById(id: string): InspirationItem | undefined {
  const item = INSPIRATIONS.find((i) => i.id === id);
  if (!item) return undefined;
  return { ...item, imageUrl: proxyUrl(item.imageUrl) };
}

/**
 * 获取所有可用风格
 */
export function getAvailableStyles(): { label: string; value: string; count: number }[] {
  const styleCount: Record<string, number> = {};
  for (const item of INSPIRATIONS) {
    styleCount[item.style] = (styleCount[item.style] || 0) + 1;
  }

  return Object.entries(styleCount).map(([label, count]) => ({
    label,
    value: INSPIRATIONS.find((i) => i.style === label)?.styleEn || label,
    count,
  }));
}

/**
 * 获取所有可用房间类型
 */
export function getAvailableRoomTypes(): { label: string; value: string; count: number }[] {
  const roomCount: Record<string, number> = {};
  for (const item of INSPIRATIONS) {
    roomCount[item.roomType] = (roomCount[item.roomType] || 0) + 1;
  }

  return Object.entries(roomCount).map(([label, count]) => ({
    label,
    value: INSPIRATIONS.find((i) => i.roomType === label)?.roomTypeEn || label,
    count,
  }));
}
