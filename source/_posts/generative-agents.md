---
title: Generative Agents——让 AI 在小镇里过日子的实验
date: 2026-06-23
tags:
  - AI
  - 智能体
  - 论文阅读
  - LLM
categories:
  - AI 研究
photos:
  - /img/posts/generative-agents-cover.png
  - /img/posts/generative-agents.svg
---

你想象过一群 AI 在一个虚拟小镇里自主生活的场景吗？

早上 7 点，John 起床洗漱，出门去咖啡馆的路上遇到了邻居 Isabella，两人停下来聊了几句昨天的经历。到了咖啡馆，吧台后的 Sam 已经准备好了他常点的早餐。与此同时，小镇另一头的公园里，几个居民正在讨论周末要办的艺术节。

这不是《模拟人生》的某个 Mod，也不是科幻电影——这是 **Generative Agents** 项目，一篇发表于 UIST '23 的论文，目前在 GitHub 上拥有 **21.6k+ Star**。

{% img /img/posts/generative-agents-cover.png '"Generative Agents 项目封面图" "Generative Agents"' %}

<!-- more -->

## 一句话说清楚

Generative Agents 的核心目标：**构建能够模拟可信人类行为的计算型智能体**。这些智能体生活在一个名为 **Smallville** 的虚拟小镇中，拥有独立的记忆、个性和日程，能够自主社交、规划和执行日常活动。

论文作者阵容相当强大：Joon Sung Park、Joseph C. O'Brien、Carrie J. Cai、Meredith Ringel Morris、Percy Liang、Michael S. Bernstein。Joon 之前在斯坦福，这篇论文发在人机交互顶会 UIST '23。

---

## Smallville 小镇

小镇里有一个咖啡馆、一个酒吧、一所大学、几家商店、一个公园，还有若干住宅。25 个智能体各司其职——有人当教授，有人做学生，有人经营店铺——按照设定的性格和角色生活。

你不需要复杂的 3D 渲染，项目用俯视 2D 像素地图呈现，更像早期 RPG 游戏风格。但这不重要，**核心是背后的行为仿真系统**。

<!-- 小镇地图见封面图 -->

---

## 技术架构

项目采用 **双服务器并发运行** 的设计模式：

### 1. 环境服务器（Django）
渲染游戏地图和展示智能体的实时移动，通过浏览器 `localhost:8000` 呈现小镇与智能体位置。

### 2. 智能体仿真服务器
运行核心仿真逻辑 `reverie.py`，通过 **OpenAI API** 驱动智能体的决策与行为生成。

两个服务器必须同时运行才能正常仿真。

{% img /img/posts/generative-agents.svg '"Generative Agents 架构示意" "架构图" %}

---

## 核心机制：智能体如何做决策？

这是整篇论文最精彩的部分。智能体的行为不是写死的脚本，而是通过一套层层递进的架构动态生成的：

### 记忆流（Memory Stream）

每个智能体有一个持续增长的记忆流，记录所有经历：
- 自己做过的动作
- 看到的事件
- 与其他智能体的对话
- 对人类操作的回应

记忆不是简单的文本存储，每条记忆都附带**时间戳**和**重要性分数**。

### 检索（Retrieval）

当智能体需要做决策时，系统从记忆流中检索三条信息：
1. **近期性** — 刚刚发生的事情更重要
2. **重要性** — 关键事件权重更高
3. **相关性** — 与当前情境有关的记忆优先

### 反思（Reflection）

智能体会定期对记忆进行**高层次抽象**。比如 John 连续三天看到小镇图书馆在施工，他可能产生反思："图书馆正在装修"→ "图书馆可能很快会重新开放"→ "我到时候可以去借书了"。

这种反思让智能体不只是在回放记忆，而是在**理解和推断**。

### 规划（Planning）

基于上述所有信息，智能体生成每日计划。计划是动态可调整的——如果遇到意外事件（比如路上碰到朋友聊了几句），智能体会实时调整后续安排。

```
07:00 起床、洗漱
08:00 去咖啡馆吃早餐
09:00 在大学上课（John 是教授）
12:00 午休，在公园散步
18:00 参加社区活动
22:00 回家睡觉
```

如果计划被打乱（比如咖啡馆临时关门），智能体会根据记忆和反思选择一个合理的替代方案，而不是卡住不动。

---

## 涌现行为

论文中最让人兴奋的部分是**涌现行为**（emergent behaviors）。作者没有显式编程以下行为，但智能体自发产生了：

- **信息传播**：一个智能体告诉另一个"咖啡馆要办 Valentine's Day 活动"，这个信息会在居民之间自然传播
- **协调行动**：多个智能体约好同一时间去同一地点
- **关系形成**：经常碰面的智能体会建立关系记忆，后续互动更加自然
- **对意外事件的反应**：如果某个智能体做了反常的事，目睹者会记住并在后续对话中提及

你点下运行按钮，然后把窗口最小化。再打开时，小镇里已经发生了各种你意想不到的故事——AI 版本"模拟人生"。

---

## 如何搭建与运行

项目开源在 GitHub（[joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents)，21.6k Star），采用 Apache-2.0 协议。以下是完整的本地搭建指南。

---

### 环境要求

| 项目 | 要求 |
|------|------|
| **Python** | 官方测试版本为 3.9.12，建议用相近版本 |
| **硬件** | 只要能跑 Python 就行，计算靠 OpenAI API |
| **网络** | 需要能正常访问 OpenAI API |
| **浏览器** | Chrome 或 Safari 推荐（Firefox 可能有前端小问题） |

---

### 第一步：克隆项目

```bash
git clone https://github.com/joonspk-research/generative_agents.git
cd generative_agents
```

---

### 第二步：创建虚拟环境并安装依赖

**强烈建议**使用虚拟环境，避免包冲突。项目依赖 69 个包，大部分固定了版本号。

```bash
# 创建虚拟环境（用 venv 或 conda 均可）
python -m venv venv

# 激活
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# 安装依赖（耐心等待，包比较多）
pip install -r requirements.txt
```

**关键依赖一览：**

| 包 | 用途 |
|------|------|
| `Django==2.2` | 环境服务器 Web 框架 |
| `openai==0.27.0` | 调用 OpenAI 的 GPT 系列模型 |
| `numpy==1.25.2` | 数值计算 |
| `pandas==2.0.3` | 数据处理与 CSV 加载 |
| `scikit-learn==1.3.0` | 智能体的相似度计算和检索 |
| `nltk==3.6.5` | 自然语言处理 |
| `gensim==3.8.0` | 词向量建模 |
| `matplotlib==3.7.2` | 数据可视化 |
| `tqdm==4.62.3` | 进度条显示 |

---

### 第三步：配置 OpenAI API Key

这是最关键的一步。在 `reverie/backend_server` 目录下创建 `utils.py` 文件：

```bash
cd reverie/backend_server
touch utils.py   # Windows 下用 type nul > utils.py
```

打开 `utils.py` 写入以下内容：

```python
# ！！！替换为你自己的信息
openai_api_key = "sk-your-openai-api-key-here"
key_owner = "your-name"

# 下面的路径通常不需要改动
maze_assets_loc = "../../environment/frontend_server/static_dirs/assets"
env_matrix = f"{maze_assets_loc}/the_ville/matrix"
env_visuals = f"{maze_assets_loc}/the_ville/visuals"
fs_storage = "../../environment/frontend_server/storage"
fs_temp_storage = "../../environment/frontend_server/temp_storage"
collision_block_id = "32125"

# 调试模式
debug = True
```

> **注意：** OpenAI API Key 需要去 [platform.openai.com/api-keys](https://platform.openai.com/api-keys) 获取。`openai==0.27.0` 用的是旧版 API，确保你的 Key 有对应模型的访问权限（建议使用 gpt-3.5-turbo 或 gpt-4）。

---

### 第四步：启动环境服务器

```bash
# 回到项目根目录
cd generative_agents/environment/frontend_server
python manage.py runserver
```

看到类似输出即表示启动成功：

```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).

Django version 2.2, using settings 'frontend_server.settings'
Starting development server at http://localhost:8000/
Quit the server with CTRL-BREAK.
```

浏览器打开 `http://localhost:8000/`，如果看到 **"Your environment server is up and running"**，说明环境服务器正常。

> **注意：** 这个终端窗口要保持运行，不要关闭。

---

### 第五步：启动仿真服务器

**新开一个终端**（刚才那个跑着 Django 不能关），同样进入虚拟环境：

```bash
# 激活虚拟环境（同上）
cd generative_agents/reverie/backend_server
python reverie.py
```

启动后会进入交互式命令行，依次提示输入：

```
Enter the name of the forked simulation:
```

这里输入预置存档的名称，项目内置了两个场景：

| 存档名称 | 说明 |
|----------|------|
| `base_the_ville_isabella_maria_klaus` | 3 个智能体的小场景，适合快速测试 |
| `base_the_ville_n25` | 25 个智能体的完整小镇，体验最佳效果 |

输入存档名称后：

```
Enter the name of the new simulation:
```

给本次仿真取个名字，比如 `my-first-run`。

然后就进入命令模式：

```
Enter option:
```

---

### 第六步：运行仿真

在命令模式下输入：

```
run 100
```

这里的数字是**时间步数**，每一步代表游戏内的 10 秒。所以 `run 100` = 模拟 1000 秒 ≈ 16 分钟游戏内时间。

**同时在浏览器打开：**

```
http://localhost:8000/simulator_home
```

你会看到 Smallville 的小镇地图，智能体们开始在地图上走动、对话、互动。地图顶部的当前游戏时间会不断推进。

---

### 第七步：保存与退出

- **保存并退出：** 输入 `fin`，仿真存档会保存到 `environment/frontend_server/storage` 目录，下次可以继续加载
- **不保存直接退出：** 输入 `exit` 或按 `Ctrl+C`

---

### 如何回放仿真

如果你想回看已经跑过的仿真：

```
http://localhost:8000/replay/<仿真名称>/<起始时间步>/
```

项目自带一个回放示例：

```
http://localhost:8000/replay/July1_the_ville_isabella_maria_klaus-step-3-20/1/
```

> 回放主要用于调试，注意所有角色在回放中看起来一样。

---

### 如何制作演示 Demo

先压缩仿真存档，运行压缩脚本：

```bash
cd generative_agents/reverie
python compress_sim_storage.py
```

在代码中调用 `compress()` 函数并传入你的仿真名称。然后访问：

```
http://localhost:8000/demo/<仿真名称>/<起始时间步>/<播放速度>/
```

**速度参数**：1（最慢）到 5（最快）

项目自带示例：

```
http://localhost:8000/demo/July1_the_ville_isabella_maria_klaus-step-3-20/1/3/
```

---

### 加载初始记忆（CSV）

你可以给智能体加载预设的历史记忆，在命令模式下输入：

```
call -- load history the_ville/<文件名>.csv
```

项目内置了两个示例文件：
- `agent_history_init_n25.csv`（25 智能体）
- `agent_history_init_n3.csv`（3 智能体）

自定义 CSV 文件需放在 `environment/frontend_server/static_dirs/assets/the_ville` 目录下，格式参考示例文件。

---

### 常见问题排查

**Q：OpenAI API 调用超时或挂起？**

A：OpenAI 的 API 有每小时速率限制，超出后会挂起。建议频繁 `fin` 保存存档，万一中断可以从存档继续。

**Q：API 费用高吗？**

A：作者 2023 年初的估算——大量智能体长时间运行，费用确实不低。每个智能体的决策都要调一次 API。建议先用 3 智能体场景测试。

**Q：Firefox 页面显示异常？**

A：官方推荐 Chrome 或 Safari。Firefox 可能有前端显示小问题，但不影响实际仿真逻辑。

**Q：提示端口 8000 被占用？**

A：`python manage.py runserver 0.0.0.0:8001` 换个端口。

**Q：找不到 `utils.py` 报错？**

A：确认 `reverie/backend_server/utils.py` 已创建且 API Key 已正确填写。

**Q：安装依赖时报版本冲突？**

A：`Django==2.2` 比较老，如果用 Python 3.11+ 可能会不兼容。建议用 Python 3.9.12 避免问题。

---

### 自定义扩展

- **创建新场景**：复制 `environment/frontend_server/storage` 下的 base 文件夹，修改名称和相关配置
- **修改地图**：使用 [Tiled 地图编辑器](https://www.mapeditor.org/) 直接编辑 `.json` 格式的地图文件
- **修改智能体**：调整角色的初始描述、性格设定、日程模板

---

## 为什么这个项目重要？

Generative Agents 的意义不在于 21.6k Star，而在于它展示了一个方向：**AI 智能体的行为可以不是预先写好的剧本，而是由底层模型实时生成的**。

在这之前，游戏 NPC 的行为要么是脚本，要么是有限状态机。Generative Agents 用 LLM 作为智能体的"大脑"，让 NPC 拥有了记忆、反思和动态规划的能力。

这直接影响了后来的很多工作：AutoGPT、CrewAI、各种 AI 智能体框架……仔细看都能看到 Generative Agents 的影子。

当然，它也有局限。每个决策都要调 OpenAI API，成本不低；智能体的行为仍然是统计模式的模拟；大规模场景下的信息密度和连贯性也有限。但作为一篇 2023 年的论文，它像是一扇被推开的门——门后是一个巨大的、尚待探索的空间。

---

## 结语

我曾经在某个深夜跑起来这个仿真。看到 25 个小人在地图上走来走去，互相打招呼、聊八卦、约饭——虽然只是一堆像素块，但那个瞬间真的有种"在看一个微型社会"的错觉。

如果 AI 智能体最后真的走向 Agent 时代，这篇论文大概会被记上浓墨重彩的一笔。

---

*论文：Generative Agents: Interactive Simulacra of Human Behavior (UIST '23)*
*仓库：[github.com/joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents)*
