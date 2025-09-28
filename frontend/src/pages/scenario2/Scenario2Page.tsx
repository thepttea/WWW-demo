import React, { useState } from 'react';
import { Typography, message } from 'antd';
import CaseSelectionPanel from './CaseSelectionPanel';
import VisualizationArea from './VisualizationArea';
import { SimulationConfig, HistoricalCase } from '../../types';
import './Scenario2Page.css';

const { Title, Paragraph } = Typography;

const Scenario2Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [selectedCase, setSelectedCase] = useState<HistoricalCase | null>(null);

  const handleStartSimulation = async (config: SimulationConfig) => {
    if (!selectedCase) {
      message.warning('Please select a classic PR case first');
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
        accuracy: Math.floor(Math.random() * 20) + 80, // 80-100% 与实际结果的一致性
        comparison: {
          predicted: {
            positive: Math.floor(Math.random() * 30) + 40,
            negative: Math.floor(Math.random() * 30) + 20,
            neutral: Math.floor(Math.random() * 20) + 30,
          },
          actual: {
            positive: Math.floor(Math.random() * 30) + 40,
            negative: Math.floor(Math.random() * 30) + 20,
            neutral: Math.floor(Math.random() * 20) + 30,
          }
        },
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
    message.info('Generating comparison report...');
  };

  const handleReset = () => {
    setSimulationResult(null);
    setSelectedCase(null);
    message.success('Simulation reset');
  };

  const handleCaseSelect = (caseItem: HistoricalCase) => {
    setSelectedCase(caseItem);
    message.success(`Selected case: ${caseItem.title}`);
  };

  return (
    <div className="scenario2-page">
      <div className="page-header">
        <Title level={2} className="page-title">
          Public Opinion Simulator: Historical Case Analysis
        </Title>
        <Paragraph className="page-description">
          Select classic PR cases and simulate public opinion propagation using LLM-based multi-agent systems.
        </Paragraph>
      </div>

      <div className="page-content">
        <div className="content-grid">
          <div className="config-column">
            <CaseSelectionPanel
              selectedCase={selectedCase}
              onCaseSelect={handleCaseSelect}
              onStartSimulation={handleStartSimulation}
              onGenerateReport={handleGenerateReport}
              onReset={handleReset}
            />
          </div>
          <div className="visualization-column">
            <VisualizationArea
              isLoading={isLoading}
              networkData={simulationResult?.networkData}
              simulationResult={simulationResult}
              selectedCase={selectedCase}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scenario2Page;
