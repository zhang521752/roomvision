import { create } from 'zustand';

interface Selection {
  id: string;
  label: { zh: string; en: string };
  prompt: { zh: string; en: string };
}

interface AppState {
  // 选择状态
  character: {
    gender?: Selection;
    age?: Selection;
    body_type?: Selection;
    personality?: Selection[];
  };
  hairstyle?: Selection;
  costume?: Selection;
  expression?: Selection;
  mecha: {
    type?: Selection;
    size?: Selection;
    style?: Selection;
    color?: Selection;
  };
  weapon?: Selection;
  prop?: Selection;
  scene: {
    type?: Selection;
    time?: Selection;
    weather?: Selection;
  };
  lighting?: Selection;
  camera?: Selection;
  effect?: Selection;
  custom_input: string;

  // 生成状态
  prompt_zh: string;
  prompt_en: string;
  isGenerating: boolean;
  generatedImage: string | null;

  // 项目状态
  currentProjectId: string | null;

  // Actions
  setCharacter: (field: string, value: Selection | Selection[] | undefined) => void;
  setHairstyle: (value: Selection | undefined) => void;
  setCostume: (value: Selection | undefined) => void;
  setExpression: (value: Selection | undefined) => void;
  setMecha: (field: string, value: Selection | undefined) => void;
  setWeapon: (value: Selection | undefined) => void;
  setProp: (value: Selection | undefined) => void;
  setScene: (field: string, value: Selection | undefined) => void;
  setLighting: (value: Selection | undefined) => void;
  setCamera: (value: Selection | undefined) => void;
  setEffect: (value: Selection | undefined) => void;
  setCustomInput: (value: string) => void;
  setPrompt: (zh: string, en: string) => void;
  setIsGenerating: (value: boolean) => void;
  setGeneratedImage: (value: string | null) => void;
  setCurrentProject: (id: string | null) => void;
  resetSelections: () => void;
}

const initialState = {
  character: {},
  hairstyle: undefined,
  costume: undefined,
  expression: undefined,
  mecha: {},
  weapon: undefined,
  prop: undefined,
  scene: {},
  lighting: undefined,
  camera: undefined,
  effect: undefined,
  custom_input: '',
  prompt_zh: '',
  prompt_en: '',
  isGenerating: false,
  generatedImage: null,
  currentProjectId: null,
};

export const useStore = create<AppState>((set) => ({
  ...initialState,

  setCharacter: (field, value) =>
    set((state) => ({
      character: { ...state.character, [field]: value },
    })),

  setHairstyle: (value) => set({ hairstyle: value }),

  setCostume: (value) => set({ costume: value }),

  setExpression: (value) => set({ expression: value }),

  setMecha: (field, value) =>
    set((state) => ({
      mecha: { ...state.mecha, [field]: value },
    })),

  setWeapon: (value) => set({ weapon: value }),

  setProp: (value) => set({ prop: value }),

  setScene: (field, value) =>
    set((state) => ({
      scene: { ...state.scene, [field]: value },
    })),

  setLighting: (value) => set({ lighting: value }),

  setCamera: (value) => set({ camera: value }),

  setEffect: (value) => set({ effect: value }),

  setCustomInput: (value) => set({ custom_input: value }),

  setPrompt: (zh, en) => set({ prompt_zh: zh, prompt_en: en }),

  setIsGenerating: (value) => set({ isGenerating: value }),

  setGeneratedImage: (value) => set({ generatedImage: value }),

  setCurrentProject: (id) => set({ currentProjectId: id }),

  resetSelections: () => set(initialState),
}));
