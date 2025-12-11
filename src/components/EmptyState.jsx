import React from 'react';
import { Empty, Typography } from 'antd';

const { Text } = Typography;

const EmptyState = ({ 
  icon, 
  title = '暂无匹配结果', 
  message = '请调整筛选条件或搜索关键词',
  action
}) => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <Empty
        image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
        imageStyle={{
          height: 80,
        }}
        description={
          <div>
            <Text strong style={{ fontSize: '16px', color: '#1f2937', display: 'block', marginBottom: '8px' }}>
              {title}
            </Text>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {message}
            </Text>
          </div>
        }
      >
        {action}
      </Empty>
    </div>
  );
};

export default EmptyState;
