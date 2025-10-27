import React from 'react';
import { Card, Typography, Button, Row, Col, Progress, Tag, Space, Divider, Popover } from 'antd';
import { ArrowLeftOutlined, CloseOutlined, ReloadOutlined, BarChartOutlined, SwapOutlined } from '@ant-design/icons';
import { ReportResponse } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Scenario2ReportPage.css';

const { Title, Text, Paragraph } = Typography;

interface Scenario2ReportPageProps {
  reportData: ReportResponse;
  onBack: () => void;
  onClose: () => void;
  onReset: () => void;
}

const Scenario2ReportPage: React.FC<Scenario2ReportPageProps> = ({
  reportData,
  onBack,
  onClose,
  onReset,
}) => {
  const { evaluation, caseId, caseTitle, overallSimilarityPercentage } = reportData;
  const overallSimilarity = overallSimilarityPercentage || evaluation.overall_similarity_percentage || 0;

  // 根据相似度获取颜色
  const getSimilarityColor = (score: number): string => {
    if (score >= 85) return '#52c41a'; // 高度相似
    if (score >= 70) return '#1890ff'; // 相似
    if (score >= 55) return '#faad14'; // 中等相似
    return '#ff7a45'; // 低相似度
  };

  // 根据相似度获取评级
  const getSimilarityRating = (score: number): string => {
    if (score >= 85) return 'Highly Similar';
    if (score >= 70) return 'Similar';
    if (score >= 55) return 'Moderately Similar';
    return 'Low Similarity';
  };

  return (
    <div className="scenario2-report-page">
      <div className="page-header">
        <Title level={2} className="page-title">
          <SwapOutlined className="title-icon" />
          Comparative Analysis Report
        </Title>
        <Text className="page-description">
          Simulation vs Real-world Case Comparison Analysis
        </Text>
      </div>

      <div className="report-content">
        {/* 案例信息 */}
        <Card className="case-info-card glassmorphism">
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <div className="case-details">
                <Title level={3} className="case-title">Case Study</Title>
                <Text className="case-name">{caseTitle}</Text>
                <Text className="case-id">Case ID: {caseId}</Text>
              </div>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <div className="similarity-overview">
                <div className="similarity-circle">
                  <Progress
                    type="circle"
                    percent={overallSimilarity}
                    strokeColor={getSimilarityColor(overallSimilarity)}
                    format={() => (
                      <div className="similarity-text">
                        <div className="similarity-value">{overallSimilarity.toFixed(1)}%</div>
                        <div className="similarity-label">Similarity</div>
                      </div>
                    )}
                    size={120}
                  />
                </div>
                <Tag 
                  className="similarity-tag" 
                  color={getSimilarityColor(overallSimilarity)}
                >
                  {getSimilarityRating(overallSimilarity)}
                </Tag>
              </div>
            </Col>
            <Col xs={24} sm={8} md={12}>
              <div className="similarity-breakdown-compact">
                <Title level={4} className="breakdown-title">Similarity Breakdown</Title>
                <div className="breakdown-mini-grid">
                  {Object.entries(evaluation.dimension_scores || {}).map(([dimensionName, dimensionData]) => {
                    const details = dimensionData.details;
                    const weight = dimensionData.weight || 0;
                    const similarityScore = details?.similarity?.similarity_score || 
                                          details?.similarity?.similarity_percentage || 0;
                    const contribution = (similarityScore * weight).toFixed(1);
                    
                    return (
                      <div key={dimensionName} className="breakdown-mini-item">
                        <div className="mini-item-header">
                          <span className="mini-dimension-name">{dimensionName}</span>
                          <span className="mini-contribution">{contribution}</span>
                        </div>
                        <Progress
                          percent={similarityScore}
                          strokeColor={getSimilarityColor(similarityScore)}
                          showInfo={false}
                          size="small"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 维度对比分析 */}
        <Card className="dimensions-card glassmorphism">
          <Title level={3} className="section-title">
            <SwapOutlined className="section-icon" />
            Dimension Comparison Analysis
          </Title>
          <div className="dimensions-grid">
            {Object.entries(evaluation.dimension_scores || {}).map(([dimensionName, dimensionData]) => {
              const details = dimensionData.details;
              const weight = dimensionData.weight || 0;
              
              // 获取相似度分数（兼容两种字段名）
              const similarityScore = details?.similarity?.similarity_score || 
                                    details?.similarity?.similarity_percentage || 0;
              
              const isStanceDimension = dimensionName === "总体立场倾向";

              return (
                <Card key={dimensionName} className="dimension-card">
                  <div className="dimension-header">
                    <Title level={4} className="dimension-title">{dimensionName}</Title>
                    <div className="dimension-meta">
                      <Tag color="blue">Weight: {(weight * 100).toFixed(0)}%</Tag>
                      <div className="similarity-badge">
                        <Progress
                          type="circle"
                          percent={similarityScore}
                          strokeColor={getSimilarityColor(similarityScore)}
                          format={() => `${similarityScore.toFixed(1)}%`}
                          size={50}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div className="comparison-content">
                    {/* 模拟数据 */}
                    <div className="simulation-side">
                      <Title level={5} className="comparison-title">Simulation</Title>
                      {isStanceDimension ? (
                        <div className="detailed-summary">
                          <Text className="summary-text">
                            {details?.simulation?.summary || 'No data available'}
                          </Text>
                        </div>
                      ) : (
                        <div className="percentage-summary">
                          <div className="percentage-value">
                            {details?.simulation?.percentage?.toFixed(1) || 0}%
                          </div>
                          <Text className="summary-text">
                            {details?.simulation?.summary || 'No data available'}
                          </Text>
                        </div>
                      )}
                    </div>
                    
                    {/* 真实案例数据 */}
                    <div className="real-case-side">
                      <Title level={5} className="comparison-title">Real Case</Title>
                      {isStanceDimension ? (
                        <div className="detailed-summary">
                          <Text className="summary-text">
                            {details?.real_case?.summary || 'No data available'}
                          </Text>
                        </div>
                      ) : (
                        <div className="percentage-summary">
                          <div className="percentage-value">
                            {details?.real_case?.percentage?.toFixed(1) || 0}%
                          </div>
                          <Text className="summary-text">
                            {details?.real_case?.summary || 'No data available'}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 相似度分析 */}
                  {details?.similarity?.reasoning && (
                    <div className="similarity-reasoning">
                      <Popover
                        content={
                          <div className="reasoning-popover-content">
                            <Text className="reasoning-text">{details.similarity.reasoning}</Text>
                          </div>
                        }
                        title="Similarity Analysis"
                        trigger="click"
                        placement="topLeft"
                        overlayClassName="reasoning-popover"
                      >
                        <Button 
                          type="link" 
                          className="reasoning-summary"
                          size="small"
                        >
                          Similarity Analysis
                        </Button>
                      </Popover>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Card>

        {/* 详细分析报告 */}
        <Card className="detailed-report-card glassmorphism">
          <Title level={3} className="section-title">
            <BarChartOutlined className="section-icon" />
            Detailed Analysis Report
          </Title>
          <div className="report-content-text">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
            >
              {reportData.content}
            </ReactMarkdown>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="action-buttons">
          <Space size="large">
            <Button
              size="large"
              className="action-button secondary-button"
              onClick={onBack}
              icon={<ArrowLeftOutlined />}
            >
              Back to Simulation
            </Button>
            <Button
              size="large"
              className="action-button secondary-button"
              onClick={onReset}
              icon={<ReloadOutlined />}
            >
              Reset Simulation
            </Button>
            <Button
              size="large"
              className="action-button secondary-button"
              onClick={onClose}
              icon={<CloseOutlined />}
            >
              Close Report
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default Scenario2ReportPage;
