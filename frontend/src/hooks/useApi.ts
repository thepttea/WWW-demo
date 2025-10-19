import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type StartSimulationRequest, type ReportRequest } from '../services/api';

// LLM Chat相关hooks
export const useInitChatSession = () => {
  return useMutation({
    mutationFn: () => apiClient.initChatSession(),
    onSuccess: (data) => {
      console.log('Chat session initialized:', data);
    },
    onError: (error) => {
      console.error('Failed to initialize chat session:', error);
    },
  });
};

export const useSendChatMessage = () => {
  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) => 
      apiClient.sendChatMessage(sessionId, message),
    onError: (error) => {
      console.error('Failed to send chat message:', error);
    },
  });
};

export const useChatHistory = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['chatHistory', sessionId],
    queryFn: () => apiClient.getChatHistory(sessionId!),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};

// 模拟相关hooks
export const useStartSimulation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: StartSimulationRequest) => apiClient.startSimulation(request),
    onSuccess: (data) => {
      console.log('Simulation started:', data);
      // 清除相关的查询缓存
      queryClient.invalidateQueries({ queryKey: ['simulation'] });
    },
    onError: (error) => {
      console.error('Failed to start simulation:', error);
    },
  });
};

export const useAddPRStrategy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ simulationId, prStrategy }: { simulationId: string; prStrategy: string }) => 
      apiClient.addPRStrategy(simulationId, prStrategy),
    onSuccess: (data, variables) => {
      console.log('PR strategy added:', data);
      // 清除相关的查询缓存，强制重新获取最新数据
      queryClient.invalidateQueries({ queryKey: ['simulationStatus', variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ['simulationResult', variables.simulationId] });
      queryClient.invalidateQueries({ queryKey: ['networkData', variables.simulationId] });
    },
    onError: (error) => {
      console.error('Failed to add PR strategy:', error);
    },
  });
};

export const useSimulationStatus = (simulationId: string | null, isRunning: boolean = true) => {
  return useQuery({
    queryKey: ['simulationStatus', simulationId],
    queryFn: () => apiClient.getSimulationStatus(simulationId!),
    enabled: !!simulationId && isRunning,
    refetchInterval: isRunning ? 2000 : false, // 只在运行时轮询
  });
};

export const useSimulationResult = (simulationId: string | null) => {
  return useQuery({
    queryKey: ['simulationResult', simulationId],
    queryFn: () => apiClient.getSimulationResult(simulationId!),
    enabled: !!simulationId,
    staleTime: 30 * 1000, // 30秒
    retry: 3, // 重试3次
    retryDelay: 1000, // 重试间隔1秒
  });
};

export const useNetworkData = (simulationId: string | null) => {
  return useQuery({
    queryKey: ['networkData', simulationId],
    queryFn: () => apiClient.getNetworkData(simulationId!),
    enabled: !!simulationId,
    staleTime: 60 * 1000, // 1分钟
    retry: 3, // 重试3次
    retryDelay: 1000, // 重试间隔1秒
  });
};

export const useSimulationResultData = (simulationId: string | null) => {
  return useQuery({
    queryKey: ['simulationResultData', simulationId],
    queryFn: () => apiClient.getSimulationResultData(simulationId!),
    enabled: !!simulationId,
    staleTime: 30 * 1000, // 30秒
  });
};

export const useStopSimulation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (simulationId: string) => apiClient.stopSimulation(simulationId),
    onSuccess: (data, simulationId) => {
      console.log('Simulation stopped:', data);
      // 清除模拟相关的查询缓存
      queryClient.removeQueries({ queryKey: ['simulation', simulationId] });
    },
    onError: (error) => {
      console.error('Failed to stop simulation:', error);
    },
  });
};

export const useGenerateReport = () => {
  return useMutation({
    mutationFn: (request: ReportRequest) => apiClient.generateReport(request),
    onSuccess: (data) => {
      console.log('Report generated:', data);
    },
    onError: (error) => {
      console.error('Failed to generate report:', error);
    },
  });
};

export const useResetSimulation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (simulationId: string) => apiClient.resetSimulation(simulationId),
    onSuccess: (data, simulationId) => {
      console.log('Simulation reset:', data);
      // 清除所有模拟相关的查询缓存
      queryClient.removeQueries({ queryKey: ['simulation', simulationId] });
      queryClient.removeQueries({ queryKey: ['simulationStatus', simulationId] });
      queryClient.removeQueries({ queryKey: ['simulationResult', simulationId] });
      queryClient.removeQueries({ queryKey: ['networkData', simulationId] });
    },
    onError: (error) => {
      console.error('Failed to reset simulation:', error);
    },
  });
};
