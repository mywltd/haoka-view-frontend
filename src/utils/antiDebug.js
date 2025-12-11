// 反调试和安全防护工具
// 提高前端代码安全性，增加逆向工程难度

/**
 * 反调试保护 - 检测开发者工具
 */
export const antiDebugProtection = () => {
  // 只在生产环境启用
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // 检测DevTools是否打开
  const detectDevTools = () => {
    // 在移动/平板设备上禁用窗口尺寸启发式，避免误报
    const ua = (navigator && navigator.userAgent) ? navigator.userAgent : '';
    const isTouch = (navigator && typeof navigator.maxTouchPoints === 'number') ? navigator.maxTouchPoints > 1 : false;
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
    const isMobileOrTablet = isTouch || isMobileUA;

    const threshold = 170; // 更高阈值，减少误报
    if (isMobileOrTablet) return false;
    
    const hDelta = Math.max(0, (window.outerHeight || 0) - (window.innerHeight || 0));
    const wDelta = Math.max(0, (window.outerWidth || 0) - (window.innerWidth || 0));
    if ((hDelta > threshold || wDelta > threshold) && document.visibilityState === 'visible') {
      devtoolsHeuristicHits++;
      if (devtoolsHeuristicHits >= 3) {
        devtoolsLikelyOpen = true;
        return true;
      }
    } else {
      devtoolsHeuristicHits = 0;
    }
    return false;
  };

  // 定期检测
  const intervalId = setInterval(detectDevTools, 500);

  // 检测右键菜单
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    console.log('%c🔒 右键菜单已被禁用', 'color: orange; font-size: 12px;');
  });

  // 检测F12和其他调试快捷键
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      console.log('%c🔒 F12调试已被禁用', 'color: orange; font-size: 12px;');
      return false;
    }
    
    // Ctrl+Shift+I (开发者工具)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+J (控制台)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+C (元素选择)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+U (查看源代码)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      return false;
    }
  });

  // 渲染安全提示覆盖页（美观样式）
  const renderSecurityBlockPage = () => {
    try {
      if (document.getElementById('security-block-overlay')) return;

      // 清空页面内容
      document.body.innerHTML = '';
      document.body.style.margin = '0';
      document.body.style.height = '100vh';
      document.documentElement.style.height = '100%';
      document.body.style.overflow = 'hidden';

      const style = document.createElement('style');
      style.innerHTML = `
        .sbp-bg { 
          position: fixed; inset: 0; 
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; 
        }
        .sbp-card {
          width: min(560px, 92vw);
          border-radius: 16px;
          background: rgba(255,255,255,0.95);
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.25);
          border: 1px solid rgba(102, 126, 234, 0.25);
          padding: 28px 32px;
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
        }
        .sbp-title { font-size: 20px; font-weight: 700; color: #667eea; margin: 0 0 12px 0; }
        .sbp-desc { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0 0 16px 0; }
        .sbp-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%);
          border: 1px solid rgba(102,126,234,0.25);
          color: #4f46e5;
          padding: 8px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;
        }
      `;
      document.head.appendChild(style);

      const overlay = document.createElement('div');
      overlay.id = 'security-block-overlay';
      overlay.className = 'sbp-bg';
      overlay.innerHTML = `
        <div class="sbp-card">
          <div class="sbp-badge">🔒 安全保护已启用</div>
          <h3 class="sbp-title">为保护系统安全，已暂停页面展示</h3>
          <p class="sbp-desc">检测到控制台被使用。请关闭开发者工具并刷新页面继续访问。<br/>若您是开发者，请在非生产环境进行调试。</p>
        </div>
      `;
      document.body.appendChild(overlay);
    } catch (_) {}
  };

  // 检测控制台使用（覆盖常见方法，一经触发即清空并展示提示页）
  const detectConsole = () => {
    // 在移动/平板上不劫持 console，避免正常日志触发误拦截
    const ua = (navigator && navigator.userAgent) ? navigator.userAgent : '';
    const isTouch = (navigator && typeof navigator.maxTouchPoints === 'number') ? navigator.maxTouchPoints > 1 : false;
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
    const isMobileOrTablet = isTouch || isMobileUA;
    const original = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };
    let locked = false;

    const wrap = (method) => (...args) => {
      if (!locked && devtoolsLikelyOpen && document.visibilityState === 'visible') {
        locked = true;
        renderSecurityBlockPage();
      }
      return original[method].apply(console, args);
    };

    if (!isMobileOrTablet) {
      console.log = wrap('log');
      console.warn = wrap('warn');
      console.error = wrap('error');
      console.info = wrap('info');
    }
  };

  // 状态：启发式命中次数与标记
  let devtoolsHeuristicHits = 0;
  let devtoolsLikelyOpen = false;

  detectConsole();

  // 增强：针对“新窗口/分离窗口”打开的 DevTools 场景
  // 思路1：利用 debugger 语句在 DevTools 打开时会触发暂停，从而产生明显的时间停顿
  // 思路2：检测主线程事件循环的异常停顿（>3s）也视为可疑
  const startUndockedDetector = () => {
    let last = performance.now();
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      // 在移动/平板上禁用该检测，避免慢设备或后台态误判
      const ua = (navigator && navigator.userAgent) ? navigator.userAgent : '';
      const isTouch = (navigator && typeof navigator.maxTouchPoints === 'number') ? navigator.maxTouchPoints > 1 : false;
      const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
      const isMobileOrTablet = isTouch || isMobileUA;
      if (isMobileOrTablet || document.visibilityState !== 'visible') {
        setTimeout(tick, 1500);
        last = performance.now();
        return;
      }

      // 10% 概率注入一次 debugger，避免频繁打断正常体验
      // eslint-disable-next-line no-debugger
      if (Math.random() < 0.1) {
        const t1 = performance.now();
        debugger; // DevTools 打开时此处会暂停，恢复后时间差显著增大
        const t2 = performance.now();
        if (t2 - t1 > 250 && devtoolsLikelyOpen) {
          renderSecurityBlockPage();
          stopped = true;
          return;
        }
      }

      const now = performance.now();
      if (now - last > 4000 && devtoolsLikelyOpen) { // 更宽松阈值，且需已怀疑DevTools打开
        renderSecurityBlockPage();
        stopped = true;
        return;
      }
      last = now;
      setTimeout(tick, 1000);
    };

    setTimeout(tick, 1500);
  };

  startUndockedDetector();

  // 返回清理函数
  return () => {
    clearInterval(intervalId);
    document.removeEventListener('contextmenu', () => {});
    document.removeEventListener('keydown', () => {});
  };
};

/**
 * 代码完整性检查
 */
export const integrityCheck = () => {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  // 简单的代码完整性校验
  const criticalFunctions = [
    'fetch',
    'XMLHttpRequest',
    'eval',
    'Function'
  ];
  
  for (const funcName of criticalFunctions) {
    if (typeof window[funcName] !== 'function' && typeof global[funcName] !== 'function') {
      console.error(`🔒 关键函数 ${funcName} 被篡改或缺失`);
      return false;
    }
  }
  
  return true;
};

/**
 * 性能监控 - 检测异常的性能指标可能表明调试活动
 */
export const performanceMonitoring = () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  let performanceStart = performance.now();
  
  const checkPerformance = () => {
    const currentTime = performance.now();
    const timeDiff = currentTime - performanceStart;
    
    // 如果执行时间异常长，可能在调试
    if (timeDiff > 10000) { // 10秒
      console.log('%c🔒 检测到异常的执行时间', 'color: orange; font-size: 12px;');
    }
    
    performanceStart = currentTime;
  };
  
  setInterval(checkPerformance, 5000);
};

/**
 * 初始化所有安全防护
 */
export const initSecurity = () => {
  if (process.env.NODE_ENV === 'production') {
    console.log('%c🔒 安全防护已启用', 'color: green; font-size: 12px;');
    
    antiDebugProtection();
    integrityCheck();
    performanceMonitoring();
    
    // 清理控制台
    setTimeout(() => {
      console.clear();
    }, 1000);
  }
};

export default {
  antiDebugProtection,
  integrityCheck, 
  performanceMonitoring,
  initSecurity
};
