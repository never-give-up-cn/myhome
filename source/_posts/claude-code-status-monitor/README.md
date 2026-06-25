---
title: Claude Code 工作状态监控器 — 用 Arduino LED Matrix 实时显示 AI 编程状态
---

# Claude Code 工作状态监控器

监控 Claude Code 的工作状态，通过串口发送状态码到 Arduino LED Matrix 显示。
支持 **桌面窗口** 和 **控制台** 两种模式。

内置 **Token 用量追踪** 和 **对话日志记录**，实时跟踪 API 消耗。

## 工作流程

```
┌─────────────────┐    串口 (115200)    ┌──────────────────┐
│  PC端监控程序    │ ──────────────────→ │  Arduino         │
│  gui.py          │    "状态码,0\n"     │  LED Matrix 显示  │
│  monitor.py      │                     │  S0, S1, ... S11 │
└─────────────────┘                     └──────────────────┘
     ↑
     │ psutil 检测进程 + 会话文件解析
     │
┌────┴────────────┐
│  Claude Code    │
│  (工作状态变化)  │
└─────────────────┘
```

## 技术栈

- **Python 3.7+** — 核心监控逻辑
- **psutil** — 进程检测与 CPU 监控
- **pyserial** — 串口通信
- **Tkinter** — 桌面 GUI 浮窗 + 日志查看器
- **Arduino** — LED Matrix 显示端
- **标准库** — Token 解析与对话日志（零额外依赖）

## 功能特性

### 12 种工作状态码

| 码 | 英文 | 中文 | 触发条件 |
|----|------|------|----------|
| 0 | IDLE | 空闲 | Claude 未运行 |
| 1 | LOADING | 启动 | 进程刚创建 |
| 2 | THINKING | 思考 | CPU 占用高，正在推理 |
| 3 | READING | 读文件 | 大量读取文件活动 |
| 4 | WRITING | 写代码 | 检测到文件修改 |
| 5 | SEARCHING | 搜索 | 搜索代码库 |
| 6 | BUILDING | 编译 | NPM/Git 等子进程 |
| 7 | COMMAND | 命令 | 执行其他命令 |
| 8 | WAITING | 等待 | CPU 为零超过 15 秒 |
| 9 | PROCESSING | 处理中 | 中等 CPU 活动 |
| 10 | DONE | 完成 | 任务刚完成 |
| 11 | ERROR | 错误 | 异常状态 |

### 📊 Token 用量追踪

自动解析 `~/.claude/projects/` 下的会话文件，实时监控 API Token 消耗：

- **输入 Token / 输出 Token / 缓存读取 / 缓存创建**
- **多模型计价**：支持 deepseek-v4-flash、Claude Sonnet、Haiku
- **费用估算**：每轮对话实时显示费用
- **零配置**：自动检测最新会话文件，增量解析（只读新增行，性能无损）

GUI 窗口底部新增 Token 统计面板（深绿底色），控制台每 60 秒打印详细日志。

### 📝 对话日志记录

自动记录每一轮用户输入和 API 返回数据：

- **用户输入**：提取实际文本输入，自动跳过 tool_result 等系统内容
- **Token 明细**：每条记录包含输入/输出/缓存 Token 和费用
- **增量写入**：`conversation_log.jsonl` 追加写入，性能无损

### 🔍 对话日志查看器

独立 GUI 窗口，通过主窗口 **「查看日志」** 按钮打开：

- **表格展示**：10 列（ID、时间、模型、用户输入、Token 明细、费用）
- **搜索条件**：日期范围搜索 + 关键词搜索（回车即搜）
- **分页浏览**：上/下页、首/末页、页码跳转、每页条数切换
- **详情查看**：双击任意行弹出完整详情窗口

## 实现思路

### 进程检测

通过 `psutil` 轮询检测 `claude.exe` 或 `node.exe` 进程的存在和 CPU 占用：

- 进程不存在 → IDLE
- CPU > 8% → THINKING
- 检测到文件读写 → READING / WRITING
- 检测到子进程 → BUILDING
- CPU 连续 15 秒为零 → WAITING

### 串口通信

通过串口以 `状态码,0\n` 的 CSV 格式发送数据，Arduino 端解析后驱动 LED Matrix 显示对应的图标和文字。

### Token 追踪

解析 Claude Code 会话 JSONL 文件中 assistant 消息的 `usage` 字段，提取 `input_tokens`、`output_tokens`、`cache_read_input_tokens` 等数据，按模型单价实时计算费用。

### 对话日志

按时间顺序解析会话文件，配对用户输入和 AI 返回，跳过 tool_result 等非用户内容，写入结构化 JSONL 日志文件。

### GUI 桌面浮窗

用 Tkinter 做的半透明浮窗：
- 每个状态有独立颜色（绿色=完成，红色=错误，蓝色=思考等）
- 实时显示 CPU 占用、进程号
- Token 统计面板
- 「查看日志」按钮
- 串口连接状态指示灯
- 支持置顶显示

### Arduino 端

Arduino Uno R4 WiFi 开发板，利用板载 LED Matrix 矩阵屏，每个状态显示不同的动画图标。

## 开发历程

### 原型阶段

最初的版本只有一个控制台脚本，每 1 秒检测一次进程状态并打印日志。用来验证状态检测逻辑。

### GUI 化

觉得控制台不够直观，加上了 Tkinter 桌面浮窗。状态用不同颜色区分，更加一目了然。

### 串口通信

为了配合物理 LED Matrix，增加了串口输出功能。用 CSV 格式（`状态码,校验位`）传输，Arduino 端解析简单可靠。

### 状态细化

从最初的 5 种状态逐步细化到 12 种：
- 把 THINKING 和 PROCESSING 分开（高强度 vs 中等 CPU）
- 把 WAITING 单独提取出来（空闲但进程活着）
- 增加 DONE 状态（任务完成后的短暂过渡）
- 增加 ERROR 状态（异常指示）

### Token 追踪 + 对话日志

从用户需求出发，增加了 Token 监控和对话日志功能：
- 解析 Claude Code 本地会话文件，零配置自动发现
- 对话日志查看器支持搜索和分页，方便回溯历史记录

## 文件结构

```
ClaudeMonitor/
├── gui.py                  # 桌面窗口版 (Tkinter，推荐)
├── monitor.py              # 控制台版
├── start.bat               # 启动脚本
├── README.md               # 完整文档
├── token_tracker.py        # Token 用量追踪模块
├── conversation_logger.py  # 对话日志记录模块
├── log_viewer.py           # 对话日志查看器 GUI
├── conversation_log.jsonl  # 对话日志数据（自动生成）
├── monitor.log             # 运行日志 (自动生成)
└── arduino/
    └── claude_status/
        └── claude_status.ino  # Arduino 固件
```

## 使用方式

```bash
# 桌面窗口版（推荐）
双击 start.bat

# 控制台版
start.bat console

# 或直接运行
python gui.py
```

**依赖会自动安装（pyserial + psutil）。**

## 开发历程

### 缘起

用 Claude Code 写代码时，经常想知道它当前在做什么——是在思考、读文件、写代码，还是已经空闲了？于是做了这个小工具，把 AI 助手的"内心活动"可视化。

### v0.1 — 控制台原型

最初的版本只有一个控制台脚本 `monitor.py`，每 1 秒轮询一次 `psutil` 检测 `claude.exe` 进程的 CPU 占用。那时只有 5 种状态，能跑但很简陋。

### v0.2 — GUI 浮窗

觉得控制台不够直观，加上了 Tkinter 桌面浮窗。每个状态用独立颜色标识，一眼就能看到 Claude 在干嘛。

### v0.3 — Arduino 硬件联动

通过串口发送状态码到 Arduino Uno R4 WiFi，LED Matrix 显示对应图标。把软件状态带到了物理世界。

### v0.4 — 状态细化

从 5 种逐步细化到 12 种状态：区分高强度思考和低强度处理、增加等待态/完成态/错误态，加入文件变化检测来触发写入状态。

### v0.5 — Token 追踪

用户想知道 API 花了多少 Token。翻阅 Claude Code 本地会话文件，发现每个 assistant 消息都带有 `usage` 字段。写了增量解析模块，实时追踪输入/输出/缓存 Token 并估算费用。

### v0.6 — 对话日志

从会话文件中提取用户输入和 AI 返回，记录到结构化日志。配套做了表格查看器，支持搜索、分页、导出。

### v0.7 — 系统托盘 + 悬浮球

系统托盘图标、桌面悬浮球（类似 360 桌面助手），显示实时硬件状态。悬浮球可拖拽吸附到屏幕边缘自动隐藏。

### v0.8 — 双样式悬浮球

支持两种显示样式：简约圆形和 Token 数据面板。设置面板可调节字体大小、自定义音效、开机自启。

### v0.9 — GUI 全面美化

自定义深色标题栏，布局重构为区块化卡片。统一科技暗色配色方案，进度条辅助显示，按钮 hover 动效。

## 踩坑记录

### 1. Python 2/3 混装
系统同时有 Python 2.7 和 3.13，`python` 指向 2.7 导致 f-string 崩溃。  
**解决**：`start.bat` 用三步检测链：`py -3` → `python3` → `python` + 版本检查，确保跑在 3.7+。窗口模式用 `pyw -3` 或 `pythonw.exe` 隐藏控制台。

### 2. 子进程枚举竞态
遍历子进程时刚好退出，`psutil.NoSuchProcess` 导致崩溃。  
**解决**：不用生成器表达式，改 `for` 循环 + 每个子进程单独 `try/except` 跳过已退出的。

### 3. PowerShell 超时弹窗
GPU 检测用 `-Command` 模式会超时并闪 PowerShell 窗口。  
**解决**：写临时 `.ps1` 文件用 `-File` 模式执行，加 `CREATE_NO_WINDOW` 标志隐藏窗口，超时设 3 秒。

### 4. 右键卡死
菜单每次重建 + GPU 检测阻塞主线程。  
**解决**：菜单 `__init__` 预构建缓存，GPU 数据采集移到 `threading.Thread` 后台守护线程，UI 只读缓存。

### 5. 悬浮窗起不来
`menu.index(None)` 抛 Tcl 异常。  
**解决**：不存 index，直接用 `entryconfig("标签名")` 按标签操作。

### 6. 吸附后不会隐藏
`_on_leave` 条件 `_hidden_mode=False` 时直接返回，不启动隐藏。  
**解决**：去掉 `_hidden_mode` 检查，吸附状态下一律启动 1.5s 隐藏定时器。

### 7. 8 位颜色码崩溃
Tkinter 不支持 `#ffffff18` 等带透明度的颜色。  
**解决**：全用 6 位纯色，分割线 `#334455`，阴影用偏移矩形 `#080a10` 模拟。

### 8. 文件编码损坏
PowerShell `Set-Content` 默认 ANSI 编码，中文全变乱码。  
**解决**：不用 PowerShell 写 Python 文件，统一用 Python `open(write, encoding="utf-8")`。

### 9. AMD GPU 检测不到
只写了 nvidia-smi，用户是 AMD RX 6750 XT。  
**解决**：三层检测链：`nvidia-smi` → PowerShell `Get-Counter`（Windows 通用）→ WMI `Win32_VideoController`。

### 10. 显存读错
WMI 报告 4GB 实际 12GB，`AdapterRAM` 不准确。  
**解决**：从注册表 `HardwareInformation.qwMemorySize` 读取，值以字节为单位，除以 1GB 得准确显存。

### 11. 自定义标题栏问题
`overrideredirect` 移除了原生标题栏也失去了任务栏行为。  
**解决**：手动实现 `─` 最小化 / `—` 托盘 / `×` 退出三个按钮，标题栏绑定拖拽。Tkinter 调用用 `after(0, callback)` 确保主线程执行。

### 12. 按钮溢出
7 个按钮总宽超窗口，反复调宽度 520→560→640。  
**解决**：按钮字体 10→9px，内边距 20→10，窗口稳定在 640px，`pack(side=RIGHT)` 从右到左排列。

## 配置项

在 `gui.py` 或 `monitor.py` 开头的 `CONFIG` 字典中调整：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| serial_port | "auto" | 串口名，自动检测 |
| baud_rate | 115200 | 波特率 |
| check_interval | 0.5s (gui) | 检测间隔 |
| idle_timeout | 15s | 无 CPU 活动多久算等待 |
| cpu_think_threshold | 8.0% | 思考状态的 CPU 阈值 |
| enable_token_tracking | True | 启用 Token 监控 |

## 经验总结

1. **psutil 比 tasklist 快得多** — 用 `psutil.process_iter()` 遍历进程比调用 Windows `tasklist` 命令快一个数量级
2. **CPU 采样需要平滑** — 单次采样抖动大，做了指数移动平均（EMA）
3. **串口通信要加校验** — CSV 格式简单可靠，Arduino 端解析无负担
4. **GUI 和后台线程要分离** — Tkinter 主线程不能阻塞，用队列传递状态数据
5. **状态合并避免闪烁** — 短时间内状态切换加了 500ms 防抖
6. **会话文件增量解析** — 监听 JSONL 文件尾部新增行，避免全量读取
7. **JSONL 天然适合日志** — 追加写入无锁竞争，每条记录独立可查

## 完整代码

项目地址：https://github.com/never-give-up-cn/ClaudeMonitor

从最初的控制台脚本，到桌面浮窗 + Arduino 硬件显示，再到 Token 追踪和对话日志，这个项目一步步把 AI 编程助手的"内心活动"全方位可视化到了物理世界。
