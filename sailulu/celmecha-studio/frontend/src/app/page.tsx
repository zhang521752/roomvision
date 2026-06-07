"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/stores/useStore";

export default function Home() {
  const [modules, setModules] = useState<any>({});
  const [activeTab, setActiveTab] = useState("character");
  const [promptZh, setPromptZh] = useState("");
  const [promptEn, setPromptEn] = useState("");
  const [selectedModel, setSelectedModel] = useState("flux");
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const store = useStore();

  // 加载Prompt数据库
  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const moduleList = [
        "character",
        "hairstyle",
        "costume",
        "expression",
        "mecha",
        "scene",
        "lighting",
        "camera",
      ];

      const loadedModules: any = {};
      for (const moduleName of moduleList) {
        try {
          const data = await api.getPromptDatabase(moduleName);
          loadedModules[moduleName] = data;
        } catch (error) {
          console.error(`Failed to load module ${moduleName}:`, error);
        }
      }
      setModules(loadedModules);
    } catch (error) {
      console.error("Failed to load modules:", error);
    }
  };

  // 生成提示词
  const handleGeneratePrompt = async () => {
    try {
      const request = {
        character: store.character,
        hairstyle: store.hairstyle,
        costume: store.costume,
        expression: store.expression,
        mecha: store.mecha,
        scene: store.scene,
        lighting: store.lighting,
        camera: store.camera,
        custom_input: store.custom_input,
      };

      const response = await api.generatePrompt(request);
      setPromptZh(response.prompt_zh);
      setPromptEn(response.prompt_en);
      store.setPrompt(response.prompt_zh, response.prompt_en);
    } catch (error) {
      console.error("Failed to generate prompt:", error);
    }
  };

  // 生成图像
  const handleGenerateImage = async () => {
    if (!promptEn) {
      await handleGeneratePrompt();
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // 根据选择的模型调用不同的API
      if (selectedModel === "gpt-image-2" || selectedModel === "nano-banana2") {
        // 调用线上模型API
        const response = await fetch("http://localhost:8000/api/online/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            prompt: promptEn,
            width: 1024,
            height: 1024,
          }),
        });

        const data = await response.json();
        if (data.success && data.images && data.images.length > 0) {
          // 显示base64图像
          const imageUrl = `data:image/png;base64,${data.images[0]}`;
          setGeneratedImage(imageUrl);
        } else {
          console.error("Generation failed:", data.error);
          alert(`Generation failed: ${data.error || "Unknown error"}`);
        }
      } else {
        // 调用本地ComfyUI
        const response = await api.generateImage({
          prompt: promptEn,
          prompt_zh: promptZh,
          model: selectedModel,
        });

        setTaskId(response.task_id);

        // 轮询检查状态
        const checkStatus = async () => {
          const status = await api.getGenerationStatus(response.task_id);
          if (status.status === "completed" && status.image_url) {
            setGeneratedImage(status.image_url);
            setIsGenerating(false);
          } else if (status.status === "failed") {
            console.error("Generation failed:", status.error);
            setIsGenerating(false);
          } else {
            setTimeout(checkStatus, 1000);
          }
        };

        checkStatus();
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert(`Failed to generate image: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 选项标签组件
  const TagSelector = ({
    options,
    selected,
    onSelect,
    multiSelect = false,
  }: {
    options: any[];
    selected: any;
    onSelect: (value: any) => void;
    multiSelect?: boolean;
  }) => {
    const handleClick = (option: any) => {
      if (multiSelect) {
        const currentSelected = Array.isArray(selected) ? selected : [];
        const isSelected = currentSelected.some((s: any) => s.id === option.id);
        if (isSelected) {
          onSelect(currentSelected.filter((s: any) => s.id !== option.id));
        } else {
          onSelect([...currentSelected, option]);
        }
      } else {
        onSelect(selected?.id === option.id ? undefined : option);
      }
    };

    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = multiSelect
            ? Array.isArray(selected) && selected.some((s: any) => s.id === option.id)
            : selected?.id === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleClick(option)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {option.label.zh}
            </button>
          );
        })}
      </div>
    );
  };

  // 颜色选择器组件
  const ColorSelector = ({
    options,
    selected,
    onSelect,
  }: {
    options: any[];
    selected: any;
    onSelect: (value: any) => void;
  }) => {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected?.id === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onSelect(isSelected ? undefined : option)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                isSelected ? "border-primary scale-110" : "border-border"
              }`}
              style={{ backgroundColor: option.hex }}
              title={option.label.zh}
            />
          );
        })}
      </div>
    );
  };

  // 渲染角色模块
  const renderCharacterModule = () => {
    const characterData = modules.character;
    if (!characterData) return <div>加载中...</div>;

    return (
      <div className="space-y-4">
        {/* 性别 */}
        <div>
          <label className="text-sm font-medium mb-2 block">性别</label>
          <TagSelector
            options={characterData.gender.options}
            selected={store.character.gender}
            onSelect={(value) => store.setCharacter("gender", value)}
          />
        </div>

        {/* 年龄 */}
        <div>
          <label className="text-sm font-medium mb-2 block">年龄</label>
          <TagSelector
            options={characterData.age.options}
            selected={store.character.age}
            onSelect={(value) => store.setCharacter("age", value)}
          />
        </div>

        {/* 体型 */}
        <div>
          <label className="text-sm font-medium mb-2 block">体型</label>
          <TagSelector
            options={characterData.body_type.options}
            selected={store.character.body_type}
            onSelect={(value) => store.setCharacter("body_type", value)}
          />
        </div>

        {/* 性格 */}
        <div>
          <label className="text-sm font-medium mb-2 block">性格 (可多选)</label>
          <TagSelector
            options={characterData.personality.options}
            selected={store.character.personality}
            onSelect={(value) => store.setCharacter("personality", value)}
            multiSelect
          />
        </div>
      </div>
    );
  };

  // 渲染发型模块
  const renderHairstyleModule = () => {
    const hairstyleData = modules.hairstyle;
    if (!hairstyleData) return <div>加载中...</div>;

    return (
      <div className="space-y-4">
        {/* 发型 */}
        <div>
          <label className="text-sm font-medium mb-2 block">发型</label>
          <TagSelector
            options={hairstyleData.style.options}
            selected={store.hairstyle}
            onSelect={(value) => store.setHairstyle(value)}
          />
        </div>

        {/* 发色 */}
        <div>
          <label className="text-sm font-medium mb-2 block">发色</label>
          <ColorSelector
            options={hairstyleData.color.options}
            selected={store.hairstyle}
            onSelect={(value) => store.setHairstyle(value)}
          />
        </div>
      </div>
    );
  };

  // 渲染机甲模块
  const renderMechaModule = () => {
    const mechaData = modules.mecha;
    if (!mechaData) return <div>加载中...</div>;

    return (
      <div className="space-y-4">
        {/* 机甲类型 */}
        <div>
          <label className="text-sm font-medium mb-2 block">机甲类型</label>
          <TagSelector
            options={mechaData.type.options}
            selected={store.mecha.type}
            onSelect={(value) => store.setMecha("type", value)}
          />
        </div>

        {/* 机甲尺寸 */}
        <div>
          <label className="text-sm font-medium mb-2 block">机甲尺寸</label>
          <TagSelector
            options={mechaData.size.options}
            selected={store.mecha.size}
            onSelect={(value) => store.setMecha("size", value)}
          />
        </div>

        {/* 设计风格 */}
        <div>
          <label className="text-sm font-medium mb-2 block">设计风格</label>
          <TagSelector
            options={mechaData.style.options}
            selected={store.mecha.style}
            onSelect={(value) => store.setMecha("style", value)}
          />
        </div>

        {/* 主色调 */}
        <div>
          <label className="text-sm font-medium mb-2 block">主色调</label>
          <ColorSelector
            options={mechaData.color.options}
            selected={store.mecha.color}
            onSelect={(value) => store.setMecha("color", value)}
          />
        </div>
      </div>
    );
  };

  // 渲染场景模块
  const renderSceneModule = () => {
    const sceneData = modules.scene;
    if (!sceneData) return <div>加载中...</div>;

    return (
      <div className="space-y-4">
        {/* 场景类型 */}
        <div>
          <label className="text-sm font-medium mb-2 block">场景类型</label>
          <TagSelector
            options={sceneData.type.options}
            selected={store.scene.type}
            onSelect={(value) => store.setScene("type", value)}
          />
        </div>

        {/* 时间 */}
        <div>
          <label className="text-sm font-medium mb-2 block">时间</label>
          <TagSelector
            options={sceneData.time.options}
            selected={store.scene.time}
            onSelect={(value) => store.setScene("time", value)}
          />
        </div>

        {/* 天气 */}
        <div>
          <label className="text-sm font-medium mb-2 block">天气</label>
          <TagSelector
            options={sceneData.weather.options}
            selected={store.scene.weather}
            onSelect={(value) => store.setScene("weather", value)}
          />
        </div>
      </div>
    );
  };

  // 渲染光影模块
  const renderLightingModule = () => {
    const lightingData = modules.lighting;
    if (!lightingData) return <div>加载中...</div>;

    return (
      <div className="space-y-4">
        {/* 光源类型 */}
        <div>
          <label className="text-sm font-medium mb-2 block">光源类型</label>
          <TagSelector
            options={lightingData.type.options}
            selected={store.lighting}
            onSelect={(value) => store.setLighting(value)}
          />
        </div>

        {/* 光线方向 */}
        <div>
          <label className="text-sm font-medium mb-2 block">光线方向</label>
          <TagSelector
            options={lightingData.direction.options}
            selected={store.lighting}
            onSelect={(value) => store.setLighting(value)}
          />
        </div>
      </div>
    );
  };

  // 渲染镜头模块
  const renderCameraModule = () => {
    const cameraData = modules.camera;
    if (!cameraData) return <div>加载中...</div>;

    return (
      <div className="space-y-4">
        {/* 拍摄角度 */}
        <div>
          <label className="text-sm font-medium mb-2 block">拍摄角度</label>
          <TagSelector
            options={cameraData.angle.options}
            selected={store.camera}
            onSelect={(value) => store.setCamera(value)}
          />
        </div>

        {/* 景别 */}
        <div>
          <label className="text-sm font-medium mb-2 block">景别</label>
          <TagSelector
            options={cameraData.shot.options}
            selected={store.camera}
            onSelect={(value) => store.setCamera(value)}
          />
        </div>
      </div>
    );
  };

  // 标签页配置
  const tabs = [
    { id: "character", label: "角色", icon: "👤" },
    { id: "hairstyle", label: "发型", icon: "💇" },
    { id: "costume", label: "服装", icon: "👔" },
    { id: "mecha", label: "机甲", icon: "🤖" },
    { id: "scene", label: "场景", icon: "🏙️" },
    { id: "lighting", label: "光影", icon: "💡" },
    { id: "camera", label: "镜头", icon: "📷" },
  ];

  // 渲染当前标签页内容
  const renderTabContent = () => {
    switch (activeTab) {
      case "character":
        return renderCharacterModule();
      case "hairstyle":
        return renderHairstyleModule();
      case "costume":
        return (
          <div>
            <label className="text-sm font-medium mb-2 block">服装类型</label>
            <TagSelector
              options={modules.costume?.type?.options || []}
              selected={store.costume}
              onSelect={(value) => store.setCostume(value)}
            />
          </div>
        );
      case "mecha":
        return renderMechaModule();
      case "scene":
        return renderSceneModule();
      case "lighting":
        return renderLightingModule();
      case "camera":
        return renderCameraModule();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🤖</span>
            <h1 className="text-xl font-bold">CelMecha Studio</h1>
            <span className="text-sm text-muted-foreground">赛璐璐机甲工坊</span>
          </div>
          <nav className="flex items-center space-x-4">
            <button className="text-sm text-muted-foreground hover:text-foreground">
              生成器
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground">
              身份板
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground">
              卡牌
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground">
              海报
            </button>
            <a
              href="/settings"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              ⚙️ API设置
            </a>
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧选择面板 */}
          <div className="col-span-4">
            <div className="bg-card rounded-lg border p-4">
              <h2 className="font-semibold mb-4">选择配置</h2>

              {/* 标签页导航 */}
              <div className="flex flex-wrap gap-1 mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* 标签页内容 */}
              <div className="min-h-[300px]">{renderTabContent()}</div>

              {/* 特殊需求输入 */}
              <div className="mt-4">
                <label className="text-sm font-medium mb-2 block">特殊需求</label>
                <textarea
                  value={store.custom_input}
                  onChange={(e) => store.setCustomInput(e.target.value)}
                  placeholder="输入特殊需求..."
                  className="w-full p-2 border rounded-md text-sm resize-none h-20"
                />
              </div>

              {/* 生成提示词按钮 */}
              <button
                onClick={handleGeneratePrompt}
                className="w-full mt-4 bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                生成提示词
              </button>
            </div>
          </div>

          {/* 右侧预览区域 */}
          <div className="col-span-8">
            <div className="bg-card rounded-lg border p-4">
              {/* 图像预览区 */}
              <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                {isGenerating ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">生成中...</p>
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <span className="text-4xl">🎨</span>
                    <p className="mt-2">选择配置后点击生成</p>
                  </div>
                )}
              </div>

              {/* 提示词预览区 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">提示词预览</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(promptZh);
                      }}
                      className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80"
                    >
                      复制中文
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(promptEn);
                      }}
                      className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80"
                    >
                      复制英文
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">中文</label>
                    <div className="p-3 bg-muted rounded-md text-sm min-h-[100px] max-h-[200px] overflow-auto">
                      {promptZh || "点击「生成提示词」查看结果"}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">English</label>
                    <div className="p-3 bg-muted rounded-md text-sm min-h-[100px] max-h-[200px] overflow-auto">
                      {promptEn || "Click 'Generate Prompt' to see result"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 模型选择和生成按钮 */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">选择模型</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <optgroup label="Local Models">
                      <option value="comfyui">ComfyUI (Local)</option>
                    </optgroup>
                    <optgroup label="Online Models">
                      <option value="gpt-image-2">GPT-Image-2</option>
                      <option value="nano-banana2">Nano-Banana2</option>
                    </optgroup>
                  </select>
                </div>
                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? "生成中..." : "生成图像"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
