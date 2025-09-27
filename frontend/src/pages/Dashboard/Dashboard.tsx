/**
 * 主仪表板页面
 * 展示模拟概览和网络图
 */

import React, { useEffect, useState } from 'react';
import { Layout, Card, Row, Col, Statistic, Button, Space, Divider } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StopOutlined,
  SettingOutlined,
  BarChartOutlined 
} from '@ant-design/icons';
import { NetworkGraph } from '@/components/NetworkGraph';
import { useSimulationStore, useAgentStore } from '@/stores';
import { mockAgents, generateMockSimulationResult } from '@/services/mockData';
import './Dashboard.css';

const { Header, Content, Sider } = Layout;

const Dashboard: React.FC = () => {
  const {
    currentSimulation,
    isSimulating,
    currentRound,
    selectedAgentId,
    setCurrentSimulation,
    setSimulating,
    setSelectedAgent,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
  } = useSimulationStore();

  const {
    agents,
    setAgents,
    selectedAgent,
  } = useAgentStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化数据
  useEffect(() => {
    if (!isInitialized) {
      setAgents(mockAgents);
      setIsInitialized(true);
    }
  }, [isInitialized, setAgents]);

  // 处理模拟控制
  const handleStartSimulation = async () => {
    const config = {
      num_rounds: 3,
      participation_prob: 0.8,
      rejoining_prob: 0.1,
      llm_model: 'gpt-4o-mini',
      initial_topic: 'AI预测股市技术发布',
    };
    
    try {
      await startSimulation(config);
      // 模拟API调用
      setTimeout(() => {
        const result = generateMockSimulationResult(config);
        setCurrentSimulation(result);
        setSimulating(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
  };

  const handlePauseSimulation = () => {
    pauseSimulation();
  };

  const handleResumeSimulation = () => {
    resumeSimulation();
  };

  const handleStopSimulation = () => {
    stopSimulation();
  };

  // 处理Agent点击
  const handleAgentClick = (agentId: string) => {
    const agent = Object.values(agents).find(a => a.id === agentId);
    setSelectedAgent(agent?.id || null);
  };

  // 生成网络图数据
  const networkData = {
    agents: Object.values(agents),
    connections: generateMockConnections(Object.values(agents)),
  };

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Multi-Agent 舆论模拟系统</h1>
          <Space>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={handleStartSimulation}
              disabled={isSimulating}
            >
              开始模拟
            </Button>
            {isSimulating ? (
              <Button 
                icon={<PauseCircleOutlined />}
                onClick={handlePauseSimulation}
              >
                暂停
              </Button>
            ) : (
              <Button 
                icon={<PlayCircleOutlined />}
                onClick={handleResumeSimulation}
                disabled={!currentSimulation}
              >
                继续
              </Button>
            )}
            <Button 
              icon={<StopOutlined />}
              onClick={handleStopSimulation}
              disabled={!currentSimulation}
            >
              停止
            </Button>
            <Button icon={<SettingOutlined />}>
              设置
            </Button>
          </Space>
        </div>
      </Header>

      <Layout>
        <Sider width={300} className="dashboard-sider">
          <div className="sider-content">
            {/* 模拟状态 */}
            <Card title="模拟状态" size="small" className="status-card">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic 
                    title="当前轮次" 
                    value={currentRound} 
                    suffix={`/ ${currentSimulation?.rounds.length || 0}`}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="活跃Agent" 
                    value={Object.values(agents).filter(a => a.is_active).length} 
                    suffix={`/ ${Object.values(agents).length}`}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="总帖子数" 
                    value={Object.values(agents).reduce((sum, agent) => sum + agent.recent_posts.length, 0)} 
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="平均立场" 
                    value={Object.values(agents).reduce((sum, agent) => sum + agent.stance, 0) / Object.values(agents).length} 
                    precision={2}
                  />
                </Col>
              </Row>
            </Card>

            <Divider />

            {/* Agent列表 */}
            <Card title="Agent列表" size="small" className="agents-card">
              <div className="agents-list">
                {Object.values(agents).map(agent => (
                  <div 
                    key={agent.id}
                    className={`agent-item ${selectedAgentId === agent.id ? 'selected' : ''}`}
                    onClick={() => handleAgentClick(agent.id)}
                  >
                    <div className="agent-info">
                      <div className="agent-name">{agent.persona.username}</div>
                      <div className="agent-platform">{agent.persona.primary_platform}</div>
                    </div>
                    <div className="agent-stats">
                      <div className="influence">影响力: {agent.persona.influence_score}</div>
                      <div className="stance">立场: {agent.stance.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Divider />

            {/* 选中Agent详情 */}
            {selectedAgent && (
              <Card title="Agent详情" size="small" className="agent-detail-card">
                <div className="agent-detail">
                  <div className="detail-item">
                    <strong>用户名:</strong> {selectedAgent.persona.username}
                  </div>
                  <div className="detail-item">
                    <strong>描述:</strong> {selectedAgent.persona.description}
                  </div>
                  <div className="detail-item">
                    <strong>情绪风格:</strong> {selectedAgent.persona.emotional_style}
                  </div>
                  <div className="detail-item">
                    <strong>主要平台:</strong> {selectedAgent.persona.primary_platform}
                  </div>
                  <div className="detail-item">
                    <strong>影响力分数:</strong> {selectedAgent.persona.influence_score}
                  </div>
                  <div className="detail-item">
                    <strong>当前立场:</strong> {selectedAgent.stance.toFixed(2)}
                  </div>
                  <div className="detail-item">
                    <strong>状态:</strong> {selectedAgent.is_active ? '活跃' : '静默'}
                  </div>
                  {selectedAgent.last_cognitive_summary && (
                    <div className="detail-item">
                      <strong>最新想法:</strong> {selectedAgent.last_cognitive_summary}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </Sider>

        <Content className="dashboard-content">
          <div className="content-wrapper">
            {/* 网络图 */}
            <Card 
              title="社交网络图" 
              className="network-card"
              extra={
                <Space>
                  <Button icon={<BarChartOutlined />} size="small">
                    分析
                  </Button>
                </Space>
              }
            >
              <div className="network-container">
                <NetworkGraph
                  agents={networkData.agents}
                  connections={networkData.connections}
                  selectedAgentId={selectedAgentId}
                  onAgentClick={handleAgentClick}
                />
              </div>
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

// 生成模拟连接数据
const generateMockConnections = (agents: any[]): Array<{source: string; target: string; tie_strength: 'mutual' | 'weak'; isActive: boolean}> => {
  const connections: Array<{source: string; target: string; tie_strength: 'mutual' | 'weak'; isActive: boolean}> = [];
  
  for (let i = 0; i < agents.length; i++) {
    for (let j = 0; j < agents.length; j++) {
      if (i !== j && Math.random() > 0.7) {
        connections.push({
          source: agents[i].id,
          target: agents[j].id,
          tie_strength: Math.random() > 0.5 ? 'mutual' : 'weak',
          isActive: false,
        });
      }
    }
  }
  
  return connections;
};

export default Dashboard;
