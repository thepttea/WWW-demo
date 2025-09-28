import React, { useState } from 'react';
import { Layout } from 'antd';
import Header from '../layout/Header';
import HomePage from './HomePage';
import Scenario1Page from './scenario1/Scenario1Page';
import Scenario2Page from './scenario2/Scenario2Page';

const { Content } = Layout;

type Scenario = 'home' | 'scenario1' | 'scenario2';

const Dashboard: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<Scenario>('home');

  const handleScenarioChange = (scenario: Scenario) => {
    setCurrentScenario(scenario);
  };

  const renderContent = () => {
    switch (currentScenario) {
      case 'home':
        return (
          <HomePage
            onNavigateToScenario1={() => setCurrentScenario('scenario1')}
            onNavigateToScenario2={() => setCurrentScenario('scenario2')}
          />
        );
      case 'scenario1':
        return <Scenario1Page />;
      case 'scenario2':
        return <Scenario2Page />;
      default:
        return (
          <HomePage
            onNavigateToScenario1={() => setCurrentScenario('scenario1')}
            onNavigateToScenario2={() => setCurrentScenario('scenario2')}
          />
        );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#101922' }}>
      <Header
        currentScenario={currentScenario}
        onScenarioChange={handleScenarioChange}
      />
      <Content style={{ background: '#101922' }}>
        {renderContent()}
      </Content>
    </Layout>
  );
};

export default Dashboard;
