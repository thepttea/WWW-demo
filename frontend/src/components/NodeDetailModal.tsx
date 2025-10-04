import React from 'react';
import { Modal } from 'antd';
import './NodeDetailModal.css';

interface User {
  username: string;
  description: string;
  emotional_style: string;
  influence_score: number;
  primary_platform: string;
  llm_model: string;
  llm_temperature: number;
  objective_stance_score: number;
  final_decision: string;
  contextual_memories: string[];
  short_term_memories: string[];
}

interface Platform {
  name: string;
  type: string;
  userCount: number;
  activeUsers: string[];
  message_propagation: Array<{
    sender: string;
    receivers: string[];
    content: string;
    sentiment: string;
    timestamp: string;
    likes: number;
    shares: number;
    comments: number;
  }>;
}

interface NodeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  nodeData: User | Platform | null;
  nodeType: 'user' | 'platform' | null;
}

const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  visible,
  onClose,
  nodeData,
  nodeType
}) => {
  if (!nodeData || !nodeType) return null;

  const renderUserDetails = (user: User) => (
    <div className="node-detail-content">
      <div className="node-detail-header">
        <div className="node-detail-title">
          <p className="node-detail-subtitle">Agent {user.influence_score}</p>
          <h3 className="node-detail-name">{user.username}</h3>
        </div>
      </div>
      
      <div className="node-detail-body">
        <div className="node-detail-section">
          <div className="node-detail-item">
            <span className="node-detail-icon">👤</span>
            <div>
              <p className="node-detail-label">Identity</p>
              <p className="node-detail-value">{user.emotional_style}</p>
            </div>
          </div>
          
          <div className="node-detail-item">
            <span className="node-detail-icon">🧠</span>
            <div>
              <p className="node-detail-label">Personality</p>
              <p className="node-detail-value">{user.emotional_style}</p>
            </div>
          </div>
          
          <div className="node-detail-item">
            <span className="node-detail-icon">📊</span>
            <div>
              <p className="node-detail-label">Influence Score</p>
              <p className="node-detail-value">{user.influence_score}/100</p>
            </div>
          </div>
          
          <div className="node-detail-item">
            <span className="node-detail-icon">🌐</span>
            <div>
              <p className="node-detail-label">Primary Platform</p>
              <p className="node-detail-value">{user.primary_platform}</p>
            </div>
          </div>
          
          <div className="node-detail-section">
            <p className="node-detail-label">Opinion on Current Topic</p>
            <p className="node-detail-opinion">{user.final_decision}</p>
          </div>
        </div>
      </div>
      
      <div className="node-detail-footer"></div>
    </div>
  );

  const renderPlatformDetails = (platform: Platform) => (
    <div className="node-detail-content">
      <div className="node-detail-header">
        <div className="node-detail-title">
          <p className="node-detail-subtitle">Platform</p>
          <h3 className="node-detail-name">{platform.name}</h3>
        </div>
      </div>
      
      <div className="node-detail-body">
        <div className="node-detail-section">
          <div className="node-detail-item">
            <span className="node-detail-icon">📱</span>
            <div>
              <p className="node-detail-label">Type</p>
              <p className="node-detail-value">{platform.type}</p>
            </div>
          </div>
          
          <div className="node-detail-item">
            <span className="node-detail-icon">👥</span>
            <div>
              <p className="node-detail-label">Active Users</p>
              <p className="node-detail-value">{platform.userCount}</p>
            </div>
          </div>
          
          <div className="node-detail-item">
            <span className="node-detail-icon">💬</span>
            <div>
              <p className="node-detail-label">Messages</p>
              <p className="node-detail-value">{platform.message_propagation.length}</p>
            </div>
          </div>
          
          <div className="node-detail-section">
            <p className="node-detail-label">Active Users</p>
            <div className="node-detail-users">
              {platform.activeUsers.map((user, index) => (
                <span key={index} className="node-detail-user-tag">
                  {user}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="node-detail-footer"></div>
    </div>
  );

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      className="node-detail-modal"
      width={400}
      centered
      destroyOnClose
    >
      {nodeType === 'user' ? renderUserDetails(nodeData as User) : renderPlatformDetails(nodeData as Platform)}
    </Modal>
  );
};

export default NodeDetailModal;
