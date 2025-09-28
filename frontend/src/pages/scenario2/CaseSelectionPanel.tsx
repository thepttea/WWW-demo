import React, { useState } from 'react';
import { Card, Select, Button, Typography, Divider } from 'antd';
import { 
  PlayCircleOutlined, 
  BarChartOutlined, 
  ReloadOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { LLMOption, HistoricalCase } from '../../types';
import './CaseSelectionPanel.css';

const { Title, Text } = Typography;

interface CaseSelectionPanelProps {
  selectedCase: HistoricalCase | null;
  onCaseSelect: (caseItem: HistoricalCase) => void;
  onStartSimulation: (config: any) => void;
  onGenerateReport: () => void;
  onReset: () => void;
}

const CaseSelectionPanel: React.FC<CaseSelectionPanelProps> = ({
  selectedCase,
  onCaseSelect,
  onStartSimulation,
  onGenerateReport,
  onReset,
}) => {
  const [selectedLLM, setSelectedLLM] = useState<string>('gpt-4');

  const llmOptions: LLMOption[] = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'claude-3', label: 'Claude 3' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ];

  // 历史案例数据 - 等待后端对接
  // const historicalCases: HistoricalCase[] = [];

  const handleStartSimulation = () => {
    if (!selectedCase) {
      return;
    }

    const config = {
      llm: selectedLLM,
      case: selectedCase,
      enableRefinement: false,
    };
    onStartSimulation(config);
  };


  return (
    <Card className="case-selection-panel glassmorphism">
      <Title level={4} className="panel-title">Case Selection & Configuration</Title>
      
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

        <Divider />

        <div className="config-section">
          <label className="config-label">Select Classic PR Case</label>
          <Button
            className="case-select-button"
            icon={<FolderOpenOutlined />}
            onClick={() => {
              // TODO: 这里将跳转到案例选择页面
              console.log('Navigate to case selection page');
            }}
          >
            {selectedCase ? selectedCase.title : 'Select Classic PR Case'}
          </Button>
          {selectedCase && (
            <div className="selected-case-info">
              <Text className="selected-case-title">{selectedCase.title}</Text>
              <Text className="selected-case-description">{selectedCase.description}</Text>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  // TODO: 清除选择的案例
                  console.log('Clear selected case');
                }}
              >
                Change Case
              </Button>
            </div>
          )}
        </div>

        <div className="config-actions">
          <Button
            type="primary"
            size="large"
            className="action-button primary-button"
            onClick={handleStartSimulation}
            disabled={!selectedCase}
            icon={<PlayCircleOutlined />}
          >
            Start Simulation
          </Button>
          
          <Button
            size="large"
            className="action-button secondary-button"
            onClick={onGenerateReport}
            disabled={!selectedCase}
            icon={<BarChartOutlined />}
          >
            View & Compare Results
          </Button>
          
          <Button
            size="large"
            className="action-button secondary-button"
            onClick={onReset}
            icon={<ReloadOutlined />}
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CaseSelectionPanel;
