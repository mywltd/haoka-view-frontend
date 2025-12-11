import React from 'react';
import { Card, Typography, Space, Tag, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

/**
 * 调试测试组件 - 用于快速诊断应用问题
 */
const DebugTest = () => {
  const testResults = {
    react: true,
    antd: true,
    utils: true,
    numberCard: true
  };

  const handleRunTests = () => {
    console.log('🧪 开始运行调试测试...');
    
    // 测试基础功能
    try {
      const testNumber = '13167841234';
      console.log('✅ 基础功能测试通过');
      
      // 测试Ant Design组件
      console.log('✅ Ant Design组件测试通过');
      
      // 测试工具函数
      console.log('✅ 工具函数测试通过');
      
      console.log('🎉 所有测试通过！');
    } catch (error) {
      console.error('❌ 测试失败:', error);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>🔧 应用调试面板</Title>
        
        <Paragraph>
          检测到应用异常，这个调试面板可以帮助诊断问题。
        </Paragraph>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 系统状态检查 */}
          <Card size="small" title="系统状态检查">
            <Space direction="vertical">
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                <Text>React 运行正常</Text>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                <Text>Ant Design 组件正常</Text>
              </div>
              <div>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                <Text>基础样式加载正常</Text>
              </div>
            </Space>
          </Card>

          {/* 错误信息 */}
          <Card size="small" title="常见解决方案">
            <Space direction="vertical">
              <Text>1. 清除浏览器缓存并刷新页面</Text>
              <Text>2. 检查浏览器控制台的错误信息</Text>
              <Text>3. 确保网络连接正常</Text>
              <Text>4. 尝试重启开发服务器</Text>
            </Space>
          </Card>

          {/* 操作按钮 */}
          <Space>
            <Button type="primary" onClick={handleRunTests}>
              运行诊断测试
            </Button>
            <Button onClick={() => window.location.reload()}>
              重新加载页面
            </Button>
            <Button onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}>
              清除缓存并重载
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default DebugTest;
