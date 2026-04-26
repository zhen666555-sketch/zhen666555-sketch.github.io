# 个人主页部署文档

## 项目概述

这是一个视觉效果炫酷的个人主页网站，包含以下核心特性：

- 动态粒子背景效果，响应鼠标交互
- 磨砂玻璃卡片设计
- 渐变文字效果
- 鼠标跟随效果
- 暗黑风格设计
- 响应式布局，适配桌面端和移动端
- 基于个人资料内容的信息架构

## 技术栈

- HTML5
- CSS3
- JavaScript (原生)
- 无外部依赖

## 部署到 GitHub Pages

### 步骤 1: 创建 GitHub 仓库

1. 登录 GitHub 账号
2. 点击右上角的 "+", 选择 "New repository"
3. 仓库名称建议使用 `username.github.io`（其中 username 是你的 GitHub 用户名）
4. 选择 "Public" 权限
5. 勾选 "Initialize this repository with a README"
6. 点击 "Create repository"

### 步骤 2: 克隆仓库到本地

```bash
git clone https://github.com/username/username.github.io.git
cd username.github.io
```

### 步骤 3: 添加项目文件

1. 将 `index.html` 文件复制到克隆的仓库目录中
2. 确保文件结构如下：

```
username.github.io/
├── index.html
└── README.md
```

### 步骤 4: 提交并推送更改

```bash
git add .
git commit -m "Initial commit: Add personal website"
git push origin main
```

### 步骤 5: 启用 GitHub Pages

1. 进入仓库设置页面
2. 点击左侧菜单中的 "Pages"
3. 在 "Source" 部分，选择 "main" 分支，然后点击 "Save"
4. 等待几分钟，GitHub Pages 会自动构建并部署你的网站
5. 部署完成后，你会看到一个 URL，格式为 `https://username.github.io`

## 自定义配置

### 修改个人信息

打开 `index.html` 文件，修改以下内容：

1. 姓名：修改 `<h1>曹泽祯</h1>` 为你的姓名
2. 职业：修改 `<p class="subtitle">全栈开发工程师 | 技术创新者</p>` 为你的职业
3. 关于我：修改 `<div id="about">` 部分的内容
4. 技能：修改 `<div id="skills">` 部分的内容
5. 项目经历：修改 `<div id="projects">` 部分的内容
6. 联系方式：修改 `<footer id="contact">` 部分的内容
7. 社交媒体链接：修改 `<div class="social-links">` 部分的链接

### 自定义样式

你可以通过修改 CSS 变量和样式规则来自定义网站的外观：

1. 主题颜色：修改 `--primary-color` 和 `--secondary-color` 变量
2. 字体：修改 `font-family` 规则
3. 粒子效果：修改 `Particles` 类中的参数
4. 鼠标跟随效果：修改 `Cursor` 类中的参数

## 性能优化

1. **图片优化**：如果添加图片，请确保压缩图片大小
2. **代码压缩**：可以使用工具压缩 HTML、CSS 和 JavaScript 文件
3. **缓存策略**：GitHub Pages 会自动处理静态资源的缓存
4. **响应式设计**：网站已经实现了响应式布局，适配不同屏幕尺寸

## 故障排除

### 网站不显示

1. 确保仓库名称格式正确：`username.github.io`
2. 确保分支设置正确：在 GitHub Pages 设置中选择了正确的分支
3. 等待几分钟，GitHub Pages 构建需要时间
4. 检查浏览器控制台是否有错误

### 样式问题

1. 确保 CSS 路径正确
2. 检查浏览器兼容性
3. 清除浏览器缓存

### 粒子效果不工作

1. 确保 JavaScript 代码没有错误
2. 检查浏览器控制台是否有错误
3. 确保 Canvas 元素正确初始化

## 总结

通过以上步骤，你可以将个人主页部署到 GitHub Pages 上，使其可以通过 `https://username.github.io` 访问。

如果你需要进一步的自定义或有任何问题，请参考 GitHub Pages 官方文档：[GitHub Pages 文档](https://docs.github.com/en/pages)