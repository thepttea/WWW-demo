import React, { useState, useEffect } from 'react';
import { Card, Select, Input, Button, Space, Typography } from 'antd';
import { ThunderboltOutlined, SendOutlined, RightOutlined, EyeOutlined, LockOutlined } from '@ant-design/icons';
import { LLMOption, SimulationState } from '../../types';
import ContentModal from '../../components/ContentModal';
import './ConfigurationPanel.css';

const { Title } = Typography;
const { TextArea } = Input;

interface ConfigurationPanelProps {
  onStartSimulation: (config: any) => void;
  onStartNextRound: (strategy: string) => void;
  onGenerateReport: () => void;
  onReset: () => void;
  onOpenDrawer: () => void;
  simulationState?: SimulationState;
  confirmedStrategy?: string;
  onResetFields?: () => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onStartSimulation,
  onStartNextRound,
  onGenerateReport,
  onReset,
  onOpenDrawer,
  simulationState,
  confirmedStrategy,
  onResetFields,
}) => {
  const [selectedLLM, setSelectedLLM] = useState<string>('gpt-4-turbo');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [prStrategy, setPrStrategy] = useState<string>('');
  const [nextRoundStrategy, setNextRoundStrategy] = useState<string>('');
  
  // Modal states
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [strategyModalVisible, setStrategyModalVisible] = useState(false);

  const llmOptions: LLMOption[] = [
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ];

  // 监听confirmedStrategy变化，自动填充策略输入框
  useEffect(() => {
    if (confirmedStrategy && confirmedStrategy.trim()) {
      if (simulationState?.isRunning) {
        // 如果模拟正在运行，填充下一轮策略
        setNextRoundStrategy(confirmedStrategy);
      } else {
        // 如果模拟未开始，填充第一轮策略
        setPrStrategy(confirmedStrategy);
      }
    }
  }, [confirmedStrategy, simulationState?.isRunning]);

  // 重置所有字段
  const resetFields = () => {
    setSelectedLLM('gpt-4-turbo');
    setEventDescription('');
    setPrStrategy('');
    setNextRoundStrategy('');
  };

  // 当父组件调用重置时，清空字段
  useEffect(() => {
    if (onResetFields) {
      onResetFields();
    }
  }, [onResetFields]);

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

  const handleStartNextRound = () => {
    if (!nextRoundStrategy.trim()) {
      return;
    }
    onStartNextRound(nextRoundStrategy);
    setNextRoundStrategy('');
  };

  // 如果模拟正在进行中，显示锁定状态
  if (simulationState?.isRunning) {
    return (
      <>
        <Card className="configuration-panel glassmorphism">
          <Title level={4} className="panel-title">Simulation in Progress</Title>
          
          <div className="config-content">
            {/* 锁定的配置 */}
            <div className="config-section">
              <label className="config-label locked-label">
                <LockOutlined className="locked-icon" />
                LLM Selection
              </label>
              <div className="locked-value">
                {simulationState.lockedConfig.llm}
              </div>
            </div>

            <div className="config-section">
              <label className="config-label locked-label">
                <LockOutlined className="locked-icon" />
                Event Description
              </label>
              <Button
                className="content-button"
                icon={<EyeOutlined />}
                onClick={() => setEventModalVisible(true)}
              >
                View Event Description
              </Button>
            </div>

            <div className="config-section">
              <label className="config-label locked-label">
                <LockOutlined className="locked-icon" />
                Previous Rounds' Strategies
              </label>
              <Button
                className="content-button"
                icon={<EyeOutlined />}
                onClick={() => setStrategyModalVisible(true)}
              >
                View All Previous Strategies
              </Button>
            </div>

            {/* 下一轮配置 */}
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
              <label className="config-label">Next Round Strategy</label>
              <TextArea
                className="strategy-input"
                value={nextRoundStrategy}
                onChange={(e) => setNextRoundStrategy(e.target.value)}
                placeholder="Enter your next round PR response strategy..."
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
                onClick={handleStartNextRound}
                icon={<SendOutlined />}
                disabled={!nextRoundStrategy.trim()}
              >
                Start Next Round Simulation
              </Button>
              
              <Button
                size="large"
                className="action-button secondary-button"
                onClick={onGenerateReport}
              >
                Generate Report & View Results
              </Button>
              
              <Button
                size="large"
                className="action-button secondary-button"
                onClick={() => {
                  resetFields();
                  onReset();
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* 弹窗 */}
        <ContentModal
          visible={eventModalVisible}
          onClose={() => setEventModalVisible(false)}
          title="Event Description"
          content={simulationState.lockedConfig.eventDescription}
        />

        <ContentModal
          visible={strategyModalVisible}
          onClose={() => setStrategyModalVisible(false)}
          title="Previous Rounds' Strategies"
          content={simulationState.strategyHistory
            .map(item => `Round ${item.round} (${item.timestamp.toLocaleString()}):\n${item.strategy}`)
            .join('\n\n' + '='.repeat(50) + '\n\n')
          }
        />
      </>
    );
  }

  // 初始配置状态
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
            onClick={() => {
              resetFields();
              onReset();
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ConfigurationPanel;
