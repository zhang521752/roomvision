// 数据库 Schema 定义（可对接 PostgreSQL / SQLite）
// 仅定义结构和迁移，不引入 ORM 依赖，保持轻量

/**
 * 生成任务表
 */
export const GENERATION_TASKS_TABLE = {
  name: 'generation_tasks',
  columns: {
    id: 'SERIAL PRIMARY KEY',
    user_id: 'VARCHAR(64) NOT NULL',
    provider: "VARCHAR(32) NOT NULL DEFAULT 'auto'",     // gpt-image | doubao | mock
    mode: "VARCHAR(32) NOT NULL DEFAULT 'auto'",          // quick_preview | premium_render | ultra_render
    prompt: 'TEXT NOT NULL',
    status: "VARCHAR(16) NOT NULL DEFAULT 'pending'",     // pending | processing | completed | failed
    quality: "VARCHAR(16) NOT NULL DEFAULT 'medium'",     // low | medium | high | ultra
    cost: 'DECIMAL(10,4) DEFAULT 0',
    image_count: 'INTEGER DEFAULT 0',
    result_urls: 'TEXT',                                   // JSON array
    error_message: 'TEXT',
    duration_ms: 'INTEGER DEFAULT 0',
    user_level: "VARCHAR(16) NOT NULL DEFAULT 'free'",
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  },
  indexes: [
    'CREATE INDEX idx_generation_tasks_user_id ON generation_tasks(user_id)',
    'CREATE INDEX idx_generation_tasks_status ON generation_tasks(status)',
    'CREATE INDEX idx_generation_tasks_created_at ON generation_tasks(created_at DESC)',
  ],
};

/**
 * 风格模板表
 */
export const STYLE_TEMPLATES_TABLE = {
  name: 'style_templates',
  columns: {
    id: 'SERIAL PRIMARY KEY',
    style_name: 'VARCHAR(64) NOT NULL UNIQUE',
    prompt_template: 'TEXT NOT NULL',
    category: "VARCHAR(32) NOT NULL DEFAULT 'style'",
    is_active: 'BOOLEAN DEFAULT true',
    preview_url: 'TEXT',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  },
};

/**
 * Provider 配置表
 */
export const PROVIDER_CONFIGS_TABLE = {
  name: 'provider_configs',
  columns: {
    id: 'SERIAL PRIMARY KEY',
    provider_name: 'VARCHAR(32) NOT NULL UNIQUE',
    api_url: 'TEXT',
    api_key: 'TEXT',
    max_concurrency: 'INTEGER DEFAULT 2',
    timeout_ms: 'INTEGER DEFAULT 30000',
    is_active: 'BOOLEAN DEFAULT true',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  },
};

/**
 * 用户配额表
 */
export const USER_QUOTAS_TABLE = {
  name: 'user_quotas',
  columns: {
    id: 'SERIAL PRIMARY KEY',
    user_id: 'VARCHAR(64) NOT NULL UNIQUE',
    level: "VARCHAR(16) NOT NULL DEFAULT 'free'",
    daily_limit: 'INTEGER DEFAULT 5',
    daily_used: 'INTEGER DEFAULT 0',
    total_generations: 'INTEGER DEFAULT 0',
    total_cost: 'DECIMAL(10,4) DEFAULT 0',
    last_reset_date: 'DATE',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
  },
};

/**
 * 完整建表 SQL（PostgreSQL / SQLite 兼容）
 */
export function getCreateTableSQL(): string {
  return `
-- 生成任务表
CREATE TABLE IF NOT EXISTS generation_tasks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  provider VARCHAR(32) NOT NULL DEFAULT 'auto',
  mode VARCHAR(32) NOT NULL DEFAULT 'auto',
  prompt TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  quality VARCHAR(16) NOT NULL DEFAULT 'medium',
  cost DECIMAL(10,4) DEFAULT 0,
  image_count INTEGER DEFAULT 0,
  result_urls TEXT,
  error_message TEXT,
  duration_ms INTEGER DEFAULT 0,
  user_level VARCHAR(16) NOT NULL DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_generation_tasks_created_at ON generation_tasks(created_at DESC);

-- 风格模板表
CREATE TABLE IF NOT EXISTS style_templates (
  id SERIAL PRIMARY KEY,
  style_name VARCHAR(64) NOT NULL UNIQUE,
  prompt_template TEXT NOT NULL,
  category VARCHAR(32) NOT NULL DEFAULT 'style',
  is_active BOOLEAN DEFAULT true,
  preview_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider 配置表
CREATE TABLE IF NOT EXISTS provider_configs (
  id SERIAL PRIMARY KEY,
  provider_name VARCHAR(32) NOT NULL UNIQUE,
  api_url TEXT,
  api_key TEXT,
  max_concurrency INTEGER DEFAULT 2,
  timeout_ms INTEGER DEFAULT 30000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户配额表
CREATE TABLE IF NOT EXISTS user_quotas (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE,
  level VARCHAR(16) NOT NULL DEFAULT 'free',
  daily_limit INTEGER DEFAULT 5,
  daily_used INTEGER DEFAULT 0,
  total_generations INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  last_reset_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`.trim();
}