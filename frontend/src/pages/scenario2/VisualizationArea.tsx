import React from 'react';
import { Card, Typography, Spin, Row, Col, Statistic, Progress, Divider } from 'antd';
import { 
  ClusterOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { HistoricalCase } from '../../types';
import './VisualizationArea.css';

const { Title, Text } = Typography;

interface VisualizationAreaProps {
  isLoading: boolean;
  networkData?: {
    nodes: number;
    connections: number;
  };
  simulationResult?: any;
  selectedCase?: HistoricalCase | null;
}

const VisualizationArea: React.FC<VisualizationAreaProps> = ({
  isLoading,
  networkData,
  simulationResult,
  selectedCase,
}) => {
  const renderCaseDetails = () => {
    if (!selectedCase) return null;

    return (
      <div className="case-details-display">
        <Card className="case-info-card" style={{ marginBottom: '16px' }}>
          <Title level={5}>Case Background</Title>
          <Text>{selectedCase.background}</Text>
          
          <Divider />
          
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={8}>
              <Text type="secondary">Industry:</Text>
              <br />
              <Text strong>{selectedCase.industry}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Difficulty:</Text>
              <br />
              <Text strong style={{ textTransform: 'capitalize' }}>{selectedCase.difficulty}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Total Rounds:</Text>
              <br />
              <Text strong>{selectedCase.totalRounds}</Text>
            </Col>
          </Row>
        </Card>

        {selectedCase.strategies && selectedCase.strategies.length > 0 && (
          <Card className="strategy-preview-card">
            <Title level={5}>Round 1 Strategy Preview</Title>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              {selectedCase.strategies[0].title}
            </Text>
            <Text>{selectedCase.strategies[0].content}</Text>
            {selectedCase.strategies[0].timeline && (
              <Text type="secondary" style={{ display: 'block', marginTop: '8px', fontStyle: 'italic' }}>
                Timeline: {selectedCase.strategies[0].timeline}
              </Text>
            )}
          </Card>
        )}
      </div>
    );
  };

  const renderNetworkVisualization = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <Spin size="large" />
          <Text className="loading-text">Loading case information...</Text>
        </div>
      );
    }

    if (!simulationResult && selectedCase) {
      return renderCaseDetails();
    }

    if (!simulationResult) {
      return (
      <div className="placeholder-container">
        <ClusterOutlined className="placeholder-icon" />
        <Text className="placeholder-text">
          Select a classic PR case to start simulation
        </Text>
      </div>
      );
    }

    return (
      <div className="network-visualization">
        <div className="network-stats">
          <div className="stat-item">
            <Text strong>Network Nodes: {networkData?.nodes || 0}</Text>
          </div>
          <div className="stat-item">
            <Text strong>Connections: {networkData?.connections || 0}</Text>
          </div>
        </div>
        <div className="network-placeholder">
          <ClusterOutlined className="network-icon" />
          <Text>Network Visualization</Text>
        </div>
      </div>
    );
  };

  const renderSimulationResults = () => {
    if (!simulationResult) return null;

    return (
      <div className="simulation-results">
        <Title level={4}>Simulation Results</Title>
        
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card className="result-card">
              <Statistic
                title="Prediction Accuracy"
                value={simulationResult.accuracy}
                suffix="%"
                valueStyle={{ color: simulationResult.accuracy >= 80 ? '#3f8600' : '#cf1322' }}
                prefix={simulationResult.accuracy >= 80 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="result-card">
              <Statistic
                title="Success Rate"
                value={simulationResult.score}
                suffix="%"
                valueStyle={{ color: simulationResult.score >= 70 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card className="result-card">
              <Statistic
                title="Network Density"
                value={simulationResult.networkData?.connections || 0}
                suffix="connections"
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {simulationResult.comparison && (
          <div className="comparison-section">
            <Divider />
            <Title level={5}>Predicted vs Actual Sentiment</Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="Predicted Sentiment">
                  <div className="sentiment-bars">
                    <div className="sentiment-item">
                      <Text>Positive</Text>
                      <Progress 
                        percent={simulationResult.comparison.predicted.positive} 
                        strokeColor="#52c41a"
                        size="small"
                      />
                    </div>
                    <div className="sentiment-item">
                      <Text>Negative</Text>
                      <Progress 
                        percent={simulationResult.comparison.predicted.negative} 
                        strokeColor="#ff4d4f"
                        size="small"
                      />
                    </div>
                    <div className="sentiment-item">
                      <Text>Neutral</Text>
                      <Progress 
                        percent={simulationResult.comparison.predicted.neutral} 
                        strokeColor="#1890ff"
                        size="small"
                      />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Actual Sentiment">
                  <div className="sentiment-bars">
                    <div className="sentiment-item">
                      <Text>Positive</Text>
                      <Progress 
                        percent={simulationResult.comparison.actual.positive} 
                        strokeColor="#52c41a"
                        size="small"
                      />
                    </div>
                    <div className="sentiment-item">
                      <Text>Negative</Text>
                      <Progress 
                        percent={simulationResult.comparison.actual.negative} 
                        strokeColor="#ff4d4f"
                        size="small"
                      />
                    </div>
                    <div className="sentiment-item">
                      <Text>Neutral</Text>
                      <Progress 
                        percent={simulationResult.comparison.actual.neutral} 
                        strokeColor="#1890ff"
                        size="small"
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="visualization-area glassmorphism">
      <Title level={4} className="visualization-title">
        {selectedCase ? `${selectedCase.title} - Analysis` : 'Social Network Propagation'}
      </Title>
      
      <div className="visualization-content">
        <div className="network-section">
          {renderNetworkVisualization()}
        </div>
        
        {simulationResult && (
          <div className="results-section">
            {renderSimulationResults()}
          </div>
        )}
      </div>
    </Card>
  );
};

export default VisualizationArea;
