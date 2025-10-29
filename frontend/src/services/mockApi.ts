// Mock API service - used during development to simulate backend responses
import round1Data from '../../data/round1.json';  // Round 1 data
import round2Data from '../../data/round2.json';  // Round 2 data
import round3Data from '../../data/round3.json';  // Round 3 data
import resultData from '../../data/result.json';  // Mock result data
import { ApiResponse } from './api';

export interface MockSimulationData {
  simulationId: string;
  status: string;
  currentRound: number;
  eventDescription: string;
  prStrategies: Array<{
    round: number;
    strategy: string;
    timestamp: string;
  }>;
  users: Array<{
    username: string;
    description: string;
    emotional_style: string;
    influence_score: number;
    primary_platform: string;
    objective_stance_score: number;
    final_decision: string;
    contextual_memories: string[];
    short_term_memories: string[];
  }>;
  platforms: Array<{
    name: string;
    type: string;
    userCount: number;
    activeUsers: string[];
    message_propagation: Array<{
      sender: string;
      receivers: string[];
      content: string;
      sentiment: string;
      timestamp: string;
    }>;
  }>;
}

// Polling status interface
export interface SimulationStatus {
  simulationId: string;
  status: 'initial' | 'running' | 'completed' | 'consumed' | 'error';
  progress: number;
  currentRound: number;
  message?: string;
}

// Mock result data interface
export interface SimulationResultData {
  overallSentiment: number;
  engagementRate: number;
  reach: number;
  sentimentTrend: string;
  prEffectiveness: number;
  keyInsights: string;
  recommendations: string[];
  influentialNodes: Array<{
    node: string;
    influence_score: number;
    sentiment: string;
    reach: number;
  }>;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trendData: {
    positive: string;
    engagement: string;
    reach: string;
  };
  effectivenessRating: {
    score: number;
    rating: string;
    thresholds: {
      excellent: number;
      good: number;
    };
  };
}

// Mock state storage
interface SimulationState {
  status: 'initial' | 'running' | 'completed' | 'consumed' | 'error';
  progress: number;
  currentRound: number;
  data?: MockSimulationData;
  startTime: number;
  completedTime?: number;
}

class MockApiClient {
  private simulationStates: Map<string, SimulationState> = new Map();

  constructor(baseURL: string = '/api') {
    // baseURL is reserved for future use
    void baseURL;
  }

  private async mockRequest<T>(data: T, delay: number = 500): Promise<ApiResponse<T>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, delay));
    return {
      success: true,
      data: data
    };
  }

  // Mock API call to start simulation
  async startSimulation(config: {
    eventDescription: string;
    llm: string;
    strategy: string;
  }): Promise<ApiResponse<{ simulationId: string; status: string }>> {
    console.log('Mock API: Starting simulation with config:', config);
    
    const simulationId = `sim_${Date.now()}`;
    
    // Initialize simulation state
    this.simulationStates.set(simulationId, {
      status: 'running',
      progress: 0,
      currentRound: 1,
      startTime: Date.now()
    });

    return this.mockRequest({
      simulationId,
      status: 'running'
    }, 500);
  }


  // Mock API call to add next round strategy
  async addNextRoundStrategy(simulationId: string, strategy: string, currentRound: number = 1): Promise<ApiResponse<{ simulationId: string; status: string }>> {
    console.log('Mock API: Adding next round strategy:', strategy, 'for round:', currentRound + 1);
    
    const targetRound = currentRound + 1;
    console.log('Mock API: Target round:', targetRound);
    
    // Update simulation state
    const state = this.simulationStates.get(simulationId);
    if (state) {
      console.log('Mock API: Updating existing state from round', state.currentRound, 'to round', targetRound);
      state.status = 'running';
      state.progress = 0;
      state.currentRound = targetRound;
      state.startTime = Date.now();
      state.completedTime = undefined;
      state.data = undefined;
    } else {
      console.log('Mock API: Creating new state for round', targetRound);
      // If state does not exist, create a new one
      this.simulationStates.set(simulationId, {
        status: 'running',
        progress: 0,
        currentRound: targetRound,
        startTime: Date.now()
      });
    }

    return this.mockRequest({
      simulationId,
      status: 'running'
    }, 500);
  }

  // Mock API call to generate report
  async generateReport(simulationId: string): Promise<ApiResponse<{
    reportId: string;
    content: string;
    summary: {
      overallSentiment: number;
      keyInsights: string[];
      improvements: string[];
    };
    generatedAt: string;
  }>> {
    console.log('Mock API: Generating report for:', simulationId);
    
    const reportData = {
      reportId: `report_${Date.now()}`,
      content: "Analysis report based on simulation results...",
      summary: {
        overallSentiment: 0.2,
        keyInsights: [
          "Most users are cautious about AI products",
          "Support from technical experts is relatively high",
          "Regulatory risk is a major concern"
        ],
        improvements: [
          "Strengthen privacy protection measures",
          "Increase transparency",
          "Enhance communication with regulatory agencies"
        ]
      },
      generatedAt: new Date().toISOString()
    };

    return this.mockRequest(reportData, 1200);
  }

  // Mock API call to reset simulation
  async resetSimulation(simulationId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    console.log('Mock API: Resetting simulation:', simulationId);
    
    return this.mockRequest({
      success: true,
      message: 'Simulation reset successfully'
    }, 200);
  }

  // Polling API - get simulation status
  async getSimulationStatus(simulationId: string): Promise<ApiResponse<SimulationStatus>> {
    console.log('Mock API: Getting simulation status for:', simulationId);
    
    const state = this.simulationStates.get(simulationId);
    
    if (!state) {
      return this.mockRequest({
        simulationId,
        status: 'error',
        progress: 0,
        currentRound: 0,
        message: 'Simulation not found'
      }, 100);
    }

    // If status is running, simulate progress update
    if (state.status === 'running') {
      const now = Date.now();
      const elapsed = now - state.startTime;
      const totalDuration = 2000; // Simulate completion in 2 seconds
      const progress = Math.min(Math.floor((elapsed / totalDuration) * 100), 99);
      
      // If total duration is exceeded, mark as completed
      if (elapsed >= totalDuration) {
        state.status = 'completed';
        state.progress = 100;
        state.completedTime = now;
        
        // Set corresponding data based on the current round
        console.log('Mock API: Setting data for round:', state.currentRound);
        let baseData;
        if (state.currentRound === 1) {
          baseData = round1Data;
          console.log('Mock API: Using round1Data');
        } else if (state.currentRound === 2) {
          baseData = round2Data;
          console.log('Mock API: Using round2Data');
        } else if (state.currentRound === 3) {
          baseData = round3Data;
          console.log('Mock API: Using round3Data');
        } else {
          baseData = round1Data;
          console.log('Mock API: Using round1Data (fallback)');
        }
        
        state.data = {
          ...baseData,
          simulationId,
          status: 'completed',
          currentRound: state.currentRound
        };
      } else {
        state.progress = progress;
      }
    }

    return this.mockRequest({
      simulationId,
      status: state.status,
      progress: state.progress,
      currentRound: state.currentRound,
      message: state.status === 'error' ? 'Simulation failed' : undefined
    }, 100);
  }

  // Polling API - get simulation result
  async getSimulationResult(simulationId: string): Promise<ApiResponse<MockSimulationData>> {
    console.log('Mock API: Getting simulation result for:', simulationId);
    
    const state = this.simulationStates.get(simulationId);
    
    if (!state) {
      throw new Error('Simulation not found');
    }

    if (state.status === 'running') {
      throw new Error('Simulation is still running');
    }

    if (state.status === 'error') {
      throw new Error('Simulation failed');
    }

    if (!state.data) {
      throw new Error('Simulation data not available');
    }

    // If status is 'completed', change to 'consumed' after fetching data
    if (state.status === 'completed') {
      state.status = 'consumed';
    }

    return this.mockRequest(state.data, 200);
  }
}

// Export mock API client instance
export const mockApiClient = new MockApiClient();
export default mockApiClient;
