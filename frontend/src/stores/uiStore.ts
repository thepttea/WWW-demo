/**
 * UI状态管理Store
 * 管理界面相关的状态
 */

import { create } from 'zustand';

interface UIState {
  // 侧边栏状态
  sidebarCollapsed: boolean;
  
  // 模态框状态
  isLLMSelectorOpen: boolean;
  isSimulationConfigOpen: boolean;
  isAgentDetailOpen: boolean;
  
  // 主题设置
  theme: 'light' | 'dark';
  
  // 布局设置
  layout: 'horizontal' | 'vertical';
  networkPanelSize: number; // 网络图面板大小比例
  
  // 动画设置
  enableAnimations: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  
  // 显示设置
  showInfluenceScores: boolean;
  showStanceValues: boolean;
  showPlatformIcons: boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  openLLMSelector: () => void;
  closeLLMSelector: () => void;
  
  openSimulationConfig: () => void;
  closeSimulationConfig: () => void;
  
  openAgentDetail: () => void;
  closeAgentDetail: () => void;
  
  setTheme: (theme: 'light' | 'dark') => void;
  setLayout: (layout: 'horizontal' | 'vertical') => void;
  setNetworkPanelSize: (size: number) => void;
  
  setEnableAnimations: (enable: boolean) => void;
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  
  setShowInfluenceScores: (show: boolean) => void;
  setShowStanceValues: (show: boolean) => void;
  setShowPlatformIcons: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // 初始状态
  sidebarCollapsed: false,
  isLLMSelectorOpen: false,
  isSimulationConfigOpen: false,
  isAgentDetailOpen: false,
  theme: 'light',
  layout: 'horizontal',
  networkPanelSize: 0.7,
  enableAnimations: true,
  animationSpeed: 'normal',
  showInfluenceScores: true,
  showStanceValues: true,
  showPlatformIcons: true,
  
  // Actions
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  openLLMSelector: () => set({ isLLMSelectorOpen: true }),
  closeLLMSelector: () => set({ isLLMSelectorOpen: false }),
  
  openSimulationConfig: () => set({ isSimulationConfigOpen: true }),
  closeSimulationConfig: () => set({ isSimulationConfigOpen: false }),
  
  openAgentDetail: () => set({ isAgentDetailOpen: true }),
  closeAgentDetail: () => set({ isAgentDetailOpen: false }),
  
  setTheme: (theme) => set({ theme }),
  setLayout: (layout) => set({ layout }),
  setNetworkPanelSize: (size) => set({ networkPanelSize: Math.max(0.3, Math.min(0.9, size)) }),
  
  setEnableAnimations: (enable) => set({ enableAnimations: enable }),
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  
  setShowInfluenceScores: (show) => set({ showInfluenceScores: show }),
  setShowStanceValues: (show) => set({ showStanceValues: show }),
  setShowPlatformIcons: (show) => set({ showPlatformIcons: show }),
}));
