import React from 'react';

const Loading = ({ overlay = false }) => {
  const content = <div className="spinner"></div>;

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }

  return (
    <div className="loading">
      {content}
    </div>
  );
};

export default Loading;
