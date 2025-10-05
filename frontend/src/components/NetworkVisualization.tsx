import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import NodeDetailModal from './NodeDetailModal';
import MessageNotification from './MessageNotification';
import MessageHistoryModal from './MessageHistoryModal';
import './NetworkVisualization.css';

interface User {
  username: string;
  influence_score: number;
  primary_platform: string;
  emotional_style: string;
  final_decision: string;
  objective_stance_score?: number;
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
  message_flow?: Array<{
    from: string;
    to: string[];
    timestamp: string;
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
  const [animationStartTime, setAnimationStartTime] = useState<number | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); // 用于强制重新渲染
  
  // 节点详情弹窗状态
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<'user' | 'platform' | null>(null);

  // 消息历史弹窗状态
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);

  // 消息传播步骤定义 - 以消息为主体，每个消息6秒，包含具体内容
  const messageSteps = React.useMemo(() => [
    // 消息1: Serena 发表消息到 Weibo，传播到其他用户
    { 
      id: 'message1',
      type: 'message_flow', 
      sender: 'Serena', 
      platform: 'Weibo', 
      receivers: ['Journalist', 'Elon', 'Graham', 'Vivian'],
      content: '这个AI产品代表了技术发展的未来方向，我们应该拥抱变化，而不是恐惧。任何新技术都会面临质疑，这是正常的。',
      delay: 0,
      duration: 6000
    },
    // 消息2: Journalist 发表消息到 Weibo，传播到其他用户
    { 
      id: 'message2',
      type: 'message_flow', 
      sender: 'Journalist', 
      platform: 'Weibo', 
      receivers: ['Serena', 'Elon', 'Tom', 'Dev'],
      content: '科技公司必须对用户数据负责，我们需要更多的透明度和监管。不能以创新为名忽视用户权益，这个AI产品的隐私问题需要深入调查。',
      delay: 6000,
      duration: 6000
    },
    // 消息3: Elon 发表消息到 Weibo，传播到其他用户
    { 
      id: 'message3',
      type: 'message_flow', 
      sender: 'Elon', 
      platform: 'Weibo', 
      receivers: ['Serena', 'Graham', 'Philosopher'],
      content: 'AI技术是人类的未来，我们应该支持技术创新。任何技术都有风险，但收益更大，这个AI产品虽然存在争议，但技术本身是先进的。',
      delay: 12000,
      duration: 6000
    },
    // 消息4: Alex 发表消息到 Weibo，传播到其他用户
    { 
      id: 'message4',
      type: 'message_flow', 
      sender: 'Alex', 
      platform: 'Weibo', 
      receivers: [],
      content: '这个AI产品虽然存在争议，但技术本身是先进的。我们应该支持技术创新，而不是因为争议就否定它。',
      delay: 18000,
      duration: 6000
    },
    // 消息5: Graham 发表消息到 WeChat，传播到其他用户
    { 
      id: 'message5',
      type: 'message_flow', 
      sender: 'Graham', 
      platform: 'WeChat', 
      receivers: ['Tom', 'Serena', 'Elon'],
      content: '需要看这个产品的商业模式是否可持续，监管风险可能影响投资回报。技术本身不是问题，问题在于应用，我需要评估这个产品是否具有长期投资价值。',
      delay: 24000,
      duration: 6000
    },
    // 消息6: Tom 发表消息到 WeChat，传播到其他用户
    { 
      id: 'message6',
      type: 'message_flow', 
      sender: 'Tom', 
      platform: 'WeChat', 
      receivers: ['Graham', 'Journalist'],
      content: '需要确保产品符合现有法规，监管框架需要跟上技术发展。平衡创新和风险很重要，我需要客观评估这个AI产品的合规性。',
      delay: 30000,
      duration: 6000
    },
    // 消息7: Vivian 发表消息到 TikTok，传播到其他用户
    { 
      id: 'message7',
      type: 'message_flow', 
      sender: 'Vivian', 
      platform: 'TikTok', 
      receivers: ['Intern', 'Serena', 'Elon'],
      content: 'AI可能会改变艺术创作方式，但也要考虑艺术的人文价值。技术应该服务于创意，而不是替代，AI可以辅助艺术创作，但不能替代人文精神。',
      delay: 36000,
      duration: 6000
    },
    // 消息8: Intern 发表消息到 TikTok，传播到其他用户
    { 
      id: 'message8',
      type: 'message_flow', 
      sender: 'Intern', 
      platform: 'TikTok', 
      receivers: [],
      content: '这个话题肯定会火，可以做成很多有趣的梗。AI产品争议性很强，适合传播，争议性话题总是更容易传播。',
      delay: 42000,
      duration: 6000
    },
    // 消息9: Dev 发表消息到 Forum，传播到其他用户
    { 
      id: 'message9',
      type: 'message_flow', 
      sender: 'Dev', 
      platform: 'Forum', 
      receivers: ['Philosopher', 'Serena', 'Journalist', 'Graham'],
      content: '又是一个被过度炒作的AI产品，技术本身没问题，但营销太过了。用户隐私问题确实需要重视，但很多公司为了商业利益而忽视这些问题。',
      delay: 48000,
      duration: 6000
    },
    // 消息10: Philosopher 发表消息到 Forum，传播到其他用户
    { 
      id: 'message10',
      type: 'message_flow', 
      sender: 'Philosopher', 
      platform: 'Forum', 
      receivers: ['Dev', 'Elon', 'Graham', 'Tom'],
      content: '这涉及到AI伦理的根本问题，我们需要建立更完善的伦理框架。技术发展必须考虑道德责任，AI发展需要建立完善的伦理框架和道德边界。',
      delay: 54000,
      duration: 6000
    }
  ], []);

  // 获取用户坐标 - 优化为现代美学的不规则圆形分布
  const getUserCoordinates = (username: string) => {
    // 中心点坐标
    const centerX = 500;
    const centerY = 350;
    
    // 定义每个节点的半径和角度（微调角度避免三点一线）
    const nodeConfigs: { [key: string]: { radius: number; angle: number } } = {
      'Serena': { radius: 320, angle: 0.05 },           // 右侧，稍微上移
      'Journalist': { radius: 280, angle: 0.23 },       // 右上，半径稍小
      'Elon': { radius: 350, angle: 0.41 },             // 右上偏上，半径较大
      'Alex': { radius: 300, angle: 0.63 },             // 上侧，标准半径
      'Graham': { radius: 290, angle: 0.87 },           // 左上偏上，半径稍小
      'Tom': { radius: 330, angle: 1.12 },              // 左侧，半径稍大
      'Vivian': { radius: 310, angle: 1.35 },           // 左下偏下，半径较小
      'Intern': { radius: 290, angle: 1.58 },           // 下侧，标准半径
      'Dev': { radius: 340, angle: 1.82 },              // 右下偏下，半径较大
      'Philosopher': { radius: 275, angle: 1.95 }       // 右下，半径较小，修正角度避免重叠
    };
    
    const config = nodeConfigs[username];
    if (!config) {
      // 默认位置作为fallback
      return { x: centerX, y: centerY };
    }
    
    const x = centerX + config.radius * Math.cos(config.angle * Math.PI);
    const y = centerY + config.radius * Math.sin(config.angle * Math.PI);
    
    return { x, y };
  };

  // 获取平台坐标 - 集中在中心区域
  const getPlatformCoordinates = (platformName: string) => {
    const coordinates: { [key: string]: { x: number; y: number } } = {
      'Weibo': { x: 500, y: 250 }, // 右上
      'WeChat': { x: 600, y: 350 }, // 右下
      'TikTok': { x: 500, y: 450 }, // 左下
      'Forum': { x: 400, y: 350 } // 左上
    };
    return coordinates[platformName];
  };

  // 根据objective_stance_score计算最终颜色 (-3到3，蓝红渐变)
  const getStanceColor = (stanceScore: number) => {
    // 将-3到3的范围映射到0到1
    const normalizedScore = (stanceScore + 3) / 6;
    
    // 蓝色(反对)到红色(支持)的渐变
    // 反对(-3): 蓝色 #3B82F6
    // 中性(0): 灰色 #6B7280  
    // 支持(3): 红色 #EF4444
    
    if (normalizedScore <= 0.5) {
      // 从蓝色到灰色的渐变
      const t = normalizedScore * 2; // 0到1
      const r = Math.round(59 + (107 - 59) * t);
      const g = Math.round(130 + (114 - 130) * t);
      const b = Math.round(246 + (128 - 246) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // 从灰色到红色的渐变
      const t = (normalizedScore - 0.5) * 2; // 0到1
      const r = Math.round(107 + (239 - 107) * t);
      const g = Math.round(114 + (68 - 114) * t);
      const b = Math.round(128 + (68 - 128) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  // 计算总动画时长 - 根据消息数量动态计算
  const getTotalAnimationDuration = () => {
    // 优先使用实际的后端数据计算时长
    if (_users.length > 0 && _platforms.length > 0) {
      // 从平台数据中提取所有消息传播信息
      let maxEndTime = 0;
      let hasMessages = false;
      
      _platforms.forEach(platform => {
        // 检查不同的消息字段名
        const messages = platform.message_propagation || platform.message_flow || [];
        
        if (Array.isArray(messages) && messages.length > 0) {
          hasMessages = true;
          messages.forEach(message => {
            if (message.timestamp) {
              // 假设每条消息持续6秒
              const messageEndTime = new Date(message.timestamp).getTime() + 6000;
              maxEndTime = Math.max(maxEndTime, messageEndTime);
            }
          });
        }
      });
      
      if (hasMessages && maxEndTime > 0 && animationStartTime) {
        // 返回相对于动画开始时间的时长
        return maxEndTime - animationStartTime;
      }
    }
    
    // 如果没有后端数据，使用静态消息步骤
    if (messageSteps.length === 0) return 0;
    
    // 找到最后一条消息的结束时间
    const lastMessage = messageSteps[messageSteps.length - 1];
    const lastMessageEndTime = lastMessage.delay + lastMessage.duration;
    
    return lastMessageEndTime;
  };

  // 获取动态颜色 - 根据动画进度从初始颜色渐变到最终颜色
  const getDynamicColor = (username: string) => {
    const user = _users.find(u => {
      const usernameMapping: { [key: string]: string } = {
        'Serena': 'MarketingPro_Serena',
        'Journalist': 'Skeptical_Journalist',
        'Elon': 'TechBro_Elon',
        'Alex': 'TechEnthusiast_Alex',
        'Graham': 'ValueInvestor_Graham',
        'Tom': 'Regulator_Tom',
        'Vivian': 'ArtStudent_Vivian',
        'Intern': 'SocialMedia_Intern',
        'Dev': 'Cynical_Dev',
        'Philosopher': 'Ethical_Philosopher'
      };
      const fullUsername = usernameMapping[username] || username;
      return u.username === fullUsername;
    });

    if (!user || user.objective_stance_score === undefined || !animationStartTime) {
      return '#6B7280'; // 默认灰色
    }

    // 动态计算总动画时长
    const totalDuration = getTotalAnimationDuration();
    if (totalDuration === 0) return '#6B7280';

    // 计算动画进度 (0到1)
    const elapsed = Date.now() - animationStartTime;
    const progress = Math.min(elapsed / totalDuration, 1);

    // 初始颜色 (中性灰色)
    const initialColor = { r: 107, g: 114, b: 128 }; // #6B7280
    
    // 最终颜色
    const finalColorStr = getStanceColor(user.objective_stance_score);
    const finalColorMatch = finalColorStr.match(/rgb\((\d+), (\d+), (\d+)\)/);
    if (!finalColorMatch) return '#6B7280';
    
    const finalColor = {
      r: parseInt(finalColorMatch[1]),
      g: parseInt(finalColorMatch[2]),
      b: parseInt(finalColorMatch[3])
    };

    // 插值计算当前颜色
    const currentColor = {
      r: Math.round(initialColor.r + (finalColor.r - initialColor.r) * progress),
      g: Math.round(initialColor.g + (finalColor.g - initialColor.g) * progress),
      b: Math.round(initialColor.b + (finalColor.b - initialColor.b) * progress)
    };

    return `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
  };

  // 获取用户颜色 - 使用动态颜色变化
  const getUserColor = (username: string) => {
    return getDynamicColor(username);
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
      setAnimationStartTime(Date.now()); // 设置动画开始时间
      
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
      
      // 添加动画结束逻辑 - 在最后一条消息结束后停止动画
      if (messageSteps.length > 0) {
        const lastMessage = messageSteps[messageSteps.length - 1];
        const animationEndTime = lastMessage.delay + lastMessage.duration;
        
        const endTimer = setTimeout(() => {
          console.log('Animation sequence completed - stopping animation');
          setIsAnimating(false);
          setCurrentStep(-1); // 重置为-1表示没有当前消息
          setCurrentPhase(0);
          setAnimationCompleted(true); // 标记动画完成
        }, animationEndTime);
        
        timers.push(endTimer);
      }
      
      // 清理所有定时器
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    } else {
      // 重置状态
      setCurrentStep(0);
      setCurrentPhase(0);
      setIsAnimating(false);
      setAnimationStartTime(null);
      setAnimationCompleted(false);
    }
  }, [_users.length]);

  // 颜色动画定时器 - 每100ms更新一次颜色
  useEffect(() => {
    if (!animationStartTime) return;

    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 100); // 每100ms更新一次

    return () => clearInterval(interval);
  }, [animationStartTime]);

  // 获取所有静态路径（一开始就显示）
  const getAllStaticPaths = () => {
    const allPaths: Array<{
      id: string;
      d: string;
      stroke: string;
      delay: number;
      isActive: boolean;
      messageId: string;
    }> = [];

    // 用于跟踪已经显示过的通道
    const shownChannels = new Set<string>();
    const shownPlatformToUserChannels = new Set<string>();

    // 首先生成所有静态路径（不激活）
    messageSteps.forEach((step) => {
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
              isActive: false, // 初始状态不激活
              messageId: step.id
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
                  isActive: false, // 初始状态不激活
                  messageId: step.id
                });
                shownPlatformToUserChannels.add(platformToUserChannel);
              }
            }
          });
        }
      }
    });

    // 然后根据当前步骤激活相应的边
    if (currentStep >= 0 && currentStep < messageSteps.length) {
      const currentStepData = messageSteps[currentStep];
      if (currentStepData.type === 'message_flow') {
        const senderCoords = getUserCoordinates(currentStepData.sender);
        const platformCoords = getPlatformCoordinates(currentStepData.platform);
        
        if (senderCoords && platformCoords) {
          // 激活发送者到平台的路径
          const senderToPlatformId = `sender-to-platform-${currentStepData.sender}-${currentStepData.platform}`;
          const senderToPlatformPath = allPaths.find(path => path.id === senderToPlatformId);
          if (senderToPlatformPath) {
            senderToPlatformPath.isActive = true;
            senderToPlatformPath.messageId = currentStepData.id;
          }
          
          // 激活平台到接收者的路径
          currentStepData.receivers.forEach(receiver => {
            const platformToUserId = `platform-to-user-${currentStepData.platform}-${receiver}`;
            const platformToUserPath = allPaths.find(path => path.id === platformToUserId);
            if (platformToUserPath) {
              platformToUserPath.isActive = true;
              platformToUserPath.messageId = currentStepData.id;
            }
          });
        }
      }
    }

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

  // 处理消息历史弹窗
  const handleOpenHistoryModal = () => {
    setHistoryModalVisible(true);
  };

  const handleCloseHistoryModal = () => {
    setHistoryModalVisible(false);
  };

  // 获取所有路径和当前闪烁节点
  const allPaths = getAllStaticPaths();
  const flashingNodes = getCurrentFlashingNodes();

  // 使用forceUpdate来触发重新渲染
  void forceUpdate;



  return (
    <div className="network-visualization-container">
      <svg width="1000" height="700" viewBox="0 0 1000 700" className="network-svg">
        {/* 平台节点 */}
        <g id="platforms">
          {/* Weibo平台 */}
          <circle 
            cx={getPlatformCoordinates('Weibo').x} 
            cy={getPlatformCoordinates('Weibo').y} 
            r="30" 
            fill="#1DA1F2" 
            opacity="0.8" 
            className={`platform-node ${flashingNodes.platform === 'Weibo' ? 'flashing-platform' : ''}`}
            onClick={() => handleNodeClick('platform', 'Weibo/Twitter-like')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getPlatformCoordinates('Weibo').x} y={getPlatformCoordinates('Weibo').y + 50} fill="white" fontSize="14" textAnchor="middle" className="platform-label">Weibo</text>
          
          {/* WeChat平台 */}
          <circle 
            cx={getPlatformCoordinates('WeChat').x} 
            cy={getPlatformCoordinates('WeChat').y} 
            r="30" 
            fill="#07C160" 
            opacity="0.8" 
            className={`platform-node ${flashingNodes.platform === 'WeChat' ? 'flashing-platform' : ''}`}
            onClick={() => handleNodeClick('platform', 'WeChat Moments-like')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getPlatformCoordinates('WeChat').x} y={getPlatformCoordinates('WeChat').y + 50} fill="white" fontSize="14" textAnchor="middle" className="platform-label">WeChat</text>
          
          {/* TikTok平台 */}
          <circle 
            cx={getPlatformCoordinates('TikTok').x} 
            cy={getPlatformCoordinates('TikTok').y} 
            r="30" 
            fill="#FF6B9D" 
            opacity="0.8" 
            className={`platform-node ${flashingNodes.platform === 'TikTok' ? 'flashing-platform' : ''}`}
            onClick={() => handleNodeClick('platform', 'TikTok-like')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getPlatformCoordinates('TikTok').x} y={getPlatformCoordinates('TikTok').y + 50} fill="white" fontSize="14" textAnchor="middle" className="platform-label">TikTok</text>
          
          {/* Forum平台 */}
          <circle 
            cx={getPlatformCoordinates('Forum').x} 
            cy={getPlatformCoordinates('Forum').y} 
            r="30" 
            fill="#8B5CF6" 
            opacity="0.8" 
            className={`platform-node ${flashingNodes.platform === 'Forum' ? 'flashing-platform' : ''}`}
            onClick={() => handleNodeClick('platform', 'Forum-like')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getPlatformCoordinates('Forum').x} y={getPlatformCoordinates('Forum').y + 50} fill="white" fontSize="14" textAnchor="middle" className="platform-label">Forum</text>
        </g>

        {/* 用户节点 */}
        <g id="users">
          {/* Serena */}
          <circle 
            cx={getUserCoordinates('Serena').x} 
            cy={getUserCoordinates('Serena').y} 
            r="25" 
            fill={getUserColor('Serena')} 
            stroke={getUserColor('Serena')} 
            strokeWidth="3" 
            className={`agent-node stance-color-transition ${
              flashingNodes.sender === 'Serena' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Serena') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'MarketingPro_Serena')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getUserCoordinates('Serena').x} y={getUserCoordinates('Serena').y + 30} fill={getUserColor('Serena')} fontSize="12" textAnchor="middle" className="user-label stance-color-transition">Serena</text>
          
          {/* Journalist */}
          <circle 
            cx={getUserCoordinates('Journalist').x} 
            cy={getUserCoordinates('Journalist').y} 
            r="20" 
            fill={getUserColor('Journalist')} 
            stroke={getUserColor('Journalist')} 
            strokeWidth="3" 
            className={`agent-node stance-color-transition ${
              flashingNodes.sender === 'Journalist' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Journalist') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'Skeptical_Journalist')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getUserCoordinates('Journalist').x} y={getUserCoordinates('Journalist').y - 20} fill={getUserColor('Journalist')} fontSize="12" textAnchor="middle" className="user-label stance-color-transition">Journalist</text>
          
          {/* Elon */}
          <circle 
            cx={getUserCoordinates('Elon').x} 
            cy={getUserCoordinates('Elon').y} 
            r="22" 
            fill={getUserColor('Elon')} 
            stroke={getUserColor('Elon')} 
            strokeWidth="3" 
            className={`agent-node stance-color-transition ${
              flashingNodes.sender === 'Elon' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Elon') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'TechBro_Elon')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getUserCoordinates('Elon').x} y={getUserCoordinates('Elon').y + 30} fill={getUserColor('Elon')} fontSize="12" textAnchor="middle" className="user-label stance-color-transition">Elon</text>
          
          {/* Alex */}
          <circle 
            cx={getUserCoordinates('Alex').x} 
            cy={getUserCoordinates('Alex').y} 
            r="12" 
            fill={getUserColor('Alex')} 
            stroke={getUserColor('Alex')} 
            strokeWidth="2" 
            className={`agent-node stance-color-transition ${
              flashingNodes.sender === 'Alex' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Alex') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'TechEnthusiast_Alex')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getUserCoordinates('Alex').x} y={getUserCoordinates('Alex').y + 20} fill={getUserColor('Alex')} fontSize="12" textAnchor="middle" className="user-label stance-color-transition">Alex</text>
          
          {/* Graham */}
          <circle 
            cx={getUserCoordinates('Graham').x} 
            cy={getUserCoordinates('Graham').y} 
            r="18" 
            fill={getUserColor('Graham')} 
            stroke={getUserColor('Graham')} 
            strokeWidth="2" 
            className={`agent-node stance-color-transition ${
              flashingNodes.sender === 'Graham' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Graham') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'ValueInvestor_Graham')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getUserCoordinates('Graham').x} y={getUserCoordinates('Graham').y + 25} fill={getUserColor('Graham')} fontSize="12" textAnchor="middle" className="user-label stance-color-transition">Graham</text>
          
          {/* Tom */}
          <circle 
            cx={getUserCoordinates('Tom').x} 
            cy={getUserCoordinates('Tom').y} 
            r="15" 
            fill={getUserColor('Tom')} 
            stroke={getUserColor('Tom')} 
            strokeWidth="2" 
            className={`agent-node stance-color-transition ${
              flashingNodes.sender === 'Tom' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Tom') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'Regulator_Tom')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getUserCoordinates('Tom').x} y={getUserCoordinates('Tom').y + 20} fill={getUserColor('Tom')} fontSize="12" textAnchor="middle" className="user-label stance-color-transition">Tom</text>
          
          {/* Vivian */}
          <circle 
            cx={getUserCoordinates('Vivian').x} 
            cy={getUserCoordinates('Vivian').y} 
            r="10" 
            fill={getUserColor('Vivian')} 
            stroke={getUserColor('Vivian')} 
            strokeWidth="2" 
            className={`agent-node stance-color-transition ${
              flashingNodes.sender === 'Vivian' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Vivian') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'ArtStudent_Vivian')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getUserCoordinates('Vivian').x} y={getUserCoordinates('Vivian').y + 15} fill={getUserColor('Vivian')} fontSize="12" textAnchor="middle" className="user-label stance-color-transition">Vivian</text>
          
          {/* Intern */}
          <circle 
            cx={getUserCoordinates('Intern').x} 
            cy={getUserCoordinates('Intern').y} 
            r="8" 
            fill={getUserColor('Intern')} 
            stroke={getUserColor('Intern')} 
            strokeWidth="2" 
            className={`agent-node stance-color-transition ${
              flashingNodes.sender === 'Intern' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Intern') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'SocialMedia_Intern')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getUserCoordinates('Intern').x} y={getUserCoordinates('Intern').y + 15} fill={getUserColor('Intern')} fontSize="12" textAnchor="middle" className="user-label stance-color-transition">Intern</text>
          
          {/* Dev */}
          <circle 
            cx={getUserCoordinates('Dev').x} 
            cy={getUserCoordinates('Dev').y} 
            r="14" 
            fill={getUserColor('Dev')} 
            stroke={getUserColor('Dev')} 
            strokeWidth="2" 
            className={`agent-node stance-color-transition ${
              flashingNodes.sender === 'Dev' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Dev') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'Cynical_Dev')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getUserCoordinates('Dev').x} y={getUserCoordinates('Dev').y + 20} fill={getUserColor('Dev')} fontSize="12" textAnchor="middle" className="user-label stance-color-transition">Dev</text>
          
          {/* Philosopher */}
          <circle 
            cx={getUserCoordinates('Philosopher').x} 
            cy={getUserCoordinates('Philosopher').y} 
            r="16" 
            fill={getUserColor('Philosopher')} 
            stroke={getUserColor('Philosopher')} 
            strokeWidth="2" 
            className={`agent-node stance-color-transition ${
              flashingNodes.sender === 'Philosopher' ? 'flashing-sender' : 
              flashingNodes.receivers.includes('Philosopher') ? 'flashing-receiver' : ''
            }`}
            onClick={() => handleNodeClick('user', 'Ethical_Philosopher')}
            style={{ cursor: 'pointer' }}
          />
          <text x={getUserCoordinates('Philosopher').x} y={getUserCoordinates('Philosopher').y + 20} fill={getUserColor('Philosopher')} fontSize="12" textAnchor="middle" className="user-label stance-color-transition">Philosopher</text>
        </g>

        {/* 所有消息流动路径 */}
        <g id="message-flows">
          {allPaths.map((path) => (
            <path
              key={path.id}
              className={`animated-flow ${path.isActive ? 'animate-flow' : 'inactive-flow'}`}
              d={path.d}
              stroke={path.stroke}
              style={{ animationDelay: `${path.delay / 1000}s` }}
              fill="none"
            />
          ))}
        </g>
      </svg>
      
      {/* 节点详情弹窗 */}
      <NodeDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        nodeData={selectedNode}
        nodeType={selectedNodeType}
      />
      
      {/* 消息通知 */}
      <MessageNotification
        currentStep={currentStep}
        messageSteps={messageSteps}
      />

      {/* 消息历史按钮 - 只在动画完成后显示 */}
      {animationCompleted && (
        <div className="message-history-button-container">
          <Button
            type="primary"
            icon={<HistoryOutlined />}
            onClick={handleOpenHistoryModal}
            className="message-history-button"
            size="large"
          >
            View All Messages
          </Button>
        </div>
      )}

      {/* 消息历史弹窗 */}
      <MessageHistoryModal
        visible={historyModalVisible}
        onClose={handleCloseHistoryModal}
        messageSteps={messageSteps}
        currentStep={currentStep}
      />
    </div>
  );
};

export default NetworkVisualization;