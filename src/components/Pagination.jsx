import React from 'react';
import { Pagination as AntPagination, Card } from 'antd';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  pageSize = 20,
  onPageChange, 
  onPageSizeChange,
  hasNextPage, 
  hasPrevPage 
}) => {
  if (totalPages <= 1) return null;

  // 处理页面大小变化
  const handleShowSizeChange = (current, size) => {
    if (onPageSizeChange) {
      onPageSizeChange(size);
    }
  };

  return (
    <Card style={{ textAlign: 'center' }}>
      <AntPagination
        current={currentPage}
        total={totalItems}
        pageSize={pageSize}
        onChange={onPageChange}
        showSizeChanger={true}
        onShowSizeChange={handleShowSizeChange}
        pageSizeOptions={['20', '30', '50', '100']}
        showQuickJumper
        showTotal={(total, range) =>
          `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
        }
        style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      />
    </Card>
  );
};

export default Pagination;
