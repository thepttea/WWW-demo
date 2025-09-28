import React, { useState } from 'react';
import { Card, Typography, Button, Divider } from 'antd';
import {
  ReloadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { HistoricalCase } from '../../types';
import './Scenario2SimulationPage.css';

const { Title, Text } = Typography;

interface Scenario2SimulationPageProps {
  selectedCase: HistoricalCase | null;
  onBack: () => void;
  onReselectCase: () => void;
}

const Scenario2SimulationPage: React.FC<Scenario2SimulationPageProps> = ({
  selectedCase,
  onBack,
  onReselectCase,
}) => {
  const [currentRound, setCurrentRound] = useState(1);

  const handleContinueNextRound = () => {
    setCurrentRound(prev => prev + 1);
  };

  const getCurrentRoundStrategy = (fullStrategy: string, round: number) => {
    // 解析HTML内容，提取对应轮次的策略
    const rounds = fullStrategy.split('<h4>');
    if (rounds.length === 1) {
      // 如果没有轮次分割，返回完整内容
      return fullStrategy;
    }
    
    // 查找对应轮次的内容
    for (let i = 1; i < rounds.length; i++) {
      const roundContent = rounds[i];
      if (roundContent.includes(`Round ${round}:`)) {
        return `<h4>${roundContent}`;
      }
    }
    
    // 如果找不到对应轮次，返回第一轮或最后一轮
    if (round > rounds.length - 1) {
      return `<h4>${rounds[rounds.length - 1]}`;
    }
    return `<h4>${rounds[1]}`;
  };

  const renderMapVisualization = () => {
    return (
      <div className="map-visualization">
        <div className="map-header">
          <Title level={4} className="map-title">Public Opinion Propagation Map</Title>
          <Text className="round-info">Round {currentRound} Analysis</Text>
        </div>

        <div className="map-content">
          <div className="simulation-status">
            <div className="status-indicator">
              <div className="status-dot"></div>
              <Text className="status-text">Simulation Running...</Text>
            </div>
            <Text className="simulation-description">
              Analyzing public opinion propagation and sentiment spread for Round {currentRound}
            </Text>
          </div>
        </div>
      </div>
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
              dangerouslySetInnerHTML={{ __html: getCurrentRoundStrategy(selectedCase.originalStrategy, currentRound) }}
            />
          </div>
        </div>

        <div className="action-buttons">
          <Button
            size="large"
            className="action-button primary-button"
            onClick={handleContinueNextRound}
            icon={<ReloadOutlined />}
          >
            Continue Next Round Simulation
          </Button>

          <Button
            size="large"
            className="action-button secondary-button"
            onClick={() => {
              // TODO: 实现查看和比较结果功能
              console.log('View & Compare Results');
            }}
          >
            View & Compare Results
          </Button>

          <Button
            size="large"
            className="action-button secondary-button"
            onClick={() => {
              // TODO: 实现重置功能
              console.log('Reset');
            }}
          >
            Reset
          </Button>

          <Button
            size="large"
            className="action-button secondary-button"
            onClick={onReselectCase}
          >
            Reselect Case Study
          </Button>
        </div>
      </div>
    );
  };


  return (
    <div className="scenario2-simulation-page">
      <div className="page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          className="back-button"
        >
          Back to Case Selection
        </Button>
        <Title level={2} className="page-title">PR Event Simulation</Title>
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
