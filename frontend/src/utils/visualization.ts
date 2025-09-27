/**
 * 可视化工具函数
 */

import { COLOR_SCHEMES } from './constants';

/**
 * 根据立场值获取颜色
 * @param stance 立场值 (-1 到 1)
 * @param alpha 透明度 (0 到 1)
 * @returns HSL颜色字符串
 */
export const getStanceColor = (stance: number, alpha: number = 1): string => {
  const hue = stance > 0 ? 120 : 0; // 绿色到红色
  const saturation = Math.abs(stance) * 100;
  const lightness = 50 + (1 - Math.abs(stance)) * 20;
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
};

/**
 * 根据影响力分数获取节点大小
 * @param influenceScore 影响力分数 (0 到 100)
 * @param minSize 最小大小
 * @param maxSize 最大大小
 * @returns 节点大小
 */
export const getNodeSize = (
  influenceScore: number, 
  minSize: number = 20, 
  maxSize: number = 60
): number => {
  return minSize + (influenceScore / 100) * (maxSize - minSize);
};

/**
 * 根据影响力分数获取颜色
 * @param influenceScore 影响力分数 (0 到 100)
 * @returns 颜色字符串
 */
export const getInfluenceColor = (influenceScore: number): string => {
  if (influenceScore >= 80) return COLOR_SCHEMES.influence.high;
  if (influenceScore >= 50) return COLOR_SCHEMES.influence.medium;
  return COLOR_SCHEMES.influence.low;
};

/**
 * 根据平台获取颜色
 * @param platform 平台类型
 * @returns 颜色字符串
 */
export const getPlatformColor = (platform: string): string => {
  return COLOR_SCHEMES.platform[platform as keyof typeof COLOR_SCHEMES.platform] || '#8c8c8c';
};

/**
 * 生成渐变色
 * @param startColor 起始颜色
 * @param endColor 结束颜色
 * @param steps 步数
 * @returns 渐变色数组
 */
export const generateGradient = (
  startColor: string, 
  endColor: string, 
  steps: number
): string[] => {
  const colors = [];
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    colors.push(interpolateColor(startColor, endColor, ratio));
  }
  return colors;
};

/**
 * 颜色插值
 * @param startColor 起始颜色
 * @param endColor 结束颜色
 * @param ratio 插值比例 (0 到 1)
 * @returns 插值后的颜色
 */
export const interpolateColor = (
  startColor: string, 
  endColor: string, 
  ratio: number
): string => {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  
  if (!start || !end) return startColor;
  
  const r = Math.round(start.r + (end.r - start.r) * ratio);
  const g = Math.round(start.g + (end.g - start.g) * ratio);
  const b = Math.round(start.b + (end.b - start.b) * ratio);
  
  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * 十六进制颜色转RGB
 * @param hex 十六进制颜色
 * @returns RGB对象
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * 计算两点之间的距离
 * @param point1 点1
 * @param point2 点2
 * @returns 距离
 */
export const calculateDistance = (
  point1: { x: number; y: number }, 
  point2: { x: number; y: number }
): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 计算角度
 * @param point1 点1
 * @param point2 点2
 * @returns 角度（弧度）
 */
export const calculateAngle = (
  point1: { x: number; y: number }, 
  point2: { x: number; y: number }
): number => {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x);
};

/**
 * 生成随机位置
 * @param width 容器宽度
 * @param height 容器高度
 * @param padding 边距
 * @returns 随机位置
 */
export const generateRandomPosition = (
  width: number, 
  height: number, 
  padding: number = 50
): { x: number; y: number } => {
  return {
    x: padding + Math.random() * (width - 2 * padding),
    y: padding + Math.random() * (height - 2 * padding),
  };
};

/**
 * 生成圆形布局位置
 * @param index 索引
 * @param total 总数
 * @param centerX 中心X坐标
 * @param centerY 中心Y坐标
 * @param radius 半径
 * @returns 位置
 */
export const generateCircularPosition = (
  index: number,
  total: number,
  centerX: number,
  centerY: number,
  radius: number
): { x: number; y: number } => {
  const angle = (2 * Math.PI * index) / total;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
};

/**
 * 生成层次布局位置
 * @param index 索引
 * @param total 总数
 * @param level 层级
 * @param levels 总层级数
 * @param width 容器宽度
 * @param height 容器高度
 * @returns 位置
 */
export const generateHierarchicalPosition = (
  index: number,
  total: number,
  level: number,
  levels: number,
  width: number,
  height: number
): { x: number; y: number } => {
  const levelHeight = height / levels;
  const nodesInLevel = Math.ceil(total / levels);
  const levelWidth = width * 0.8;
  const startX = width * 0.1;
  
  const positionInLevel = index % nodesInLevel;
  const x = (positionInLevel / Math.max(1, nodesInLevel - 1)) * levelWidth + startX;
  const y = level * levelHeight + levelHeight / 2;
  
  return { x, y };
};
