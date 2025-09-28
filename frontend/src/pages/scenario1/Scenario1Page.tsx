import React, { useState } from 'react';
import { Row, Col, Typography, message } from 'antd';
import ConfigurationPanel from './ConfigurationPanel';
import VisualizationArea from './VisualizationArea';
import { SimulationConfig } from '../../types';
import './Scenario1Page.css';

const { Title, Paragraph } = Typography;

const Scenario1Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleStartSimulation = async (config: SimulationConfig) => {
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

  const handleGenerateReport = () => {
    if (!simulationResult) {
      message.warning('Please run a simulation first');
      return;
    }
    message.info('Generating report...');
  };

  const handleReset = () => {
    setSimulationResult(null);
    message.success('Simulation reset');
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

      <Row gutter={32} className="page-content">
        <Col xs={24} lg={8}>
          <ConfigurationPanel
            onStartSimulation={handleStartSimulation}
            onGenerateReport={handleGenerateReport}
            onReset={handleReset}
          />
        </Col>
        <Col xs={24} lg={16}>
          <VisualizationArea
            isLoading={isLoading}
            networkData={simulationResult?.networkData}
            simulationResult={simulationResult}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Scenario1Page;
