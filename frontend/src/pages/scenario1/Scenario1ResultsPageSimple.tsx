import React from 'react';
import { Card, Typography, Button } from 'antd';
import { ArrowLeftOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import './Scenario1ResultsPage.css';

const { Title, Text } = Typography;

interface Scenario1ResultsPageProps {
  simulationResults: any;
  onBack: () => void;
  onClose: () => void;
  onReset: () => void;
}

const Scenario1ResultsPageSimple: React.FC<Scenario1ResultsPageProps> = ({
  simulationResults,
  onBack,
  onClose,
  onReset,
}) => {
  console.log('Scenario1ResultsPageSimple - simulationResults:', simulationResults);

  return (
    <div className="scenario1-results-overlay">
      <div className="results-modal">
        <div className="modal-header">
          <Title level={2} className="modal-title">PR Strategy Simulation Results</Title>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="close-button"
          />
        </div>

        <div className="modal-content">
          <Card style={{ margin: '20px 0' }}>
            <Title level={4}>Simulation Results</Title>
            <Text>
              {simulationResults ? 
                `Results loaded: ${JSON.stringify(simulationResults, null, 2)}` : 
                'No simulation results available. Using mock data for demonstration.'
              }
            </Text>
          </Card>
        </div>

        <div className="modal-footer">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className="back-button"
          >
            Back to Simulation
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={onReset}
            className="reset-button"
          >
            Reset & Start New
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Scenario1ResultsPageSimple;
