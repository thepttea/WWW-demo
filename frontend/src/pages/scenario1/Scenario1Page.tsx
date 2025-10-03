import React, { useState } from 'react';
import { Typography, message } from 'antd';
import ConfigurationPanel from './ConfigurationPanel';
import VisualizationArea from './VisualizationArea';
import StrategyRefinementDrawer from '../../components/StrategyRefinementDrawer';
import Scenario1ResultsPageStatic from './Scenario1ResultsPageStatic';
import { SimulationConfig, SimulationParameters, SimulationState } from '../../types';
import { useStartSimulation, useAddPRStrategy, useSimulationStatus, useSimulationResult, useGenerateReport, useResetSimulation } from '../../hooks/useApi';
import './Scenario1Page.css';

const { Title, Paragraph } = Typography;

const Scenario1Page: React.FC = () => {
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [confirmedStrategy, setConfirmedStrategy] = useState<string>('');
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);

  // API hooks
  const startSimulationMutation = useStartSimulation();
  const addPRStrategyMutation = useAddPRStrategy();
  const generateReportMutation = useGenerateReport();
  const resetSimulationMutation = useResetSimulation();
  const { data: simulationStatus } = useSimulationStatus(simulationId);
  const { data: simulationResultData } = useSimulationResult(simulationId);

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
      });

      if (result.success && result.data) {
        setSimulationId(result.data.simulationId);
        
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

        message.success('Simulation started successfully!');
      } else {
        message.error(result.error?.message || 'Failed to start simulation');
      }
    } catch (error) {
      message.error('Failed to start simulation');
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
      const result = await addPRStrategyMutation.mutateAsync({
        simulationId,
        prStrategy: strategy,
      });

      if (result.success && result.data) {
        // 更新模拟状态，将当前策略添加到历史中
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
        } : null);

        message.success(`Round ${simulationState?.currentRound ? simulationState.currentRound + 1 : 2} simulation started!`);
      } else {
        message.error(result.error?.message || 'Failed to start next round');
      }
    } catch (error) {
      message.error('Next round simulation failed. Please try again.');
    }
  };

  const handleGenerateReport = async () => {
    if (!simulationId) {
      message.warning('Please run a simulation first');
      return;
    }

    try {
      const result = await generateReportMutation.mutateAsync({
        simulationId,
        reportType: 'comprehensive',
        includeVisualizations: true,
      });

      if (result.success && result.data) {
        message.success('Report generated successfully!');
        // 显示结果页面
        setShowResults(true);
        console.log('Generated report:', result.data);
      } else {
        message.error(result.error?.message || 'Failed to generate report');
      }
    } catch (error) {
      message.error('Failed to generate report');
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
      setSimulationResult(null);
      setSimulationState(null);
      setSimulationId(null);
      setConfirmedStrategy('');
      setIsDrawerVisible(false);
      setShowResults(false); // 隐藏结果页面
      
      // 触发 ConfigurationPanel 内部重置
      setResetTrigger(prev => prev + 1);
      
      message.success('Simulation reset successfully');
    } catch (error) {
      message.error('Failed to reset simulation');
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
    console.log('Scenario1Page - simulationResultData:', simulationResultData);
    return (
      <Scenario1ResultsPageStatic
        simulationResults={simulationResultData?.data}
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
              resetTrigger={resetTrigger}
              confirmedStrategy={confirmedStrategy}
            />
          </div>
          <div className="visualization-column">
            <VisualizationArea
              isLoading={startSimulationMutation.isPending || addPRStrategyMutation.isPending}
              networkData={simulationResultData?.data}
              simulationResult={simulationResultData?.data}
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
