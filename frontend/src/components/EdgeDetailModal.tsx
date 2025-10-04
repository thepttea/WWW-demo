import React from 'react';
import { Modal } from 'antd';
import './EdgeDetailModal.css';

interface Message {
  sender: string;
  receivers: string[];
  content: string;
  sentiment: string;
  timestamp: string;
  likes: number;
  shares: number;
  comments: number;
}

interface EdgeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  edgeData: {
    from: string;
    to: string;
    messages: Message[];
  } | null;
}

const EdgeDetailModal: React.FC<EdgeDetailModalProps> = ({
  visible,
  onClose,
  edgeData
}) => {
  if (!edgeData) return null;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '#4ade80';
      case 'negative':
        return '#f87171';
      case 'neutral':
        return '#facc15';
      default:
        return '#9ca3af';
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '积极';
      case 'negative':
        return '消极';
      case 'neutral':
        return '中性';
      default:
        return '未知';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      className="edge-detail-modal"
      width={600}
      centered
      destroyOnClose
    >
      <div className="edge-detail-content">
        <div className="edge-detail-header">
          <div className="edge-detail-title">
            <p className="edge-detail-subtitle">Channel</p>
            <h3 className="edge-detail-name">{edgeData.from} → {edgeData.to}</h3>
          </div>
        </div>
        
        <div className="edge-detail-body">
          <div className="edge-detail-section">
            <p className="edge-detail-label">Messages ({edgeData.messages.length})</p>
            <div className="edge-detail-messages">
              {edgeData.messages.map((message, index) => (
                <div key={index} className="edge-detail-message">
                  <div className="message-header">
                    <div className="message-sender">
                      <span className="message-sender-name">{message.sender}</span>
                      <span 
                        className="message-sentiment"
                        style={{ color: getSentimentColor(message.sentiment) }}
                      >
                        {getSentimentText(message.sentiment)}
                      </span>
                    </div>
                    <div className="message-meta">
                      <span className="message-timestamp">{formatTimestamp(message.timestamp)}</span>
                      <div className="message-stats">
                        <span className="message-stat">👍 {message.likes}</span>
                        <span className="message-stat">🔄 {message.shares}</span>
                        <span className="message-stat">💬 {message.comments}</span>
                      </div>
                    </div>
                  </div>
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-receivers">
                    <span className="receivers-label">接收者:</span>
                    <div className="receivers-list">
                      {message.receivers.map((receiver, idx) => (
                        <span key={idx} className="receiver-tag">
                          {receiver}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="edge-detail-footer"></div>
      </div>
    </Modal>
  );
};

export default EdgeDetailModal;
