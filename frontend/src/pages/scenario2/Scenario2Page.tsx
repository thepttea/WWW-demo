import React, { useState, useEffect } from 'react';
import { Typography, message } from 'antd';
import CaseSelectionPanel from './CaseSelectionPanel';
import VisualizationArea from './VisualizationArea';
import Scenario2SimulationPage from './Scenario2SimulationPage';
import { SimulationConfig, HistoricalCase } from '../../types';
import { apiClient } from '../../services/api';
import './Scenario2Page.css';

const { Title, Paragraph } = Typography;

type Scenario2View = 'selection' | 'simulation';

const Scenario2Page: React.FC = () => {
  const [currentView, setCurrentView] = useState<Scenario2View>('selection');
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult] = useState<any>(null);
  const [selectedCase, setSelectedCase] = useState<HistoricalCase | null>(null);
  const [historicalCases, setHistoricalCases] = useState<HistoricalCase[]>([]);
<<<<<<< HEAD

  // 获取案例列表
=======
  const [selectedLlm, setSelectedLlm] = useState<string>('gpt-4o-mini'); 

  // Fetch case list
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getHistoricalCases();
        if (response.success && Array.isArray(response.data)) {
          setHistoricalCases(response.data);
        } else {
          message.error('Failed to load historical cases.');
          console.error("API Error:", response.error || "Unknown error");
        }
      } catch (error) {
        message.error('Error connecting to the server to fetch cases.');
        console.error("Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, []);


  const handleStartSimulation = async (config: { llm: string }) => {
    if (!selectedCase) {
      message.warning('Please select a classic PR case first');
      return;
    }

    setSelectedLlm(config.llm); // Save the selected LLM
    setCurrentView('simulation');
    message.success('Starting simulation...');
  };


  const handleCaseSelect = (caseItem: HistoricalCase) => {
<<<<<<< HEAD
    // Modal已经获取了完整的案例详情，直接使用即可
=======
    // The modal has already fetched the complete case details, so we can use it directly
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    setSelectedCase(caseItem);
    message.success(`Selected case: ${caseItem.title}`);
  };

  const handleBackToSelection = () => {
    setCurrentView('selection');
  };

  const handleReselectCase = () => {
    setCurrentView('selection');
  };

  if (currentView === 'simulation') {
    return (
      <Scenario2SimulationPage
        selectedCase={selectedCase}
        llmModel={selectedLlm} // Pass the selected LLM to the simulation page
        onBack={handleBackToSelection}
        onReselectCase={handleReselectCase}
      />
    );
  }

  return (
    <div className="scenario2-page">
      <div className="page-header">
        <Title level={2} className="page-title">
          Public Opinion Simulator: Historical Case Analysis
        </Title>
        <Paragraph className="page-description">
          Select classic PR cases and simulate public opinion propagation using LLM-based multi-agent systems.
        </Paragraph>
      </div>

      <div className="page-content">
        <div className="content-grid">
          <div className="config-column">
            <CaseSelectionPanel
              historicalCases={historicalCases} // Pass data
              selectedCase={selectedCase}
              onCaseSelect={handleCaseSelect}
              onStartSimulation={handleStartSimulation}
            />
          </div>
          <div className="visualization-column">
            <VisualizationArea
              isLoading={isLoading}
              networkData={simulationResult?.networkData}
              simulationResult={simulationResult}
              selectedCase={selectedCase}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scenario2Page;
