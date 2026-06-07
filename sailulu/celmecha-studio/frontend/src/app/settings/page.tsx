"use client";

import { useState, useEffect } from "react";

interface ModelConfig {
  name: string;
  description: string;
  enabled: boolean;
  base_url: string;
  api_key: string;
  model: string;
}

interface ApiConfig {
  [key: string]: ModelConfig;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<ApiConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/online/models");
      const data = await response.json();
      if (data.success) {
        // 获取每个模型的详细配置
        const configData: ApiConfig = {};
        for (const model of data.data) {
          try {
            const res = await fetch(
              `http://localhost:8000/api/online/models/${model.id}`
            );
            const modelData = await res.json();
            if (modelData.success) {
              configData[model.id] = {
                ...modelData.data,
                api_key: "", // 不显示已有的key
              };
            }
          } catch (e) {
            configData[model.id] = {
              name: model.name,
              description: model.description,
              enabled: model.enabled,
              base_url: "",
              api_key: "",
              model: model.id,
            };
          }
        }
        setConfig(configData);
      }
    } catch (error) {
      setMessage({ text: "Failed to load config", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async (modelId: string) => {
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const modelConfig = config[modelId];
      const response = await fetch("http://localhost:8000/api/online/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: modelId,
          base_url: modelConfig.base_url,
          api_key: modelConfig.api_key,
          enabled: modelConfig.enabled,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ text: `${modelId} saved successfully!`, type: "success" });
      } else {
        setMessage({ text: data.detail || "Save failed", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // 测试连接
  const testConnection = async (modelId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/online/test/${modelId}`
      );
      const data = await response.json();
      if (data.success) {
        setMessage({ text: `${modelId} connection OK!`, type: "success" });
      } else {
        setMessage({
          text: data.error || "Connection failed",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({ text: "Connection test failed", type: "error" });
    }
  };

  // 更新配置
  const updateConfig = (
    modelId: string,
    field: keyof ModelConfig,
    value: any
  ) => {
    setConfig((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">API Settings</h1>
          <p className="text-gray-400">
            Configure your online model API endpoints
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-900/50 border border-green-500"
                : "bg-red-900/50 border border-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Model Cards */}
        <div className="space-y-6">
          {Object.entries(config).map(([modelId, modelConfig]) => (
            <div
              key={modelId}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{modelConfig.name}</h2>
                  <p className="text-gray-400 text-sm">
                    {modelConfig.description}
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modelConfig.enabled}
                    onChange={(e) =>
                      updateConfig(modelId, "enabled", e.target.checked)
                    }
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>

              <div className="space-y-4">
                {/* Base URL */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    API URL
                  </label>
                  <input
                    type="text"
                    value={modelConfig.base_url}
                    onChange={(e) =>
                      updateConfig(modelId, "base_url", e.target.value)
                    }
                    placeholder="https://your-proxy-url.com"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={modelConfig.api_key}
                    onChange={(e) =>
                      updateConfig(modelId, "api_key", e.target.value)
                    }
                    placeholder="Enter your API key"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Model Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={modelConfig.model}
                    onChange={(e) =>
                      updateConfig(modelId, "model", e.target.value)
                    }
                    placeholder={modelId}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => saveConfig(modelId)}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => testConnection(modelId)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help */}
        <div className="mt-8 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-3">How to get API?</h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              • <strong>GPT-Image-2</strong>: Get API key from OpenAI or proxy
              service
            </li>
            <li>
              • <strong>Nano-Banana2</strong>: Get API key from your provider
            </li>
            <li>
              • <strong>API URL</strong>: Enter your proxy URL (e.g.,
              https://api.example.com)
            </li>
            <li>
              • <strong>API Key</strong>: Enter your secret key
            </li>
          </ul>
        </div>

        {/* Back Link */}
        <div className="mt-6">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
