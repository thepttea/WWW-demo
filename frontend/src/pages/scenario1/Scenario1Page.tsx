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
    setSimulationResult(null);

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 模拟结果
      const mockResult = {
        success: Math.random() > 0.5,
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        improvements: [
          'Consider addressing the emotional impact more directly',
          'Add more specific data points to support your claims',
          'Include a clear timeline for follow-up actions'
        ],
        networkData: {
          nodes: Math.floor(Math.random() * 50) + 20,
          connections: Math.floor(Math.random() * 100) + 50,
        }
      };

      setSimulationResult(mockResult);
      message.success('Simulation completed successfully!');
    } catch (error) {
      message.error('Simulation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleReset = () => {
    setSimulationResult(null);
    message.success('Simulation reset');
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
              onReset={handleReset}
              onOpenDrawer={handleOpenDrawer}
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
