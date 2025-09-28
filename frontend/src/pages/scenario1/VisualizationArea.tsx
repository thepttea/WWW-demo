import React from 'react';
import { Card, Typography, Spin } from 'antd';
import './VisualizationArea.css';

const { Title } = Typography;

interface VisualizationAreaProps {
  isLoading?: boolean;
  networkData?: any;
  simulationResult?: any;
}

const VisualizationArea: React.FC<VisualizationAreaProps> = ({
  isLoading = false,
  networkData: _networkData,
  simulationResult: _simulationResult,
}) => {
  return (
    <Card className="visualization-area glassmorphism">
      <Title level={4} className="visualization-title">
        Social Network Propagation
      </Title>
      
      <div className="visualization-content">
        {isLoading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p className="loading-text">Running simulation...</p>
          </div>
        ) : _networkData ? (
          <div className="network-visualization">
            {/* 这里将来会集成网络可视化组件 */}
            <div className="network-placeholder">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZyHKnKuy5qhOKSSAnkvVplxEz5RVjCAHwcfSQ1qkFcI_i3n_hDxkEU9b39I8ytQzQ8gDz23YO1lCtQhJ7hHdPF0Ao_0_linds5V7G0W8lEkx_3gqsHKmnuUR1Lg7Xe3e4AOpebxyhRTkx1gnf97-VcKbkCumWF5JHFL0zL4M0mejmAuU6xIeDjzt5zjruXiZcjTzxPIcA6T5yVG_FNie4KAyycAi8G2KLhsEpu_iAEGKp52_Gsh3tjgRl_Ky3YGBi35X6XJghbuA"
                alt="Network Visualization"
                className="network-image"
              />
            </div>
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
