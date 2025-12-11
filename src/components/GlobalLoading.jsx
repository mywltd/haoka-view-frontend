import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined, DatabaseOutlined, MobileOutlined } from '@ant-design/icons';

/**
 * 全局加载组件 - 带有美观的动画效果和智能显示逻辑
 */
const GlobalLoading = ({ loading, delay = 300, minDuration = 800, type = 'default' }) => {
  const [show, setShow] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    let timer;
    if (loading) {
      setStartTime(Date.now());
      // 延迟显示，避免加载动画一闪而过
      timer = setTimeout(() => setShow(true), delay);
    } else {
      if (startTime) {
        const elapsed = Date.now() - startTime;
        const remaining = minDuration - elapsed;
        
        // 确保最小显示时间，避免闪烁
        if (remaining > 0) {
          timer = setTimeout(() => setShow(false), remaining);
        } else {
          setShow(false);
        }
      } else {
        setShow(false);
      }
    }
    return () => clearTimeout(timer);
  }, [loading, delay, minDuration, startTime]);

  if (!show) return null;

  // 自定义旋转图标
  const customIcon = <LoadingOutlined style={{ fontSize: 32, color: '#667eea' }} spin />;

  // 根据类型显示不同的加载界面
  const renderLoadingContent = () => {
    switch (type) {
      case 'initial':
        return (
          <div className="global-loading-content">
            <div className="loading-logo">
              <MobileOutlined style={{ fontSize: '48px', color: '#667eea', marginBottom: '16px' }} />
            </div>
            <div className="loading-title">校园卡号码查询系统</div>
            <div className="loading-subtitle">正在初始化系统...</div>
            <div className="loading-spinner">
              <Spin indicator={customIcon} />
            </div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="global-loading-content">
            <div className="loading-logo">
              <DatabaseOutlined style={{ fontSize: '48px', color: '#667eea', marginBottom: '16px' }} />
            </div>
            <div className="loading-title">数据加载中</div>
            <div className="loading-subtitle">正在获取最新数据...</div>
            <div className="loading-spinner">
              <Spin indicator={customIcon} />
            </div>
          </div>
        );
      default:
        return (
          <div className="global-loading-content">
            <div className="loading-spinner">
              <Spin size="large" indicator={customIcon} />
            </div>
            <div className="loading-text">请稍候...</div>
          </div>
        );
    }
  };

  return (
    <div className="global-loading-overlay">
      <div className="global-loading-backdrop" />
      {renderLoadingContent()}
    </div>
  );
};

export default GlobalLoading;
