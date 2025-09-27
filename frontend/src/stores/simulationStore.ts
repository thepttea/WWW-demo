/**
 * 模拟状态管理Store
 * 使用Zustand管理模拟相关的全局状态
 */

import { create } from 'zustand';
import { SimulationResult, SimulationConfig } from '@/types';

interface SimulationState {
  // 当前模拟状态
  currentSimulation: SimulationResult | null;
  isSimulating: boolean;
  simulationError: string | null;
  
  // 模拟配置
  simulationConfig: SimulationConfig | null;
  
  // 当前轮次
  currentRound: number;
  
  // 选中的Agent
  selectedAgentId: string | null;
  
  // 网络图状态
  networkLayout: 'force' | 'circular' | 'hierarchical';
  showConnections: boolean;
  highlightPath: boolean;
  
  // Actions
  setCurrentSimulation: (simulation: SimulationResult | null) => void;
  setSimulating: (isSimulating: boolean) => void;
  setSimulationError: (error: string | null) => void;
  setSimulationConfig: (config: SimulationConfig | null) => void;
  setCurrentRound: (round: number) => void;
  setSelectedAgent: (agentId: string | null) => void;
  setNetworkLayout: (layout: 'force' | 'circular' | 'hierarchical') => void;
  setShowConnections: (show: boolean) => void;
  setHighlightPath: (highlight: boolean) => void;
  
  // 模拟控制
  startSimulation: (config: SimulationConfig) => Promise<void>;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stopSimulation: () => void;
  
  // 轮次控制
  goToRound: (round: number) => void;
  nextRound: () => void;
  previousRound: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  // 初始状态
  currentSimulation: null,
  isSimulating: false,
  simulationError: null,
  simulationConfig: null,
  currentRound: 0,
  selectedAgentId: null,
  networkLayout: 'force',
  showConnections: true,
  highlightPath: false,
  
  // Actions
  setCurrentSimulation: (simulation) => set({ currentSimulation: simulation }),
  setSimulating: (isSimulating) => set({ isSimulating }),
  setSimulationError: (error) => set({ simulationError: error }),
  setSimulationConfig: (config) => set({ simulationConfig: config }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),
  setNetworkLayout: (layout) => set({ networkLayout: layout }),
  setShowConnections: (show) => set({ showConnections: show }),
  setHighlightPath: (highlight) => set({ highlightPath: highlight }),
  
  // 模拟控制方法
  startSimulation: async (config) => {
    set({ isSimulating: true, simulationError: null, simulationConfig: config });
    // TODO: 调用API开始模拟
    console.log('Starting simulation with config:', config);
  },
  
  pauseSimulation: () => {
    set({ isSimulating: false });
    console.log('Simulation paused');
  },
  
  resumeSimulation: () => {
    set({ isSimulating: true });
    console.log('Simulation resumed');
  },
  
  stopSimulation: () => {
    set({ 
      isSimulating: false, 
      currentSimulation: null, 
      currentRound: 0,
      selectedAgentId: null 
    });
    console.log('Simulation stopped');
  },
  
  // 轮次控制方法
  goToRound: (round) => {
    const { currentSimulation } = get();
    if (currentSimulation && round >= 0 && round < currentSimulation.rounds.length) {
      set({ currentRound: round });
    }
  },
  
  nextRound: () => {
    const { currentSimulation, currentRound } = get();
    if (currentSimulation && currentRound < currentSimulation.rounds.length - 1) {
      set({ currentRound: currentRound + 1 });
    }
  },
  
  previousRound: () => {
    const { currentRound } = get();
    if (currentRound > 0) {
      set({ currentRound: currentRound - 1 });
    }
  },
}));
