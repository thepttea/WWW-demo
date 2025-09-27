/**
 * 节点详情面板组件
 * 显示在节点旁边的Agent详细信息
 */

import React from 'react';
import { Card, Avatar, Tag, Badge, Divider, Typography } from 'antd';
import { 
  UserOutlined, 
  MessageOutlined, 
  EyeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Agent } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import './NodeDetailPanel.css';

const { Title, Text, Paragraph } = Typography;

interface NodeDetailPanelProps {
  agent: Agent | null;
  position: { x: number; y: number };
  visible: boolean;
  onClose: () => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  agent,
  position,
  visible,
  onClose,
}) => {
  if (!agent) return null;

  // 根据立场值获取颜色
  const getStanceColor = (stance: number): string => {
    if (stance > 0.3) return '#52c41a';
    if (stance < -0.3) return '#ff4d4f';
    return '#faad14';
  };

  // 获取平台图标和颜色
  const getPlatformInfo = (platform: string) => {
    const platformMap = {
      'Weibo/Twitter-like': { icon: '🐦', color: '#1da1f2', name: '微博/推特' },
      'WeChat Moments-like': { icon: '💬', color: '#07c160', name: '朋友圈' },
      'TikTok-like': { icon: '🎵', color: '#ff0050', name: '抖音' },
      'Forum-like': { icon: '💻', color: '#1890ff', name: '论坛' },
    };
    return platformMap[platform as keyof typeof platformMap] || { icon: '📱', color: '#8c8c8c', name: '未知' };
  };

  // 获取情绪风格颜色
  const getEmotionalStyleColor = (style: string): string => {
    const colorMap = {
      '激情支持型': '#52c41a',
      '尖锐批评型': '#ff4d4f',
      '冷静分析型': '#1890ff',
      '幽默讽刺型': '#faad14',
    };
    return colorMap[style as keyof typeof colorMap] || '#d9d9d9';
  };

  const platformInfo = getPlatformInfo(agent.persona.primary_platform);
  const stanceColor = getStanceColor(agent.stance);
  const emotionalStyleColor = getEmotionalStyleColor(agent.persona.emotional_style);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="node-detail-panel"
          style={{
            position: 'absolute',
            left: position.x + 20,
            top: position.y - 20,
            zIndex: 1000,
          }}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Card
            className="detail-card"
            size="small"
            title={
              <div className="detail-header">
                <Avatar
                  size={40}
                  icon={<UserOutlined />}
                  style={{ 
                    backgroundColor: stanceColor,
                    marginRight: 12
                  }}
                />
                <div className="header-info">
                  <Title level={5} style={{ margin: 0, color: '#333' }}>
                    {agent.persona.username}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {platformInfo.name}
                  </Text>
                </div>
                <div className="close-btn" onClick={onClose}>
                  ×
                </div>
              </div>
            }
          >
            <div className="detail-content">
              {/* 基本信息 */}
              <div className="info-section">
                <Title level={5} className="section-title">
                  <UserOutlined /> 基本信息
                </Title>
                <div className="info-grid">
                  <div className="info-item">
                    <Text strong>影响力:</Text>
                    <Badge 
                      count={agent.persona.influence_score} 
                      style={{ backgroundColor: '#faad14' }}
                    />
                  </div>
                  <div className="info-item">
                    <Text strong>立场:</Text>
                    <Tag color={stanceColor}>
                      {agent.stance > 0 ? '+' : ''}{agent.stance.toFixed(2)}
                    </Tag>
                  </div>
                  <div className="info-item">
                    <Text strong>状态:</Text>
                    <Badge 
                      status={agent.is_active ? 'success' : 'default'} 
                      text={agent.is_active ? '活跃' : '静默'}
                    />
                  </div>
                  <div className="info-item">
                    <Text strong>风格:</Text>
                    <Tag color={emotionalStyleColor}>
                      {agent.persona.emotional_style}
                    </Tag>
                  </div>
                </div>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* 平台信息 */}
              <div className="info-section">
                <Title level={5} className="section-title">
                  <span style={{ color: platformInfo.color }}>{platformInfo.icon}</span> 平台信息
                </Title>
                <div className="platform-info">
                  <Text>{platformInfo.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {agent.persona.llm_model} (温度: {agent.persona.llm_temperature})
                  </Text>
                </div>
              </div>

              {/* 描述 */}
              <div className="info-section">
                <Title level={5} className="section-title">
                  <EyeOutlined /> 角色描述
                </Title>
                <Paragraph 
                  style={{ 
                    fontSize: 12, 
                    lineHeight: 1.6,
                    margin: 0,
                    color: '#666'
                  }}
                >
                  {agent.persona.description}
                </Paragraph>
              </div>

              {/* 最新想法 */}
              {agent.last_cognitive_summary && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <div className="info-section">
                    <Title level={5} className="section-title">
                      <ClockCircleOutlined /> 最新想法
                    </Title>
                    <div className="cognitive-summary">
                      <Text style={{ fontSize: 12, fontStyle: 'italic' }}>
                        "{agent.last_cognitive_summary}"
                      </Text>
                    </div>
                  </div>
                </>
              )}

              {/* 帖子统计 */}
              <Divider style={{ margin: '12px 0' }} />
              <div className="info-section">
                <Title level={5} className="section-title">
                  <MessageOutlined /> 活动统计
                </Title>
                <div className="stats-grid">
                  <div className="stat-item">
                    <Text strong>帖子数:</Text>
                    <Text>{agent.recent_posts.length}</Text>
                  </div>
                  <div className="stat-item">
                    <Text strong>记忆数:</Text>
                    <Text>{agent.memories.length}</Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NodeDetailPanel;
