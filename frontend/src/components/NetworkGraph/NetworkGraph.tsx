/**
 * 网络图组件
 * 使用react-force-graph-2d实现社交网络可视化
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Agent, AgentConnection } from '@/types';
import { useAgentStore, useSimulationStore } from '@/stores';
import { NodeDetailPanel } from '../NodeDetailPanel';
import './NetworkGraph.css';

interface NetworkGraphProps {
  agents: Agent[];
  connections: AgentConnection[];
  selectedAgentId?: string | null;
  highlightedPath?: string[];
  onAgentClick?: (agentId: string) => void;
  onAgentHover?: (agentId: string | null) => void;
  className?: string;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  agents,
  connections,
  selectedAgentId,
  highlightedPath = [],
  onAgentClick,
  onAgentHover,
  className = '',
}) => {
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Agent | null>(null);
  const [detailPanelPosition, setDetailPanelPosition] = useState({ x: 0, y: 0 });
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  
  const { setSelectedAgent, setAgentPosition } = useAgentStore();
  const { showConnections, highlightPath: showHighlightPath } = useSimulationStore();

  // 处理窗口大小变化 - 添加防抖避免频繁更新
  useEffect(() => {
    let timeoutId: number;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const container = graphRef.current?.parentElement;
        if (container) {
          const newWidth = container.clientWidth - 40;
          const newHeight = container.clientHeight - 40;
          
          // 只有当尺寸真正改变时才更新
          setDimensions(prev => {
            if (Math.abs(prev.width - newWidth) > 10 || Math.abs(prev.height - newHeight) > 10) {
              return { width: newWidth, height: newHeight };
            }
            return prev;
          });
        }
      }, 100);
    };

    // 初始设置
    const container = graphRef.current?.parentElement;
    if (container) {
      setDimensions({
        width: container.clientWidth - 40,
        height: container.clientHeight - 40,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // 处理节点点击
  const handleNodeClick = useCallback((node: any) => {
    const agent = agents.find(agent => agent.id === node.id);
    if (agent) {
      setSelectedNode(agent);
      setDetailPanelPosition({ x: node.x, y: node.y });
      setShowDetailPanel(true);
      
      if (onAgentClick) {
        onAgentClick(node.id);
      }
      setSelectedAgent(agent);
    }
  }, [agents, onAgentClick, setSelectedAgent]);

  // 处理节点悬停 - 添加防抖避免抽搐
  const handleNodeHover = useCallback((node: any) => {
    // 使用requestAnimationFrame来避免频繁更新
    requestAnimationFrame(() => {
      setHoveredNode(node?.id || null);
      if (onAgentHover) {
        onAgentHover(node?.id || null);
      }
    });
  }, [onAgentHover]);

  // 处理节点拖拽
  const handleNodeDrag = useCallback((node: any) => {
    setAgentPosition(node.id, { x: node.x, y: node.y });
    // 如果详情面板正在显示，更新位置
    if (showDetailPanel && selectedNode && selectedNode.id === node.id) {
      setDetailPanelPosition({ x: node.x, y: node.y });
    }
  }, [setAgentPosition, showDetailPanel, selectedNode]);

  // 关闭详情面板
  const handleCloseDetailPanel = useCallback(() => {
    setShowDetailPanel(false);
    setSelectedNode(null);
  }, []);

  // 生成节点数据 - 使用更大的布局空间
  const nodeData = agents.map((agent, index) => {
    // 使用更大的圆形布局，避免节点拥挤
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    // 增加半径，让节点分布更分散
    const radius = Math.min(dimensions.width, dimensions.height) * 0.4;
    const angle = (2 * Math.PI * index) / agents.length;
    
    // 添加一些随机偏移，避免完全对称
    const randomOffset = (Math.random() - 0.5) * 20;
    
    return {
      id: agent.id,
      agent,
      x: centerX + radius * Math.cos(angle) + randomOffset,
      y: centerY + radius * Math.sin(angle) + randomOffset,
      isHighlighted: highlightedPath.includes(agent.id),
      isSelected: selectedAgentId === agent.id,
    };
  });

  // 生成边数据
  const linkData = connections.map(conn => ({
    source: conn.source,
    target: conn.target,
    tie_strength: conn.tie_strength,
    isActive: conn.isActive,
  }));

  // 网络图初始化优化
  useEffect(() => {
    if (graphRef.current && nodeData.length > 0) {
      // 暂停动画，避免初始渲染时的抽搐
      graphRef.current.pauseAnimation();
      
      // 延迟恢复动画
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.resumeAnimation();
        }
      }, 1000);
    }
  }, [nodeData.length]);

  // 自定义节点渲染 - 优化性能
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const label = node.agent.persona.username;
    const fontSize = 11;
    
    // 设置字体样式
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 根据状态设置颜色
    let textColor = '#666';
    if (node.isSelected) {
      textColor = '#1890ff';
    } else if (node.isHighlighted) {
      textColor = '#52c41a';
    }
    
    ctx.fillStyle = textColor;
    
    // 添加文字阴影提高可读性
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 2;
    ctx.fillText(label, node.x, node.y + 25);
    
    // 清除阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }, []);

  // 自定义边渲染 - 优化性能
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    if (!showConnections) return;

    const { source, target, tie_strength, isActive } = link;
    const isHighlighted = showHighlightPath && isActive;
    
    // 设置线条样式
    let strokeColor = '#d9d9d9';
    let lineWidth = 1;
    let dashPattern: number[] = [];
    
    if (isHighlighted) {
      strokeColor = '#ff4d4f';
      lineWidth = 3;
      dashPattern = [8, 4];
    } else if (tie_strength === 'mutual') {
      strokeColor = '#52c41a';
      lineWidth = 2;
    }
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dashPattern);
    
    // 绘制线条
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    
    // 重置线条样式
    ctx.setLineDash([]);
  }, [showConnections, showHighlightPath]);

  // 布局算法（暂时注释掉，因为react-force-graph-2d的API可能有变化）
  // const getLayoutAlgorithm = () => {
  //   switch (networkLayout) {
  //     case 'circular':
  //       return (graph: any) => {
  //         const nodes = graph.nodes();
  //         const radius = Math.min(dimensions.width, dimensions.height) / 3;
  //         const centerX = dimensions.width / 2;
  //         const centerY = dimensions.height / 2;
  //         
  //         nodes.forEach((node: any, i: number) => {
  //           const angle = (2 * Math.PI * i) / nodes.length;
  //           node.x = centerX + radius * Math.cos(angle);
  //           node.y = centerY + radius * Math.sin(angle);
  //         });
  //       };
  //     case 'hierarchical':
  //       return (graph: any) => {
  //         const nodes = graph.nodes();
  //         const levels = 3;
  //         const nodesPerLevel = Math.ceil(nodes.length / levels);
  //         
  //         nodes.forEach((node: any, i: number) => {
  //           const level = Math.floor(i / nodesPerLevel);
  //           const positionInLevel = i % nodesPerLevel;
  //           const levelWidth = dimensions.width * 0.8;
  //           const levelHeight = dimensions.height / levels;
  //           
  //           node.x = (positionInLevel / Math.max(1, nodesPerLevel - 1)) * levelWidth + dimensions.width * 0.1;
  //           node.y = level * levelHeight + levelHeight / 2;
  //         });
  //       };
  //     default: // force
  //       return undefined;
  //   }
  // };

  return (
    <div className={`network-graph-container ${className}`}>
      <ForceGraph2D
        ref={graphRef}
        graphData={{ nodes: nodeData, links: linkData }}
        width={dimensions.width}
        height={dimensions.height}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onNodeDrag={handleNodeDrag}
        nodeLabel={(node: any) => node.agent.persona.username}
        linkLabel={(link: any) => `${link.source.id} -> ${link.target.id}`}
        // 稳定性参数优化
        cooldownTicks={500}
        d3AlphaDecay={0.005}
        d3VelocityDecay={0.6}
        warmupTicks={200}
        // 交互设置
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        minZoom={0.3}
        maxZoom={3}
        // 节点设置
        nodeRelSize={5}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        nodeCanvasObjectMode="after"
        // 样式配置
        backgroundColor="transparent"
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.1}
        // 力导向图参数优化 - 大幅增加节点间距
        // linkDistance={200}
        // chargeStrength={-800}
      />
      
      {/* 节点详情面板 */}
      <NodeDetailPanel
        agent={selectedNode}
        position={detailPanelPosition}
        visible={showDetailPanel}
        onClose={handleCloseDetailPanel}
      />
      
      {/* 图例 */}
      <div className="network-legend">
        <div className="legend-item">
          <div className="legend-color mutual"></div>
          <span>好友关系</span>
        </div>
        <div className="legend-item">
          <div className="legend-color weak"></div>
          <span>关注关系</span>
        </div>
        <div className="legend-item">
          <div className="legend-color active"></div>
          <span>传播路径</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;
