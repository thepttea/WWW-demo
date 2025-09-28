import React, { useState } from 'react';
import MainLayout from './layout/MainLayout';
import Scenario1Page from './pages/scenario1/Scenario1Page';
import './App.css';

type CurrentPage = 'scenario1' | 'scenario2' | 'home';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('scenario1');

  const renderPage = () => {
    switch (currentPage) {
      case 'scenario1':
        return <Scenario1Page />;
      case 'scenario2':
        return <div>Scenario 2 - Coming Soon</div>;
      case 'home':
        return <div>Home - Coming Soon</div>;
      default:
        return <Scenario1Page />;
    }
  };

  return (
    <MainLayout currentScenario={currentPage === 'scenario1' ? 'scenario1' : currentPage === 'scenario2' ? 'scenario2' : undefined}>
      {renderPage()}
    </MainLayout>
  );
};

export default App;
