/**
 * API配置模块
 * 用于统一管理后端API的基础URL配置
 * 
 * 配置优先级：
 * 1. 环境变量 REACT_APP_API_BASE_URL（构建时注入）
 * 2. 环境变量 VITE_API_BASE_URL（Vite项目使用）
 * 3. 默认值：相对路径 '/api'（同域部署）
 */

// 获取API基础URL
// 支持通过环境变量配置，方便不同环境使用不同的后端地址
const getApiBaseUrl = () => {
  // 优先使用环境变量配置（构建时注入）
  // React项目通常使用 REACT_APP_ 前缀
  // Vite项目使用 VITE_ 前缀
  // 这里同时支持两种，提高兼容性
  const envApiUrl = 
    process.env.REACT_APP_API_BASE_URL || 
    process.env.VITE_API_BASE_URL ||
    window.REACT_APP_API_BASE_URL; // 运行时配置（通过window对象）
  
  if (envApiUrl) {
    // 确保URL以 / 结尾，但不重复
    return envApiUrl.endsWith('/') ? envApiUrl.slice(0, -1) : envApiUrl;
  }
  
  // 默认使用相对路径，适用于同域部署
  return '';
};

// API基础URL（导出常量，避免重复计算）
export const API_BASE_URL = getApiBaseUrl();

/**
 * 构建完整的API URL
 * @param {string} endpoint - API端点路径（如 '/query-numbers'）
 * @returns {string} 完整的API URL
 * 
 * @example
 * buildApiUrl('/query-numbers') 
 * // 返回: '/api/query-numbers' (默认) 或 'https://api.example.com/api/query-numbers' (配置了环境变量)
 */
export const buildApiUrl = (endpoint) => {
  // 确保endpoint以 / 开头
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // 如果配置了完整URL，直接拼接
  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalizedEndpoint}`;
  }
  
  // 默认使用相对路径
  return `/api${normalizedEndpoint}`;
};

/**
 * 常用API端点（方便统一管理）
 */
export const API_ENDPOINTS = {
  // 公钥获取
  PUBLIC_KEY: '/public-key',
  // 会话初始化
  SESSION_INIT: '/session/init',
  // 数据索引
  INDEX: '/index',
  // 号码查询
  QUERY_NUMBERS: '/query-numbers',
  // 健康检查
  HEALTH: '/health',
};

// 默认导出配置对象
export default {
  API_BASE_URL,
  buildApiUrl,
  API_ENDPOINTS,
};

