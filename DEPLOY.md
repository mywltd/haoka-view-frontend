# 阿里云Page部署指南

## 部署步骤

### 1. 准备构建

在项目根目录执行：

```bash
# 安装前端依赖
cd frontend
npm install

# 构建生产版本
npm run build
```

构建完成后，`dist` 目录将包含所有静态文件。

### 2. 阿里云Page配置

1. 登录阿里云控制台，进入 **云开发平台** > **静态网站托管**（或 **Page服务**）
2. 创建新的静态网站托管服务
3. 配置构建设置：
   - **构建目录**: `frontend/dist`
   - **构建命令**: `cd frontend && npm install && npm run build`
   - **Node版本**: 22.x（根据项目要求）
   - **输出目录**: `dist`

### 3. 环境变量（如需要）

如果需要在构建时使用环境变量，可以在阿里云Page的构建配置中添加：
- `NODE_ENV=production`

### 4. 部署注意事项

- ✅ 确保 `publicPath` 已设置为相对路径 `./`，适合静态部署
- ✅ 所有API请求使用相对路径 `/api/*`，需要配置反向代理或API网关
- ✅ 确保 `dist` 目录包含 `index.html` 和所有静态资源

### 5. 自定义域名配置

部署成功后，可以配置自定义域名：
1. 在阿里云Page控制台找到域名配置
2. 添加自定义域名并配置DNS解析
3. 如需HTTPS，启用SSL证书

## 构建输出结构

```
frontend/dist/
├── index.html
└── static/
    └── js/
        ├── main.[hash].js
        └── vendors-[hash].[hash].js
```

## 故障排查

### 问题：资源404错误
- 检查 `webpack.config.js` 中的 `publicPath` 是否为 `./`
- 确认构建输出目录结构正确

### 问题：API请求失败
- 前端使用 `/api/*` 路径，需要在阿里云Page配置反向代理
- 或使用API网关转发请求到后端服务

### 问题：构建失败
- 检查 Node.js 版本是否为 22.x
- 确认所有依赖已正确安装
- 查看构建日志中的具体错误信息

