/**
 * API服务基础配置
 */

import axios from 'axios';

// 创建axios实例
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// 通用API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 通用API方法
export const api = {
  get: <T>(url: string, params?: any) => 
    apiClient.get<ApiResponse<T>>(url, { params }).then(res => res.data),
  
  post: <T>(url: string, data?: any) => 
    apiClient.post<ApiResponse<T>>(url, data).then(res => res.data),
  
  put: <T>(url: string, data?: any) => 
    apiClient.put<ApiResponse<T>>(url, data).then(res => res.data),
  
  delete: <T>(url: string) => 
    apiClient.delete<ApiResponse<T>>(url).then(res => res.data),
};
