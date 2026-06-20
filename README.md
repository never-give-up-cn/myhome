# CYH · 摄影笔记 📷

> 用镜头定格时光 —— 一个摄影爱好者的 Hexo 个人主页

基于 **[Hexo](https://hexo.io/)** 构建，使用 **[Butterfly](https://github.com/jerryc127/hexo-theme-butterfly)** 主题。

## 📚 文章列表

| 分类 | 文章 |
|------|------|
| 📷 **摄影教程** | LOFIC 技术科普、风光构图技巧、黑白摄影 |
| 📸 **器材评测** | DJI Pocket 4P vs Insta360 Luna Ultra 对比、新手器材推荐 |
| ✍️ **摄影随笔** | 我与摄影的故事、七年摄影路、手机相册、日常记录 |
| 🖥️ **技术笔记** | 家庭网络拓扑与静态路由、ESXi 网络架构、自建机房成本分析 |

## ✨ 功能特性

- 🦋 **Butterfly 主题** — 响应式设计，移动端友好
- 🌗 **亮/暗模式** — 自动跟随系统或手动切换
- 🔍 **全文搜索** — 本地搜索，实时查找文章
- 🖼️ **作品集页面** — 摄影作品展示
- 🏷️ **标签 & 分类** — 文章精细组织
- 🎯 **打字机效果** — 首页动态标语
- 📊 **站点统计** — Busuanzi PV/UV 统计
- 📡 **RSS 订阅** — Atom 输出
- 🎨 **代码高亮** — Prism.js 支持
- ❤️ **点击爱心 + 烟花** — 页面交互特效
- 🕸️ **粒子网络** — Canvas 动态背景
- 🗺️ **Sitemap** — SEO 优化

## 📂 站点结构

```
source/
├── _posts/                 # 博客文章（摄影 + 技术）
├── about/                  # 关于页面
├── photos/                 # 作品集页面
├── cover/                  # 封面页（摄影才是真爱）
├── tags/                   # 标签页
├── categories/             # 分类页
├── css/custom.css          # 自定义样式
├── js/random-cover.js      # 首页随机封面
└── img/
    ├── cover.jpg           # 封面/横幅图片
    ├── avatar.jpg          # 头像
    ├── topo-full.png       # 网络拓扑图
    ├── esxi-network.png    # ESXi 网络架构图
    ├── photos/             # 摄影作品原图
    └── posts/              # 文章插图
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装

```bash
git clone https://github.com/never-give-up-cn/myhome.git
cd myhome
npm install
```

### 本地开发

```bash
hexo server --port 7200
# 访问 http://localhost:7200
```

### 写作

```bash
hexo new "文章标题"
hexo new page "页面名"
```

### 构建

```bash
hexo clean && hexo generate
```

## ⚙️ 配置说明

| 文件 | 说明 |
|------|------|
| `_config.yml` | 站点基础配置 |
| `_config.butterfly.yml` | Butterfly 主题配置 |

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Hexo](https://hexo.io/) | 静态站点生成器 v5 |
| [Butterfly](https://github.com/jerryc127/hexo-theme-butterfly) | 主题框架 |
| [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli) | 拓扑图渲染 |
| [hexo-generator-search](https://github.com/hexojs/hexo-generator-search) | 本地搜索 |
| [hexo-generator-sitemap](https://github.com/hexojs/hexo-generator-sitemap) | SEO |
| [hexo-filter-nofollow](https://github.com/hexojs/hexo-filter-nofollow) | 外链处理 |

## 📄 License

[MIT](LICENSE)
