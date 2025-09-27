/**
 * 静态数据模拟服务
 * 在后端API未完成时提供模拟数据
 */

import { Agent, AgentPost, SimulationResult, SimulationConfig, SimulationRound, HistoricalCase } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// 基于后端personas.csv的模拟Agent数据
export const mockAgents: Agent[] = [
  {
    id: 'agent_0',
    persona: {
      username: 'MarketingPro_Serena',
      description: '嗅觉敏锐的市场营销专家，擅长引爆话题。',
      emotional_style: '激情支持型',
      influence_score: 90,
      primary_platform: 'Weibo/Twitter-like',
      llm_model: 'gpt-4o-mini',
      llm_temperature: 0.8,
    },
    stance: 0.7,
    is_active: true,
    memories: [
      { id: 'mem_1', content: '我对AI预测股市这个话题很感兴趣', timestamp: '2024-01-01T10:00:00Z' },
      { id: 'mem_2', content: '这可能是下一个营销热点', timestamp: '2024-01-01T10:05:00Z' },
    ],
    recent_posts: [],
    last_cognitive_summary: '这是一个很有潜力的营销机会',
  },
  {
    id: 'agent_1',
    persona: {
      username: 'Skeptical_Journalist',
      description: '追求真相的调查记者，习惯于公开质疑。',
      emotional_style: '尖锐批评型',
      influence_score: 80,
      primary_platform: 'Weibo/Twitter-like',
      llm_model: 'gemini-2.5-flash',
      llm_temperature: 0.7,
    },
    stance: -0.8,
    is_active: true,
    memories: [
      { id: 'mem_3', content: '需要深入调查这个公司的背景', timestamp: '2024-01-01T10:01:00Z' },
    ],
    recent_posts: [],
    last_cognitive_summary: '这种声称过于夸张，需要质疑',
  },
  {
    id: 'agent_2',
    persona: {
      username: 'TechBro_Elon',
      description: '对前沿科技极度痴迷的工程师，喜欢公开布道。',
      emotional_style: '激情支持型',
      influence_score: 85,
      primary_platform: 'Weibo/Twitter-like',
      llm_model: 'gpt-4o-mini',
      llm_temperature: 0.9,
    },
    stance: 0.9,
    is_active: true,
    memories: [
      { id: 'mem_4', content: 'AI技术正在改变一切', timestamp: '2024-01-01T10:02:00Z' },
    ],
    recent_posts: [],
    last_cognitive_summary: '这是AI技术的重大突破',
  },
  {
    id: 'agent_3',
    persona: {
      username: 'ValueInvestor_Graham',
      description: '经验丰富的价值投资者，只在自己的圈子分享深度见解。',
      emotional_style: '尖锐批评型',
      influence_score: 70,
      primary_platform: 'WeChat Moments-like',
      llm_model: 'gpt-4o-mini',
      llm_temperature: 0.8,
    },
    stance: -0.3,
    is_active: true,
    memories: [],
    recent_posts: [],
    last_cognitive_summary: '需要谨慎评估投资价值',
  },
  {
    id: 'agent_4',
    persona: {
      username: 'Regulator_Tom',
      description: '在监管机构工作的中年人，言辞谨慎，只在工作相关的圈子发言。',
      emotional_style: '冷静分析型',
      influence_score: 60,
      primary_platform: 'WeChat Moments-like',
      llm_model: 'gpt-4o-mini',
      llm_temperature: 0.8,
    },
    stance: -0.1,
    is_active: true,
    memories: [],
    recent_posts: [],
    last_cognitive_summary: '需要关注监管合规问题',
  },
  {
    id: 'agent_5',
    persona: {
      username: 'Newbie_Investor',
      description: '刚入市的年轻人，喜欢在朋友圈分享跟风信息。',
      emotional_style: '激情支持型',
      influence_score: 20,
      primary_platform: 'WeChat Moments-like',
      llm_model: 'gemini-2.5-flash',
      llm_temperature: 0.7,
    },
    stance: 0.5,
    is_active: true,
    memories: [],
    recent_posts: [],
    last_cognitive_summary: '听起来很厉害，想了解更多',
  },
  {
    id: 'agent_6',
    persona: {
      username: 'ArtStudent_Vivian',
      description: '艺术系学生，擅长用图片和短视频表达感性思考。',
      emotional_style: '幽默讽刺型',
      influence_score: 40,
      primary_platform: 'TikTok-like',
      llm_model: 'gpt-4o-mini',
      llm_temperature: 0.8,
    },
    stance: 0.2,
    is_active: true,
    memories: [],
    recent_posts: [],
    last_cognitive_summary: '这个话题很有趣，可以做成创意内容',
  },
  {
    id: 'agent_7',
    persona: {
      username: 'SocialMedia_Intern',
      description: '社交媒体实习生，追逐网络热梗，擅长二次创作。',
      emotional_style: '幽默讽刺型',
      influence_score: 35,
      primary_platform: 'TikTok-like',
      llm_model: 'gemini-2.5-flash',
      llm_temperature: 0.9,
    },
    stance: 0.1,
    is_active: true,
    memories: [],
    recent_posts: [],
    last_cognitive_summary: '这个梗可以火',
  },
  {
    id: 'agent_8',
    persona: {
      username: 'Cynical_Dev',
      description: '看透一切的资深程序员，只在开发者社区吐槽。',
      emotional_style: '幽默讽刺型',
      influence_score: 55,
      primary_platform: 'Forum-like',
      llm_model: 'gpt-4o-mini',
      llm_temperature: 0.8,
    },
    stance: -0.6,
    is_active: true,
    memories: [],
    recent_posts: [],
    last_cognitive_summary: '又是一个过度包装的AI项目',
  },
  {
    id: 'agent_9',
    persona: {
      username: 'Ethical_Philosopher',
      description: '大学哲学教授，习惯在学术论坛进行深度思辨。',
      emotional_style: '冷静分析型',
      influence_score: 65,
      primary_platform: 'Forum-like',
      llm_model: 'gpt-4o-mini',
      llm_temperature: 0.8,
    },
    stance: 0.0,
    is_active: true,
    memories: [],
    recent_posts: [],
    last_cognitive_summary: '需要从伦理角度深入思考',
  },
];

// 生成模拟的Agent帖子
export const generateMockPosts = (agents: Agent[]): AgentPost[] => {
  const posts: AgentPost[] = [];
  
  agents.forEach(agent => {
    if (Math.random() > 0.3) { // 70%概率发帖
      const post: AgentPost = {
        id: uuidv4(),
        author_id: agent.id,
        content: generatePostContent(agent, 1),
        round: 1,
        timestamp: new Date().toISOString(),
        platform: agent.persona.primary_platform,
        internal_monologue: generateInternalMonologue(agent),
        cognitive_summary: agent.last_cognitive_summary,
      };
      posts.push(post);
    }
  });
  
  return posts;
};

// 生成帖子内容
const generatePostContent = (agent: Agent, _round: number): string => {
  const templates = {
    'Weibo/Twitter-like': [
      `#AI预测股市# 这技术太牛了！{stance_opinion}`,
      `刚看到这个新闻，{stance_opinion} #科技前沿#`,
      `{stance_opinion} 期待看到更多细节！`,
    ],
    'WeChat Moments-like': [
      `今天看到个有趣的消息：{stance_opinion}`,
      `{stance_opinion} 大家怎么看？`,
      `{stance_opinion} 感觉这个方向很有前景`,
    ],
    'TikTok-like': [
      `{stance_opinion} 🚀 #AI #股市预测`,
      `{stance_opinion} 这个技术绝了！✨`,
      `{stance_opinion} 必须关注！👀`,
    ],
    'Forum-like': [
      `从技术角度分析：{stance_opinion}`,
      `{stance_opinion} 欢迎大家讨论`,
      `{stance_opinion} 需要更多数据支撑`,
    ],
  };
  
  const stanceOpinions = {
    positive: ['非常看好这个技术', '这可能是革命性的突破', '值得深入研究'],
    negative: ['感觉不太靠谱', '需要更多证据', '过于夸大了'],
    neutral: ['需要观察一段时间', '保持谨慎态度', '让时间来验证'],
  };
  
  const stance = agent.stance;
  let stanceType: 'positive' | 'negative' | 'neutral';
  if (stance > 0.3) stanceType = 'positive';
  else if (stance < -0.3) stanceType = 'negative';
  else stanceType = 'neutral';
  
  const template = templates[agent.persona.primary_platform][Math.floor(Math.random() * templates[agent.persona.primary_platform].length)];
  const stanceOpinion = stanceOpinions[stanceType][Math.floor(Math.random() * stanceOpinions[stanceType].length)];
  
  return template.replace('{stance_opinion}', stanceOpinion);
};

// 生成内心独白
const generateInternalMonologue = (agent: Agent): string => {
  const monologues = [
    `作为${agent.persona.username}，我对这个话题的看法是...`,
    `考虑到我的背景和经验，我认为...`,
    `这让我想起了之前类似的案例...`,
    `从我的专业角度来看...`,
  ];
  
  return monologues[Math.floor(Math.random() * monologues.length)];
};

// 生成模拟轮次
export const generateMockRounds = (numRounds: number, agents: Agent[]): SimulationRound[] => {
  const rounds: SimulationRound[] = [];
  
  for (let i = 0; i < numRounds; i++) {
    const posts = generateMockPosts(agents);
    const activeAgents = agents.filter(agent => agent.is_active).map(agent => agent.id);
    
    const round: SimulationRound = {
      round_number: i + 1,
      posts,
      active_agents: activeAgents,
      network_changes: [],
      timestamp: new Date().toISOString(),
    };
    
    rounds.push(round);
  }
  
  return rounds;
};

// 生成完整的模拟结果
export const generateMockSimulationResult = (config: SimulationConfig): SimulationResult => {
  const agents = [...mockAgents];
  const rounds = generateMockRounds(config.num_rounds, agents);
  
  return {
    simulation_id: uuidv4(),
    status: 'completed',
    config,
    rounds,
    agents: agents.reduce((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {} as Record<string, Agent>),
    final_report: generateMockReport(),
    network_graph: {
      nodes: agents.map(agent => ({
        id: agent.id,
        agent,
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        isHighlighted: false,
        isSelected: false,
      })),
      edges: generateMockEdges(agents),
    },
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  };
};

// 生成模拟边
const generateMockEdges = (agents: Agent[]) => {
  const edges: Array<{source: string; target: string; tie_strength: 'mutual' | 'weak'; isActive: boolean}> = [];
  
  for (let i = 0; i < agents.length; i++) {
    for (let j = 0; j < agents.length; j++) {
      if (i !== j && Math.random() > 0.7) {
        edges.push({
          source: agents[i].id,
          target: agents[j].id,
          tie_strength: Math.random() > 0.5 ? 'mutual' : 'weak',
          isActive: false,
        });
      }
    }
  }
  
  return edges;
};

// 生成模拟报告
const generateMockReport = (): string => {
  return `
# 舆情分析报告

## 核心议题
本次讨论围绕"AI预测股市"这一新兴技术展开，涉及技术可行性、市场前景、监管合规等多个维度。

## 主要观点阵营
1. **支持派** (40%): 主要由科技爱好者和营销专家组成，认为这是技术创新的重要突破
2. **质疑派** (35%): 以记者和投资者为代表，对技术真实性持谨慎态度
3. **观望派** (25%): 包括监管者和普通用户，等待更多证据

## 关键影响者
- **MarketingPro_Serena**: 积极推广，影响力90分
- **Skeptical_Journalist**: 持续质疑，影响力80分
- **TechBro_Elon**: 技术布道者，影响力85分

## 舆论演变
第1轮：话题引爆，观点分化明显
第2轮：深度讨论，质疑声音增多
第3轮：趋于理性，等待验证

## 最终共识
未形成明确共识，但普遍认为需要更多实际案例验证技术可行性。
  `.trim();
};

// 历史案例数据
export const mockHistoricalCases: HistoricalCase[] = [
  {
    id: 'case_1',
    title: '某科技公司AI产品争议事件',
    description: '一家科技公司发布AI产品后遭遇用户隐私泄露质疑',
    category: '隐私争议',
    industry: '科技',
    event_date: '2023-06-15',
    real_pr_strategy: '公开道歉+技术改进+第三方审计',
    real_outcome: '成功挽回声誉，用户增长15%',
    real_timeline: [
      { date: '2023-06-15', event: '事件爆发', description: '用户隐私泄露事件被曝光' },
      { date: '2023-06-16', event: '官方回应', description: '公司发布道歉声明' },
      { date: '2023-06-20', event: '技术改进', description: '推出新的隐私保护措施' },
    ],
    real_metrics: {
      sentiment_score: 0.3,
      reach_count: 1000000,
      engagement_rate: 0.12,
      crisis_resolution_time: 120,
    },
  },
  // 可以添加更多案例...
];
