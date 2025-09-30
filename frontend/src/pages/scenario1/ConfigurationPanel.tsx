import React, { useState } from 'react';
import { Card, Select, Input, Button, Space, Typography, Badge, InputNumber } from 'antd';
import { ThunderboltOutlined, SendOutlined, RightOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import { LLMOption } from '../../types';
import './ConfigurationPanel.css';

const { Title } = Typography;
const { TextArea } = Input;

interface ConfigurationPanelProps {
  onStartSimulation: (config: any) => void;
  onAddStrategy: (strategy: string) => void;  // 【新增】添加公关策略
  onStopSimulation: () => void;  // 【新增】停止模拟
  onGenerateReport: () => void;
  onReset: () => void;
  onOpenDrawer: () => void;
  isSimulationActive: boolean;  // 【新增】模拟是否激活
  currentRound: number;  // 【新增】当前轮次
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onStartSimulation,
  onAddStrategy,
  onStopSimulation,
  onGenerateReport,
  onReset,
  onOpenDrawer,
  isSimulationActive,
  currentRound,
}) => {
  const [selectedLLM, setSelectedLLM] = useState<string>('gpt-4-turbo');
  const [initialTopic, setInitialTopic] = useState<string>('');  // 【新增】初始话题
  const [prStrategy, setPrStrategy] = useState<string>('');
  const [numRounds, setNumRounds] = useState<number>(1);  // 【新增】回合数

  const llmOptions: LLMOption[] = [
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ];

  const handleStartSimulation = () => {
    if (!initialTopic.trim()) {
      return;
    }
    const config = {
      llm: selectedLLM,
      initialTopic: initialTopic,
      numRounds: numRounds,  // 【新增】传递回合数
      strategy: {
        content: prStrategy,
        isOptimized: false,
      },
      enableRefinement: false,
    };
    onStartSimulation(config);
  };

  const handleAddStrategy = () => {
    if (!prStrategy.trim()) {
      return;
    }
    onAddStrategy(prStrategy);
    setPrStrategy('');  // 清空输入框，准备下一轮
  };

  return (
    <Card className="configuration-panel glassmorphism">
      <Title level={4} className="panel-title">
        Configuration {isSimulationActive && <Badge count={`Round ${currentRound}`} style={{ backgroundColor: '#52c41a' }} />}
      </Title>
      
      <div className="config-content">
        <div className="config-section">
          <label className="config-label">LLM Selection</label>
          <Select
            className="config-select"
            value={selectedLLM}
            onChange={setSelectedLLM}
            options={llmOptions}
            placeholder="Select LLM"
            disabled={isSimulationActive}
          />
        </div>

        {!isSimulationActive && (
          <>
            <div className="config-section">
              <label className="config-label">Initial Topic (Crisis Event)</label>
              <TextArea
                className="strategy-input"
                value={initialTopic}
                onChange={(e) => setInitialTopic(e.target.value)}
                placeholder="Enter an initial crisis event, e.g., A famous tech company was exposed for a data breach incident..."
                rows={3}
                showCount
                maxLength={500}
              />
            </div>
            
            <div className="config-section">
              <label className="config-label">Interaction Rounds (Rounds per strategy)</label>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={10}
                value={numRounds}
                onChange={(value) => setNumRounds(value || 1)}
                placeholder="Number of rounds"
              />
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                After each PR strategy, agents will interact for {numRounds} round(s)
              </div>
            </div>
          </>
        )}

        <div className="config-section">
          <label className="config-label">
            {isSimulationActive ? 'Add New PR Strategy (Intervention)' : 'Initial PR Strategy (Optional)'}
          </label>
          <TextArea
            className="strategy-input"
            value={prStrategy}
            onChange={(e) => setPrStrategy(e.target.value)}
            placeholder={isSimulationActive ? "Enter a new PR strategy for intervention..." : "Enter initial PR strategy (optional)..."}
            rows={4}
            showCount
            maxLength={1000}
          />
        </div>

        <div className="config-actions">
          {!isSimulationActive ? (
            <Button
              type="primary"
              size="large"
              className="action-button primary-button"
              onClick={handleStartSimulation}
              icon={<SendOutlined />}
              disabled={!initialTopic.trim()}
            >
              Start Simulation
            </Button>
          ) : (
            <>
              <Button
                type="primary"
                size="large"
                className="action-button primary-button"
                onClick={handleAddStrategy}
                icon={<PlusOutlined />}
                disabled={!prStrategy.trim()}
              >
                Add PR Strategy & Simulate
              </Button>
              <Button
                size="large"
                className="action-button secondary-button"
                onClick={onStopSimulation}
                icon={<StopOutlined />}
                danger
              >
                Stop Simulation
              </Button>
            </>
          )}
          
          <Button
            size="large"
            className="action-button secondary-button"
            onClick={onGenerateReport}
            disabled={!isSimulationActive}
          >
            Generate Public Opinion Report
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
