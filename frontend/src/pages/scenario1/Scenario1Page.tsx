import React, { useState } from 'react';
import { Typography, message } from 'antd';
import ConfigurationPanel from './ConfigurationPanel';
import VisualizationArea from './VisualizationArea';
import StrategyRefinementDrawer from '../../components/StrategyRefinementDrawer';
import Scenario1ResultsPageStatic from './Scenario1ResultsPageStatic';
import { SimulationConfig, SimulationParameters, SimulationState } from '../../types';
import { useStartSimulation, useAddPRStrategy, useSimulationResult, useGenerateReport, useResetSimulation, useNetworkData } from '../../hooks/useApi';
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

  // API hooks
  const startSimulationMutation = useStartSimulation();
  const addPRStrategyMutation = useAddPRStrategy();
  const generateReportMutation = useGenerateReport();
  const resetSimulationMutation = useResetSimulation();
  const { data: simulationResultData } = useSimulationResult(simulationId);
  const { data: networkData } = useNetworkData(simulationId);


  const handleStartSimulation = async (config: SimulationConfig) => {
    if (!config.eventDescription?.trim()) {
      message.warning('Please enter event description first');
      return;
    }
    if (!config.strategy.content.trim()) {
      message.warning('Please enter your PR strategy first');
      return;
    }

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
        setSimulationId(result.data.simulationId);
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
        message.error(result.error?.message || 'Failed to start simulation');
      }
    } catch (error) {
      message.destroy();
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

    try {
      message.loading('Starting next round...', 0);
      const result = await addPRStrategyMutation.mutateAsync({
        simulationId,
        prStrategy: strategy,
      });

      message.destroy();
      
      if (result.success && result.data) {
        const roundNumber = result.data.round;
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

        message.success(`Round ${roundNumber || 'next'} simulation completed!`);
      } else {
        message.error(result.error?.message || 'Failed to start next round');
      }
    } catch (error) {
      message.destroy();
      message.error('Next round simulation failed. Please try again.');
      console.error('Next round error:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!simulationId) {
      message.warning('Please run a simulation first');
      return;
    }

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
        message.success('Report generated successfully!');
        console.log('Generated report:', result.data);
      } else {
        message.error(result.error?.message || 'Failed to generate report');
      }
    } catch (error) {
      message.destroy();
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
            />
          </div>
          <div className="visualization-column">
            <VisualizationArea
              isLoading={startSimulationMutation.isPending || addPRStrategyMutation.isPending}
              networkData={(() => {
                // 数据转换：将后端格式转换为前端期望的格式
                if (simulationResultData?.success && simulationResultData.data) {
                  try {
                    // 转换数据格式以匹配期望的接口
                    const transformedData = {
                      ...simulationResultData.data,
                      agents: simulationResultData.data.agents.map(agent => ({
                        ...agent,
                        // 后端返回的字段名已经是 influenceScore，不需要转换
                        influenceScore: agent.influenceScore || agent.influence_score || 0
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
                        // 后端返回的字段名已经是 influenceScore，不需要转换
                        influenceScore: agent.influenceScore || agent.influence_score || 0
                      }));
                      return transformAgentsToNetworkData(transformedAgents);
                    }
                  }
                }
                return undefined;
              })()}
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
