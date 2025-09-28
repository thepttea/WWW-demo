import React, { useState } from 'react';
import MainLayout from './layout/MainLayout';
import Scenario1Page from './pages/scenario1/Scenario1Page';
import Scenario2Page from './pages/scenario2/Scenario2Page';
import './App.css';

type CurrentPage = 'scenario1' | 'scenario2' | 'home';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('scenario1');

  const renderPage = () => {
    switch (currentPage) {
      case 'scenario1':
        return <Scenario1Page />;
      case 'scenario2':
        return <Scenario2Page />;
      case 'home':
        return <div>Home - Coming Soon</div>;
      default:
        return <Scenario1Page />;
    }
  };

  const handleScenarioChange = (scenario: CurrentPage) => {
    setCurrentPage(scenario);
  };

  return (
    <MainLayout 
      currentScenario={currentPage === 'scenario1' ? 'scenario1' : currentPage === 'scenario2' ? 'scenario2' : undefined}
      onScenarioChange={handleScenarioChange}
    >
      {renderPage()}
    </MainLayout>
  );
};

export default App;
