import React from 'react';
import { Card, Tag, Typography, Tooltip, message } from 'antd';
import { 
  StarOutlined, 
  CloseCircleOutlined, 
  TagOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { isNiceNumber } from '../utils/helpers';

const { Text } = Typography;

const NumberCard = ({ number, customNumbers = [], customFilterMode = 'include' }) => {
  // 安全检查：确保number是有效的
  const safeNumber = number || '';
  const safeCustomNumbers = Array.isArray(customNumbers) ? customNumbers : [];
  const safeCustomFilterMode = customFilterMode || 'include';

  // 检查是否匹配自定义筛选 - 添加错误保护
  const matchesCustomFilter = (() => {
    try {
      return safeCustomNumbers.length > 0 && 
        safeCustomNumbers.some(customNum => 
          safeNumber.toString().includes(customNum?.toString() || '')
        );
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // 静默处理筛选错误
      }
      return false;
    }
  })();

  // 复制号码到剪贴板 - 增强版，包含成功反馈和降级方案
  const handleCopy = async () => {
    try {
      // 优先使用现代剪贴板API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(safeNumber);
        message.success({
          content: `号码 ${safeNumber} 已复制到剪贴板`,
          duration: 2,
          style: {
            marginTop: '20vh',
          }
        });
      } else {
        // 降级方案：使用传统的复制方法
        const textArea = document.createElement('textarea');
        textArea.value = safeNumber;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        if (document.execCommand('copy')) {
          message.success({
            content: `号码 ${safeNumber} 已复制到剪贴板`,
            duration: 2,
            style: {
              marginTop: '20vh',
            }
          });
        } else {
          throw new Error('复制命令执行失败');
        }
        
        document.body.removeChild(textArea);
      }
    } catch (error) {
      message.error({
        content: '复制失败，请手动选择号码进行复制',
        duration: 3,
        style: {
          marginTop: '20vh',
        }
      });
      
      if (process.env.NODE_ENV !== 'production') {
        // 静默处理复制错误
      }
    }
  };

  return (
    <Card
      hoverable
      className="number-card"
      style={{ 
        minHeight: '72px', // 长方形卡片，自动随内容增高
        width: '100%', // 确保卡片完全填充容器宽度
        borderRadius: '12px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        border: '1px solid #e8e8e8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', // 统一阴影效果
        display: 'flex',
        flexDirection: 'column'
      }}
      bodyStyle={{ 
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
      onClick={handleCopy}
    >
      {/* 行1：号码（去除前置图标，始终完整显示） */}
      <Tooltip title="点击复制号码">
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Text 
            strong 
            style={{ 
              fontSize: '18px', 
              color: '#1677ff',
              lineHeight: '22px',
              whiteSpace: 'nowrap',
              textAlign: 'center'
            }}
          >
            {safeNumber}
          </Text>
        </div>
      </Tooltip>

      {/* 行2：标签（尾部展示，自动换行，保证完整显示） */}
      <div style={{
        marginTop: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: '6px'
      }}>
        {/* 号段标签 - 始终显示 */}
        {safeNumber.length >= 3 && (
          <Tag 
            color="blue" 
            style={{ 
              fontSize: '10px',
              border: '1px solid #1677ff',
              borderRadius: '4px',
              padding: '0 6px'
            }}
          >
            {safeNumber.slice(0, 3)}
          </Tag>
        )}

        {/* 靓号标签 */}
        {(() => {
          try {
            return isNiceNumber(safeNumber) && (
              <Tag 
                color="gold" 
                icon={<StarOutlined style={{ fontSize: '10px' }} />} 
                style={{ 
                  fontSize: '10px',
                  border: '1px solid #faad14',
                  borderRadius: '4px',
                  padding: '0 6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                靓号
              </Tag>
            );
          } catch (error) {
            return null;
          }
        })()}

        {/* 无4标签 */}
        {!safeNumber.includes('4') && (
          <Tag 
            color="green" 
            icon={<CloseCircleOutlined style={{ fontSize: '10px' }} />} 
            style={{ 
              fontSize: '10px',
              border: '1px solid #52c41a',
              borderRadius: '4px',
              padding: '0 6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            无4
          </Tag>
        )}

        {/* 自定义筛选标签 */}
        {matchesCustomFilter && safeCustomFilterMode === 'include' && (
          <Tag 
            color="purple" 
            icon={<TagOutlined style={{ fontSize: '10px' }} />} 
            style={{ 
              fontSize: '10px',
              border: '1px solid #722ed1',
              borderRadius: '4px',
              padding: '0 6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            自定义
          </Tag>
        )}
      </div>
    </Card>
  );
};

export default NumberCard;
