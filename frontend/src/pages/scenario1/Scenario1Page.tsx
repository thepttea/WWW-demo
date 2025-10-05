import React, { useState } from 'react';
import { Typography, message } from 'antd';
import ConfigurationPanel from './ConfigurationPanel';
import VisualizationArea from './VisualizationArea';
import StrategyRefinementDrawer from '../../components/StrategyRefinementDrawer';
import Scenario1ResultsPageStatic from './Scenario1ResultsPageStatic';
import { SimulationConfig, SimulationParameters, SimulationState } from '../../types';
// import { useStartSimulation, useAddPRStrategy, useSimulationStatus, useSimulationResult, useGenerateReport, useResetSimulation } from '../../hooks/useApi';
import './Scenario1Page.css';

const { Title, Paragraph } = Typography;

const Scenario1Page: React.FC = () => {
  const [_simulationResult, setSimulationResult] = useState<any>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState | undefined>(undefined);
  const [confirmedStrategy, setConfirmedStrategy] = useState<string>('');
  const [_simulationId, setSimulationId] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);

  // API hooks - TODO: 后续集成后端API时取消注释
  // const startSimulationMutation = useStartSimulation();
  // const addPRStrategyMutation = useAddPRStrategy();
  // const generateReportMutation = useGenerateReport();
  // const resetSimulationMutation = useResetSimulation();
  // const { data: _simulationStatus } = useSimulationStatus(simulationId);
  // const { data: simulationResultData } = useSimulationResult(simulationId);

  const handleStartSimulation = async (config: SimulationConfig) => {
    if (!config.eventDescription?.trim()) {
      message.warning('Please enter event description first');
      return;
    }
    if (!config.strategy.content.trim()) {
      message.warning('Please enter your PR strategy first');
      return;
    }

    // 使用静态数据，立即设置模拟状态
        setSimulationState({
          isRunning: true,
          currentRound: 1,
          lockedConfig: {
            llm: config.llm,
            eventDescription: config.eventDescription || '',
          },
          strategyHistory: [{
            round: 1,
            strategy: config.strategy.content,
            timestamp: new Date(),
          }],
        });

        message.success('Simulation started successfully!');

    // TODO: 后续集成后端API时取消注释
    // try {
    //   const result = await startSimulationMutation.mutateAsync({
    //     initialTopic: config.eventDescription,
    //     llmModel: config.llm,
    //     simulationConfig: {
    //       agents: 10,
    //       num_rounds: 1,
    //       interactionProbability: 0.5,
    //       positiveResponseProbability: 0.3,
    //       negativeResponseProbability: 0.3,
    //       neutralResponseProbability: 0.4,
    //       initialPositiveSentiment: 0.2,
    //       initialNegativeSentiment: 0.6,
    //       initialNeutralSentiment: 0.2,
    //     },
    //     prStrategy: config.strategy.content,
    //   });

    //   if (result.success && result.data) {
    //     setSimulationId(result.data.simulationId);
    //   }
    // } catch (error) {
    //   console.error('Background API call failed:', error);
    // }
  };


  const handleStartNextRound = async (strategy: string) => {
    if (!strategy.trim()) {
      message.warning('Please enter next round strategy first');
      return;
    }

    // 使用静态数据，立即更新状态
        setSimulationState(prev => prev ? {
          ...prev,
          currentRound: prev.currentRound + 1,
          strategyHistory: [
            ...prev.strategyHistory,
            {
              round: prev.currentRound + 1,
              strategy: strategy,
              timestamp: new Date(),
            }
          ],
          nextRoundStrategy: strategy,
    } : undefined);

        message.success(`Round ${simulationState?.currentRound ? simulationState.currentRound + 1 : 2} simulation started!`);

    // TODO: 后续集成后端API时取消注释
    // if (!simulationId) {
    //   message.error('No active simulation found');
    //   return;
    // }

    // try {
    //   const result = await addPRStrategyMutation.mutateAsync({
    //     simulationId,
    //     prStrategy: strategy,
    //   });

    //   if (result.success && result.data) {
    //     // 更新模拟状态，将当前策略添加到历史中
    //     setSimulationState(prev => prev ? {
    //       ...prev,
    //       currentRound: prev.currentRound + 1,
    //       strategyHistory: [
    //         ...prev.strategyHistory,
    //         {
    //           round: prev.currentRound + 1,
    //           strategy: strategy,
    //           timestamp: new Date(),
    //         }
    //       ],
    //       nextRoundStrategy: strategy,
    //     } : undefined);

    //     message.success(`Round ${simulationState?.currentRound ? simulationState.currentRound + 1 : 2} simulation started!`);
    //   } else {
    //     message.error(result.error?.message || 'Failed to start next round');
    //   }
    // } catch (error) {
    //   message.error('Next round simulation failed. Please try again.');
    // }
  };

  const handleGenerateReport = async () => {
    // 使用静态数据，直接显示结果
        message.success('Report generated successfully!');
        setShowResults(true);

    // TODO: 后续集成后端API时取消注释
    // if (!simulationId) {
    //   message.warning('Please run a simulation first');
    //   return;
    // }

    // try {
    //   const result = await generateReportMutation.mutateAsync({
    //     simulationId,
    //     reportType: 'comprehensive',
    //     includeVisualizations: true,
    //   });

    //   if (result.success && result.data) {
    //     message.success('Report generated successfully!');
    //     // 显示结果页面
    //     setShowResults(true);
    //     console.log('Generated report:', result.data);
    //   } else {
    //     message.error(result.error?.message || 'Failed to generate report');
    //   }
    // } catch (error) {
    //   message.error('Failed to generate report');
    // }
  };

  const handleReset = async () => {
    // 使用静态数据，直接重置前端状态
      setSimulationResult(null);
    setSimulationState(undefined);
      setSimulationId(null);
      setConfirmedStrategy('');
      setIsDrawerVisible(false);
      setShowResults(false); // 隐藏结果页面
      
      message.success('Simulation reset successfully');

    // TODO: 后续集成后端API时取消注释
    // try {
    //   // 如果有活跃的模拟，先调用后端reset接口
    //   if (simulationId) {
    //     const result = await resetSimulationMutation.mutateAsync(simulationId);
    //     if (!result.success) {
    //       message.error(result.error?.message || 'Failed to reset simulation on server');
    //       return;
    //     }
    //   }

    //   // 重置所有前端状态
    //   setSimulationResult(null);
    //   setSimulationState(undefined);
    //   setSimulationId(null);
    //   setConfirmedStrategy('');
    //   setIsDrawerVisible(false);
    //   setShowResults(false); // 隐藏结果页面
      
    //   message.success('Simulation reset successfully');
    // } catch (error) {
    //   message.error('Failed to reset simulation');
    // }
  };

  const handleOpenDrawer = () => {
    setIsDrawerVisible(true);
  };

  const handleCloseResults = () => {
    setShowResults(false);
  };

  const handleBackToSimulation = () => {
    setShowResults(false);
  };

  const handleCloseDrawer = () => {
    setIsDrawerVisible(false);
  };

  const handleStrategyConfirm = (strategy: string, parameters: SimulationParameters) => {
    // 保存确认的策略
    setConfirmedStrategy(strategy);
    console.log('Confirmed strategy:', strategy);
    console.log('Parameters:', parameters);
    message.success('Strategy confirmed and parameters updated!');
  };

  // 如果显示结果页面，渲染结果组件
  if (showResults) {
    console.log('Scenario1Page - simulationResultData:', undefined);
    return (
      <Scenario1ResultsPageStatic
        simulationResults={undefined}
        onBack={handleBackToSimulation}
        onClose={handleCloseResults}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="scenario1-page">
      <div className="page-header">
        <Title level={2} className="page-title">
          EchoChamber: A Simulator for Public Relations Crisis Dynamics
        </Title>
        <Paragraph className="page-description">
          Analyze public opinion propagation through multi-agent llm-based simulation.
        </Paragraph>
      </div>

      <div className="page-content">
        <div className="content-grid">
          <div className="config-column">
            <ConfigurationPanel
              onStartSimulation={handleStartSimulation}
              onStartNextRound={handleStartNextRound}
              onGenerateReport={handleGenerateReport}
              onReset={handleReset}
              onOpenDrawer={handleOpenDrawer}
              simulationState={simulationState}
              confirmedStrategy={confirmedStrategy}
            />
          </div>
          <div className="visualization-column">
            <VisualizationArea
              isLoading={false}
              networkData={simulationState?.isRunning ? {
                users: [
                  {
                    username: "MarketingPro_Serena",
                    influence_score: 90,
                    primary_platform: "Weibo/Twitter-like",
                    emotional_style: "激情支持型",
                    final_decision: "这个AI产品代表了技术发展的未来方向，我们应该拥抱变化，而不是恐惧。",
                    objective_stance_score: 2
                  },
                  {
                    username: "Skeptical_Journalist", 
                    influence_score: 80,
                    primary_platform: "Weibo/Twitter-like",
                    emotional_style: "尖锐批评型",
                    final_decision: "科技公司必须对用户数据负责，我们需要更多的透明度和监管。",
                    objective_stance_score: -2
                  },
                  {
                    username: "TechBro_Elon",
                    influence_score: 85,
                    primary_platform: "Weibo/Twitter-like",
                    emotional_style: "激情支持型",
                    final_decision: "AI技术是人类的未来，我们应该支持技术创新。",
                    objective_stance_score: 3
                  },
                  {
                    username: "TechEnthusiast_Alex",
                    influence_score: 45,
                    primary_platform: "Weibo/Twitter-like",
                    emotional_style: "激情支持型",
                    final_decision: "这个AI产品虽然存在争议，但技术本身是先进的。",
                    objective_stance_score: 2
                  },
                  {
                    username: "ValueInvestor_Graham",
                    influence_score: 70,
                    primary_platform: "WeChat Moments-like",
                    emotional_style: "尖锐批评型",
                    final_decision: "需要看这个产品的商业模式是否可持续，监管风险可能影响投资回报。",
                    objective_stance_score: 0
                  },
                  {
                    username: "Regulator_Tom",
                    influence_score: 60,
                    primary_platform: "WeChat Moments-like",
                    emotional_style: "冷静分析型",
                    final_decision: "需要确保产品符合现有法规，监管框架需要跟上技术发展。",
                    objective_stance_score: 1
                  },
                  {
                    username: "ArtStudent_Vivian",
                    influence_score: 40,
                    primary_platform: "TikTok-like",
                    emotional_style: "幽默讽刺型",
                    final_decision: "AI可能会改变艺术创作方式，但也要考虑艺术的人文价值。",
                    objective_stance_score: 0
                  },
                  {
                    username: "SocialMedia_Intern",
                    influence_score: 35,
                    primary_platform: "TikTok-like",
                    emotional_style: "幽默讽刺型",
                    final_decision: "这个话题肯定会火，可以做成很多有趣的梗。",
                    objective_stance_score: 1
                  },
                  {
                    username: "Cynical_Dev",
                    influence_score: 55,
                    primary_platform: "Forum-like",
                    emotional_style: "幽默讽刺型",
                    final_decision: "又是一个被过度炒作的AI产品，技术本身没问题，但营销太过了。",
                    objective_stance_score: -1
                  },
                  {
                    username: "Ethical_Philosopher",
                    influence_score: 65,
                    primary_platform: "Forum-like",
                    emotional_style: "冷静分析型",
                    final_decision: "这涉及到AI伦理的根本问题，我们需要建立更完善的伦理框架。",
                    objective_stance_score: -1
                  }
                ],
                platforms: [
                  {
                    name: "Weibo/Twitter-like",
                    type: "social_media",
                    userCount: 4,
                    activeUsers: ["MarketingPro_Serena", "Skeptical_Journalist", "TechBro_Elon", "TechEnthusiast_Alex"],
                    message_propagation: [
                      {
                        sender: "MarketingPro_Serena",
                        receivers: ["Skeptical_Journalist", "TechBro_Elon", "ValueInvestor_Graham", "ArtStudent_Vivian"],
                        content: "这个AI产品代表了技术发展的未来方向，我们应该拥抱变化，而不是恐惧。",
                        sentiment: "positive",
                        timestamp: new Date().toISOString(),
                        likes: 45,
                        shares: 12,
                        comments: 8
                      },
                      {
                        sender: "Skeptical_Journalist",
                        receivers: ["MarketingPro_Serena", "TechBro_Elon", "Regulator_Tom", "Cynical_Dev"],
                        content: "科技公司必须对用户数据负责，我们需要更多的透明度和监管。",
                        sentiment: "negative",
                        timestamp: new Date(Date.now() + 6000).toISOString(),
                        likes: 38,
                        shares: 15,
                        comments: 12
                      },
                      {
                        sender: "TechBro_Elon",
                        receivers: ["MarketingPro_Serena", "ValueInvestor_Graham", "Ethical_Philosopher"],
                        content: "AI技术是人类的未来，我们应该支持技术创新。",
                        sentiment: "positive",
                        timestamp: new Date(Date.now() + 12000).toISOString(),
                        likes: 52,
                        shares: 18,
                        comments: 6
                      }
                    ]
                  },
                  {
                    name: "WeChat Moments-like",
                    type: "private_social", 
                    userCount: 2,
                    activeUsers: ["ValueInvestor_Graham", "Regulator_Tom"],
                    message_propagation: [
                      {
                        sender: "ValueInvestor_Graham",
                        receivers: ["Regulator_Tom", "MarketingPro_Serena", "TechBro_Elon"],
                        content: "需要看这个产品的商业模式是否可持续，监管风险可能影响投资回报。",
                        sentiment: "neutral",
                        timestamp: new Date(Date.now() + 18000).toISOString(),
                        likes: 8,
                        shares: 2,
                        comments: 5
                      },
                      {
                        sender: "Regulator_Tom",
                        receivers: ["ValueInvestor_Graham", "Skeptical_Journalist"],
                        content: "需要确保产品符合现有法规，监管框架需要跟上技术发展。",
                        sentiment: "neutral",
                        timestamp: new Date(Date.now() + 24000).toISOString(),
                        likes: 6,
                        shares: 1,
                        comments: 3
                      }
                    ]
                  },
                  {
                    name: "TikTok-like",
                    type: "short_video",
                    userCount: 2,
                    activeUsers: ["ArtStudent_Vivian", "SocialMedia_Intern"],
                    message_propagation: [
                      {
                        sender: "ArtStudent_Vivian",
                        receivers: ["SocialMedia_Intern", "MarketingPro_Serena", "TechBro_Elon"],
                        content: "AI可能会改变艺术创作方式，但也要考虑艺术的人文价值。",
                        sentiment: "neutral",
                        timestamp: new Date(Date.now() + 30000).toISOString(),
                        likes: 25,
                        shares: 5,
                        comments: 4
                      },
                      {
                        sender: "SocialMedia_Intern",
                        receivers: [],
                        content: "这个话题肯定会火，可以做成很多有趣的梗。",
                        sentiment: "neutral",
                        timestamp: new Date(Date.now() + 36000).toISOString(),
                        likes: 12,
                        shares: 2,
                        comments: 1
                      }
                    ]
                  },
                  {
                    name: "Forum-like",
                    type: "discussion_forum",
                    userCount: 2,
                    activeUsers: ["Cynical_Dev", "Ethical_Philosopher"],
                    message_propagation: [
                      {
                        sender: "Cynical_Dev",
                        receivers: ["Ethical_Philosopher", "MarketingPro_Serena", "Skeptical_Journalist", "ValueInvestor_Graham"],
                        content: "又是一个被过度炒作的AI产品，技术本身没问题，但营销太过了。",
                        sentiment: "negative",
                        timestamp: new Date(Date.now() + 42000).toISOString(),
                        likes: 18,
                        shares: 3,
                        comments: 7
                      },
                      {
                        sender: "Ethical_Philosopher",
                        receivers: ["Cynical_Dev", "TechBro_Elon", "ValueInvestor_Graham", "Regulator_Tom"],
                        content: "这涉及到AI伦理的根本问题，我们需要建立更完善的伦理框架。",
                        sentiment: "negative",
                        timestamp: new Date(Date.now() + 48000).toISOString(),
                        likes: 22,
                        shares: 4,
                        comments: 9
                      }
                    ]
                  }
                ]
              } : undefined}
              simulationResult={undefined}
            />
          </div>
        </div>
      </div>

      <StrategyRefinementDrawer
        visible={isDrawerVisible}
        onClose={handleCloseDrawer}
        onStrategyConfirm={handleStrategyConfirm}
      />
    </div>
  );
};

export default Scenario1Page;
