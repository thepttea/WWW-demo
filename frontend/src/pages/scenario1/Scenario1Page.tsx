import React, { useState } from 'react';
import { Typography, message } from 'antd';
import ConfigurationPanel from './ConfigurationPanel';
import VisualizationArea from './VisualizationArea';
import StrategyRefinementDrawer from '../../components/StrategyRefinementDrawer';
import { SimulationConfig, SimulationParameters } from '../../types';
import './Scenario1Page.css';

const { Title, Paragraph } = Typography;

const Scenario1Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);  // 保存模拟ID
  const [currentRound, setCurrentRound] = useState<number>(0);  // 当前轮次

  const handleStartSimulation = async (config: SimulationConfig) => {
    if (!config.initialTopic?.trim()) {
      message.warning('Please enter an initial topic');
      return;
    }

    setIsLoading(true);

    try {
      // 调用真实API - 启动模拟
      const startResponse = await fetch('http://localhost:8000/api/scenario1/simulation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialTopic: config.initialTopic,
          llmModel: config.llm,
          simulationConfig: {
            agents: 10,
            num_rounds: config.numRounds || 1,  // 传递回合数
            interactionProbability: 0.8,
            positiveResponseProbability: 0.3,
            negativeResponseProbability: 0.3,
            neutralResponseProbability: 0.4,
            initialPositiveSentiment: 0.2,
            initialNegativeSentiment: 0.6,
            initialNeutralSentiment: 0.2
          }
        })
      });

      const startData = await startResponse.json();
      if (startData.success) {
        const simId = startData.data.simulationId;
        setSimulationId(simId);
        message.success('Simulation initialized successfully!');

        // 无论是否有策略，都执行第一轮模拟
        // 如果有策略则添加策略后模拟，如果没有策略则直接模拟（agents自然讨论）
        await addStrategyAndSimulate(simId, config.strategy.content.trim());
      }
    } catch (error) {
      message.error('Failed to start simulation: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // 添加策略并执行一轮模拟
  const addStrategyAndSimulate = async (simId: string, strategy: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/scenario1/simulation/${simId}/add-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prStrategy: strategy })
      });

      const data = await response.json();
      if (data.success) {
        setSimulationResult(data.data);
        setCurrentRound(data.data.round);
        message.success(`Round ${data.data.round} simulation completed!`);
      }
    } catch (error) {
      message.error('Simulation execution failed: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // 继续添加策略
  const handleAddStrategy = async (strategy: string) => {
    if (!simulationId) {
      message.warning('Please start simulation first');
      return;
    }
    await addStrategyAndSimulate(simulationId, strategy);
  };

  // 停止模拟
  const handleStopSimulation = async () => {
    if (!simulationId) return;

    try {
      const response = await fetch(`http://localhost:8000/api/scenario1/simulation/${simulationId}/stop`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        message.success('Simulation stopped');
        setSimulationId(null);
        setCurrentRound(0);
      }
    } catch (error) {
      message.error('Failed to stop simulation: ' + error);
    }
  };

  const handleGenerateReport = async () => {
    if (!simulationId) {
      message.warning('Please run simulation first');
      return;
    }

    setIsLoading(true);
    try {
      message.info('Generating public opinion analysis report, please wait...');
      
      const response = await fetch('http://localhost:8000/api/scenario1/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulationId: simulationId,
          reportType: 'comprehensive',  // 可以选择 "summary" 或 "comprehensive"
          includeVisualizations: false
        })
      });

      const data = await response.json();
      
      if (data.success) {
        message.success('Report generated successfully!');
      } else {
        message.error('Failed to generate report: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (error) {
      message.error('Failed to generate report: ' + error);
      console.error('Report generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSimulationResult(null);
    setSimulationId(null);
    setCurrentRound(0);
    message.success('Reset successfully');
  };

  const handleOpenDrawer = () => {
    setIsDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
  };

  const handleStrategyConfirm = (strategy: string, parameters: SimulationParameters) => {
    // 这里可以处理策略确认逻辑
    console.log('Confirmed strategy:', strategy);
    console.log('Parameters:', parameters);
    message.success('Strategy confirmed and parameters updated!');
  };

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
              onAddStrategy={handleAddStrategy}
              onStopSimulation={handleStopSimulation}
              onGenerateReport={handleGenerateReport}
              onReset={handleReset}
              onOpenDrawer={handleOpenDrawer}
              isSimulationActive={!!simulationId}
              currentRound={currentRound}
            />
          </div>
          <div className="visualization-column">
            <VisualizationArea
              isLoading={isLoading}
              networkData={simulationResult?.networkData}
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
