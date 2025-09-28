import React, { useState } from 'react';
import MainLayout from './layout/MainLayout';
import HomePage from './pages/HomePage';
import Scenario1Page from './pages/scenario1/Scenario1Page';
import Scenario2Page from './pages/scenario2/Scenario2Page';
import './App.css';

type CurrentPage = 'scenario1' | 'scenario2' | 'home';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onNavigateToScenario1={() => setCurrentPage('scenario1')}
            onNavigateToScenario2={() => setCurrentPage('scenario2')}
          />
        );
      case 'scenario1':
        return <Scenario1Page />;
      case 'scenario2':
        return <Scenario2Page />;
      default:
        return (
          <HomePage
            onNavigateToScenario1={() => setCurrentPage('scenario1')}
            onNavigateToScenario2={() => setCurrentPage('scenario2')}
          />
        );
    }
  };

  const handleScenarioChange = (scenario: CurrentPage) => {
    setCurrentPage(scenario);
  };

  return (
    <MainLayout 
      currentScenario={currentPage}
      onScenarioChange={handleScenarioChange}
    >
      {renderPage()}
    </MainLayout>
  );
};

export default App;
