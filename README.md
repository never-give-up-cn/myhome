# CYH · 摄影笔记 📷

> 用镜头定格时光 —— 一个摄影爱好者的 Hexo 个人主页

基于 **[Hexo](https://hexo.io/)** 构建，使用 **[Butterfly](https://github.com/jerryc127/hexo-theme-butterfly)** 主题，部署在 GitHub Pages。

## 功能特性

- 🦋 **Butterfly 主题** — 响应式设计，移动端友好
- 🌗 **亮/暗模式** — 自动跟随系统或手动切换
- 🔍 **全文搜索** — 本地搜索，实时查找文章
- 🖼️ **作品集页面** — 展示摄影作品
- 🏷️ **标签 & 分类** — 文章精细组织
- 📱 **移动端适配** — 完美支持手机浏览
- 🎯 **打字机效果** — 首页动态标语
- 📊 **站点统计** — 文章数、访问量、字数
- 📡 **RSS 订阅** — Atom 与 Feed 输出
- 🎨 **代码高亮** — Prism.js 支持

## 站点结构

```
source/
├── _posts/            # 博客文章
│   ├── hello-world-1.md                     # 我与摄影的故事
│   ├── my-dev-tools.md                      # 器材推荐
│   ├── learning-notes.md                    # 构图技巧
│   └── landscape-photography-techniques.md  # 风光实战技巧
├── about/             # 关于页面
├── photos/            # 作品集页面
├── tags/              # 标签页
├── categories/        # 分类页
└── img/               # 图片资源
    ├── avatar.jpg          # 头像
    ├── banner.svg          # 首页横幅
    ├── photos/             # 摄影作品原图
    └── posts/              # 文章插图
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
# 克隆项目
git clone https://github.com/never-give-up-cn/myhome.git
cd myhome

# 安装依赖
npm install
```

### 本地开发

```bash
# 启动开发服务器（默认端口 4000）
hexo server

# 指定端口
hexo server --port 6201
```

访问 `http://localhost:6201` 预览。

### 写作

```bash
# 创建新文章
hexo new "文章标题"

# 创建新页面
hexo new page "页面名"
```

### 构建与部署

```bash
# 清理缓存
hexo clean

# 生成静态文件
hexo generate

# 本地预览生成结果
hexo server
```

## 写作风格

本博客的文章采用 **Tim（影视飓风/潘天鸿）** 的表达风格撰写：

- 宏大开场 → 细节落地 → 哲学升华
- 真实、过程、无限进步 为核心关键词
- 技术问题果断、人生问题谦逊
- 多用反问句、平行递进、时间对比

## 配置说明

| 文件 | 说明 |
|------|------|
| `_config.yml` | 站点基础配置（标题、描述、URL 等） |
| `_config.butterfly.yml` | Butterfly 主题配置（导航、外观、功能开关等） |

主要修改 `_config.butterfly.yml` 中的以下字段：

- `avatar.img` — 头像图片路径
- `social` — 社交链接
- `aside.card_author` — 侧边栏个人信息
- `menu` — 导航菜单

## 技术栈

| 技术 | 用途 |
|------|------|
| [Hexo](https://hexo.io/) | 静态站点生成器 v5 |
| [Butterfly](https://github.com/jerryc127/hexo-theme-butterfly) | 主题框架 |
| [Prism.js](https://prismjs.com/) | 代码语法高亮 |
| [Local Search](https://github.com/hexojs/hexo-generator-search) | 本地全文搜索 |
| [hexo-wordcount](https://github.com/willin/hexo-wordcount) | 字数统计 |
| [hexo-generator-feed](https://github.com/hexojs/hexo-generator-feed) | RSS 生成 |

## License

[MIT](LICENSE)
