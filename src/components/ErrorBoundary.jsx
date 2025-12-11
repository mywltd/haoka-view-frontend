import React from 'react';

// 简化的错误边界，避免在错误状态下使用复杂的Ant Design组件
// 这样可以防止错误边界本身也出现渲染错误

/**
 * 错误边界组件 - 捕获子组件中的渲染错误
 * 防止整个应用崩溃，提供友好的错误提示
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // 更新state，下次渲染将显示错误UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // 在生产环境中，可以发送错误报告到监控系统
    if (process.env.NODE_ENV !== 'production') {
      // 特殊处理 prefix 相关错误
      if (error.message && error.message.includes('prefix')) {
        // 静默处理prefix错误
      }
      // 静默处理开发环境错误
      // 静默处理组件堆栈
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '50px 20px', 
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{ 
            maxWidth: '600px', 
            width: '100%',
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.6)'
          }}>
            {/* 错误图标 */}
            <div style={{ 
              fontSize: '48px', 
              color: '#ff4d4f', 
              marginBottom: '24px' 
            }}>
              🐛
            </div>
            
            {/* 错误标题 */}
            <h2 style={{ 
              color: '#ff4d4f', 
              marginBottom: '16px',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              应用出现异常
            </h2>
            
            {/* 错误描述 */}
            <p style={{ 
              fontSize: '16px', 
              marginBottom: '24px', 
              color: '#666',
              lineHeight: '1.5'
            }}>
              很抱歉，应用遇到了一个意外错误。这可能是临时的问题。
            </p>

            {/* 错误详情 */}
            <div style={{
              background: '#ffeaea',
              border: '1px solid #ffbaba',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              <strong style={{ color: '#d32f2f' }}>错误详情</strong>
              <div style={{ marginTop: '8px', color: '#666' }}>
                {this.state.error ? (
                  <div style={{ textAlign: 'left', fontSize: '12px' }}>
                    <strong>错误信息:</strong> {this.state.error.toString()}
                    
                    {/* 针对 prefix 错误的特殊提示 */}
                    {this.state.error.message && this.state.error.message.includes('prefix') && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '8px',
                        background: '#fff2e8',
                        border: '1px solid #ffb84d',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        <strong>🔧 Ant Design 配置问题：</strong>
                        <br />
                        这是 ConfigProvider 配置错误，通常通过清除缓存或重启开发服务器可以解决。
                        <br />
                        <strong>建议操作：</strong>
                        <br />
                        1. 点击"刷新页面"按钮
                        <br />
                        2. 清除浏览器缓存
                        <br />
                        3. 重启开发服务器 (npm start)
                      </div>
                    )}
                    
                    <br />
                    <strong>错误位置:</strong> 
                    <pre style={{ 
                      marginTop: '8px', 
                      padding: '8px',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '200px',
                      fontSize: '11px'
                    }}>
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                ) : (
                  '系统已记录错误信息，我们会尽快修复此问题。'
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={this.handleReload}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#5a6fd8';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#667eea';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🔄 刷新页面
              </button>
              
              <button 
                onClick={this.handleReset}
                style={{
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f0f2ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                }}
              >
                🔄 重试
              </button>
            </div>

            {/* 提示信息 */}
            <p style={{ 
              marginTop: '24px', 
              fontSize: '12px', 
              color: '#999',
              lineHeight: '1.4'
            }}>
              如果问题持续存在，请联系技术支持。
            </p>
          </div>
        </div>
      );
    }

    // 在成功渲染的情况下，直接返回子组件
    // ConfigProvider 已在 App 组件层面配置，无需重复包装
    return this.props.children;
  }
}

export default ErrorBoundary;
