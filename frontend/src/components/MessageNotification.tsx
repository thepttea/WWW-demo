import React, { useEffect, useState, useRef } from 'react';
import { MessageOutlined } from '@ant-design/icons';
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
  const [notificationData, setNotificationData] = useState<{
    title: string;
    description: string;
    content: string;
    receivers: string;
    visible: boolean;
  } | null>(null);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedStepRef = useRef<number>(-1);

  useEffect(() => {
    console.log('MessageNotification - currentStep:', currentStep, 'lastProcessedStep:', lastProcessedStepRef.current);
    
    // 如果已经处理过这个步骤，跳过
    if (currentStep === lastProcessedStepRef.current) {
      console.log('Skipping already processed step:', currentStep);
      return;
    }
    
    // 清除之前的自动隐藏定时器
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    
    if (currentStep >= 0 && currentStep < messageSteps.length) {
      const step = messageSteps[currentStep];
      console.log('MessageNotification - showing notification for step:', step);
      
      const receiverList = step.receivers.length > 0 
        ? step.receivers.join('、') 
        : '无接收者';
      
      const newNotification = {
        title: `📢 消息传播 - 第${currentStep + 1}轮`,
        description: `${step.sender} 通过 ${step.platform} 向 ${step.receivers.length} 位用户发送消息`,
        visible: true,
        content: step.content,
        receivers: receiverList
      };
      
      // 标记当前步骤已处理
      lastProcessedStepRef.current = currentStep;
      
      // 如果有当前通知，先渐出再显示新通知
      if (notificationData) {
        console.log('Fading out current notification and showing new one');
        setIsTransitioning(true);
        
        // 渐出动画完成后显示新通知
        setTimeout(() => {
          console.log('Setting new notification after fade out');
          setNotificationData(newNotification);
          
          // 渐入动画
          setTimeout(() => {
            console.log('Fade in animation completed');
            setIsTransitioning(false);
          }, 50);
          
          // 设置自动隐藏定时器
          autoHideTimerRef.current = setTimeout(() => {
            console.log('Auto-hiding notification after 3 seconds');
            setNotificationData(prev => prev ? { ...prev, visible: false } : null);
          }, 3000);
        }, 300);
      } else {
        // 直接显示新通知（首次显示）
        console.log('Showing first notification');
        setNotificationData(newNotification);
        setIsTransitioning(false);
        
        // 设置自动隐藏定时器
        autoHideTimerRef.current = setTimeout(() => {
          console.log('Auto-hiding notification after 3 seconds (first message)');
          setNotificationData(prev => prev ? { ...prev, visible: false } : null);
        }, 3000);
      }
    } else if (currentStep === -1) {
      // 动画结束，渐出隐藏通知
      console.log('MessageNotification - animation ended, fading out notification');
      lastProcessedStepRef.current = -1;
      setIsTransitioning(true);
      
      setTimeout(() => {
        setNotificationData(null);
        setIsTransitioning(false);
      }, 300);
    }
    
    // 清理函数
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
        autoHideTimerRef.current = null;
      }
    };
  }, [currentStep, messageSteps]);

  if (!notificationData || !notificationData.visible) {
    return null;
  }

  return (
    <div className="message-notification-container">
      <div className={`message-notification ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        <div className="message-notification-icon">
          <MessageOutlined style={{ color: '#137fec', fontSize: '20px' }} />
        </div>
        <div className="message-notification-content">
          <div className="message-notification-title">
            {notificationData.title}
          </div>
          <div className="message-notification-description">
            {notificationData.description}
          </div>
          <div className="message-notification-receivers">
            <strong>接收者：</strong>{notificationData.receivers}
          </div>
          <div className="message-notification-content-text">
            <strong>消息内容：</strong>
            <div className="message-content-preview">
              {notificationData.content.length > 100 
                ? `${notificationData.content.substring(0, 100)}...` 
                : notificationData.content}
            </div>
          </div>
        </div>
        <div 
          className="message-notification-close"
          onClick={() => setNotificationData(prev => prev ? { ...prev, visible: false } : null)}
        >
          ×
        </div>
      </div>
    </div>
  );
};

export default MessageNotification;