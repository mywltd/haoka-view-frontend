import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import { 
  DatabaseOutlined, 
  StarOutlined, 
  CloseCircleOutlined, 
  AppstoreOutlined,
  FileTextOutlined,
  SearchOutlined 
} from '@ant-design/icons';

const StatsPanel = ({ stats }) => {
  const { totalNumbers, segments, currentPage, filteredCount } = stats;

  const statItems = [
    {
      title: '总号码数',
      value: totalNumbers,
      icon: <DatabaseOutlined style={{ color: '#1677ff' }} />,
      color: '#1677ff'
    },
    {
      title: '号段数量',
      value: segments,
      icon: <AppstoreOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: '当前页码',
      value: currentPage,
      icon: <FileTextOutlined style={{ color: '#faad14' }} />,
      color: '#faad14'
    },
    {
      title: '筛选结果',
      value: filteredCount,
      icon: <SearchOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1'
    }
  ];

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Row gutter={[16, 16]}>
        {statItems.map((item, index) => (
          <Col key={index} xs={12} sm={6} md={6} lg={6}>
            <Card 
              size="small"
              style={{ 
                textAlign: 'center',
                borderColor: item.color,
                borderWidth: '2px'
              }}
            >
              <Statistic
                title={
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    color: '#1f2937'
                  }}>
                    {item.icon}
                    {item.title}
                  </div>
                }
                value={item.value}
                valueStyle={{ 
                  color: item.color, 
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default StatsPanel;
