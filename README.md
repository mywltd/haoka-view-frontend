# 校园卡号码展示系统 - React前端

## 🚀 快速开始

### 开发环境

1. **安装依赖**
```bash
npm install
```

2. **启动开发服务器**
```bash
npm run dev
```
前端开发服务器将在 `http://localhost:3000` 启动，并自动代理API请求到后端 `http://localhost:8000`

### 生产环境

1. **构建生产版本**
```bash
npm run build
```

2. **构建文件**
构建完成后，生产文件将位于 `dist/` 目录中，包含：
- `index.html` - 主页面
- `static/js/` - JavaScript文件
- `static/css/` - CSS文件

## 📦 项目结构

```
frontend/
├── public/
│   └── index.html          # HTML模板
├── src/
│   ├── components/         # React组件
│   │   ├── App.jsx        # 主应用组件
│   │   ├── DataTypeSelector.jsx
│   │   ├── FilterToolbar.jsx
│   │   ├── StatsPanel.jsx
│   │   ├── NumberCard.jsx
│   │   ├── Pagination.jsx
│   │   ├── Loading.jsx
│   │   └── EmptyState.jsx
│   ├── utils/             # 工具函数
│   │   ├── crypto.js      # 加密工具（已混淆）
│   │   └── helpers.js     # 辅助函数
│   ├── styles/            # 样式文件
│   │   └── index.css      # 主样式文件
│   └── index.js           # 入口文件
├── webpack.config.js       # Webpack配置
├── .babelrc               # Babel配置
└── package.json           # 项目配置
```

## 🔒 安全特性

### 前端安全
- **代码混淆**: 加密模块使用深度混淆，防止逆向工程
- **反调试保护**: 多层反调试检测机制
- **CSP策略**: 严格的内容安全策略
- **禁用开发者工具**: 生产环境下禁用F12等调试工具

### 数据安全
- **强制加密**: 所有API数据传输强制使用AES+RSA加密
- **安全验证**: 拒绝未加密的数据传输
- **请求限制**: 防止暴力请求攻击

## 🛠️ 技术栈

- **React 18**: 现代React框架
- **Webpack 5**: 模块打包工具
- **Babel**: JavaScript编译器
- **CSS3**: 现代CSS特性
- **Web Crypto API**: 浏览器原生加密API

## 📱 响应式设计

- **桌面端**: 1400px最大宽度，多列网格布局
- **平板端**: 768px以下自适应布局
- **移动端**: 480px以下单列布局

## 🔧 开发配置

### Webpack配置特性
- **开发模式**: 热重载、Source Map、代理API
- **生产模式**: 代码分割、压缩优化、内容哈希
- **代码分割**: 自动分离vendor和应用代码

### Babel配置
- **ES6+语法**: 支持最新JavaScript特性
- **React JSX**: 自动处理JSX语法
- **浏览器兼容**: 支持现代浏览器

## 🚀 部署

### 自动部署
在项目根目录运行：
```bash
npm run build
```
构建文件将自动被后端服务器识别和使用。

### 手动部署
1. 构建前端：`npm run build`
2. 将 `dist/` 目录内容复制到服务器
3. 配置Web服务器支持SPA路由

## 🔍 调试

### 开发环境调试
- 使用浏览器开发者工具
- React DevTools扩展
- 网络面板查看API请求

### 生产环境
- 安全保护机制会阻止调试
- 查看控制台错误信息
- 使用Source Map进行错误定位

## 📋 注意事项

1. **安全限制**: 生产环境下无法使用开发者工具
2. **加密传输**: 所有数据都经过加密，无法直接查看
3. **浏览器兼容**: 需要支持ES6+和Web Crypto API的现代浏览器
4. **网络要求**: 需要稳定的网络连接进行加密通信
