import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Select, 
  Switch, 
  Input, 
  Space, 
  Typography,
  Divider,
  Spin,
  Radio
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  MobileOutlined,
  StarOutlined,
  CloseCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { parseCustomNumbers } from '../utils/helpers';

const { Option } = Select;
const { Text } = Typography;

const FilterToolbar = ({
  filters,
  searchQuery,
  searchLoading = false,
  onFiltersChange,
  onSearchChange,
  segments = []
}) => {
  const customNumbers = filters.customNumbers || [];
  const customNumbersString = Array.isArray(customNumbers) ? customNumbers.join(',') : (customNumbers || '');
  const [rawCustomNumbers, setRawCustomNumbers] = useState(customNumbersString);
  useEffect(() => {
    // 将外部filters变化同步到本地输入框，避免受控输入被重置
    setRawCustomNumbers(customNumbersString);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customNumbersString]);
  const parsedCustomNumbers = parseCustomNumbers(customNumbersString);

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleCustomNumbersChange = (value) => {
    setRawCustomNumbers(value);
    const parsed = parseCustomNumbers(value);
    handleFilterChange('customNumbers', parsed);
  };

  return (
    <div>
      {/* 搜索框 */}
      <Row style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <div style={{ maxWidth: '100%', margin: '0 auto' }}>
            <Input
            size="large"
            placeholder="搜索号码（支持模糊匹配，自动防抖600ms）"
            prefix={searchLoading ? <LoadingOutlined spin /> : <SearchOutlined />}
            suffix={
              searchLoading ? (
                <Spin 
                  size="small" 
                  indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />}
                />
              ) : null
            }
            value={searchQuery || ''}
            onChange={e => onSearchChange(e.target.value)}
            style={{ 
              width: '100%',
              borderRadius: '8px',
              borderColor: searchLoading ? '#1677ff' : undefined
            }}
            />
          </div>
          {searchLoading && (
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
              正在搜索中...
            </Text>
          )}
        </Col>
      </Row>

      <Divider orientation="left" orientationMargin="0">
        <Space>
          <FilterOutlined />
          <Text strong>筛选条件</Text>
        </Space>
      </Divider>

      <Row gutter={[16, 16]}>
        {/* 号段筛选（支持多选） */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            <MobileOutlined style={{ marginRight: '4px' }} />
            号段筛选
          </Text>
          <Select
            mode="multiple"
            placeholder="选择号段（可多选）"
            value={filters.prefixes || []}
            onChange={value => handleFilterChange('prefixes', value)}
            style={{ width: '100%' }}
            allowClear
          >
            {segments.map(segment => (
              <Option key={segment} value={segment}>
                {segment} 号段
              </Option>
            ))}
          </Select>
        </Col>

        {/* 不含数字4筛选 */}
        <Col xs={12} sm={12} md={8} lg={6}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            minHeight: '32px'
          }}>
            <Text strong style={{ display: 'flex', alignItems: 'center' }}>
              <CloseCircleOutlined style={{ marginRight: '4px' }} />
              不含数字4
            </Text>
            <Switch
              size="small"
              checked={filters.no4}
              onChange={value => handleFilterChange('no4', value)}
            />
          </div>
        </Col>

        {/* 靓号筛选 */}
        <Col xs={12} sm={12} md={8} lg={6}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            minHeight: '32px'
          }}>
            <Text strong style={{ display: 'flex', alignItems: 'center' }}>
              <StarOutlined style={{ marginRight: '4px' }} />
              靓号连号
            </Text>
            <Switch
              size="small"
              checked={filters.nice}
              onChange={value => handleFilterChange('nice', value)}
            />
          </div>
        </Col>

        {/* 匹配方式 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            匹配方式
          </Text>
          <Radio.Group 
            value={filters.matchMode || 'none'} 
            onChange={e => handleFilterChange('matchMode', e.target.value)}
          >
            <Radio.Button value="none">不限制</Radio.Button>
            <Radio.Button value="head">从头匹配</Radio.Button>
            <Radio.Button value="tail">从尾匹配</Radio.Button>
          </Radio.Group>
        </Col>

        {/* 自定义数字模式 */}
        <Col xs={24} sm={24} md={16} lg={12}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            自定义数字筛选
          </Text>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Select
              value={filters.customMode || 'include'}
              onChange={value => handleFilterChange('customMode', value)}
              style={{ width: '100%' }}
            >
              <Option value="include">包含</Option>
              <Option value="exclude">不包含</Option>
            </Select>
            <Input
              placeholder="自定义数字（逗号分隔，如: 123,456,789）"
              value={rawCustomNumbers}
              onChange={e => handleCustomNumbersChange(e.target.value)}
            />
            {parsedCustomNumbers.length > 0 && (
              <Text type="success" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                已设置: {parsedCustomNumbers.join(', ')}
              </Text>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default FilterToolbar;
