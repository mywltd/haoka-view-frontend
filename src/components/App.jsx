import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ConfigProvider,
  Layout, 
  Typography, 
  Card, 
  Row, 
  Col, 
  Spin,
  Alert,
  Button
} from 'antd';
import { 
  MobileOutlined, 
  SearchOutlined, 
  ReloadOutlined,
  DatabaseOutlined,
  StarOutlined,
  RocketOutlined
} from '@ant-design/icons';
import cryptoClient from '../utils/crypto';
import { isNiceNumber, parseCustomNumbers } from '../utils/helpers';
import useDebounce from '../utils/useDebounce';
import { initSecurity } from '../utils/antiDebug';
import { buildApiUrl, API_ENDPOINTS } from '../utils/apiConfig';
import FilterToolbar from './FilterToolbar';
import StatsPanel from './StatsPanel';
import NumberCard from './NumberCard';
import Pagination from './Pagination';
import Loading from './Loading';
import EmptyState from './EmptyState';
import GlobalLoading from './GlobalLoading';
import DebugTest from './DebugTest';
import '../styles/GlobalLoading.css';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

// Ant Design 5.x 主题配置 - 遵循官方最新规范，仅设置必要的主题色
const appTheme = {
  token: {
    colorPrimary: '#667eea',
  },
};

function App() {
  // 基础状态
  const [dataIndex, setDataIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // 初始加载状态
  const [searchLoading, setSearchLoading] = useState(false); // 搜索专用加载状态
  const [error, setError] = useState(null);
  const [rateLimited, setRateLimited] = useState(false); // 429限流状态
  const [retryCount, setRetryCount] = useState(0); // 重试次数
  const [appReady, setAppReady] = useState(false); // 应用就绪状态
  const [debugMode, setDebugMode] = useState(false); // 调试模式状态

  // 数据状态
  const [currentData, setCurrentData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // 筛选状态 - 确保初始值安全（兼容旧字段 -> 新字段）
  const [filters, setFilters] = useState(() => ({
    // 兼容：旧 prefix 映射为 prefixes 数组
    prefixes: [],
    no4: false,
    nice: false,
    customNumbers: [],
    customMode: 'include',
    matchMode: 'none',
    matchValue: ''
  }));
  const [searchQuery, setSearchQuery] = useState(''); // 用户输入的搜索词
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20); // 每页显示数量
  
  // 🔍 使用防抖Hook，800ms延迟（增加延迟减少请求）
  const debouncedSearchQuery = useDebounce(searchQuery, 800);
  
  // 请求节流控制
  const lastRequestTime = useRef(0);
  const requestQueue = useRef([]);
  const isRequestInProgress = useRef(false);
  const currentFetchController = useRef(null); // 取消上一次请求，避免并发
  const lastRequestSigRef = useRef(null); // 去重签名，避免重复请求
  const responseCacheRef = useRef(new Map()); // 简易缓存：sig -> { data, pagination, ts }
  const CACHE_TTL_MS = 10 * 1000; // 10秒缓存，减少抖动重复

  // 初始化安全防护
  useEffect(() => {
    try {
      if (process.env.NODE_ENV === 'production') {
        initSecurity(); // 生产环境启用完整安全保护
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // 静默处理安全初始化错误
      }
    }
  }, []);

  // 应用初始化
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 模拟初始化过程
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 会话握手：优先使用会话密钥（AES-GCM），失败回退旧版CBC
        // 中文注释：前端生成随机会话密钥，使用后端RSA公钥加密后上送，后端返回令牌
        try {
          await cryptoClient.initSession();
        } catch (_) {
          // 静默降级，保持兼容
        }

        // 加载数据索引
        await loadDataIndex();
        
        // 设置应用就绪
        setAppReady(true);
        setInitialLoading(false);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          // 静默处理应用初始化错误
        }
        setError('应用初始化失败: ' + error.message);
        setInitialLoading(false);
        setAppReady(true); // 即使初始化失败也要显示界面
      }
    };

    initializeApp();
  }, []);

  // 请求节流函数 - 防止请求过于频繁
  const throttleRequest = useCallback((requestFn, minInterval = 1000) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    
    if (isRequestInProgress.current) {
      return Promise.resolve();
    }
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      return new Promise(resolve => {
        setTimeout(() => {
          lastRequestTime.current = Date.now();
          resolve(requestFn());
        }, waitTime);
      });
    }
    
    lastRequestTime.current = now;
    return requestFn();
  }, []);

  // 查询号码数据的内部函数 - 增强版错误处理
  const performQuery = useCallback(async (page = 1, isSearchQuery = false, isRetry = false) => {
    // 请求节流保护
    return throttleRequest(async () => {
      if (isRequestInProgress.current) {
        return;
      }
      
      try {
        isRequestInProgress.current = true;
        
        // 根据查询类型设置不同的加载状态
        if (isSearchQuery) {
          setSearchLoading(true);
        } else {
          setLoading(true);
        }
        setError(null);
        setRateLimited(false);

        // 构建请求签名，避免重复
        const reqSigObj = {
          f: { prefix: filters.prefix, no4: !!filters.no4, nice: !!filters.nice, c: (filters.customNumbers||[]).join(','), m: filters.customMode||'include' },
          s: debouncedSearchQuery || '',
          p: page,
          ps: pageSize
        };
        const reqSig = JSON.stringify(reqSigObj);
        if (!isRetry && lastRequestSigRef.current === reqSig) {
          // 检查缓存
          const cached = responseCacheRef.current.get(reqSig);
          if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
            setCurrentData(cached.data);
            setPagination(cached.pagination);
            setCurrentPage(page);
            setLoading(false);
            setSearchLoading(false);
            return;
          }
        }
        lastRequestSigRef.current = reqSig;

        // 取消上一次请求
        if (currentFetchController.current) {
          try { currentFetchController.current.abort(); } catch(_) {}
        }
        currentFetchController.current = new AbortController();

        const response = await fetch(buildApiUrl(API_ENDPOINTS.QUERY_NUMBERS), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 中文注释：如果已完成会话握手，则携带混淆后的会话令牌
            ...(cryptoClient.sessionToken ? { 
              'X-Session-Token': await cryptoClient.obfuscateTransport(cryptoClient.sessionToken),
              'X-Obf-Salt': cryptoClient._deviceSalt || 'nosalt'
            } : {})
          },
          signal: currentFetchController.current.signal,
          body: JSON.stringify({
            filters,
            search: debouncedSearchQuery,
            page,
            pageSize
          })
        });

        // 特殊处理429错误
        if (response.status === 429) {
          setRateLimited(true);
          setRetryCount(prev => prev + 1);
          
          // 指数退避重试
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setError(`请求过于频繁，${retryDelay/1000}秒后自动重试...`);
          
          setTimeout(() => {
            if (retryCount < 3) { // 最多重试3次
              performQuery(page, isSearchQuery);
            } else {
              setError('请求次数过多，请稍后手动刷新页面');
              setRetryCount(0);
            }
          }, retryDelay);
          
          return;
        }

        // 处理401：生产环境未建立安全会话，先握手后重试一次
        if (response.status === 401) {
          try {
            await cryptoClient.initSession();
            const retryResp = await fetch(buildApiUrl(API_ENDPOINTS.QUERY_NUMBERS), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(cryptoClient.sessionToken ? { 
                  'X-Session-Token': await cryptoClient.obfuscateTransport(cryptoClient.sessionToken),
                  'X-Obf-Salt': cryptoClient._deviceSalt || 'nosalt'
                } : {})
              },
              body: JSON.stringify({
                filters,
                search: debouncedSearchQuery,
                page,
                pageSize
              })
            });
            if (!retryResp.ok) throw new Error(`请求失败 (${retryResp.status}): ${retryResp.statusText}`);
            const retryJson = await retryResp.json();
            if (retryJson.encrypted && retryJson.data) {
              const decryptedRetry = await cryptoClient.decryptData(retryJson.data, retryJson.alg);
              if (decryptedRetry && decryptedRetry.success) {
                const data = decryptedRetry.data || [];
                const paginationInfo = decryptedRetry.pagination || {};
                setCurrentData(data.map(x => String(x)).filter(x => /\d/.test(x)));
                setPagination(paginationInfo);
                setCurrentPage(page);
                if (paginationInfo.pageSize && paginationInfo.pageSize !== pageSize) {
                  setPageSize(paginationInfo.pageSize);
                }
                setRetryCount(0);
                setRateLimited(false);
                return; // 重试成功后结束
              }
            }
          } catch (e) {
            // 握手或重试失败，继续走通用错误分支
          }
        }

        if (!response.ok) {
          throw new Error(`请求失败 (${response.status}): ${response.statusText}`);
        }

        const result = await response.json();
        if (result.encrypted && result.data) {
          try {
            const decryptedResult = await cryptoClient.decryptData(result.data, result.alg);
            if (decryptedResult && decryptedResult.success) {
              const data = decryptedResult.data || [];
              const paginationInfo = decryptedResult.pagination || {};
              setCurrentData(data.map(x => String(x)).filter(x => /\d/.test(x)));
              setPagination(paginationInfo);
              setCurrentPage(page);
              if (paginationInfo.pageSize && paginationInfo.pageSize !== pageSize) {
                setPageSize(paginationInfo.pageSize);
              }
              setRetryCount(0);
              setRateLimited(false);
              // 写入缓存
              responseCacheRef.current.set(reqSig, {
                data: data.map(x => String(x)).filter(x => /\d/.test(x)),
                pagination: paginationInfo,
                ts: Date.now()
              });
              return;
            }
            throw new Error('数据解密失败');
          } catch (e) {
            // 解密失败自愈：尝试重新握手一次后重试
            if (!isRetry) {
              try {
                await cryptoClient.initSession();
                return await performQuery(page, isSearchQuery, true);
              } catch (_) {}
            }
            throw e;
          }
        } else {
          throw new Error('数据格式错误');
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          // 静默处理查询错误
        }
        
        // 根据错误类型提供不同的错误信息
        let errorMessage = '查询失败，请重试';
        if (error.message.includes('429')) {
          errorMessage = '请求过于频繁，请稍后再试';
          setRateLimited(true);
        } else if (error.message.includes('网络')) {
          errorMessage = '网络连接异常，请检查网络';
        } else if (error.message.includes('解密')) {
          errorMessage = '数据解密失败，请刷新页面';
        }
        
        setError(errorMessage);
        
        // 防止完全清空数据导致白屏
        if (currentData.length === 0) {
          setCurrentData(['暂无数据']);
        }
        
        setPagination({
          currentPage: 1,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
      } finally {
        setLoading(false);
        setSearchLoading(false);
        isRequestInProgress.current = false;
        currentFetchController.current = null;
      }
    }, rateLimited ? 2000 : 1000); // 如果被限流，增加节流间隔
  }, [filters, debouncedSearchQuery, pageSize, throttleRequest, rateLimited, retryCount, currentData.length]);

  // 创建稳定的查询函数引用，避免useEffect依赖问题
  const performQueryRef = useRef();
  performQueryRef.current = performQuery;

  // 初始数据加载
  useEffect(() => {
    if (dataIndex) {
      performQueryRef.current(1);
    }
  }, [dataIndex]); // 使用ref避免函数依赖

  // 当筛选条件变化时，重置到第一页并查询（兼容同步：若旧prefix存在则迁移到prefixes）
  useEffect(() => {
    if (!dataIndex) return; // 早期返回，防止不必要的执行
    
    // 兼容同步：将旧 filters.prefix 迁移到 filters.prefixes（只在存在旧字段时迁移一次）
    if (filters && filters.prefix && (!filters.prefixes || filters.prefixes.length === 0)) {
      setFilters(prev => ({
        ...prev,
        prefixes: prev.prefix ? [prev.prefix] : [],
        prefix: undefined
      }));
      return; // 等待下一轮渲染后再触发查询
    }

    setCurrentPage(1);
    performQueryRef.current(1, false);
  }, [filters.prefix, filters.prefixes, filters.no4, filters.nice, filters.customNumbers, filters.customMode, filters.matchMode, filters.matchValue, dataIndex]); // 安全的依赖

  // 当防抖后的搜索词变化时，重置到第一页并查询
  useEffect(() => {
    if (!dataIndex) return; // 早期返回，确保dataIndex存在
    
    if (searchQuery !== '') {
      setCurrentPage(1);
      performQueryRef.current(1, true);
    } else if (searchQuery === '' && debouncedSearchQuery !== '') {
      setCurrentPage(1);
      performQueryRef.current(1, false);
    }
  }, [debouncedSearchQuery, searchQuery, dataIndex]); // 安全的依赖

  // 当页码变化时查询
  useEffect(() => {
    if (!dataIndex) return; // 仅在索引就绪后处理
    // 中文注释：当页码变化时始终拉取对应页数据（包括第1页），避免无法回到第一页的问题
    performQueryRef.current(currentPage, false);
  }, [currentPage, dataIndex]); // 安全的依赖

  // 当页面大小变化时，重新查询第一页数据
  useEffect(() => {
    if (!dataIndex) return; // 早期返回，确保dataIndex存在
    
    performQueryRef.current(1, false);
  }, [pageSize, dataIndex]); // 当pageSize改变时重新查询

  /**
   * 加载数据索引 - 增强版错误处理
   */
  const loadDataIndex = async () => {
    try {
      setLoading(true);
      setError(null);
      setRateLimited(false);

      const response = await fetch(buildApiUrl(API_ENDPOINTS.INDEX), {
        headers: {
          ...(cryptoClient.sessionToken ? { 
            'X-Session-Token': await cryptoClient.obfuscateTransport(cryptoClient.sessionToken),
            'X-Obf-Salt': cryptoClient._deviceSalt || 'nosalt'
          } : {})
        }
      });
      
      // 处理429限流错误
      if (response.status === 429) {
        setRateLimited(true);
        setError('系统繁忙，正在重试连接...');
        
        // 延迟重试
        setTimeout(() => {
          loadDataIndex();
        }, 3000);
        return;
      }
      
      if (response.status === 401) {
        try {
          await cryptoClient.initSession();
          const retryResp = await fetch(buildApiUrl(API_ENDPOINTS.INDEX), {
            headers: {
              ...(cryptoClient.sessionToken ? { 'X-Session-Token': cryptoClient.sessionToken } : {})
            }
          });
          if (!retryResp.ok) throw new Error(`HTTP ${retryResp.status}: ${retryResp.statusText}`);
          const retryJson = await retryResp.json();
          if (retryJson.encrypted && retryJson.data) {
            const decryptedRetry = await cryptoClient.decryptData(retryJson.data, retryJson.alg);
            if (decryptedRetry && decryptedRetry.success && decryptedRetry.data) {
              setDataIndex(decryptedRetry.data);
              setRateLimited(false);
              return; // 成功后结束
            }
          }
        } catch (_) {}
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.encrypted && result.data) {
        // 中文注释：索引返回同样支持GCM优先、CBC兼容
        const decryptedResult = await cryptoClient.decryptData(result.data, result.alg);
        if (decryptedResult && decryptedResult.success && decryptedResult.data) {
          setDataIndex(decryptedResult.data);
          setRateLimited(false);
        } else {
          throw new Error('数据解密失败');
        }
      } else {
        throw new Error('数据格式错误');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // 静默处理索引加载错误
      }
      
      // 防止白屏，提供降级数据
      const fallbackIndex = {
        total: 0,
        segments: ['130', '131', '132', '155', '156', '166', '176', '185', '186'],
        segmentCounts: {},
        no4Count: 0,
        niceCount: 0,
        lastUpdated: new Date().toISOString()
      };
      
      setDataIndex(fallbackIndex);
      setError('数据加载失败，正在使用缓存数据，请刷新页面获取最新数据');
    } finally {
      setLoading(false);
    }
  };



  /**
   * 📄 页码变化处理
   */
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  }, [pagination.totalPages]);

  /**
   * 📊 页面大小变化处理
   */
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 改变页面大小时重置到第一页
  }, []);

  /**
   * 🔍 筛选条件变化处理
   */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * 🔎 搜索词变化处理
   */
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  /**
   * 📊 统计数据计算
   */
  const stats = useMemo(() => {
    if (!dataIndex || !pagination) return null;
    
    return {
      totalNumbers: dataIndex.total || 0,
      segments: dataIndex.segments?.length || 0,
      currentPage: pagination.currentPage || 1,
      totalPages: pagination.totalPages || 0,
      filteredCount: pagination.totalItems || 0
    };
  }, [dataIndex, pagination]);

  // 如果处于调试模式，直接显示调试界面
  if (debugMode) {
    return (
      <ConfigProvider 
        theme={appTheme}
      >
        <Layout style={{ minHeight: '100vh' }}>
          <Header style={{ 
            background: '#ff4d4f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              🔧 调试模式
            </Title>
            <Button 
              type="primary" 
              ghost 
              onClick={() => setDebugMode(false)}
            >
              返回正常模式
            </Button>
          </Header>
          <Content>
            <DebugTest />
          </Content>
        </Layout>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider 
      theme={appTheme}
    >
      <div>
      {/* 全局加载动画 - 移到 ConfigProvider 内部 */}
      <GlobalLoading 
        loading={initialLoading} 
        type="initial" 
        delay={100}
        minDuration={1200}
      />
      
      {/* 数据加载动画 */}
      <GlobalLoading 
        loading={loading && appReady} 
        type="data" 
        delay={200}
        minDuration={600}
      />

      <Layout style={{ 
        minHeight: '100vh', 
        height: '100vh', // 固定视口高度
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        overflow: 'hidden' // 防止整体页面滚动，让内容区域自己滚动
      }}>
        {/* 页面头部 - 修复溢出问题 */}
        <Header 
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 min(32px, 4vw)',
            minHeight: '80px', // 改为minHeight，允许内容撑开
            height: 'auto',
            lineHeight: 1.2,
            overflow: 'visible', // 确保内容可见
            position: 'relative',
            zIndex: 100
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'min(16px, 2vw)',
            flex: 1,
            width: '100%',
            minHeight: '80px', // 保证最小高度
            padding: '12px 0' // 上下内边距
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: 'min(12px, 1.5vw)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              flexShrink: 0
            }}>
              <MobileOutlined style={{ 
                fontSize: 'min(32px, 4vw)', 
                color: '#ffffff',
                display: 'block'
              }} />
            </div>
            <div style={{ 
              flex: 1,
              minWidth: 0, // 防止flex item溢出
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Title level={2} style={{ 
                margin: '0 0 4px 0', 
                color: '#ffffff',
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontSize: 'clamp(18px, 4vw, 32px)', // 响应式字体大小
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                校园卡号码查询系统
              </Title>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'min(16px, 2vw)',
                flexWrap: 'wrap'
              }}>
                <Paragraph style={{ 
                  margin: 0, 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontSize: 'clamp(12px, 2vw, 14px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}>
                  <StarOutlined />
                  安全 · 高效 · 智能
                </Paragraph>
              </div>
            </div>
          </div>
        </Header>

        {/* 主要内容区域 - 美观的渐变背景 */}
        <Content style={{ 
          padding: 'min(32px, 4vw)', 
          background: 'transparent',
          flex: 1, // 使用flex布局自动填充剩余空间
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0 // 允许内容区域缩小
        }}>
          <div style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            position: 'relative',
            flex: 1,
            overflow: 'auto', // 允许内容滚动
            width: '100%'
          }}>
            {/* 初始加载时不显示内容，避免闪烁 */}
            {!appReady && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '400px'
              }}>
                <div style={{ 
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '40px',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}>
                  <Spin size="large" />
                  <div style={{ 
                    marginTop: '16px', 
                    color: '#667eea',
                    fontSize: '16px',
                    fontWeight: 500
                  }}>
                    系统初始化中...
                  </div>
                </div>
              </div>
            )}

            {/* 增强的错误状态处理 */}
            {error && (
              <Alert
                message={rateLimited ? "⚠️ 系统限流保护" : "❌ 数据加载异常"}
                description={
                  <div>
                    <div style={{ marginBottom: '8px' }}>{error}</div>
                    {rateLimited && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        为保护系统稳定，已启动请求限流机制。请稍后再试或刷新页面。
                      </div>
                    )}
                  </div>
                }
                type={rateLimited ? "warning" : "error"}
                showIcon
                style={{ marginBottom: '24px' }}
                action={
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!rateLimited && (
                      <Button 
                        size="small" 
                        type="primary" 
                        onClick={() => {
                          setError(null);
                          setRetryCount(0);
                          loadDataIndex();
                        }}
                        icon={<ReloadOutlined />}
                      >
                        重试
                      </Button>
                    )}
                    <Button 
                      size="small" 
                      onClick={() => window.location.reload()}
                      icon={<ReloadOutlined />}
                    >
                      刷新页面
                    </Button>
                    <Button 
                      size="small" 
                      onClick={() => setDebugMode(true)}
                      type="dashed"
                    >
                      🔧 调试模式
                    </Button>
                  </div>
                }
              />
            )}

            {/* 正常内容 - 只有应用就绪后才显示 */}
            {appReady && dataIndex && (
              <>
                {/* 统计面板 - 美化样式 */}
                {stats && (
                  <div style={{ marginBottom: '24px' }}>
                    <StatsPanel stats={stats} />
                  </div>
                )}

                {/* 筛选工具栏 - 美化卡片样式 */}
                <Card 
                  style={{ 
                    marginBottom: '24px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)'
                  }}
                  bodyStyle={{ padding: '24px' }}
                >
                  <FilterToolbar
                    filters={filters}
                    searchQuery={searchQuery}
                    searchLoading={searchLoading}
                    onFiltersChange={handleFiltersChange}
                    onSearchChange={handleSearchChange}
                    segments={dataIndex?.segments || []}
                  />
                </Card>

                {/* 查询结果区域 - 美化容器 */}
                <div style={{ 
                  position: 'relative', 
                  minHeight: '300px',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  {/* 搜索加载蒙层 - 美化样式 */}
                  {searchLoading && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        borderRadius: '20px',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                      }}
                    >
                      <div style={{ 
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '32px 40px',
                        borderRadius: '16px',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }}>
                        <Spin size="large" />
                        <div style={{ 
                          marginTop: '16px', 
                          color: '#667eea',
                          fontSize: '16px',
                          fontWeight: 500
                        }}>
                          正在搜索号码...
                        </div>
                      </div>
                    </div>
                  )}

                  {currentData.length > 0 ? (
                    <>
                      {/* 号码卡片网格 - 优化对齐和间距 */}
                      <Row 
                        gutter={[16, 16]} 
                        style={{ 
                          marginBottom: '24px',
                          opacity: searchLoading ? 0.6 : 1,
                          transition: 'opacity 0.3s ease',
                          // 确保所有行对齐
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'stretch' // 确保所有列等高
                        }}
                        justify="start" // 左对齐，避免最后一行居中
                      >
                        {currentData.map((number, index) => (
                          <Col 
                            key={`${number}-${index}`} 
                            xs={12} 
                            sm={8} 
                            md={6} 
                            lg={4} 
                            xl={3}
                            style={{
                              display: 'flex', // 确保Col内部也使用flex
                              marginBottom: '16px' // 统一底部间距
                            }}
                          >
                            <div style={{ 
                              width: '100%',
                              display: 'flex' // 确保卡片完全填充Col空间
                            }}>
                              <NumberCard 
                                number={number} 
                                customNumbers={filters?.customNumbers || []}
                                customFilterMode={filters?.customMode || 'include'}
                              />
                            </div>
                          </Col>
                        ))}
                      </Row>

                      {/* 分页组件 */}
                      {pagination.totalPages > 1 && (
                        <div style={{ opacity: searchLoading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
                          <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            hasNextPage={pagination.hasNextPage}
                            hasPrevPage={pagination.hasPrevPage}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            pageSize={pageSize}
                            totalItems={pagination.totalItems}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <Card style={{ opacity: searchLoading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
                      <EmptyState
                        icon={<SearchOutlined style={{ fontSize: '48px', color: '#d1d5db' }} />}
                        title="暂无匹配数据"
                        message="请尝试调整筛选条件或搜索关键词"
                      />
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>
        </Content>

        {/* 页脚 - 美化样式 */}
        <Footer 
          style={{ 
            textAlign: 'center', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderTop: 'none',
            color: '#ffffff',
            padding: 'min(24px, 3vw) min(32px, 4vw)',
            boxShadow: '0 -4px 20px rgba(102, 126, 234, 0.2)',
            flexShrink: 0, // 防止Footer被压缩
            minHeight: 'auto' // 允许Footer根据内容调整高度
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'min(12px, 2vw)',
            fontSize: 'clamp(12px, 2vw, 14px)',
            fontWeight: 500,
            flexWrap: 'wrap' // 允许内容换行
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <DatabaseOutlined style={{ fontSize: '16px' }} />
            </div>
            <span>&copy; 2025 校园卡号码查询系统</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>|</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '4px 12px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <RocketOutlined style={{ fontSize: '12px' }} />
              <span style={{ fontSize: '13px' }}>Powered by FallSakura</span>
            </div>
          </div>
        </Footer>
      </Layout>
    </div>
    </ConfigProvider>
  );
}

export default App;