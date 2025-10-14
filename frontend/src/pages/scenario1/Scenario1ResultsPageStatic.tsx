import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Table, Tag, Row, Col, Statistic, Progress } from 'antd';
import { ArrowLeftOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { mockApiClient, SimulationResultData } from '../../services/mockApi';
// import { useSimulationResultData } from '../../hooks/useApi';
import './Scenario1ResultsPage.css';

const { Title, Text } = Typography;

interface Scenario1ResultsPageProps {
  simulationResults: any;
  onBack: () => void;
  onClose: () => void;
  onReset: () => void;
}

const Scenario1ResultsPageStatic: React.FC<Scenario1ResultsPageProps> = ({
  simulationResults,
  onBack,
  onClose,
  onReset,
}) => {
  console.log('Scenario1ResultsPageStatic - simulationResults:', simulationResults);

  const [resultData, setResultData] = useState<SimulationResultData | null>(null);
  const [loading, setLoading] = useState(true);

  // 从API获取结果数据
  useEffect(() => {
    const fetchResultData = async () => {
      try {
        setLoading(true);
        // 使用simulationResults中的simulationId，如果没有则使用默认值
        const simulationId = simulationResults?.simulationId || 'default_simulation';
        const response = await mockApiClient.getSimulationResultData(simulationId);
        if (response.success && response.data) {
          setResultData(response.data);
        } else {
          throw new Error(response.error?.message || 'Failed to fetch result data');
        }
      } catch (error) {
        console.error('Failed to fetch result data:', error);
        // 如果API调用失败，使用默认数据
        setResultData({
          overallSentiment: 72,
          engagementRate: 15.3,
          reach: 850,
          sentimentTrend: '+12%',
          prEffectiveness: 85,
          keyInsights: "The PR strategy has shown significant effectiveness in shifting public opinion. The sentiment analysis reveals a 12% positive trend over the simulation period, with high engagement rates indicating strong public interest. The strategy successfully mitigated initial negative sentiment and built positive momentum.",
          recommendations: [
            "Continue the current communication strategy as it shows strong positive momentum",
            "Focus on maintaining engagement through regular updates and transparency",
            "Monitor key opinion leaders and influencers for potential amplification opportunities",
            "Consider expanding the message to reach additional demographic segments"
          ],
          influentialNodes: [
            { node: 'Media Outlet A', influence_score: 95, sentiment: 'Positive', reach: 120 },
            { node: 'Industry Expert B', influence_score: 88, sentiment: 'Positive', reach: 85 },
            { node: 'Social Media Influencer C', influence_score: 82, sentiment: 'Neutral', reach: 200 },
            { node: 'Community Leader D', influence_score: 78, sentiment: 'Positive', reach: 65 },
          ],
          sentimentDistribution: {
            positive: 45,
            neutral: 35,
            negative: 20
          },
          trendData: {
            positive: '+8%',
            engagement: '+8%',
            reach: '+15%'
          },
          effectivenessRating: {
            score: 85,
            rating: 'Excellent',
            thresholds: {
              excellent: 80,
              good: 60
            }
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [simulationResults]);

  if (loading || !resultData) {
    return (
      <div className="scenario1-results-overlay">
        <div className="results-modal">
          <div className="modal-header">
            <Title level={2} className="modal-title">Loading Results...</Title>
          </div>
        </div>
      </div>
    );
  }

  const data = resultData;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return '#52c41a';
      case 'negative': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  const renderMetricsCard = () => (
    <div className="metrics-section">
      <Title level={4} className="section-title">Simulation Results</Title>
      
      <Row gutter={[16, 16]} className="metrics-grid">
        <Col span={8}>
          <Card className="metric-card">
            <Statistic
              title="Overall Sentiment"
              value={data.overallSentiment}
              suffix="%"
              valueStyle={{ color: '#137fec' }}
            />
            <Text className="trend-text positive">{data.trendData.positive}</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="metric-card">
            <Statistic
              title="Engagement Rate"
              value={data.engagementRate}
              suffix="%"
              valueStyle={{ color: '#137fec' }}
            />
            <Text className="trend-text positive">{data.trendData.engagement}</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="metric-card">
            <Statistic
              title="Reach"
              value={data.reach}
              suffix="K"
              valueStyle={{ color: '#137fec' }}
            />
            <Text className="trend-text positive">{data.trendData.reach}</Text>
          </Card>
        </Col>
      </Row>

      <div className="effectiveness-section">
        <Title level={5} className="effectiveness-title">PR Strategy Effectiveness</Title>
        <div className="effectiveness-metric">
          <Progress
            percent={data.prEffectiveness}
            strokeColor={{
              '0%': '#ff4d4f',
              '50%': '#faad14',
              '100%': '#52c41a',
            }}
            className="effectiveness-progress"
          />
          <Text className="effectiveness-text">
            {data.effectivenessRating.score}% - {data.effectivenessRating.rating}
          </Text>
        </div>
      </div>

      <div className="sentiment-distribution">
        <Title level={5} className="distribution-title">Sentiment Distribution</Title>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div className="sentiment-item positive">
              <div className="sentiment-bar">
                <div 
                  className="sentiment-fill positive" 
                  style={{ width: `${data.sentimentDistribution.positive}%` }}
                ></div>
              </div>
              <Text className="sentiment-label">Positive: {data.sentimentDistribution.positive}%</Text>
            </div>
          </Col>
          <Col span={8}>
            <div className="sentiment-item neutral">
              <div className="sentiment-bar">
                <div 
                  className="sentiment-fill neutral" 
                  style={{ width: `${data.sentimentDistribution.neutral}%` }}
                ></div>
              </div>
              <Text className="sentiment-label">Neutral: {data.sentimentDistribution.neutral}%</Text>
            </div>
          </Col>
          <Col span={8}>
            <div className="sentiment-item negative">
              <div className="sentiment-bar">
                <div 
                  className="sentiment-fill negative" 
                  style={{ width: `${data.sentimentDistribution.negative}%` }}
                ></div>
              </div>
              <Text className="sentiment-label">Negative: {data.sentimentDistribution.negative}%</Text>
            </div>
          </Col>
        </Row>
      </div>

      <div className="chart-placeholder">
        <div className="chart-svg">
          <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="0 0 472 150" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="gradient" x1="236" x2="236" y1="1" y2="149">
                <stop stopColor="#137fec" stopOpacity="0.4"></stop>
                <stop offset="1" stopColor="#137fec" stopOpacity="0"></stop>
              </linearGradient>
            </defs>
            <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V150H0V109Z" fill="url(#gradient)"></path>
            <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#137fec" strokeLinecap="round" strokeWidth="3"></path>
          </svg>
        </div>
      </div>

      <div className="insights-section">
        <Title level={5} className="insights-title">Key Insights</Title>
        <Text className="insights-text">{data.keyInsights}</Text>
      </div>

      <div className="recommendations-section">
        <Title level={5} className="recommendations-title">Recommendations</Title>
        <ul className="recommendations-list">
          {data.recommendations.map((rec: string, index: number) => (
            <li key={index} className="recommendation-item">
              <Text className="recommendation-text">{rec}</Text>
            </li>
          ))}
        </ul>
      </div>

      <div className="nodes-section">
        <Title level={5} className="nodes-title">Key Influencers</Title>
        <Table
          dataSource={data.influentialNodes}
          columns={[
            {
              title: 'Influencer',
              dataIndex: 'node',
              key: 'node',
            },
            {
              title: 'Influence Score',
              dataIndex: 'influence_score',
              key: 'influence_score',
              render: (score: number) => (
                <Progress 
                  percent={score} 
                  size="small" 
                  strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
                />
              ),
            },
            {
              title: 'Sentiment',
              dataIndex: 'sentiment',
              key: 'sentiment',
              render: (sentiment: string) => (
                <Tag color={getSentimentColor(sentiment)} className="sentiment-tag">
                  {sentiment}
                </Tag>
              ),
            },
            {
              title: 'Reach (K)',
              dataIndex: 'reach',
              key: 'reach',
            },
          ]}
          pagination={false}
          size="small"
          className="nodes-table"
        />
      </div>
    </div>
  );

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
          <div className="simulation-results-container">
            {renderMetricsCard()}
          </div>
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

export default Scenario1ResultsPageStatic;
