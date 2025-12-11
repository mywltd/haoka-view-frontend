// 判断是否为靓号（连号）
export function isNiceNumber(num) {
  const str = String(num);
  if (str.length < 2) return false;

  for (let i = 0; i <= str.length - 2; i++) {
    const current = parseInt(str[i]);
    const next = parseInt(str[i + 1]);

    if (next === current + 1) {
      // 找到连续数字，检查是否有2位以上连号
      let count = 2;
      for (let j = i + 2; j < str.length; j++) {
        if (parseInt(str[j]) === current + (j - i)) {
          count++;
        } else {
          break;
        }
      }
      if (count >= 2) return true;
    }
  }
  return false;
}

// 解析用户输入的自定义数字
export function parseCustomNumbers(customNumbers) {
  if (!customNumbers || typeof customNumbers !== 'string' || !customNumbers.trim()) {
    return [];
  }

  return customNumbers
    .split(/[,，\s]+/) // 支持逗号、中文逗号、空格分隔
    .map(num => num.trim())
    .filter(num => num !== '' && /^\d+$/.test(num)) // 只保留纯数字
    .map(num => String(num)); // 转换为字符串以便与号码比较
}

// 分页数据处理
export function paginateArray(array, page, pageSize) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return array.slice(startIndex, endIndex);
}

// 格式化数字
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 延迟函数
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 防抖函数
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
