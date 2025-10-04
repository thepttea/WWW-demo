import React, { useEffect, useState } from 'react';
import { MessageOutlined, UserOutlined, GlobalOutlined } from '@ant-design/icons';
import './MessageNotification.css';

interface MessageNotificationProps {
  currentStep: number;
  messageSteps: Array<{
    id: string;
    type: string;
    sender: string;
    platform: string;
    receivers: string[];
    content: string;
    delay: number;
  }>;
}

const MessageNotification: React.FC<MessageNotificationProps> = ({
  currentStep,
  messageSteps
}) => {
  const [currentNotification, setCurrentNotification] = useState<{
    title: string;
    description: string;
    content: string;
    receivers: string;
    visible: boolean;
  } | null>(null);

  useEffect(() => {
    console.log('MessageNotification - currentStep:', currentStep, 'messageSteps.length:', messageSteps.length);
    
    if (currentStep >= 0 && currentStep < messageSteps.length) {
      const step = messageSteps[currentStep];
      console.log('MessageNotification - showing notification for step:', step);
      
      // 显示通知
      const receiverList = step.receivers.length > 0 
        ? step.receivers.join('、') 
        : '无接收者';
      
      setCurrentNotification({
        title: `📢 消息传播 - 第${currentStep + 1}轮`,
        description: `${step.sender} 通过 ${step.platform} 向 ${step.receivers.length} 位用户发送消息`,
        visible: true,
        content: step.content,
        receivers: receiverList
      });

      // 3秒后自动隐藏
      const timer = setTimeout(() => {
        setCurrentNotification(prev => prev ? { ...prev, visible: false } : null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, messageSteps]);

  if (!currentNotification || !currentNotification.visible) {
    return null;
  }

  return (
    <div className="message-notification-container">
      <div className="message-notification">
        <div className="message-notification-icon">
          <MessageOutlined style={{ color: '#137fec', fontSize: '20px' }} />
        </div>
        <div className="message-notification-content">
          <div className="message-notification-title">
            {currentNotification.title}
          </div>
          <div className="message-notification-description">
            {currentNotification.description}
          </div>
          <div className="message-notification-receivers">
            <strong>接收者：</strong>{currentNotification.receivers}
          </div>
          <div className="message-notification-content-text">
            <strong>消息内容：</strong>
            <div className="message-content-preview">
              {currentNotification.content.length > 100 
                ? `${currentNotification.content.substring(0, 100)}...` 
                : currentNotification.content}
            </div>
          </div>
        </div>
        <div 
          className="message-notification-close"
          onClick={() => setCurrentNotification(prev => prev ? { ...prev, visible: false } : null)}
        >
          ×
        </div>
      </div>
    </div>
  );
};

export default MessageNotification;