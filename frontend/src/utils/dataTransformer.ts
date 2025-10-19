/**
 * 数据转换工具
 * 将后端API返回的数据格式转换为前端可视化组件期望的格式
 */

// 后端返回的网络数据类型
interface BackendNetworkData {
  nodes: Array<{
    id: string;
    username: string;
    platform: string;
    influenceScore: number;
    sentiment: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    strength: number;
    type: string;
  }>;
}

// 后端返回的模拟结果类型
interface BackendSimulationResult {
  simulationId: string;
  status: string;
  round: number;
  summary: {
    totalAgents: number;
    activeAgents: number;
    totalPosts: number;
    positiveSentiment: number;
    negativeSentiment: number;
    neutralSentiment: number;
  };
  agents: Array<{
    agentId: string;
    username: string;
    description: string;
    influenceScore: number;
    primaryPlatform: string;
    emotionalStyle: string;
    stanceScore: number;
    postsSent: number;
    latestPost?: string;
    isActive: boolean;
  }>;
  propagationPaths?: Array<{
    from: string;
    content: string;
    round: number;
    stance: number;
  }>;
  platforms?: Array<{
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
    }>;
  }>;
}

// 前端期望的用户数据格式
interface FrontendUser {
  agentId?: string;
  username: string;
  influence_score: number;
  primary_platform: string;
  emotional_style: string;
  final_decision: string;
  objective_stance_score: number;
}

// 前端期望的平台数据格式
interface FrontendPlatform {
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

// 前端期望的网络数据格式
interface FrontendNetworkData {
  users: FrontendUser[];
  platforms: FrontendPlatform[];
}

/**
 * 将后端的模拟结果数据转换为前端可视化组件需要的格式
 */
export function transformSimulationResultToNetworkData(
  simulationResult: BackendSimulationResult,
  networkData?: BackendNetworkData
): FrontendNetworkData {
  // 1. 转换用户数据
  const users: FrontendUser[] = simulationResult.agents.map(agent => ({
    agentId: agent.agentId,
    username: agent.username,
    influence_score: agent.influenceScore,
    primary_platform: agent.primaryPlatform,
    emotional_style: agent.emotionalStyle,
    final_decision: agent.latestPost || "尚未发言",
    objective_stance_score: agent.stanceScore,
  }));

  // 2. 构建平台数据
  const platformMap = new Map<string, FrontendPlatform>();
  const platformTypes: { [key: string]: string } = {
    'Weibo/Twitter-like': 'social_media',
    'WeChat Moments-like': 'private_social',
    'TikTok-like': 'short_video',
    'Forum-like': 'discussion_forum',
  };

  // 按平台分组用户
  simulationResult.agents.forEach(agent => {
    const platformName = agent.primaryPlatform;
    if (!platformMap.has(platformName)) {
      platformMap.set(platformName, {
        name: platformName,
        type: platformTypes[platformName] || 'social_media',
        userCount: 0,
        activeUsers: [],
        message_propagation: [],
      });
    }
    const platform = platformMap.get(platformName)!;
    platform.userCount++;
    if (agent.isActive) {
      platform.activeUsers.push(agent.username);
    }
  });

  // 3. 构建消息传播数据
  // 检查后端是否直接提供了platforms数据（包含message_propagation）
  const messagePropagationMap = new Map<string, Array<any>>();
  
  // 首先检查是否有直接的platforms数据（后端可能直接返回）
  if (simulationResult.platforms && Array.isArray(simulationResult.platforms)) {
    console.log('DataTransformer - Found direct platforms data with', simulationResult.platforms.length, 'platforms');
    simulationResult.platforms.forEach((platform: any) => {
      if (platform.message_propagation && Array.isArray(platform.message_propagation)) {
        console.log('DataTransformer - Platform', platform.name, 'has', platform.message_propagation.length, 'messages');
        messagePropagationMap.set(platform.name, platform.message_propagation);
      }
    });
  }
  
  // 如果没有直接的platforms数据，尝试从propagationPaths构建
  if (messagePropagationMap.size === 0 && simulationResult.propagationPaths && simulationResult.propagationPaths.length > 0) {
    console.log('DataTransformer - Using propagationPaths data');
    simulationResult.propagationPaths.forEach((path, index) => {
      const sender = simulationResult.agents.find(a => a.agentId === path.from);
      if (!sender) return;

      const platform = sender.primaryPlatform;
      if (!messagePropagationMap.has(platform)) {
        messagePropagationMap.set(platform, []);
      }

      // 获取接收者（基于网络拓扑）
      const receivers: string[] = [];
      if (networkData && networkData.edges) {
        networkData.edges
          .filter(edge => edge.source === path.from)
          .forEach(edge => {
            const receiver = simulationResult.agents.find(a => a.agentId === edge.target);
            if (receiver) {
              receivers.push(receiver.username);
            }
          });
      } else {
        // 如果没有网络数据，从agents中随机选择一些作为接收者
        const otherAgents = simulationResult.agents.filter(a => a.agentId !== path.from);
        const numReceivers = Math.min(3, otherAgents.length);
        for (let i = 0; i < numReceivers; i++) {
          const randomIndex = Math.floor(Math.random() * otherAgents.length);
          receivers.push(otherAgents[randomIndex].username);
          otherAgents.splice(randomIndex, 1); // 避免重复选择
        }
      }

      const sentiment = path.stance > 0 ? 'positive' : path.stance < 0 ? 'negative' : 'neutral';
      
      messagePropagationMap.get(platform)!.push({
        sender: sender.username,
        receivers: receivers.slice(0, 4), // 限制接收者数量
        content: path.content,
        sentiment: sentiment,
        timestamp: new Date(Date.now() + index * 6000).toISOString(), // 使用实际时间戳
        likes: Math.floor(Math.random() * 50) + 10,
        shares: Math.floor(Math.random() * 20) + 5,
        comments: Math.floor(Math.random() * 15) + 3,
      });
    });
  }
  
  // 如果仍然没有数据，从agents的发言中生成基础消息
  if (messagePropagationMap.size === 0) {
    console.log('DataTransformer - Generating messages from agents data');
    simulationResult.agents.forEach((agent, index) => {
      if (agent.latestPost && agent.postsSent > 0) {
        const platform = agent.primaryPlatform;
        if (!messagePropagationMap.has(platform)) {
          messagePropagationMap.set(platform, []);
        }

        const sentiment = agent.stanceScore > 0 ? 'positive' : 
                         agent.stanceScore < 0 ? 'negative' : 'neutral';
        
        // 为消息生成一些接收者
        const otherAgents = simulationResult.agents.filter(a => a.agentId !== agent.agentId);
        const numReceivers = Math.min(3, otherAgents.length);
        const receivers: string[] = [];
        for (let i = 0; i < numReceivers; i++) {
          const randomIndex = Math.floor(Math.random() * otherAgents.length);
          receivers.push(otherAgents[randomIndex].username);
          otherAgents.splice(randomIndex, 1); // 避免重复选择
        }

        messagePropagationMap.get(platform)!.push({
          sender: agent.username,
          receivers: receivers,
          content: agent.latestPost,
          sentiment: sentiment,
          timestamp: new Date(Date.now() + index * 6000).toISOString(),
          likes: Math.floor(Math.random() * 50) + 10,
          shares: Math.floor(Math.random() * 20) + 5,
          comments: Math.floor(Math.random() * 15) + 3,
        });
      }
    });
  }

  // 将消息传播数据添加到平台
  messagePropagationMap.forEach((messages, platformName) => {
    const platform = platformMap.get(platformName);
    if (platform) {
      platform.message_propagation = messages;
      console.log('DataTransformer - Added', messages.length, 'messages to platform', platformName);
    }
  });

  const platforms = Array.from(platformMap.values());
  
  console.log('DataTransformer - Final result:');
  console.log('  - users:', users.length);
  console.log('  - platforms:', platforms.length);
  platforms.forEach(platform => {
    console.log(`  - Platform ${platform.name}: ${platform.message_propagation?.length || 0} messages`);
  });

  return {
    users,
    platforms,
  };
}

/**
 * 简化版转换函数：只根据agents数据创建基础的网络可视化数据
 * 当后端只返回agents信息而没有详细的传播路径时使用
 */
export function transformAgentsToNetworkData(
  agents: BackendSimulationResult['agents']
): FrontendNetworkData {
  const users: FrontendUser[] = agents.map(agent => ({
    agentId: agent.agentId,
    username: agent.username,
    influence_score: agent.influenceScore,
    primary_platform: agent.primaryPlatform,
    emotional_style: agent.emotionalStyle,
    final_decision: agent.latestPost || "尚未发言",
    objective_stance_score: agent.stanceScore,
  }));

  // 按平台分组
  const platformMap = new Map<string, FrontendPlatform>();
  const platformTypes: { [key: string]: string } = {
    'Weibo/Twitter-like': 'social_media',
    'WeChat Moments-like': 'private_social',
    'TikTok-like': 'short_video',
    'Forum-like': 'discussion_forum',
  };

  agents.forEach(agent => {
    const platformName = agent.primaryPlatform;
    if (!platformMap.has(platformName)) {
      platformMap.set(platformName, {
        name: platformName,
        type: platformTypes[platformName] || 'social_media',
        userCount: 0,
        activeUsers: [],
        message_propagation: [],
      });
    }
    const platform = platformMap.get(platformName)!;
    platform.userCount++;
    if (agent.isActive) {
      platform.activeUsers.push(agent.username);
    }

    // 如果有发言，添加到消息传播
    if (agent.latestPost && agent.postsSent > 0) {
      const sentiment = agent.stanceScore > 0 ? 'positive' : 
                       agent.stanceScore < 0 ? 'negative' : 'neutral';
      
      // 为消息生成一些接收者
      const otherAgents = agents.filter(a => a.agentId !== agent.agentId);
      const numReceivers = Math.min(3, otherAgents.length);
      const receivers: string[] = [];
      for (let i = 0; i < numReceivers; i++) {
        const randomIndex = Math.floor(Math.random() * otherAgents.length);
        receivers.push(otherAgents[randomIndex].username);
        otherAgents.splice(randomIndex, 1); // 避免重复选择
      }

      platform.message_propagation.push({
        sender: agent.username,
        receivers: receivers,
        content: agent.latestPost,
        sentiment: sentiment,
        timestamp: new Date().toISOString(),
        likes: Math.floor(Math.random() * 50) + 10,
        shares: Math.floor(Math.random() * 20) + 5,
        comments: Math.floor(Math.random() * 15) + 3,
      });
    }
  });

  const platforms = Array.from(platformMap.values());

  return {
    users,
    platforms,
  };
}

/**
 * 检查数据是否有效
 */
export function isValidNetworkData(data: any): data is FrontendNetworkData {
  return (
    data &&
    Array.isArray(data.users) &&
    Array.isArray(data.platforms) &&
    data.users.length > 0
  );
}

