// Axios 请求层：统一 baseURL /api、附加令牌、按统一错误码处理
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { STORAGE_KEYS, TIMEOUT } from '../constants.js';

// 支持 .env 配置 VITE_API_BASE（默认 /api，便于多环境部署）
const request = axios.create({ baseURL: import.meta.env.VITE_API_BASE || '/api', timeout: TIMEOUT.default });

// 401 跳登录时保留 redirect，登录后可回跳
function redirectToLogin() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.role);
  localStorage.removeItem(STORAGE_KEYS.userId);
  const cur = window.location.pathname + window.location.search;
  const target = cur && cur !== '/login' ? `?redirect=${encodeURIComponent(cur)}` : '';
  window.location.href = `/login${target}`;
}

// 说明：全局超时见 constants.TIMEOUT；AI 类接口在 api/index.js 调用处单独传 { timeout: TIMEOUT.ai }
request.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  (resp) => {
    const body = resp.data;
    if (body && body.code !== 0) {
      // 未登录 / 令牌过期：清理并跳转登录页
      if (body.code === 40101) {
        redirectToLogin();
        return Promise.reject(body);
      }
      ElMessage.error(body.message || '请求失败');
      return Promise.reject(body);
    }
    return body.data;
  },
  (err) => {
    const code = err.response && err.response.data && err.response.data.code;
    if (code === 40101) {
      redirectToLogin();
    } else if (err.code === 'ECONNABORTED') {
      // 前端等待超时：多为 AI 生成较慢，提示比"网络异常"更准确
      ElMessage.error('请求超时，AI 生成较慢，请稍候重试');
    } else {
      ElMessage.error((err.response && err.response.data && err.response.data.message) || '网络异常，请稍后重试');
    }
    return Promise.reject(err);
  }
);

export default request;
