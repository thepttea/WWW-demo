import React, { useState } from 'react';
import { Typography, message } from 'antd';
import ConfigurationPanel from './ConfigurationPanel';
import VisualizationArea from './VisualizationArea';
import StrategyRefinementDrawer from '../../components/StrategyRefinementDrawer';
import Scenario1ResultsPageStatic from './Scenario1ResultsPageStatic';
import { SimulationConfig, SimulationParameters, SimulationState } from '../../types';
import { mockApiClient, MockSimulationData } from '../../services/mockApi';
// import { useStartSimulation, useAddPRStrategy, useSimulationStatus, useSimulationResult, useGenerateReport, useResetSimulation } from '../../hooks/useApi';
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

  // API hooks - TODO: 后续集成后端API时取消注释
  // const startSimulationMutation = useStartSimulation();
  // const addPRStrategyMutation = useAddPRStrategy();
  // const generateReportMutation = useGenerateReport();
  // const resetSimulationMutation = useResetSimulation();
  // const { data: _simulationStatus } = useSimulationStatus(simulationId);
  // const { data: simulationResultData } = useSimulationResult(simulationId);

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
      // 使用模拟API调用
      const result = await mockApiClient.startSimulation({
        eventDescription: config.eventDescription,
        llm: config.llm,
        strategy: config.strategy.content
      });

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

      // 设置模拟结果数据
      setSimulationResult(result);
      setSimulationId(result.simulationId);

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
      // 使用模拟API调用添加下一轮策略
      const result = await mockApiClient.addNextRoundStrategy(simulationId, strategy, simulationState?.currentRound || 1);

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

      // 更新模拟结果数据
      console.log('Scenario1Page - Setting simulation result:', result);
      console.log('Scenario1Page - Result users:', result.users.length);
      console.log('Scenario1Page - Result platforms:', result.platforms.length);
      setSimulationResult(result);

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
      const result = await mockApiClient.generateReport(simulationId);
      
      message.success('Report generated successfully!');
      setShowResults(true);
      console.log('Generated report:', result);
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
      // 如果有活跃的模拟，先调用模拟API重置
      if (simulationId) {
        await mockApiClient.resetSimulation(simulationId);
      }

      // 重置所有前端状态
      setSimulationResult(null);
      setSimulationState(undefined);
      setSimulationId(null);
      setConfirmedStrategy('');
      setIsDrawerVisible(false);
      setShowResults(false);
      
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
            />
          </div>
          <div className="visualization-column">
            <VisualizationArea
              isLoading={isLoading}
              networkData={simulationResult ? {
                users: simulationResult.users.map(user => ({
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
