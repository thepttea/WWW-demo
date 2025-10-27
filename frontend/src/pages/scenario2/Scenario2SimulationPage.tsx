import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Typography, Button, message } from 'antd';
import {
  ReloadOutlined,
  BarChartOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { HistoricalCase } from '../../types';
import Scenario2ReportPage from './Scenario2ReportPage';
import VisualizationArea from '../scenario1/VisualizationArea';
import { useStartScenario2Simulation, useScenario2SimulationStatus, useGenerateScenario2Report, useAddScenario2Strategy, useScenario2SimulationResult, useResetSimulation } from '../../hooks/useApi';
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
  const [animationKey, setAnimationKey] = useState(0); // 用于强制重置动画
  const [isReportJustClosed, setIsReportJustClosed] = useState(false); // 跟踪是否刚刚关闭报告
  const [shouldKeepFinalState, setShouldKeepFinalState] = useState<boolean>(false); // 标记是否应该保持最终状态

  // API hooks
  const startSimulationMutation = useStartScenario2Simulation();
  const addScenario2StrategyMutation = useAddScenario2Strategy(); // 使用Scenario2的API
  const generateReportMutation = useGenerateScenario2Report();
  const resetSimulationMutation = useResetSimulation(); // 添加reset功能
  const { data: simulationStatusData } = useScenario2SimulationStatus(simulationId, isSimulationRunning);
  // 使用Scenario2的数据获取方式
  const { data: simulationResultData } = useScenario2SimulationResult(simulationId);

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
        // 不在这里设置hasCompletedSimulation，让动画组件通过onAnimationCompleted回调来设置
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
    
    if (hasStatusData && hasResultData) {
      console.log('All Scenario 2 simulation data ready, data is available for animation');
      // 不在这里设置hasCompletedSimulation，让动画先开始
    }
  }, [simulationStatusData, simulationResultData]);

  // 使用ref保存上一次的网络数据
  const previousNetworkDataRef = useRef<any>(null);
  
  // 处理网络数据转换 - 使用与Scenario1相同的方式
  const memoizedNetworkData = useMemo(() => {
    console.log('====== [DATA DEBUG] Scenario2 - memoizedNetworkData computing ======');
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
      console.log('[DATA DEBUG] Agents data:', simulationResultData.data.agents?.map((a: any) => ({
        username: a.username,
        stance: a.stanceScore || a.objective_stance_score
      })));
      
      try {
        // 转换数据格式以匹配期望的接口
        const transformedData = {
          ...simulationResultData.data,
          agents: simulationResultData.data.agents.map((agent: any) => ({
            ...agent,
            // 后端返回的字段名是 influence_score，需要转换
            influenceScore: agent.influence_score !== undefined ? agent.influence_score : (agent.influenceScore || 0)
          }))
        };
        
        const result = transformSimulationResultToNetworkData(
          transformedData
        );
        
        console.log('[DATA DEBUG] Transformed network data users:', result?.users?.map((u: any) => ({
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
          const transformedAgents = simulationResultData.data.agents.map((agent: any) => ({
            ...agent,
            // 后端返回的字段名是 influence_score，需要转换
            influenceScore: agent.influence_score || 0
          }));
          const result = transformSimulationResultToNetworkData({
            ...simulationResultData.data,
            agents: transformedAgents
          });
          previousNetworkDataRef.current = result;
          return result;
        }
      }
    }
    console.log('[DATA DEBUG] Returning undefined because no valid data');
    return previousNetworkDataRef.current || undefined;
  }, [simulationResultData, isStartingNewRound]);

  // 调试日志
  console.log('Scenario2SimulationPage - Current state:', {
    simulationId,
    isSimulationRunning,
    isStartingNewRound,
    hasStatusData: !!simulationStatusData,
    hasResultData: !!simulationResultData,
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
    
    // 先重置完成状态，确保新组件能正确接收状态
    setHasCompletedSimulation(false);
    setIsSimulationRunning(true);
    setIsStartingNewRound(true); // 标记正在开始新轮次，清除旧数据
    
    // 立即更新到下一轮，让用户看到下一轮的策略
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);
    
    // 同步更新animationKey和hasCompletedSimulation状态
    setAnimationKey(prev => prev + 1); // 强制重置动画
    // 确保hasCompletedSimulation被重置
    setHasCompletedSimulation(false);
    
    // 新轮次开始，重置报告关闭状态
    setIsReportJustClosed(false);
    setShouldKeepFinalState(false);
    
    console.log('handleContinueNextRound - States set, should show running simulation');
    
    try {
      message.loading('Starting next round simulation...', 0);
      
      const result = await addScenario2StrategyMutation.mutateAsync(simulationId);

      message.destroy();
      
      if (result.success && result.data) {
        const roundNumber = result.data.currentRound;
        console.log('Next round simulation started, round:', roundNumber);
        console.log('Backend returned new data, clearing isStartingNewRound flag');
        
        // 后端返回了新数据，清除新轮次标记
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
      const result = await generateReportMutation.mutateAsync({
        simulationId,
        reportType: 'comprehensive',
        includeVisualizations: true,
      });

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
      setAnimationKey(0); // 重置动画key
      setIsReportJustClosed(false);
      setShouldKeepFinalState(false);
      setReportData(null);
      
      // 清空缓存的网络数据，防止reset后仍然显示旧数据
      previousNetworkDataRef.current = null;
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
        key={`scenario2-${currentRound}-${simulationId}-${animationKey}`} // 添加animationKey来强制重新渲染
        isLoading={startSimulationMutation.isPending || addScenario2StrategyMutation.isPending || isSimulationRunning || isStartingNewRound}
        isSimulationRunning={isSimulationRunning || isStartingNewRound}
        hasCompletedSimulation={hasCompletedSimulation}
        onAnimationCompleted={() => setHasCompletedSimulation(true)}
        networkData={memoizedNetworkData}
        simulationResult={simulationResultData?.success ? simulationResultData.data : undefined}
        animationKey={animationKey} // 传递animationKey给NetworkVisualization
        isReportJustClosed={isReportJustClosed} // 传递报告关闭状态
        shouldKeepFinalState={shouldKeepFinalState} // 传递是否应该保持最终状态
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
              {/* 只有在还有下一轮策略时才显示Continue按钮 */}
              {selectedCase && currentRound < selectedCase.strategies.length && (
                <Button
                  size="large"
                  className="action-button primary-button"
                  onClick={handleContinueNextRound}
                  disabled={isStartingNewRound}
                  loading={addScenario2StrategyMutation.isPending}
                  icon={<ReloadOutlined />}
                >
                  Continue Next Round Simulation
                </Button>
              )}

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
  if (showResults && reportData) {
    return (
      <Scenario2ReportPage
        reportData={reportData}
        onBack={() => {
          setShowResults(false);
          setIsReportJustClosed(true);
          setShouldKeepFinalState(true);
          // 不要重置动画状态，保持当前的动画状态
        }}
        onClose={() => {
          setShowResults(false);
          setIsReportJustClosed(true);
          setShouldKeepFinalState(true);
          // 不要重置动画状态，保持当前的动画状态
        }}
        onReset={handleReset}
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
