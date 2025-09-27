/**
 * Agent节点组件
 * 在网络图中显示单个Agent的信息
 */

import React from 'react';
import { Card, Avatar, Tag, Tooltip, Badge } from 'antd';
import { 
  UserOutlined, 
  MessageOutlined, 
  ThunderboltOutlined 
} from '@ant-design/icons';
import { Agent } from '@/types';
import { motion } from 'framer-motion';
import './AgentNode.css';

interface AgentNodeProps {
  agent: Agent;
  position: { x: number; y: number };
  isHighlighted: boolean;
  isSelected: boolean;
  onClick: (agentId: string) => void;
  showInfluenceScore?: boolean;
  showStanceValue?: boolean;
  showPlatformIcon?: boolean;
}

const AgentNode: React.FC<AgentNodeProps> = ({
  agent,
  position,
  isHighlighted,
  isSelected,
  onClick,
  showInfluenceScore = true,
  showStanceValue = true,
  showPlatformIcon = true,
}) => {
  // 根据立场值获取颜色
  const getStanceColor = (stance: number): string => {
    const hue = stance > 0 ? 240 : 0; // 蓝色到红色
    const saturation = Math.abs(stance) * 100;
    const lightness = 50 + (1 - Math.abs(stance)) * 20;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // 根据影响力分数获取节点大小
  const getNodeSize = (influenceScore: number): number => {
    const minSize = 40;
    const maxSize = 80;
    return minSize + (influenceScore / 100) * (maxSize - minSize);
  };

  // 获取平台图标
  const getPlatformIcon = (platform: string) => {
    const iconMap = {
      'Weibo/Twitter-like': '🐦',
      'WeChat Moments-like': '💬',
      'TikTok-like': '🎵',
      'Forum-like': '💻',
    };
    return iconMap[platform as keyof typeof iconMap] || '📱';
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

  const nodeSize = getNodeSize(agent.persona.influence_score);
  const stanceColor = getStanceColor(agent.stance);
  const platformIcon = getPlatformIcon(agent.persona.primary_platform);
  const emotionalStyleColor = getEmotionalStyleColor(agent.persona.emotional_style);

  return (
    <motion.div
      className={`agent-node ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        position: 'absolute',
        left: position.x - nodeSize / 2,
        top: position.y - nodeSize / 2,
        width: nodeSize,
        height: nodeSize,
        cursor: 'pointer',
      }}
      onClick={() => onClick(agent.id)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        scale: isSelected ? 1.2 : 1,
        boxShadow: isHighlighted 
          ? `0 0 20px ${stanceColor}` 
          : isSelected 
            ? `0 0 15px ${stanceColor}` 
            : '0 2px 8px rgba(0,0,0,0.15)',
      }}
      transition={{ duration: 0.3 }}
    >
      <Card
        size="small"
        className="agent-card"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: `3px solid ${stanceColor}`,
          backgroundColor: isSelected ? '#f0f8ff' : '#ffffff',
        }}
      >
        <div className="agent-content">
          {/* 头像区域 */}
          <div className="agent-avatar">
            <Avatar
              size={nodeSize * 0.6}
              icon={<UserOutlined />}
              style={{ backgroundColor: stanceColor }}
            />
            {showPlatformIcon && (
              <div className="platform-icon">
                {platformIcon}
              </div>
            )}
          </div>

          {/* 用户名 */}
          <div className="agent-username" title={agent.persona.username}>
            {agent.persona.username}
          </div>

          {/* 状态指示器 */}
          <div className="agent-status">
            {agent.is_active ? (
              <Badge status="success" text="活跃" />
            ) : (
              <Badge status="default" text="静默" />
            )}
          </div>

          {/* 影响力分数 */}
          {showInfluenceScore && (
            <div className="influence-score">
              <ThunderboltOutlined />
              {agent.persona.influence_score}
            </div>
          )}

          {/* 立场值 */}
          {showStanceValue && (
            <div 
              className="stance-indicator"
              style={{ color: stanceColor }}
            >
              {agent.stance > 0 ? '+' : ''}{agent.stance.toFixed(1)}
            </div>
          )}

          {/* 情绪风格标签 */}
          <Tag 
            color={emotionalStyleColor}
            className="emotional-style-tag"
          >
            {agent.persona.emotional_style}
          </Tag>

          {/* 最新帖子数量 */}
          {agent.recent_posts.length > 0 && (
            <div className="post-count">
              <MessageOutlined />
              {agent.recent_posts.length}
            </div>
          )}
        </div>
      </Card>

      {/* 悬停时显示详细信息 */}
      <Tooltip
        title={
          <div className="agent-tooltip">
            <div><strong>用户名:</strong> {agent.persona.username}</div>
            <div><strong>描述:</strong> {agent.persona.description}</div>
            <div><strong>平台:</strong> {agent.persona.primary_platform}</div>
            <div><strong>影响力:</strong> {agent.persona.influence_score}</div>
            <div><strong>立场:</strong> {agent.stance.toFixed(2)}</div>
            <div><strong>状态:</strong> {agent.is_active ? '活跃' : '静默'}</div>
            {agent.last_cognitive_summary && (
              <div><strong>最新想法:</strong> {agent.last_cognitive_summary}</div>
            )}
          </div>
        }
        placement="top"
      >
        <div className="agent-tooltip-trigger" />
      </Tooltip>
    </motion.div>
  );
};

export default AgentNode;
