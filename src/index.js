import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';

// 获取根元素
const container = document.getElementById('root');
const root = createRoot(container);

// 渲染应用 - 移除根层级的 ConfigProvider，由 App 组件统一管理
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
