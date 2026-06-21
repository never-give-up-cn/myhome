---
title: 照片归类工具开发记录
date: 2026-06-21 18:00:00
tags:
  - Python
  - 工具
  - EXIF
categories:
  - 我的工具
---

## 背景

电脑里存了 17 万张照片和视频，来自不同手机、相机、无人机，散落在各个文件夹里。手动整理几乎不可能，所以写了这个工具。

## 功能

- 自动读取 EXIF 元数据（拍摄日期、设备型号、GPS 坐标）
- GPS 坐标通过 Nominatim API 逆地理编码为行政区划地址
- 按 `年/日期/地址/设备` 的目录结构自动归类
- 无 GPS 的照片按 `年/日期/no-gps/设备` 归类
- 支持常见图片格式（JPEG、PNG、HEIC、RAW）和视频格式（MP4、MOV 等）
- 缓存已处理的文件，中断后可继续
- Windows GUI 界面，实时显示进度

## 技术栈

- **Python 3.11** — 核心逻辑
- **tkinter** — Windows 原生 GUI
- **Pillow** — EXIF 读取
- **ffprobe / ffmpeg** — 视频元数据读取 + 帧提取
- **ExifTool** — RAW 格式 EXIF 读取
- **Nominatim API** — 逆地理编码
- **PyTorch 2.4 + torch-directml** — 场景识别（AMD GPU 加速）
- **MobileNet V3 Large** — 图像分类模型

## 目录结构

处理后文件按以下方式存放：

```
E:\照片分类\
├── 2024\
│   ├── 2024-03-15\
│   │   ├── 思明区_厦门市\
│   │   │   ├── iPhone 15 Pro\
│   │   │   │   ├── 20240315_093021_风景_IMG_0001.jpg    ← 场景标签
│   │   │   │   └── 20240315_143022_人像_IMG_0002.jpg
│   │   │   └── iPhone 15 Pro_视频\
│   │   │       └── 20240315_180001_夜景_VID_20240315.mp4
│   │   └── no-gps\
│   │       └── 小米14\
│   │           └── 20240315_102345_其他_IMG_5432.jpg
│   └── 2024-03-16\
│       └── ...
└── 2025\
    └── ...
```

## 开发历程

### 第一阶段：基础功能

最初的版本按 `年/日期/设备(GPS地址)` 的结构归类，两阶段处理：
1. 读取所有文件的 EXIF 元数据
2. 按日期分组，逐天处理（地理编码 + 复制）

### 第二阶段：性能优化

发现每个文件被重复打开三次（读日期、读设备、读 GPS），改成一次打开全部读取，速度提升 2-3 倍。

还发现 Python 3 的 `round()` 使用银行家舍入，`round(0.5) = 0` 导致大批文件进度一直显示 0%，改成 `math.ceil()` 修复。

### 第三阶段：多线程尝试

尝试了 3 线程并行处理，但 17 万个文件的分组、限速器同步、GUI 刷新等问题导致不稳定，最终回退到单线程。

### 第四阶段：最终方案

改为单遍处理：每个文件读完后立即复制，不再等待全部读完。无 GPS 的文件直接跳过 API 调用，目录结构改为 `日期/地址/设备`。

### 第五阶段：场景识别 + DirectML

#### AMD GPU 加速的曲折

最初计划在 WSL2 中用 ROCm 做 PyTorch 推理加速，但 RX 6750 XT（RDNA2 架构）在 WSL2 中**天生没有 `/dev/kfd`**，ROCm 的计算功能用不了。尝试了 Ubuntu 24.04 + ROCm 7.2，调试了驱动和内核版本，最终确认这是 WSL2 的已知限制。

改用 **Windows 原生 + DirectML** 路线：
- 安装 Windows 版 PyTorch + `torch-directml` 包
- DX 6750 XT 通过 DirectML 后端被 PyTorch 识别，推理速度约 **24 张/秒**
- 不需要双系统、不需要重启、不需要折腾驱动

#### 多线程归类

用 `ThreadPoolExecutor` 实现 8 线程并行处理文件，配合 `threading.Lock` 保护缓存和限速器。对 13 万张照片的批量处理，速度提升明显。

#### 场景分类集成

使用 MobileNet V3 Large（ImageNet 预训练）对每张照片做场景分类：
- 1000 类 ImageNet 标签映射为 13 种实用场景：风景/建筑/人像/美食/动物/植物/室内/夜景/文档/交通/运动/艺术/其他
- 置信度低于 30% 的不加标签，避免误标
- 视频通过 ffmpeg 提取中间帧再做分类
- 场景标签追加到文件名：`20240315_093021_风景_IMG_0001.jpg`

#### GUI 改进

- 新增场景标签实时显示（红色大字）
- 场景识别状态和统计信息
- 模型预热加载（启动时提前加载 Large 模型）

## 多版本对比

| 版本 | 文件 | 特点 |
|------|------|------|
| 单线程版 | `photo_organizer_gui.py` | 稳定可靠，适合少量文件 |
| 多线程版 | `photo_organizer_gui_fast.py` | 8 线程并行，适合大批量 |
| 场景标签版 | `photo_organizer_gui_fast_label.py` | 多线程 + DirectML 场景识别 |

## 经验总结

1. **文件 I/O 是瓶颈** — 17 万个文件的目录遍历本身就需要时间
2. **API 限速决定上限** — Nominatim 10次/秒，有 GPS 的照片再多也得排队
3. **GUI 和后台线程的通信** — 队列 + 轮询比共享状态更可靠
4. **不要过度设计** — 单线程简单可靠，多线程带来的复杂度不值得
5. **WSL2 GPU 加速有硬件限制** — RDNA2 在 WSL2 没有 `/dev/kfd`，DirectML 在 Windows 原生是更好的选择
6. **场景分类的瓶颈不在推理** — 24 张/秒的推理速度足够快，瓶颈在图片解码 IO

## 运行方式

```bash
# 场景标签版（推荐）
python photo_organizer_gui_fast_label.py

# 仅场景分类（命令行）
python classify_scenes.py --model large

# 仅归类（不带场景标签）
python photo_organizer_gui_fast.py
```

## 代码

完整代码在 GitHub：https://github.com/never-give-up-cn/Multimedia-Classification
