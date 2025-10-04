import React, { useState, useEffect } from 'react';
import NodeDetailModal from './NodeDetailModal';
import EdgeDetailModal from './EdgeDetailModal';
import './NetworkVisualization.css';

interface User {
  username: string;
  influence_score: number;
  primary_platform: string;
  emotional_style: string;
  final_decision: string;
}

interface Platform {
  name: string;
  type: string;
  userCount: number;
  activeUsers: string[];
  message_propagation?: Array<{
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

interface NetworkVisualizationProps {
  users?: User[];
  platforms?: Platform[];
  isLoading?: boolean;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  users: _users = [],
  platforms: _platforms = [],
  isLoading: _isLoading = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [_isAnimating, setIsAnimating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0); // 0: 发送者, 1: 发送者+平台, 2: 发送者+平台+接收者, 3: 流动边
  
  // 节点详情弹窗状态
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<'user' | 'platform' | null>(null);
  
  // 边详情弹窗状态
  const [edgeModalVisible, setEdgeModalVisible] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  // 消息传播步骤定义 - 以消息为主体，每个消息6秒
  const messageSteps = [
    // 消息1: Serena 发表消息到 Weibo，传播到其他用户
    { 
      id: 'message1',
      type: 'message_flow', 
      sender: 'Serena', 
      platform: 'Weibo', 
      receivers: ['Journalist', 'Elon', 'Graham', 'Vivian'],
      delay: 0,
      duration: 6000
    },
    // 消息2: Journalist 发表消息到 Weibo，传播到其他用户
    { 
      id: 'message2',
      type: 'message_flow', 
      sender: 'Journalist', 
      platform: 'Weibo', 
      receivers: ['Serena', 'Elon', 'Graham', 'Vivian'],
      delay: 6000,
      duration: 6000
    },
    // 消息3: Elon 发表消息到 Weibo，传播到其他用户
    { 
      id: 'message3',
      type: 'message_flow', 
      sender: 'Elon', 
      platform: 'Weibo', 
      receivers: ['Serena', 'Journalist', 'Graham', 'Vivian'],
      delay: 12000,
      duration: 6000
    },
    // 消息4: Alex 发表消息到 Weibo，传播到其他用户
    { 
      id: 'message4',
      type: 'message_flow', 
      sender: 'Alex', 
      platform: 'Weibo', 
      receivers: ['Serena', 'Journalist', 'Elon', 'Graham'],
      delay: 18000,
      duration: 6000
    },
    // 消息5: Graham 发表消息到 WeChat，传播到其他用户
    { 
      id: 'message5',
      type: 'message_flow', 
      sender: 'Graham', 
      platform: 'WeChat', 
      receivers: ['Serena', 'Elon', 'Vivian'],
      delay: 24000,
      duration: 6000
    },
    // 消息6: Tom 发表消息到 WeChat，传播到其他用户
    { 
      id: 'message6',
      type: 'message_flow', 
      sender: 'Tom', 
      platform: 'WeChat', 
      receivers: ['Serena', 'Elon', 'Graham'],
      delay: 30000,
      duration: 6000
    },
    // 消息7: Vivian 发表消息到 TikTok，传播到其他用户
    { 
      id: 'message7',
      type: 'message_flow', 
      sender: 'Vivian', 
      platform: 'TikTok', 
      receivers: ['Serena', 'Elon'],
      delay: 36000,
      duration: 6000
    },
    // 消息8: Intern 发表消息到 TikTok，传播到其他用户
    { 
      id: 'message8',
      type: 'message_flow', 
      sender: 'Intern', 
      platform: 'TikTok', 
      receivers: ['Serena', 'Elon'],
      delay: 42000,
      duration: 6000
    },
    // 消息9: Dev 发表消息到 Forum，传播到其他用户
    { 
      id: 'message9',
      type: 'message_flow', 
      sender: 'Dev', 
      platform: 'Forum', 
      receivers: ['Serena', 'Elon', 'Graham', 'Tom'],
      delay: 48000,
      duration: 6000
    },
    // 消息10: Philosopher 发表消息到 Forum，传播到其他用户
    { 
      id: 'message10',
      type: 'message_flow', 
      sender: 'Philosopher', 
      platform: 'Forum', 
      receivers: ['Serena', 'Elon', 'Graham', 'Tom'],
      delay: 54000,
      duration: 6000
    }
  ];

  // 获取用户坐标
  const getUserCoordinates = (username: string) => {
    const coordinates: { [key: string]: { x: number; y: number } } = {
      'Serena': { x: 200, y: 100 },
      'Journalist': { x: 400, y: 80 },
      'Elon': { x: 600, y: 100 },
      'Alex': { x: 650, y: 200 },
      'Graham': { x: 650, y: 350 },
      'Tom': { x: 650, y: 500 },
      'Vivian': { x: 400, y: 620 },
      'Intern': { x: 500, y: 620 },
      'Dev': { x: 200, y: 600 },
      'Philosopher': { x: 150, y: 500 }
    };
    return coordinates[username];
  };

  // 获取平台坐标
  const getPlatformCoordinates = (platformName: string) => {
    const coordinates: { [key: string]: { x: number; y: number } } = {
      'Weibo': { x: 400, y: 200 },
      'WeChat': { x: 500, y: 300 },
      'TikTok': { x: 400, y: 400 },
      'Forum': { x: 300, y: 300 }
    };
    return coordinates[platformName];
  };

  // 获取用户颜色
  const getUserColor = (username: string) => {
    const colors: { [key: string]: string } = {
      'Serena': '#00D4FF',
      'Journalist': '#FF6B6B',
      'Elon': '#00D4FF',
      'Alex': '#FFD700',
      'Graham': '#00FF88',
      'Tom': '#00FF88',
      'Vivian': '#FF00FF',
      'Intern': '#FF00FF',
      'Dev': '#FF9F43',
      'Philosopher': '#FF9F43'
    };
    return colors[username] || '#00D4FF';
  };

  // 获取平台颜色
  const getPlatformColor = (platformName: string) => {
    const colors: { [key: string]: string } = {
      'Weibo': '#00D4FF',
      'WeChat': '#00FF88',
      'TikTok': '#FF00FF',
      'Forum': '#FF9F43'
    };
    return colors[platformName] || '#00D4FF';
  };

  // 开始动画序列 - 当有网络数据时自动开始
  useEffect(() => {
    console.log('NetworkVisualization - has network data:', !!_users.length);
    if (_users.length > 0) {
      console.log('Starting animation sequence');
      setIsAnimating(true);
      setCurrentStep(0);
      setCurrentPhase(0);
      
      // 使用 setTimeout 来精确控制每个消息的显示时机
      const timers: NodeJS.Timeout[] = [];
      
      messageSteps.forEach((step, index) => {
        const messageStartTime = step.delay;
        
        // 阶段1: 闪烁发送者 (1s)
        const phase1Timer = setTimeout(() => {
          setCurrentStep(index);
          setCurrentPhase(0);
          console.log(`Phase 1 - Message ${index + 1}: Flashing sender ${step.sender}`);
        }, messageStartTime);
        
        // 阶段2: 闪烁发送者和平台 (1s)
        const phase2Timer = setTimeout(() => {
          setCurrentPhase(1);
          console.log(`Phase 2 - Message ${index + 1}: Flashing sender and platform`);
        }, messageStartTime + 1000);
        
        // 阶段3: 闪烁发送者、平台和接收者 (1s)
        const phase3Timer = setTimeout(() => {
          setCurrentPhase(2);
          console.log(`Phase 3 - Message ${index + 1}: Flashing sender, platform and receivers`);
        }, messageStartTime + 2000);
        
        // 阶段4: 开始流动边 (3s)
        const phase4Timer = setTimeout(() => {
          setCurrentPhase(3);
          console.log(`Phase 4 - Message ${index + 1}: Starting flow animation`);
        }, messageStartTime + 3000);
        
        timers.push(phase1Timer, phase2Timer, phase3Timer, phase4Timer);
      });
      
      // 清理所有定时器
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    } else {
      // 重置状态
      setCurrentStep(0);
      setCurrentPhase(0);
      setIsAnimating(false);
    }
  }, [_users.length]);

  // 获取所有静态路径（一开始就显示）
  const getAllStaticPaths = () => {
    const allPaths: Array<{
      id: string;
      d: string;
      stroke: string;
      delay: number;
      isActive: boolean;
    }> = [];

    // 用于跟踪已经显示过的通道
    const shownChannels = new Set<string>();
    const shownPlatformToUserChannels = new Set<string>();

    messageSteps.forEach((step, stepIndex) => {
      if (step.type === 'message_flow') {
        const senderCoords = getUserCoordinates(step.sender);
        const platformCoords = getPlatformCoordinates(step.platform);
        
        if (senderCoords && platformCoords) {
          // 发送者到平台的路径 - 每个用户到平台只显示一次
          const senderToPlatformChannel = `${step.sender}-${step.platform}`;
          if (!shownChannels.has(senderToPlatformChannel)) {
            allPaths.push({
              id: `sender-to-platform-${step.sender}-${step.platform}`,
              d: `M ${senderCoords.x} ${senderCoords.y} L ${platformCoords.x} ${platformCoords.y}`,
              stroke: getUserColor(step.sender),
              delay: 0,
              isActive: stepIndex <= currentStep // 只有当前步骤及之前的路径才激活流动
            });
            shownChannels.add(senderToPlatformChannel);
          }
          
          // 平台到接收者的路径 - 每个平台到用户只显示一次
          step.receivers.forEach(receiver => {
            const receiverCoords = getUserCoordinates(receiver);
            if (receiverCoords) {
              const platformToUserChannel = `${step.platform}-${receiver}`;
              if (!shownPlatformToUserChannels.has(platformToUserChannel)) {
                allPaths.push({
                  id: `platform-to-user-${step.platform}-${receiver}`,
                  d: `M ${platformCoords.x} ${platformCoords.y} L ${receiverCoords.x} ${receiverCoords.y}`,
                  stroke: getPlatformColor(step.platform),
                  delay: 0,
                  isActive: stepIndex <= currentStep // 只有当前步骤及之前的路径才激活流动
                });
                shownPlatformToUserChannels.add(platformToUserChannel);
              }
            }
          });
        }
      }
    });

    return allPaths;
  };

  // 获取当前应该闪烁的节点
  const getCurrentFlashingNodes = () => {
    if (currentStep < 0 || currentStep >= messageSteps.length) {
      return {
        sender: null,
        platform: null,
        receivers: [] as string[]
      };
    }
    
    const step = messageSteps[currentStep];
    
    if (step.type === 'message_flow') {
      // 根据当前阶段决定闪烁哪些节点
      switch (currentPhase) {
        case 0: // 阶段1: 只闪烁发送者
          return {
            sender: step.sender,
            platform: null,
            receivers: [] as string[]
          };
        case 1: // 阶段2: 闪烁发送者和平台
          return {
            sender: step.sender,
            platform: step.platform,
            receivers: [] as string[]
          };
        case 2: // 阶段3: 闪烁发送者、平台和接收者
          return {
            sender: step.sender,
            platform: step.platform,
            receivers: step.receivers
          };
        case 3: // 阶段4: 继续闪烁发送者、平台和接收者，同时开始流动
        default:
          return {
            sender: step.sender,
            platform: step.platform,
            receivers: step.receivers
          };
      }
    }
    
    return {
      sender: null,
      platform: null,
      receivers: [] as string[]
    };
  };

  // 处理节点点击事件
  const handleNodeClick = (nodeType: 'user' | 'platform', nodeName: string) => {
    console.log('Node clicked:', nodeType, nodeName);
    console.log('Available users:', _users.map(u => u.username));
    console.log('Available platforms:', _platforms.map(p => p.name));
    
    if (nodeType === 'user') {
      const user = _users.find(u => u.username === nodeName);
      console.log('Found user:', user);
      if (user) {
        setSelectedNode(user);
        setSelectedNodeType('user');
        setModalVisible(true);
      }
    } else if (nodeType === 'platform') {
      const platform = _platforms.find(p => p.name === nodeName);
      console.log('Found platform:', platform);
      if (platform) {
        setSelectedNode(platform);
        setSelectedNodeType('platform');
        setModalVisible(true);
      }
    }
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedNode(null);
    setSelectedNodeType(null);
  };

  // 处理边点击事件
  const handleEdgeClick = (from: string, to: string) => {
    console.log('Edge clicked:', from, '→', to);
    
    // 收集该通道的所有消息
    const messages: any[] = [];
    
    // 遍历所有平台的消息传播数据
    _platforms.forEach(platform => {
      if (platform.message_propagation) {
        platform.message_propagation.forEach((message: any) => {
          // 检查是否匹配发送者到平台的边
          if (message.sender === from && platform.name === to) {
            messages.push({
              ...message,
              platform: platform.name
            });
          }
          // 检查是否匹配平台到接收者的边
          if (platform.name === from && message.receivers.includes(to)) {
            messages.push({
              ...message,
              platform: platform.name
            });
          }
        });
      }
    });
    
    console.log('Found messages for edge:', messages);
    
    if (messages.length > 0) {
      setSelectedEdge({
        from,
        to,
        messages
      });
      setEdgeModalVisible(true);
    }
  };

  // 关闭边详情弹窗
  const handleCloseEdgeModal = () => {
    setEdgeModalVisible(false);
    setSelectedEdge(null);
  };

  // 获取所有路径和当前闪烁节点
  const allPaths = getAllStaticPaths();
  const flashingNodes = getCurrentFlashingNodes();

  return (
    <div className="network-visualization-container">
      <svg width="1000" height="700" viewBox="0 0 1000 700" className="network-svg">
        {/* 平台节点 */}
        <g id="platforms">
          {/* Weibo平台 */}
          <circle 
            cx="400" 
            cy="200" 
            r="35" 
            fill="#1DA1F2" 
            opacity="0.8" 
            className={`platform-node ${flashingNodes.platform === 'Weibo' ? 'flashing-platform' : ''}`}
            onClick={() => handleNodeClick('platform', 'Weibo/Twitter-like')}
            style={{ cursor: 'pointer' }}
          />
          <text x="400" y="250" fill="white" fontSize="14" textAnchor="middle" className="platform-label">Weibo</text>
          
          {/* WeChat平台 */}
          <circle 
            cx="500" 
            cy="300" 
            r="35" 
            fill="#07C160" 
            opacity="0.8" 
            className={`platform-node ${flashingNodes.platform === 'WeChat' ? 'flashing-platform' : ''}`}
            onClick={() => handleNodeClick('platform', 'WeChat Moments-like')}
            style={{ cursor: 'pointer' }}
          />
          <text x="500" y="350" fill="white" fontSize="14" textAnchor="middle" className="platform-label">WeChat</text>
          
          {/* TikTok平台 */}
          <circle 
            cx="400" 
            cy="400" 
            r="35" 
            fill="#FF6B9D" 
            opacity="0.8" 
            className={`platform-node ${flashingNodes.platform === 'TikTok' ? 'flashing-platform' : ''}`}
            onClick={() => handleNodeClick('platform', 'TikTok-like')}
            style={{ cursor: 'pointer' }}
          />
          <text x="400" y="440" fill="white" fontSize="14" textAnchor="middle" className="platform-label">TikTok</text>
          
          {/* Forum平台 */}
          <circle 
            cx="300" 
            cy="300" 
            r="35" 
            fill="#8B5CF6" 
            opacity="0.8" 
            className={`platform-node ${flashingNodes.platform === 'Forum' ? 'flashing-platform' : ''}`}
            onClick={() => handleNodeClick('platform', 'Forum-like')}
            style={{ cursor: 'pointer' }}
          />
          <text x="300" y="350" fill="white" fontSize="14" textAnchor="middle" className="platform-label">Forum</text>
        </g>

        {/* 用户节点 */}
        <g id="users">
          {/* Serena */}
          <circle 
            cx="200" 
            cy="100" 
            r="25" 
            fill="#4ade80" 
            stroke="#22c55e" 
            strokeWidth="3" 
            className={`agent-node ${
              flashingNodes.sender === 'Serena' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Serena') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'MarketingPro_Serena')}
            style={{ cursor: 'pointer' }}
          />
          <text x="200" y="130" fill="#4ade80" fontSize="12" textAnchor="middle" className="user-label">Serena</text>
          
          {/* Journalist */}
          <circle 
            cx="400" 
            cy="80" 
            r="20" 
            fill="#f87171" 
            stroke="#ef4444" 
            strokeWidth="3" 
            className={`agent-node ${
              flashingNodes.sender === 'Journalist' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Journalist') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'Skeptical_Journalist')}
            style={{ cursor: 'pointer' }}
          />
          <text x="400" y="70" fill="#f87171" fontSize="12" textAnchor="middle" className="user-label">Journalist</text>
          
          {/* Elon */}
          <circle 
            cx="600" 
            cy="100" 
            r="22" 
            fill="#4ade80" 
            stroke="#22c55e" 
            strokeWidth="3" 
            className={`agent-node ${
              flashingNodes.sender === 'Elon' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Elon') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'TechBro_Elon')}
            style={{ cursor: 'pointer' }}
          />
          <text x="600" y="130" fill="#4ade80" fontSize="12" textAnchor="middle" className="user-label">Elon</text>
          
          {/* Alex */}
          <circle 
            cx="650" 
            cy="200" 
            r="12" 
            fill="#facc15" 
            stroke="#eab308" 
            strokeWidth="2" 
            className={`agent-node ${
              flashingNodes.sender === 'Alex' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Alex') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'TechEnthusiast_Alex')}
            style={{ cursor: 'pointer' }}
          />
          <text x="650" y="220" fill="#facc15" fontSize="12" textAnchor="middle" className="user-label">Alex</text>
          
          {/* Graham */}
          <circle 
            cx="650" 
            cy="350" 
            r="18" 
            fill="#64748b" 
            stroke="#475569" 
            strokeWidth="2" 
            className={`agent-node ${
              flashingNodes.sender === 'Graham' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Graham') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'ValueInvestor_Graham')}
            style={{ cursor: 'pointer' }}
          />
          <text x="650" y="370" fill="#64748b" fontSize="12" textAnchor="middle" className="user-label">Graham</text>
          
          {/* Tom */}
          <circle 
            cx="650" 
            cy="500" 
            r="15" 
            fill="#3b82f6" 
            stroke="#2563eb" 
            strokeWidth="2" 
            className={`agent-node ${
              flashingNodes.sender === 'Tom' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Tom') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'Regulator_Tom')}
            style={{ cursor: 'pointer' }}
          />
          <text x="650" y="520" fill="#3b82f6" fontSize="12" textAnchor="middle" className="user-label">Tom</text>
          
          {/* Vivian */}
          <circle 
            cx="400" 
            cy="620" 
            r="10" 
            fill="#64748b" 
            stroke="#475569" 
            strokeWidth="2" 
            className={`agent-node ${
              flashingNodes.sender === 'Vivian' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Vivian') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'ArtStudent_Vivian')}
            style={{ cursor: 'pointer' }}
          />
          <text x="400" y="640" fill="#64748b" fontSize="12" textAnchor="middle" className="user-label">Vivian</text>
          
          {/* Intern */}
          <circle 
            cx="500" 
            cy="620" 
            r="8" 
            fill="#facc15" 
            stroke="#eab308" 
            strokeWidth="2" 
            className={`agent-node ${
              flashingNodes.sender === 'Intern' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Intern') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'SocialMedia_Intern')}
            style={{ cursor: 'pointer' }}
          />
          <text x="500" y="630" fill="#facc15" fontSize="12" textAnchor="middle" className="user-label">Intern</text>
          
          {/* Dev */}
          <circle 
            cx="200" 
            cy="600" 
            r="14" 
            fill="#f87171" 
            stroke="#ef4444" 
            strokeWidth="2" 
            className={`agent-node ${
              flashingNodes.sender === 'Dev' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Dev') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'Cynical_Dev')}
            style={{ cursor: 'pointer' }}
          />
          <text x="200" y="620" fill="#f87171" fontSize="12" textAnchor="middle" className="user-label">Dev</text>
          
          {/* Philosopher */}
          <circle 
            cx="150" 
            cy="500" 
            r="16" 
            fill="#f87171" 
            stroke="#ef4444" 
            strokeWidth="2" 
            className={`agent-node ${
              flashingNodes.sender === 'Philosopher' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Philosopher') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'Ethical_Philosopher')}
            style={{ cursor: 'pointer' }}
          />
          <text x="150" y="520" fill="#f87171" fontSize="12" textAnchor="middle" className="user-label">Philosopher</text>
        </g>

        {/* 所有消息流动路径 */}
        <g id="message-flows">
          {allPaths.map((path, index) => {
            // 从路径ID中提取from和to信息
            const pathParts = path.id.split('-');
            let from = '';
            let to = '';
            
            if (path.id.includes('sender-to-platform')) {
              from = pathParts[3]; // sender (after 'sender-to-platform')
              to = pathParts[4]; // platform
            } else if (path.id.includes('platform-to-user')) {
              from = pathParts[3]; // platform (after 'platform-to-user')
              to = pathParts[4]; // user
            }
            
            // 计算边的中点坐标用于显示编号
            const pathData = path.d.split(' ');
            const startX = parseFloat(pathData[1]);
            const startY = parseFloat(pathData[2]);
            const endX = parseFloat(pathData[4]);
            const endY = parseFloat(pathData[5]);
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            return (
              <g key={path.id}>
                <path
                  className={`animated-flow ${path.isActive ? 'animate-flow' : ''}`}
                  d={path.d}
                  stroke={path.stroke}
                  style={{ 
                    animationDelay: `${path.delay / 1000}s`,
                    strokeWidth: '3'
                  }}
                  fill="none"
                />
                {/* 边编号标注 */}
                <circle
                  cx={midX}
                  cy={midY}
                  r="12"
                  fill="#1890ff"
                  stroke="white"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    console.log('Edge number clicked:', index + 1, from, to);
                    handleEdgeClick(from, to);
                  }}
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  style={{ cursor: 'pointer', pointerEvents: 'none' }}
                >
                  {index + 1}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      
      {/* 节点详情弹窗 */}
      <NodeDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        nodeData={selectedNode}
        nodeType={selectedNodeType}
      />
      
      {/* 边详情弹窗 */}
      <EdgeDetailModal
        visible={edgeModalVisible}
        onClose={handleCloseEdgeModal}
        edgeData={selectedEdge}
      />
    </div>
  );
};

export default NetworkVisualization;