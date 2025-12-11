// 防抖Hook工具
import { useState, useEffect } from 'react';

/**
 * 增强版防抖Hook - 用于延迟执行频繁变化的值
 * @param {any} value - 需要防抖的值
 * @param {number} delay - 延迟时间（毫秒）
 * @param {Object} options - 选项
 * @returns {any} 防抖后的值
 */
export const useDebounce = (value, delay, options = {}) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const { immediate = false, maxWait } = options;
  
  useEffect(() => {
    // 如果是立即执行且是首次调用
    if (immediate && debouncedValue === value) {
      return;
    }
    
    // 设置防抖定时器
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 最大等待时间限制
    let maxHandler;
    if (maxWait && maxWait > delay) {
      maxHandler = setTimeout(() => {
        setDebouncedValue(value);
      }, maxWait);
    }

    // 清理函数：每次value变化时清除之前的定时器
    return () => {
      clearTimeout(handler);
      if (maxHandler) {
        clearTimeout(maxHandler);
      }
    };
  }, [value, delay, immediate, maxWait, debouncedValue]);

  return debouncedValue;
};

export default useDebounce;
