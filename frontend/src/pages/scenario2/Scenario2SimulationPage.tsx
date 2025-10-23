import React, { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Button, Divider, message } from 'antd';
import {
  ReloadOutlined,
  BarChartOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { HistoricalCase } from '../../types';
import Scenario2ResultsPage from './Scenario2ResultsPage';
import VisualizationArea from '../scenario1/VisualizationArea';
import { useStartScenario2Simulation, useScenario2SimulationStatus, useGenerateScenario2Report, useAddPRStrategy, useSimulationResult, useNetworkData, useResetSimulation } from '../../hooks/useApi';
import { transformSimulationResultToNetworkData } from '../../utils/dataTransformer';
import './Scenario2SimulationPage.css';

const { Title, Text } = Typography;

interface Scenario2SimulationPageProps {
  selectedCase: HistoricalCase | null;
  onBack: () => void;
  onReselectCase: () => void;
}

const Scenario2SimulationPage: React.FC<Scenario2SimulationPageProps> = ({
  selectedCase,
  onBack: _onBack,
  onReselectCase,
}) => {
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [hasCompletedSimulation, setHasCompletedSimulation] = useState<boolean>(false);
  const [isStartingNewRound, setIsStartingNewRound] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);

  // API hooks
  const startSimulationMutation = useStartScenario2Simulation();
  const addPRStrategyMutation = useAddPRStrategy(); // 使用Scenario1的API
  const generateReportMutation = useGenerateScenario2Report();
  const resetSimulationMutation = useResetSimulation(); // 添加reset功能
  const { data: simulationStatusData } = useScenario2SimulationStatus(simulationId, isSimulationRunning);
  // 使用Scenario1的数据获取方式，因为Scenario2现在使用相同的模拟系统
  const { data: simulationResultData } = useSimulationResult(simulationId);
  const { data: networkData } = useNetworkData(simulationId);

  // 监听模拟状态变化
  useEffect(() => {
    if (simulationStatusData?.success && simulationStatusData.data) {
      const status = simulationStatusData.data.status;
      const round = simulationStatusData.data.currentRound;
      console.log('Scenario 2 simulation status:', status, 'round:', round);
      
      if (status === 'completed' && isSimulationRunning) {
        console.log('Scenario 2 simulation completed, stopping polling and fetching results');
        setIsSimulationRunning(false);
        setCurrentRound(round);
        setHasCompletedSimulation(true);
      } else if (status === 'error') {
        console.log('Scenario 2 simulation failed');
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
      console.log('Scenario 2 simulation result data received, stopping loading state');
      setIsSimulationRunning(false);
    }
  }, [simulationResultData, isSimulationRunning, isStartingNewRound]);

  // 监听所有数据状态，判断数据是否准备好
  useEffect(() => {
    const hasStatusData = !!simulationStatusData?.success;
    const hasResultData = !!simulationResultData?.success;
    const hasNetworkData = !!networkData?.success;
    
    if (hasStatusData && hasResultData && hasNetworkData) {
      console.log('All Scenario 2 simulation data ready, data is available for animation');
      // 不在这里设置hasCompletedSimulation，让动画先开始
    }
  }, [simulationStatusData, simulationResultData, networkData]);

  // 处理网络数据转换 - 使用与Scenario1相同的方式
  const memoizedNetworkData = useMemo(() => {
    // 如果正在开始新轮次，不返回数据，让界面显示"Running Simulation..."
    if (isStartingNewRound) {
      return undefined;
    }
    
    // 数据转换：将后端格式转换为前端期望的格式
    if (simulationResultData?.success && simulationResultData.data) {
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

        return transformSimulationResultToNetworkData(
          transformedData,
          backendNetworkData
        );
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
          return transformSimulationResultToNetworkData({
            ...simulationResultData.data,
            agents: transformedAgents
          });
        }
      }
    }
    return undefined;
  }, [simulationResultData, networkData, isStartingNewRound]);

  // 调试日志
  console.log('Scenario2SimulationPage - Current state:', {
    simulationId,
    isSimulationRunning,
    isStartingNewRound,
    hasStatusData: !!simulationStatusData,
    hasResultData: !!simulationResultData,
    hasNetworkData: !!networkData,
    hasCompletedSimulation
  });

  const handleStartSimulation = async () => {
    if (!selectedCase) {
      message.error('Please select a case first');
      return;
    }

    // 立即设置运行状态，给用户即时反馈
    setIsSimulationRunning(true);
    
    try {
      message.loading('Starting simulation...', 0);
      const result = await startSimulationMutation.mutateAsync({
        caseId: selectedCase.id,
        llmModel: 'gpt-4o-mini',
        simulationConfig: {
          agents: 10,
          num_rounds: 1, // 每次添加策略后只执行一轮模拟
          interactionProbability: 0.7,
          positiveResponseProbability: 0.3,
          negativeResponseProbability: 0.2,
          neutralResponseProbability: 0.5,
          initialPositiveSentiment: 0.3,
          initialNegativeSentiment: 0.4,
          initialNeutralSentiment: 0.3
        }
      });
      
      message.destroy();
      
      if (result.success && result.data) {
        setSimulationId(result.data.simulationId);
        setCurrentRound(1);
        setHasCompletedSimulation(false);
        console.log('Scenario 2 simulation started:', result.data);
      } else {
        message.error(result.error?.message || 'Failed to start simulation');
        setIsSimulationRunning(false);
      }
    } catch (error) {
      message.destroy();
      console.error('Failed to start simulation:', error);
      message.error('Failed to start simulation');
      setIsSimulationRunning(false);
    }
  };

  const handleContinueNextRound = async () => {
    if (!simulationId) {
      message.error('No active simulation');
      return;
    }

    // 立即设置运行状态，给用户即时反馈
    console.log('handleContinueNextRound - Setting states:', {
      before: { isSimulationRunning, hasCompletedSimulation, isStartingNewRound }
    });
    setIsSimulationRunning(true);
    setHasCompletedSimulation(false); // 重置完成状态，准备新的动画
    setIsStartingNewRound(true); // 标记正在开始新轮次，清除旧数据
    
    // 立即更新到下一轮，让用户看到下一轮的策略
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    
    console.log('handleContinueNextRound - States set, should show running simulation');
    
    try {
      message.loading('Starting next round simulation...', 0);
      
      // 获取下一轮策略
      const nextRoundStrategy = getCurrentRoundStrategy(selectedCase?.strategies || [], nextRound);
      const strategyContent = nextRoundStrategy.replace(/<[^>]*>/g, ''); // 移除HTML标签
      
      const result = await addPRStrategyMutation.mutateAsync({
        simulationId,
        prStrategy: strategyContent,
      });

      message.destroy();
      
      if (result.success && result.data) {
        const roundNumber = result.data.round;
        console.log('Next round simulation started, round:', roundNumber);
        setIsStartingNewRound(false);
        // 确保轮次与后端返回的一致
        if (roundNumber !== nextRound) {
          setCurrentRound(roundNumber);
        }
      } else {
        message.error(result.error?.message || 'Failed to start next round');
        setIsSimulationRunning(false);
        setIsStartingNewRound(false);
        // 如果失败，回退到上一轮
        setCurrentRound(currentRound);
      }
    } catch (error) {
      message.destroy();
      setIsSimulationRunning(false);
      setIsStartingNewRound(false);
      // 如果失败，回退到上一轮
      setCurrentRound(currentRound);
      console.error('Failed to start next round:', error);
      message.error('Failed to start next round');
    }
  };

  const handleViewResults = async () => {
    if (!simulationId) {
      message.warning('Please run a simulation first');
      return;
    }

    // 立即设置报告生成状态
    setIsGeneratingReport(true);

    try {
      message.loading('Generating report...', 0);
      const result = await generateReportMutation.mutateAsync(simulationId);

      message.destroy();
      
      if (result.success && result.data) {
        setReportData(result.data);
        setShowResults(true);
      } else {
        message.error(result.error?.message || 'Failed to generate report');
      }
    } catch (error) {
      message.destroy();
      console.error('Failed to generate report:', error);
      message.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
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
      setSimulationId(null);
      setCurrentRound(1);
      setIsSimulationRunning(false);
      setHasCompletedSimulation(false);
      setIsStartingNewRound(false);
      setReportData(null);
    } catch (error) {
      console.error('Reset error:', error);
      message.error('Failed to reset simulation');
    }
  };

  const getCurrentRoundStrategy = (strategies: any[], round: number) => {
    // 从strategies数组中获取对应轮次的策略
    const strategy = strategies.find(s => s.round === round);
    if (strategy) {
      return `
        <h4>${strategy.title}</h4>
        <p>${strategy.content}</p>
        <small><strong>Timeline:</strong> ${strategy.timeline}</small>
      `;
    }
    
    // 如果找不到对应轮次，返回第一轮或最后一轮
    if (round > strategies.length) {
      const lastStrategy = strategies[strategies.length - 1];
      return `
        <h4>${lastStrategy.title}</h4>
        <p>${lastStrategy.content}</p>
        <small><strong>Timeline:</strong> ${lastStrategy.timeline}</small>
      `;
    }
    
    const firstStrategy = strategies[0];
    return `
      <h4>${firstStrategy.title}</h4>
      <p>${firstStrategy.content}</p>
      <small><strong>Timeline:</strong> ${firstStrategy.timeline}</small>
    `;
  };

  const renderMapVisualization = () => {
    return (
      <VisualizationArea
        isLoading={startSimulationMutation.isPending || addPRStrategyMutation.isPending || isSimulationRunning || isStartingNewRound}
        isSimulationRunning={isSimulationRunning || isStartingNewRound}
        hasCompletedSimulation={hasCompletedSimulation}
        onAnimationCompleted={() => setHasCompletedSimulation(true)}
        networkData={memoizedNetworkData}
        simulationResult={simulationResultData?.success ? simulationResultData.data : undefined}
      />
    );
  };

  const renderEventDetails = () => {
    if (!selectedCase) return null;

    return (
      <div className="event-details">
        <div className="event-header">
          <Title level={4} className="event-title">{selectedCase.title}</Title>
          <Text className="event-description">{selectedCase.description}</Text>
        </div>

        <Divider />

        <div className="current-round-section">
          <Title level={5} className="round-title">Current PR Strategy</Title>
          <div className="strategy-content">
            <Text className="round-indicator">Round {currentRound}</Text>
            <div 
              className="strategy-details"
              dangerouslySetInnerHTML={{ __html: getCurrentRoundStrategy(selectedCase.strategies, currentRound) }}
            />
          </div>
        </div>

        <div className="action-buttons">
          {!simulationId ? (
            <Button
              size="large"
              className="action-button primary-button"
              onClick={handleStartSimulation}
              loading={startSimulationMutation.isPending}
              icon={<PlayCircleOutlined />}
            >
              Start Simulation
            </Button>
          ) : (
            <>
              <Button
                size="large"
                className="action-button primary-button"
                onClick={handleContinueNextRound}
                disabled={hasCompletedSimulation || isStartingNewRound}
                loading={addPRStrategyMutation.isPending}
                icon={<ReloadOutlined />}
              >
                {hasCompletedSimulation ? 'Simulation Complete' : 'Continue Next Round Simulation'}
              </Button>

              <Button
                size="large"
                className="action-button secondary-button"
                onClick={handleViewResults}
                disabled={!simulationId}
                loading={isGeneratingReport}
                icon={<BarChartOutlined />}
              >
                {isGeneratingReport ? 'Generating Report...' : 'Generate Report & View Results'}
              </Button>
            </>
          )}

          <Button
            size="large"
            className="action-button secondary-button"
            onClick={handleReset}
            icon={<ReloadOutlined />}
          >
            Reset
          </Button>

          <Button
            size="large"
            className="action-button secondary-button"
            onClick={async () => {
              // 先重置后端状态，然后重新选择案例
              await handleReset();
              onReselectCase();
            }}
          >
            Reselect Case Study
          </Button>
        </div>
      </div>
    );
  };


  // 如果显示结果页面，渲染结果比较页面
  if (showResults) {
    return (
      <Scenario2ResultsPage
        selectedCase={selectedCase}
        simulationResults={simulationResultData?.data}
        realWorldResults={selectedCase?.realWorldOutcome}
        reportData={reportData}
        onBack={() => setShowResults(false)}
        onClose={() => setShowResults(false)}
      />
    );
  }

  return (
    <div className="scenario2-simulation-page">
      <div className="page-header">
        <Title level={2} className="page-title">
          EchoChamber: A Simulator for Public Relations Crisis Dynamics
        </Title>
      </div>

      <div className="page-content">
        <div className="content-grid">
          <div className="left-panel">
            <Card className="event-panel">
              {renderEventDetails()}
            </Card>
          </div>

          <div className="right-panel">
            <Card className="map-panel">
              {renderMapVisualization()}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scenario2SimulationPage;
