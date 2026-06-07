/**
 * CelMecha Studio API Client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PromptRequest {
  character?: Record<string, any>;
  hairstyle?: Record<string, any>;
  costume?: Record<string, any>;
  expression?: Record<string, any>;
  mecha?: Record<string, any>;
  weapon?: Record<string, any>;
  prop?: Record<string, any>;
  scene?: Record<string, any>;
  lighting?: Record<string, any>;
  camera?: Record<string, any>;
  effect?: Record<string, any>;
  custom_input?: string;
}

interface PromptResponse {
  prompt_zh: string;
  prompt_en: string;
  prompt_weighted: string;
}

interface GenerateRequest {
  prompt: string;
  prompt_zh?: string;
  model: string;
  params?: Record<string, any>;
}

interface GenerateResponse {
  task_id: string;
  status: string;
  message: string;
}

interface TaskStatus {
  task_id: string;
  status: string;
  progress?: number;
  image_url?: string;
  error?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Prompt API
  async generatePrompt(request: PromptRequest): Promise<PromptResponse> {
    return fetchApi('/api/prompt/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async getPromptDatabase(moduleName: string): Promise<any> {
    return fetchApi(`/api/prompt/database/${moduleName}`);
  },

  async listPromptDatabases(): Promise<{ modules: string[] }> {
    return fetchApi('/api/prompt/database');
  },

  // Generate API
  async generateImage(request: GenerateRequest): Promise<GenerateResponse> {
    return fetchApi('/api/generate/image', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async getGenerationStatus(taskId: string): Promise<TaskStatus> {
    return fetchApi(`/api/generate/status/${taskId}`);
  },

  async listModels(): Promise<{ models: any[] }> {
    return fetchApi('/api/generate/models');
  },

  // Template API
  async listTemplates(type: string): Promise<{ templates: any[] }> {
    return fetchApi(`/api/template/list/${type}`);
  },

  async generateIdentitySheet(request: any): Promise<any> {
    return fetchApi('/api/template/identity-sheet', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async generateCard(request: any): Promise<any> {
    return fetchApi('/api/template/card', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async generatePoster(request: any): Promise<any> {
    return fetchApi('/api/template/poster', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Project API
  async createProject(request: { name: string; description?: string; type?: string }): Promise<any> {
    return fetchApi('/api/project/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async listProjects(): Promise<{ projects: any[] }> {
    return fetchApi('/api/project/list');
  },

  async getProject(projectId: string): Promise<any> {
    return fetchApi(`/api/project/${projectId}`);
  },

  async updateProject(projectId: string, request: any): Promise<any> {
    return fetchApi(`/api/project/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  },

  async deleteProject(projectId: string): Promise<any> {
    return fetchApi(`/api/project/${projectId}`, {
      method: 'DELETE',
    });
  },

  async saveProjectSelection(request: any): Promise<any> {
    return fetchApi('/api/project/save-selection', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};

export type { PromptRequest, PromptResponse, GenerateRequest, GenerateResponse, TaskStatus };
