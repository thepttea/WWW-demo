import React, { useState } from 'react';
import { Card, Select, Input, Button, Space, Typography } from 'antd';
import { ThunderboltOutlined, SendOutlined, RightOutlined } from '@ant-design/icons';
import { LLMOption } from '../../types';
import './ConfigurationPanel.css';

const { Title } = Typography;
const { TextArea } = Input;

interface ConfigurationPanelProps {
  onStartSimulation: (config: any) => void;
  onReset: () => void;
  onOpenDrawer: () => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onStartSimulation,
  onReset,
  onOpenDrawer,
}) => {
  const [selectedLLM, setSelectedLLM] = useState<string>('gpt-4-turbo');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [prStrategy, setPrStrategy] = useState<string>('');

  const llmOptions: LLMOption[] = [
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ];

  const handleStartSimulation = () => {
    const config = {
      llm: selectedLLM,
      eventDescription: eventDescription,
      strategy: {
        content: prStrategy,
        isOptimized: false, // 默认未优化，用户需要通过侧边栏进行优化
      },
      enableRefinement: false,
    };
    onStartSimulation(config);
  };

  return (
    <Card className="configuration-panel glassmorphism">
      <Title level={4} className="panel-title">Configuration</Title>
      
      <div className="config-content">
        <div className="config-section">
          <label className="config-label">LLM Selection</label>
          <Select
            className="config-select"
            value={selectedLLM}
            onChange={setSelectedLLM}
            options={llmOptions}
            placeholder="Select LLM"
          />
        </div>

        <div className="config-section">
          <label className="config-label">Event Description</label>
          <TextArea
            className="strategy-input"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            placeholder="Describe the PR crisis event..."
            rows={3}
            showCount
            maxLength={500}
          />
        </div>

        <div className="config-section">
          <label className="config-label">LLM Strategy Refinement</label>
          <div className="refinement-toggle" onClick={onOpenDrawer}>
            <Space>
              <ThunderboltOutlined className="refinement-icon" />
              <span className="refinement-text">Enable LLM Strategy Refinement</span>
            </Space>
            <RightOutlined className="refinement-arrow" />
          </div>
        </div>

        <div className="config-section">
          <label className="config-label">First Round PR Strategy</label>
          <TextArea
            className="strategy-input"
            value={prStrategy}
            onChange={(e) => setPrStrategy(e.target.value)}
            placeholder="Enter your first round PR response strategy..."
            rows={4}
            showCount
            maxLength={1000}
          />
        </div>

        <div className="config-actions">
          <Button
            type="primary"
            size="large"
            className="action-button primary-button"
            onClick={handleStartSimulation}
            icon={<SendOutlined />}
          >
            Start Simulation
          </Button>
          
          <Button
            size="large"
            className="action-button secondary-button"
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ConfigurationPanel;
