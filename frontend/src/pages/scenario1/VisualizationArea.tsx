import React from 'react';
import { Card, Typography } from 'antd';
import NetworkVisualization from '../../components/NetworkVisualization';
import './VisualizationArea.css';

const { Title } = Typography;

interface VisualizationAreaProps {
  isLoading?: boolean;
  networkData?: any;
  simulationResult?: any;
}

const VisualizationArea: React.FC<VisualizationAreaProps> = ({
  isLoading: _isLoading = false,
  networkData,
  simulationResult: _simulationResult,
}) => {
  return (
    <Card className="visualization-area glassmorphism">
      <Title level={4} className="visualization-title">
        Social Network Propagation
      </Title>
      
      <div className="visualization-content">
        {networkData ? (
          <div className="network-visualization">
            <NetworkVisualization 
              users={networkData.users}
              platforms={networkData.platforms}
              isLoading={false}
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
