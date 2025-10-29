import React from 'react';
import { Card, Typography } from 'antd';
import NetworkVisualization from '../../components/NetworkVisualization';
import './VisualizationArea.css';

const { Title } = Typography;

interface VisualizationAreaProps {
  isLoading?: boolean;
  isSimulationRunning?: boolean;
  hasCompletedSimulation?: boolean;
  onAnimationCompleted?: () => void;
  networkData?: any;
  simulationResult?: any;
}

const VisualizationArea: React.FC<VisualizationAreaProps> = ({
  isLoading: _isLoading = false,
  isSimulationRunning = false,
  hasCompletedSimulation = false,
  onAnimationCompleted,
  networkData,
  simulationResult: _simulationResult,
}) => {
<<<<<<< HEAD
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

=======
  console.log('VisualizationArea - Props:', { 
    isLoading: _isLoading, 
    isSimulationRunning, 
    hasCompletedSimulation,
    hasNetworkData: !!networkData,
    networkData: networkData
  });
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
  return (
    <Card className="visualization-area glassmorphism">
      <Title level={4} className="visualization-title">
        Social Network Propagation
      </Title>
      
      <div className="visualization-content">
        {(() => {
          console.log('VisualizationArea - Rendering decision:', { 
            isSimulationRunning, 
            hasNetworkData: !!networkData,
            networkData: networkData,
            willShowRunning: isSimulationRunning,
            willShowNetwork: !isSimulationRunning && !!networkData,
            willShowEmpty: !isSimulationRunning && !networkData
          });
          return null;
        })()}
        {isSimulationRunning ? (
          <div className="simulation-running-state">
            <div className="simulation-loading-icon">
              <div className="loading-spinner"></div>
            </div>
            <h3 className="simulation-title">Running Simulation...</h3>
            <p className="simulation-description">
              The AI agents are processing your PR strategy and simulating public opinion propagation.
              This may take a few moments.
            </p>
            <div className="simulation-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          </div>
        ) : networkData ? (
          <div className="network-visualization">
            <NetworkVisualization 
              users={networkData.users}
              platforms={networkData.platforms}
              isLoading={false}
              hasCompletedSimulation={hasCompletedSimulation}
              onAnimationCompleted={onAnimationCompleted}
            />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
                <circle cx="32" cy="32" r="16" stroke="currentColor" strokeWidth="2"/>
                <circle cx="32" cy="32" r="4" fill="currentColor"/>
              </svg>
            </div>
            <p className="empty-text">
              Configure your PR strategy and start simulation to see the network propagation
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VisualizationArea;
