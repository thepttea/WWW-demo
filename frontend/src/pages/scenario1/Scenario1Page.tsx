import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Typography, message } from 'antd';
import ConfigurationPanel from './ConfigurationPanel';
import VisualizationArea from './VisualizationArea';
import StrategyRefinementDrawer from '../../components/StrategyRefinementDrawer';
import Scenario1ResultsPageStatic from './Scenario1ResultsPageStatic';
import { SimulationConfig, SimulationParameters, SimulationState } from '../../types';
import { useStartSimulation, useAddPRStrategy, useSimulationStatus, useSimulationResult, useGenerateReport, useResetSimulation, useNetworkData } from '../../hooks/useApi';
import { transformSimulationResultToNetworkData, transformAgentsToNetworkData } from '../../utils/dataTransformer';
import './Scenario1Page.css';

const { Title, Paragraph } = Typography;

const Scenario1Page: React.FC = () => {
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState | undefined>(undefined);
  const [confirmedStrategy, setConfirmedStrategy] = useState<string>('');
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [hasCompletedSimulation, setHasCompletedSimulation] = useState<boolean>(false);
  const [isStartingNewRound, setIsStartingNewRound] = useState<boolean>(false);

  // API hooks
  const startSimulationMutation = useStartSimulation();
  const addPRStrategyMutation = useAddPRStrategy();
  const generateReportMutation = useGenerateReport();
  const resetSimulationMutation = useResetSimulation();
  const { data: simulationStatusData } = useSimulationStatus(simulationId, isSimulationRunning);
  const { data: simulationResultData } = useSimulationResult(simulationId);
  const { data: networkData } = useNetworkData(simulationId);


  // 监听模拟状态变化
  useEffect(() => {
    if (simulationStatusData?.success && simulationStatusData.data) {
      const status = simulationStatusData.data.status;
      console.log('Simulation status:', status);
      
      if (status === 'completed' && isSimulationRunning) {
        console.log('Simulation completed, stopping polling and fetching results');
        setIsSimulationRunning(false);
        // 这里不需要手动获取结果，useSimulationResult会自动获取
      } else if (status === 'error') {
        console.log('Simulation failed');
        setIsSimulationRunning(false);
        message.error('Simulation failed');
      }
    }
  }, [simulationStatusData, isSimulationRunning]);

  // 监听数据获取结果，如果有数据就停止加载状态
  useEffect(() => {
    // 如果正在开始新轮次，忽略旧的缓存数据
    if (isStartingNewRound) {
      console.log('Ignoring cached data because isStartingNewRound is true');
      return;
    }
    
    if (simulationResultData?.success && simulationResultData.data && isSimulationRunning) {
      console.log('Simulation result data received, stopping loading state');
      setIsSimulationRunning(false);
    }
  }, [simulationResultData, isSimulationRunning, isStartingNewRound]);

  // 监听所有数据状态，判断数据是否准备好（但不立即标记为完成）
  useEffect(() => {
    const hasStatusData = !!simulationStatusData?.success;
    const hasResultData = !!simulationResultData?.success;
    const hasNetworkData = !!networkData?.success;
    
    if (hasStatusData && hasResultData && hasNetworkData) {
      console.log('All simulation data ready, data is available for animation');
      // 不在这里设置hasCompletedSimulation，让动画先开始
    }
  }, [simulationStatusData, simulationResultData, networkData]);

  // 使用ref保存上一次的网络数据
  const previousNetworkDataRef = useRef<any>(null);
  
  // 使用useMemo缓存网络数据转换结果，避免不必要的重新计算
  const memoizedNetworkData = useMemo(() => {
    console.log('====== [DATA DEBUG] Scenario1 - memoizedNetworkData computing ======');
    console.log('[DATA DEBUG] isStartingNewRound:', isStartingNewRound);
    console.log('[DATA DEBUG] simulationResultData:', simulationResultData?.success ? 'has data' : 'no data');
    
    // 如果正在开始新轮次，返回上一轮的数据以保持组件挂载状态
    if (isStartingNewRound) {
      console.log('[DATA DEBUG] Returning previous networkData because isStartingNewRound=true');
      return previousNetworkDataRef.current;
    }
    
    // 数据转换：将后端格式转换为前端期望的格式
    if (simulationResultData?.success && simulationResultData.data) {
      console.log('[DATA DEBUG] Processing simulation result data');
      console.log('[DATA DEBUG] Agents data:', simulationResultData.data.agents?.map(a => ({
        username: a.username,
        stance: a.stanceScore || a.objective_stance_score
      })));
      
      try {
        // 转换数据格式以匹配期望的接口
        const transformedData = {
          ...simulationResultData.data,
          agents: simulationResultData.data.agents.map(agent => ({
            ...agent,
            // 后端返回的字段名是 influence_score，需要转换
            influenceScore: agent.influence_score || 0
          }))
        };
        
        // 优先使用完整的模拟结果数据
        const backendNetworkData = networkData?.success && networkData.data ? {
          ...networkData.data,
          nodes: networkData.data.nodes.map(node => ({
            ...node,
            influenceScore: node.influence_score || 0
          })),
          edges: networkData.data.edges || []
        } : undefined;
        
        const result = transformSimulationResultToNetworkData(
          transformedData,
          backendNetworkData
        );
        
        console.log('[DATA DEBUG] Transformed network data users:', result?.users?.map(u => ({
          username: u.username,
          stance: u.objective_stance_score
        })));
        
        // 保存当前数据以供下一轮使用
        previousNetworkDataRef.current = result;
        
        return result;
      } catch (error) {
        console.error('Error transforming simulation data:', error);
        // 如果转换失败，尝试简化版转换
        if (simulationResultData.data.agents) {
          // 转换数据格式以匹配期望的接口
          const transformedAgents = simulationResultData.data.agents.map(agent => ({
            ...agent,
            // 后端返回的字段名是 influence_score，需要转换
            influenceScore: agent.influence_score || 0
          }));
          const result = transformAgentsToNetworkData(transformedAgents);
          previousNetworkDataRef.current = result;
          return result;
        }
      }
    }
    console.log('[DATA DEBUG] Returning undefined because no valid data');
    return previousNetworkDataRef.current || undefined;
  }, [simulationResultData, networkData, isStartingNewRound]);

  // 调试日志 - 移到memoizedNetworkData定义之后
  console.log('Scenario1Page - Current state:', {
    simulationId,
    isSimulationRunning,
    isStartingNewRound,
    hasStatusData: !!simulationStatusData,
    hasResultData: !!simulationResultData,
    hasNetworkData: !!networkData,
    hasCompletedSimulation,
    hasMemoizedNetworkData: !!memoizedNetworkData,
    simulationState: simulationState
  });

  const handleStartSimulation = async (config: SimulationConfig) => {
    console.log('Scenario1Page - handleStartSimulation called with config:', config);
    
    if (!config.eventDescription?.trim()) {
      message.warning('Please enter event description first');
      return;
    }
    if (!config.strategy.content.trim()) {
      message.warning('Please enter your PR strategy first');
      return;
    }

    // 立即设置运行状态，给用户即时反馈
    setIsSimulationRunning(true);
    
    try {
      message.loading('Starting simulation...', 0);
      const result = await startSimulationMutation.mutateAsync({
        initialTopic: config.eventDescription,
        llmModel: config.llm,
        simulationConfig: {
          agents: 10,
          num_rounds: 1,
          interactionProbability: 0.5,
          positiveResponseProbability: 0.3,
          negativeResponseProbability: 0.3,
          neutralResponseProbability: 0.4,
          initialPositiveSentiment: 0.2,
          initialNegativeSentiment: 0.6,
          initialNeutralSentiment: 0.2,
        },
        prStrategy: config.strategy.content,
      });

      message.destroy();
      
      if (result.success && result.data) {
        console.log('Scenario1Page - Start simulation result:', result);
        setSimulationId(result.data.simulationId);
        // 已经在try块开始时设置了isSimulationRunning = true
        setSimulationState({
          isRunning: true,
          currentRound: 1,
          lockedConfig: {
            llm: config.llm,
            eventDescription: config.eventDescription || '',
          },
          strategyHistory: [{
            round: 1,
            strategy: config.strategy.content,
            timestamp: new Date(),
          }],
        });
        message.success('Simulation started successfully!');
      } else {
        console.log('Scenario1Page - Start simulation failed, result:', result);
        setIsSimulationRunning(false);
        message.error(result.error?.message || 'Failed to start simulation');
      }
    } catch (error) {
      message.destroy();
      setIsSimulationRunning(false);
      message.error('Failed to start simulation. Please try again.');
      console.error('Start simulation error:', error);
    }
  };


  const handleStartNextRound = async (strategy: string) => {
    if (!strategy.trim()) {
      message.warning('Please enter next round strategy first');
      return;
    }

    if (!simulationId) {
      message.error('No active simulation found');
      return;
    }

    // 立即设置运行状态，给用户即时反馈
    console.log('handleStartNextRound - Setting states:', {
      before: { isSimulationRunning, hasCompletedSimulation, isStartingNewRound }
    });
    setIsSimulationRunning(true);
    setHasCompletedSimulation(false); // 重置完成状态，准备新的动画
    setIsStartingNewRound(true); // 标记正在开始新轮次，清除旧数据
    console.log('handleStartNextRound - States set, should show running simulation');
    
    try {
      message.loading('Starting next round simulation...', 0);
      const result = await addPRStrategyMutation.mutateAsync({
        simulationId,
        prStrategy: strategy,
      });

      message.destroy();
      
      if (result.success && result.data) {
        const roundNumber = result.data.round;
        console.log('Next round simulation started, round:', roundNumber);
        console.log('Backend returned new data, clearing isStartingNewRound flag');
        
        // 后端返回了新数据，清除新轮次标记
        setIsStartingNewRound(false);
        
        // 更新模拟状态，将当前策略添加到历史中
        setSimulationState(prev => prev ? {
          ...prev,
          currentRound: roundNumber || (prev.currentRound + 1),
          strategyHistory: [
            ...prev.strategyHistory,
            {
              round: roundNumber || (prev.currentRound + 1),
              strategy: strategy,
              timestamp: new Date(),
            }
          ],
          nextRoundStrategy: strategy,
        } : undefined);

        message.success(`Round ${roundNumber || 'next'} simulation started!`);
      } else {
        console.log('Next round simulation failed, result:', result);
        setIsSimulationRunning(false);
        setIsStartingNewRound(false);
        message.error(result.error?.message || 'Failed to start next round');
      }
    } catch (error) {
      message.destroy();
      setIsSimulationRunning(false);
      setIsStartingNewRound(false);
      message.error('Next round simulation failed. Please try again.');
      console.error('Next round error:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!simulationId) {
      message.warning('Please run a simulation first');
      return;
    }

    // 立即设置报告生成状态
    setIsGeneratingReport(true);

    try {
      message.loading('Generating report...', 0);
      const result = await generateReportMutation.mutateAsync({
        simulationId,
        reportType: 'comprehensive',
        includeVisualizations: true,
      });

      message.destroy();
      
      if (result.success && result.data) {
        setReportData(result.data);
        setShowResults(true);
        setIsGeneratingReport(false);
        message.success('Report generated successfully!');
        console.log('Generated report:', result.data);
      } else {
        setIsGeneratingReport(false);
        message.error(result.error?.message || 'Failed to generate report');
      }
    } catch (error) {
      message.destroy();
      setIsGeneratingReport(false);
      message.error('Failed to generate report');
      console.error('Generate report error:', error);
    }
  };

  const handleReset = async () => {
    try {
      // 如果有活跃的模拟，先调用后端reset接口
      if (simulationId) {
        const result = await resetSimulationMutation.mutateAsync(simulationId);
        if (!result.success) {
          message.error(result.error?.message || 'Failed to reset simulation on server');
          return;
        }
      }

      // 重置所有前端状态
      setSimulationState(undefined);
      setSimulationId(null);
      setConfirmedStrategy('');
      setIsDrawerVisible(false);
      setShowResults(false);
      setReportData(null);
      setIsSimulationRunning(false);
      setIsGeneratingReport(false);
      setHasCompletedSimulation(false);
      setIsStartingNewRound(false);
      
      message.success('Simulation reset successfully');
    } catch (error) {
      message.error('Failed to reset simulation');
      console.error('Reset error:', error);
    }
  };

  const handleOpenDrawer = () => {
    setIsDrawerVisible(true);
  };

  const handleCloseResults = () => {
    setShowResults(false);
  };

  const handleBackToSimulation = () => {
    setShowResults(false);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
  };

  const handleStrategyConfirm = (strategy: string, parameters: SimulationParameters) => {
    // 保存确认的策略
    setConfirmedStrategy(strategy);
    console.log('Confirmed strategy:', strategy);
    console.log('Parameters:', parameters);
    message.success('Strategy confirmed and parameters updated!');
  };

  // 如果显示结果页面，渲染结果组件
  if (showResults) {
    return (
      <Scenario1ResultsPageStatic
        simulationResults={reportData}
        onBack={handleBackToSimulation}
        onClose={handleCloseResults}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="scenario1-page">
      <div className="page-header">
        <Title level={2} className="page-title">
          EchoChamber: A Simulator for Public Relations Crisis Dynamics
        </Title>
        <Paragraph className="page-description">
          Analyze public opinion propagation through multi-agent llm-based simulation.
        </Paragraph>
      </div>

      <div className="page-content">
        <div className="content-grid">
          <div className="config-column">
            <ConfigurationPanel
              onStartSimulation={handleStartSimulation}
              onStartNextRound={handleStartNextRound}
              onGenerateReport={handleGenerateReport}
              onReset={handleReset}
              onOpenDrawer={handleOpenDrawer}
              simulationState={simulationState}
              confirmedStrategy={confirmedStrategy}
              isGeneratingReport={isGeneratingReport}
            />
          </div>
          <div className="visualization-column">
            <VisualizationArea
              isLoading={startSimulationMutation.isPending || addPRStrategyMutation.isPending}
              isSimulationRunning={isSimulationRunning}
              hasCompletedSimulation={hasCompletedSimulation}
              onAnimationCompleted={() => setHasCompletedSimulation(true)}
              networkData={memoizedNetworkData}
              simulationResult={simulationResultData?.success ? simulationResultData.data : undefined}
            />
          </div>
        </div>
      </div>

      <StrategyRefinementDrawer
        visible={isDrawerVisible}
        onClose={handleCloseDrawer}
        onStrategyConfirm={handleStrategyConfirm}
      />
    </div>
  );
};

export default Scenario1Page;
