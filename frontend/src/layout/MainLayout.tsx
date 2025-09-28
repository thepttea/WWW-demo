import React from 'react';
import { Layout, ConfigProvider } from 'antd';
import Header from './Header';
import './MainLayout.css';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
  currentScenario?: 'scenario1' | 'scenario2';
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentScenario }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#137fec',
          borderRadius: 8,
          fontFamily: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Layout: {
            headerBg: 'transparent',
          },
        },
      }}
    >
      <Layout className="main-layout">
        <Header currentScenario={currentScenario} />
        <Content className="main-content">
          {children}
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
