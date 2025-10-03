import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '../types';
import './ChatInterface.css';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface ChatInterfaceProps {
  onStrategyGenerated: (strategy: string) => void;
  onStrategyConfirm?: (strategy: string) => void;
  onLastLLMMessageChange?: (message: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onStrategyGenerated: _onStrategyGenerated, onLastLLMMessageChange }) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: '1',
      type: 'llm',
      content: "Hello! I'm here to help you craft the perfect PR strategy. Please describe the situation and your goals.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastLLMMessage, setLastLLMMessage] = useState<string>("Hello! I'm here to help you craft the perfect PR strategy. Please describe the situation and your goals.");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 当最后LLM消息变化时，通知父组件
  useEffect(() => {
    if (onLastLLMMessageChange && lastLLMMessage) {
      onLastLLMMessageChange(lastLLMMessage);
    }
  }, [lastLLMMessage, onLastLLMMessageChange]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 模拟LLM响应
    setTimeout(() => {
      const llmMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        type: 'llm',
        content: "I understand. Let's work together to develop a comprehensive PR plan. We can explore various approaches, such as targeted communication, influencer engagement, and community outreach. What are your initial thoughts?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, llmMessage]);
      // 更新最后一条LLM消息
      setLastLLMMessage(llmMessage.content);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  return (
    <Card className="chat-interface glassmorphism">
      <div className="chat-header">
        <Title level={1} className="chat-title">LLM Chat</Title>
        <Paragraph className="chat-description">
          Interact with the LLM to refine your PR strategy. The final strategy will be used in the simulation.
        </Paragraph>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="loading-message">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <div className="input-container">
          <TextArea
            className="message-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={3}
            disabled={isLoading}
          />
          <Button
            className="send-button"
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          />
        </div>
      </div>

    </Card>
  );
};

export default ChatInterface;
