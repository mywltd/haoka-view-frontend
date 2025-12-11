const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'static/js/[name].[contenthash:8].js' : 'static/js/bundle.js',
      chunkFilename: isProduction ? 'static/js/[name].[contenthash:8].chunk.js' : 'static/js/[name].chunk.js',
      // 阿里云Page部署：使用相对路径，确保资源可以正确加载
      publicPath: isProduction ? './' : '/',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: 'defaults' }],
                ['@babel/preset-react', { runtime: 'automatic' }]
              ]
            }
          }
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html',
        inject: true,
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        } : false,
      }),
      // 生产环境代码混淆，增强安全性
      ...(isProduction ? [
        new WebpackObfuscator({
          // 降低混淆等级 - 优先保证代码正常运行
          compact: true, // 仅压缩代码
          identifierNamesGenerator: 'hexadecimal', // 使用简单的标识符生成
          renameGlobals: false, // 不重命名全局变量（保护第三方库）
          
          // 最小化字符串混淆 - 避免破坏框架
          stringArray: true, // 基础字符串数组
          stringArrayEncoding: [], // 禁用编码，避免兼容性问题
          stringArrayWrappersCount: 1, // 最少包装器
          stringArrayWrappersType: 'variable', // 使用变量避免arguments问题
          stringArrayThreshold: 0.3, // 较低阈值，减少混淆
          rotateStringArray: false, // 禁用旋转
          
          // 禁用所有可能破坏框架的功能
          controlFlowFlattening: false, // 禁用控制流扁平化
          deadCodeInjection: false, // 禁用死代码注入
          selfDefending: false, // 禁用自我保护
          debugProtection: false, // 禁用调试保护
          
          // 禁用高级特性以确保兼容性
          unicodeEscapeSequence: false, // 禁用Unicode转义
          transformObjectKeys: false, // 禁用对象键转换（关键！防止破坏 Ant Design）
          splitStrings: false, // 禁用字符串分割
          
          // 保留控制台输出用于调试
          disableConsoleOutput: false, // 保留console，便于排查问题
          
          // 排除配置
          exclude: [/node_modules/], // 排除node_modules
          ignoreRequireImports: true, // 忽略模块导入
        })
      ] : [])
    ],
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      port: 3000,
      hot: true,
      historyApiFallback: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    devtool: isProduction ? false : 'eval-source-map', // 生产环境完全禁用source map
    optimization: {
      minimize: isProduction,
      minimizer: isProduction ? [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false, // 保留console语句，便于排查问题
              drop_debugger: true, // 移除debugger语句
              pure_funcs: [], // 不移除函数调用，保持代码完整性
              passes: 1, // 单次优化，减少破坏风险
            },
            mangle: {
              safari10: true, // Safari 10兼容性
              properties: false, // 禁用属性名混淆，避免破坏对象结构
            },
            format: {
              comments: false, // 移除注释
              ascii_only: true, // 确保输出为ASCII字符
            },
          },
          extractComments: false, // 不提取注释到单独文件
        })
      ] : [],
      splitChunks: isProduction ? {
        chunks: 'all',
        maxSize: 200000, // 限制chunk大小
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          }
        },
      } : false,
      // 生产环境优化设置
      usedExports: isProduction, // 标记未使用的导出
      sideEffects: false, // 标记代码为无副作用
      concatenateModules: isProduction, // 作用域提升
      providedExports: isProduction, // 优化导出分析
    },
  };
};
