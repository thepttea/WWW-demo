import React from 'react';
import { Typography, Button } from 'antd';
import { 
  ExperimentOutlined,
  HistoryOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import './HomePage.css';

const { Title, Paragraph } = Typography;

interface HomePageProps {
  onNavigateToScenario1: () => void;
  onNavigateToScenario2: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onNavigateToScenario1,
  onNavigateToScenario2,
}) => {
  return (
    <div className="home-page">
      <div className="home-background">
        <div className="background-gradient"></div>
      </div>
      
      <div className="home-content">
        <div className="hero-section">
          <Title level={1} className="hero-title">
            EchoChamber : A Multi-Agent Public Relations Simulator
          </Title>
          <Paragraph className="hero-description">
            Explore the dynamics of public opinion with our advanced multi-agent simulation system. 
            Understand how opinions form, spread, and evolve in complex social networks.
          </Paragraph>
        </div>

        <div className="scenarios-grid">
          <div className="scenario-card glass-effect">
            <div className="card-content">
              <div className="card-background"></div>
              <div className="card-header">
                <ExperimentOutlined className="scenario-icon" />
                <Title level={3} className="scenario-title">Scenario 1: Influencer Dynamics</Title>
              </div>
              <Paragraph className="scenario-description">
                Analyze how key influencers shape public discourse and impact opinion trends within a simulated social network.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                className="scenario-button"
                onClick={onNavigateToScenario1}
                icon={<ArrowRightOutlined />}
              >
                Explore Scenario
              </Button>
            </div>
          </div>

          <div className="scenario-card glass-effect">
            <div className="card-content">
              <div className="card-background"></div>
              <div className="card-header">
                <HistoryOutlined className="scenario-icon" />
                <Title level={3} className="scenario-title">Scenario 2: Yesterday Once More</Title>
              </div>
              <Paragraph className="scenario-description">
                Simulate public reactions to some typical public relations crisis event and evaluate the difference between the real world and our simulation.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                className="scenario-button"
                onClick={onNavigateToScenario2}
                icon={<ArrowRightOutlined />}
              >
                Explore Scenario
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="home-footer">
        <div className="footer-content">
          <Paragraph className="footer-text">
            © 2025 EchoChamber. All Rights Reserved.
          </Paragraph>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
