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
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onStrategyGenerated: _onStrategyGenerated }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initStartedRef = useRef<boolean>(false); // 添加哨兵Ref

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化聊天会话
  useEffect(() => {
    // 使用哨兵防止在React严格模式下重复执行
    if (initStartedRef.current) {
      return;
    }
    initStartedRef.current = true;

    const initChat = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/scenario1/chat/init');
        const result = await response.json();

        if (result.success && result.data) {
          setSessionId(result.data.sessionId);
          const initialMessage: ChatMessageType = {
            id: '1',
            type: 'llm',
            content: result.data.content,
            timestamp: new Date(result.data.timestamp),
          };
          setMessages([initialMessage]);
        } else {
          // 处理错误情况
          const errorMessage: ChatMessageType = {
            id: 'error-1',
            type: 'llm',
            content: 'Sorry, I failed to initialize. Please try refreshing.',
            timestamp: new Date(),
          };
          setMessages([errorMessage]);
        }
      } catch (error) {
        const errorMessage: ChatMessageType = {
          id: 'error-1',
          type: 'llm',
          content: 'Error connecting to the server. Please check your connection and try again.',
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, []);


  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !sessionId) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/scenario1/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          message: inputValue,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const llmMessage: ChatMessageType = {
          id: result.data.messageId || (Date.now() + 1).toString(),
          type: 'llm',
          content: result.data.content,
          timestamp: new Date(result.data.timestamp),
        };
        setMessages(prev => [...prev, llmMessage]);
      } else {
        const errorMessage: ChatMessageType = {
          id: 'error-' + Date.now(),
          type: 'llm',
          content: `Sorry, an error occurred: ${result.error?.message || 'Unknown error'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: 'error-' + Date.now(),
        type: 'llm',
        content: 'Failed to send message. Please check the server connection.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
