# SoundChar - 早期汉字音频可视化

基于早期汉字造字逻辑的"形、义、声"重构方法，探索符号设计的新可能性。通过音频输入实时生成动态的汉字符号可视化。

## ✨ 特性

- 🎵 **音频响应式**: 通过麦克风输入实时控制字符形态变化
- 📱 **移动端适配**: 完整的移动端交互体验
- 🎨 **多模式显示**: 支持黑白/彩色模式切换
- 📊 **28个字符**: 包含气、月、金、木、水、火、土等传统汉字
- 💾 **导出功能**: 支持将当前可视化状态保存为PNG图片
- 🔧 **调试模式**: 开发时可手动控制音频参数

## 🚀 快速开始

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🎮 使用方法

1. **启动音频**: 点击播放按钮并允许麦克风权限
2. **观察变化**: 对着麦克风发声，观察字符根据音频参数的实时变化
3. **切换字符**: 
   - 桌面端：使用左右箭头按钮
   - 移动端：点击右上角网格按钮选择字符
4. **颜色模式**: 点击右侧开关切换黑白/彩色显示
5. **保存图片**: 点击下载按钮保存当前可视化状态

## 🏗️ 技术架构

- **框架**: Next.js 14 (React)
- **可视化**: p5.js + Web Audio API
- **样式**: Tailwind CSS
- **音频处理**: FFT分析 (响度、频谱重心)
- **响应式设计**: 移动端优先

## 📁 项目结构

```
src/
├── constants/          # 应用常量配置
├── hooks/             # 自定义React Hooks
├── components/
│   ├── icons/         # SVG图标组件
│   ├── mobile/        # 移动端专用组件
│   ├── panels/        # 面板组件
│   ├── sketch.js      # p5.js画布组件
│   └── chardata.js    # 字符数据和绘制逻辑
└── app/
    └── page.js        # 主页面
```

## 🎯 核心概念

### 音频映射
- **响度 (Loudness)**: 控制笔画粗细和透明度
- **频谱重心 (Spectral Centroid)**: 控制字符形态和颜色分布

### 字符类型
- `BLOCK_W`: 矩形笔画
- `BLOCK_W_MID`: 中心对齐矩形
- `ARC`: 弧线
- `POLYLINE`: 多线段
- `CIRCLE`: 圆形

## 📱 移动端功能

- 左上角：切换介绍面板
- 右上角：字符选择网格
- 触摸友好的界面设计
- 优化的移动端布局

## 🔧 开发配置

在 `src/constants/index.js` 中可以调整：
- `ENABLE_DEBUG`: 开启调试模式
- `CANVAS_CONFIG`: 画布配置
- `AUDIO_CONFIG`: 音频处理参数
- `BREAKPOINTS`: 响应式断点

## 📄 许可证

本项目用于学术研究和教育目的。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

---

*基于传统汉字造字逻辑与现代符号设计的结合，实现汉字文化元素的数字化、系统化、可视化表达。*
