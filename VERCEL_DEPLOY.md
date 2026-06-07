# 栖界AI Vercel部署指南

## 部署前准备

### 1. 环境变量配置

在Vercel Dashboard中设置以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `OPENAI_BASE_URL` | OpenAI API地址 | `https://api.openai.com/v1` |
| `OPENAI_API_KEY` | OpenAI API密钥 | `sk-xxx` |
| `ADMIN_SECRET` | 管理员密钥 | `your-admin-secret` |

### 2. Supabase集成（可选）

如果使用Supabase作为数据库和认证：

| 变量名 | 说明 |
|--------|------|
| `SUPABASE_URL` | `https://dvcfgxpylxehngvfmqsr.supabase.co` |
| `SUPABASE_ANON_KEY` | 从Supabase Dashboard获取 |

## 部署步骤

### 方式一：通过Vercel CLI

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd g:\WK\roomvision
vercel
```

### 方式二：通过GitHub

1. 将项目推送到GitHub仓库
2. 在Vercel Dashboard导入项目
3. 配置环境变量
4. 点击Deploy

## 项目结构调整

已添加以下文件用于Vercel部署：

```
api/
└── index.ts          # Vercel API入口（Serverless Function）
```

## 注意事项

### Vercel限制

1. **文件上传**：Vercel不支持本地文件存储，需要使用云存储（如Supabase Storage）
2. **请求超时**：Serverless Functions默认10秒超时
3. **冷启动**：首次请求可能有延迟

### 建议方案

- 图片存储：使用Supabase Storage或AWS S3
- 数据库：使用Supabase PostgreSQL
- 认证：使用Supabase Auth

## APP配置

部署完成后，更新APP的API地址：

编辑 `G:\WK\roomvision-app\src\services\api.ts`：

```typescript
const API_BASE_URL = 'https://your-project.vercel.app/api';
```

## 验证部署

部署成功后访问：
- `https://your-project.vercel.app/api/health` - 健康检查

---

## 快速部署命令

```bash
# 1. 进入项目目录
cd g:\WK\roomvision

# 2. 安装Vercel CLI（如未安装）
npm i -g vercel

# 3. 部署
vercel --prod
```