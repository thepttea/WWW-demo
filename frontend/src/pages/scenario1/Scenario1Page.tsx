import React, { useState, useEffect, useRef } from 'react';
import { Typography, message } from 'antd';
import ConfigurationPanel from './ConfigurationPanel';
import VisualizationArea from './VisualizationArea';
import StrategyRefinementDrawer from '../../components/StrategyRefinementDrawer';
import Scenario1ResultsPageStatic from './Scenario1ResultsPageStatic';
import { SimulationConfig, SimulationParameters, SimulationState } from '../../types';
import { mockApiClient, MockSimulationData, SimulationStatus } from '../../services/mockApi';
// import { useStartSimulation, useAddPRStrategy, useSimulationStatus, useSimulationResult, useSimulationResultData, useGenerateReport, useResetSimulation } from '../../hooks/useApi';
import './Scenario1Page.css';

const { Title, Paragraph } = Typography;

const Scenario1Page: React.FC = () => {
  const [simulationResult, setSimulationResult] = useState<MockSimulationData | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState | undefined>(undefined);
  const [confirmedStrategy, setConfirmedStrategy] = useState<string>('');
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 轮询相关状态
  const [pollingStatus, setPollingStatus] = useState<SimulationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  // API hooks - TODO: 后续集成后端API时取消注释
  // const startSimulationMutation = useStartSimulation();
  // const addPRStrategyMutation = useAddPRStrategy();
  // const generateReportMutation = useGenerateReport();
  // const resetSimulationMutation = useResetSimulation();
  // const { data: _simulationStatus } = useSimulationStatus(simulationId);
  // const { data: simulationResultData } = useSimulationResult(simulationId);

  // 清理轮询
  const clearPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setIsPolling(false);
    setPollingError(null);
    retryCountRef.current = 0;
  };

  // 开始轮询
  const startPolling = (id: string) => {
    // 如果已经在轮询，先清理之前的轮询
    if (isPolling) {
      clearPolling();
    }
    
    setIsPolling(true);
    setPollingError(null);
    let pollCount = 0;
    const maxPolls = 40; // 最大轮询次数（40秒，覆盖10秒模拟+缓冲时间）
    const maxRetries = 3; // 最大重试次数
    
    // 设置轮询间隔（1秒）
    pollingIntervalRef.current = setInterval(async () => {
      try {
        pollCount++;
        const statusResponse = await mockApiClient.getSimulationStatus(id);
        if (statusResponse.success && statusResponse.data) {
          setPollingStatus(statusResponse.data);
          setPollingError(null); // 清除之前的错误
          
          if (statusResponse.data.status === 'completed') {
            // 模拟完成，获取结果
            try {
              const resultResponse = await mockApiClient.getSimulationResult(id);
              if (resultResponse.success && resultResponse.data) {
                setSimulationResult(resultResponse.data);
              } else {
                throw new Error(resultResponse.error?.message || 'Failed to get simulation result');
              }
              clearPolling();
              message.success('Simulation completed successfully!');
            } catch (error) {
              console.error('Failed to get simulation result:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              setPollingError(`Failed to get simulation result: ${errorMessage}`);
              message.error(`Failed to get simulation result: ${errorMessage}`);
              clearPolling();
            }
          } else if (statusResponse.data.status === 'error') {
            const errorMessage = statusResponse.data.message || 'Unknown error';
            setPollingError(`Simulation failed: ${errorMessage}`);
            message.error(`Simulation failed: ${errorMessage}`);
            clearPolling();
          }
        } else {
          setPollingError('Failed to get simulation status');
          message.error('Failed to get simulation status');
          clearPolling();
        }
        
        if (pollCount >= maxPolls) {
          setPollingError('Simulation timeout - please try again');
          message.error('Simulation timeout - please try again');
          clearPolling();
        }
      } catch (error) {
        console.error('Polling error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // 增加重试计数
        retryCountRef.current++;
        
        if (retryCountRef.current >= maxRetries) {
          setPollingError(`Failed to check simulation status: ${errorMessage}`);
          message.error(`Failed to check simulation status: ${errorMessage}`);
          clearPolling();
        } else {
          // 显示重试信息
          setPollingError(`Retrying... (${retryCountRef.current}/${maxRetries})`);
          console.log(`Polling retry ${retryCountRef.current}/${maxRetries}: ${errorMessage}`);
        }
      }
    }, 1000);
    
    // 设置超时（40秒）
    pollingTimeoutRef.current = setTimeout(() => {
      setPollingError('Simulation timeout - please try again');
      message.error('Simulation timeout - please try again');
      clearPolling();
    }, 40000);
  };

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  const handleStartSimulation = async (config: SimulationConfig) => {
    if (!config.eventDescription?.trim()) {
      message.warning('Please enter event description first');
      return;
    }
    if (!config.strategy.content.trim()) {
      message.warning('Please enter your PR strategy first');
      return;
    }

    setIsLoading(true);
    try {
      // 使用模拟API调用启动模拟
      const response = await mockApiClient.startSimulation({
        eventDescription: config.eventDescription,
        llm: config.llm,
        strategy: config.strategy.content
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to start simulation');
      }
      
      const result = response.data;

      // 设置模拟状态
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

      // 设置模拟ID并开始轮询
      setSimulationId(result.simulationId);
      startPolling(result.simulationId);

      message.success('Simulation started successfully!');
    } catch (error) {
      console.error('Failed to start simulation:', error);
      message.error('Failed to start simulation. Please try again.');
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    try {
      // 清理之前的轮询状态
      clearPolling();
      
      // 获取当前轮次
      const currentRound = simulationState?.currentRound || 1;
      console.log('Frontend: Starting next round, current round:', currentRound);
      
      // 使用模拟API调用添加下一轮策略
      const response = await mockApiClient.addNextRoundStrategy(simulationId, strategy, currentRound);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to add next round strategy');
      }

      // 更新模拟状态
      setSimulationState(prev => prev ? {
        ...prev,
        currentRound: prev.currentRound + 1,
        strategyHistory: [
          ...prev.strategyHistory,
          {
            round: prev.currentRound + 1,
            strategy: strategy,
            timestamp: new Date(),
          }
        ],
        nextRoundStrategy: strategy,
      } : undefined);

      // 开始轮询新轮次
      startPolling(simulationId);

      message.success(`Round ${simulationState?.currentRound ? simulationState.currentRound + 1 : 2} simulation started!`);
    } catch (error) {
      console.error('Failed to start next round:', error);
      message.error('Next round simulation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!simulationId) {
      message.warning('Please run a simulation first');
      return;
    }

    setIsLoading(true);
    try {
      // 使用模拟API调用生成报告
      const response = await mockApiClient.generateReport(simulationId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to generate report');
      }
      
      message.success('Report generated successfully!');
      setShowResults(true);
      console.log('Generated report:', response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      message.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      // 清理轮询
      clearPolling();
      
      // 如果有活跃的模拟，先调用模拟API重置
      if (simulationId) {
        const response = await mockApiClient.resetSimulation(simulationId);
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to reset simulation');
        }
      }

      // 重置所有前端状态
      setSimulationResult(null);
      setSimulationState(undefined);
      setSimulationId(null);
      setConfirmedStrategy('');
      setIsDrawerVisible(false);
      setShowResults(false);
      setPollingStatus(null);
      
      message.success('Simulation reset successfully');
    } catch (error) {
      console.error('Failed to reset simulation:', error);
      message.error('Failed to reset simulation');
    } finally {
      setIsLoading(false);
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
    console.log('Scenario1Page - simulationResultData:', simulationResult);
    return (
      <Scenario1ResultsPageStatic
        simulationResults={simulationResult}
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
              pollingStatus={pollingStatus}
              isPolling={isPolling}
              pollingError={pollingError}
            />
          </div>
          <div className="visualization-column">
            <VisualizationArea
              isLoading={isLoading}
              networkData={simulationResult ? {
                users: simulationResult.users.map((user: any) => ({
                  username: user.username,
                  influence_score: user.influence_score,
                  primary_platform: user.primary_platform,
                  emotional_style: user.emotional_style,
                  final_decision: user.final_decision,
                  objective_stance_score: user.objective_stance_score
                })),
                platforms: simulationResult.platforms
              } : undefined}
              simulationResult={simulationResult}
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
