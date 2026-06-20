---
title: 家庭网络拓扑与静态路由配置
date: 2026-06-20
tags:
  - 网络
  - 软路由
  - ESXi
  - 拓扑
categories:
  - 技术笔记
---

家里有一台软路由、一台普通路由器、一台交换机和一台跑 ESXi 的 R730xd，要让他们互相通信，静态路由是必须要配的。这篇文章记录我的网络拓扑和路由配置。

{% img /img/server-rack.jpg '"机柜实拍图" "服务器机柜"' %}

**机柜设备分层说明：**

| 层位 | 设备 | 说明 |
|------|------|------|
| 🔝 **最上层** | **Dell PowerEdge R730xd 服务器** | 安装 VMware ESXi 虚拟化平台，运行多台虚拟机（Ubuntu、Pi-hole 等），承载网站服务、DNS 解析、开发测试环境。配备热插拔硬盘托架，兼顾存储与算力 |
| **第二层** | **H3C GR-5400AX Wi-Fi6 企业路由器** | 内网核心路由，支持 Wi-Fi 6、AC 无线 AP 管理、多 WAN 接入、2.5G 有线端口，统一管理全屋有线无线局域网 |
| **第三层** | **兮克 SKS7300-8GPY4XGS 网管交换机** | 8 个 2.5G RJ45 电口 + 4 个 10G SFP+ 万兆光口，支持 VLAN / 链路聚合 / ACL / DHCP Snooping / 802.1X，背板带宽 120Gbps，功耗仅 30W。用于高速内网互联 |
| **第四层** | **机架式 PDU 机柜电源排插** | 机柜专用大功率配电单元，集中为机柜内所有网络、存储、网关设备供电 |
| 🔻 **底层区** | **H3C SecPath F1000-T200 安全网关** | 外网出口主设备，负责光纤宽带接入、内网安全防护、上网行为管理 |
| | **小米中枢网关**（防火墙左侧黑色小主机） | 全屋智能家居核心中枢，本地运行智能自动化，联动全系小米智能设备 |
| | **海康威视机架式 NVR** | 监控录像存储主机，从交换机获取摄像头视频流，保存回放监控画面 |
| 🧰 **配套辅材** | 19 英寸标准机柜、分层理线挡板、彩色区分跳线、设备标识标签、装饰星星灯带、机柜左上角干粉灭火器 |

---

## 改造前网络拓扑

{% img /img/topo-before.png '"改造前网络拓扑" "改造前拓扑"' %}

### 设备连接关系

| 连接 | 说明 |
|------|------|
| **光猫** → **软路由 ETH3** | PPPoE 拨号，WAN IP: 10.44.66.112/32 |
| **软路由 ETH0** → **路由器 WAN1** | LAN 网段 192.168.100.1/24，路由器 WAN: 192.168.100.2 |
| **路由器 LAN1** → **交换机 1口** | 内网 192.168.1.0/24，交换机: SKS7300-8GPY4XGS |
| **路由器 LAN2/WAN3** | 🟡 空 |
| **路由器 LAN3/WAN2** | 🟡 空 |
| **交换机 2口** → **NVR** | IP: 192.168.1.6 |
| **交换机 3口** → **R730xd iDRAC** | 管理口 |
| **交换机 4口** → **小米物联网中枢** | IP: 192.168.1.2 |
| **交换机 5口** | 🟡 空 |
| **交换机 6口** → **R730xd ESXi** | IP: 192.168.1.252 |
| **交换机 7口** | 🟡 空 |
| **交换机 8口** → **电脑** | IP: 192.168.1.5 |
| **路由器 Wi-Fi** → **摄像头** | 无线连接，IP: 192.168.1.8 |

### 网段划分

| 网段 | 用途 | 设备 |
|------|------|------|
| `10.44.66.112/32` | 外网（WAN） | 软路由 PPPoE |
| `192.168.100.0/24` | 中间过渡网段 | 软路由 LAN ↔ 路由器 WAN |
| `192.168.1.0/24` | 内网（LAN） | 电脑、NVR、IoT、ESXi |

### 设备 IP 清单

| 设备 | IP 地址 | 所属网段 |
|------|---------|---------|
| 软路由 WAN（PPPoE） | 10.44.66.112/32 | 外网 |
| 软路由 LAN（ETH0） | 192.168.100.1 | 192.168.100.0/24 |
| 路由器 WAN1 | 192.168.100.2 | 192.168.100.0/24 |
| 路由器 LAN1 | 192.168.1.1 | 192.168.1.0/24 |
| 交换机 | 192.168.1.12 | 192.168.1.0/24 |
| NVR 录像机 | 192.168.1.6 | 192.168.1.0/24 |
| 摄像头（Wi-Fi） | 192.168.1.8 | 192.168.1.0/24 |
| 小米物联网中枢 | 192.168.1.2 | 192.168.1.0/24 |
| Dell R730xd ESXi | 192.168.1.252 | 192.168.1.0/24 |
| 电脑 | 192.168.1.5 | 192.168.1.0/24 |

---

## 静态路由表

要让所有网段互通，需要配置以下静态路由：

### 1. 软路由（192.168.100.1）

软路由需要知道内网 `192.168.1.0/24` 怎么走，下一跳是路由器：

```
目标网段       ：192.168.1.0/24
下一跳网关      ：192.168.100.2
出接口          ：LAN 口
```

**配置命令（OpenWRT / LEDE）：**
```
# 在 网络 → 静态路由 中添加
route add -net 192.168.1.0/24 gw 192.168.100.2
```

### 2. 路由器（192.168.1.1）

路由器需要知道外网怎么走，默认路由指向软路由：

```
目标网段        ：0.0.0.0/0（默认路由）
下一跳网关      ：192.168.100.1
出接口          ：WAN 口
```

**配置命令（爱快 / Padavan / OpenWRT）：**
```
# 在 WAN 口设置中，网关指向 192.168.100.1
route add default gw 192.168.100.1
```

### 完整路由表汇总

| 设备 | 目标网段 | 下一跳 | 说明 |
|------|---------|--------|------|
| 软路由 | 192.168.1.0/24 | 192.168.100.2 | 访问内网需经过路由器 |
| 路由器 | 0.0.0.0/0 | 192.168.100.1 | 上网默认走软路由 |
| 路由器 | 192.168.1.0/24 | 直连 | 内网设备自动互通 |
| ESXi | 192.168.1.0/24 | 直连 | 虚拟交换机管理 |

---

## 网络连通性验证

配置完成后，可以从各个方向做连通测试：

### 从电脑 ping 各设备
```bash
# 同一网段内
ping 192.168.1.1      # ✅ 路由器 LAN
ping 192.168.1.252    # ✅ ESXi 管理口
ping 192.168.1.11     # ✅ 虚拟机

# 跨网段
ping 192.168.100.1    # ✅ 软路由 LAN（需路由器静态路由）
```

### 从虚拟机 ping 外网
```bash
ping 10.44.66.112     # ✅ 软路由 WAN
ping 8.8.8.8          # ✅ 外网（需配置 NAT）
```

---

## ESXi 网络配置说明

R730xd（192.168.1.252）上安装了 ESXi，通过**虚拟交换机（vSwitch）**连接虚拟机。

```
ESXi 物理网卡 ──→ vSwitch ──→ VM Port Group ──→ 虚拟机 (192.168.1.11)
```

由于虚拟机和 ESXi 管理口在同一个网段（192.168.1.0/24），虚拟机不需要额外的路由配置，直接通过虚拟交换机与内网通信。

如果想让虚拟机也能直接访问软路由的 WAN 网段（10.44.66.0/24），需要：

1. 确保路由器上有回程路由
2. 或者在虚拟机上配置网关为 192.168.1.1（路由器 LAN）

---

## 注意事项

- **NAT 配置**：软路由上需要配置 NAT（网络地址转换），内网设备才能访问外网
- **防火墙规则**：确保软路由和路由器的防火墙没有阻止内网段的转发
- **IP 冲突**：建议将各设备的 IP 绑定为静态分配，避免 DHCP 导致 IP 变动
- **ESXi 网络策略**：如虚拟机需要访问外网，检查虚拟交换机的安全策略是否允许混杂模式

---

这个拓扑比较典型——软路由做主网关和 NAT，普通路由器做 AP + 交换机，ESXi 跑虚拟机服务。配置好静态路由后，所有设备都可以无缝互通，虚拟机也能正常上网。

---

## 改造后：H3C F1000-T200 防火墙 + 软路由全流量转发

网络入口部署 **H3C F1000-T200 防火墙**（PPPoE 拨号），通过 **VLAN 1 Transit** 将流量交给**软路由统一 NAT 和代理转发**。软路由仅需 **ETH3 + ETH0 两个端口**，ETH3 接 VLAN 1（WAN），ETH0 接 VLAN 2（LAN主干）。防火墙负责各 VLAN 的三层网关，但**默认路由全部指向软路由（192.168.100.1）**，确保所有流量都经过软路由。

{% img /img/topo-full.png '"H3C防火墙改造后拓扑" "防火墙拓扑"' %}

### 数据流路径

**DMZ 服务器上网：**
```
R730xd(10.0.2.252) → 网关 10.0.2.1 (防火墙 VLAN 20)
    → 防火墙检查路由: 0.0.0.0/0 → 192.168.100.1
    → 转发到 VLAN 2 → 软路由 NAT → 回传防火墙 VLAN 1 → ISP
```

**VLAN 间互访（经防火墙路由）：**
```
VLAN 20 → 网关 10.0.2.1 (防火墙) → 防火墙路由 → 目标 VLAN 接口 → 目标设备
```

### 防火墙端口与 VLAN 规划

各 VLAN 的**网关 IP 在防火墙上**，但防火墙的**默认路由指向软路由（192.168.100.1）**，所有跨网段和外网流量都要经过软路由。

| 防火墙接口 | VLAN | 网段 | 网关（防火墙接口） | 用途 |
|-----------|------|------|------------------|------|
| GE1/0/1 | — | PPPoE | — | WAN 拨号 |
| GE1/0/2 | **VLAN 1** | **10.0.99.0/30** | 10.0.99.1 | Transit → 软路由 ETH3 WAN |
| GE1/0/3 | **VLAN 2** | **192.168.100.0/24** | 192.168.100.254 | 主干 → 软路由 ETH0 LAN |
| GE1/0/4 | **VLAN 10** | **192.168.200.0/24** | 192.168.200.1 | H3C GR-5400AX 路由器 |
| GE1/0/5 | **VLAN 20** | **10.0.2.0/24** | 10.0.2.1 | DMZ 服务器 |
| GE1/0/6 | **VLAN 30** | **10.0.3.0/24** | 10.0.3.1 | 监控系统 |
| GE1/0/7 | **VLAN 40** | **10.0.4.0/24** | 10.0.4.1 | IoT 设备 |

### 软路由接口配置（仅需 2 口）

```bash
# ETH3 - VLAN 1 (WAN) 接防火墙 Transit
config interface 'wan'
  option device 'eth3'
  option proto 'static'
  option ipaddr '10.0.99.2'
  option netmask '255.255.255.252'
  option gateway '10.0.99.1'
  option dns '223.5.5.5'

# ETH0 - VLAN 2 (LAN) 接防火墙主干
# 这就是所有 VLAN 的最终网关和 DNS
config interface 'lan'
  option device 'eth0'
  option proto 'static'
  option ipaddr '192.168.100.1'
  option netmask '255.255.255.0'
  option dns '192.168.100.1'
```

### 交换机 VLAN 配置（SKS7300-8GPY4XGS）

```bash
# 创建 VLAN
vlan 10,20,30,40,99
quit

# 端口分配
interface gigabitEthernet 1/0/1
  switchport mode trunk
  switchport trunk allowed vlan 10,20,30,40,99    # 接软路由 ETH0
  quit

interface gigabitEthernet 1/0/2
  switchport access vlan 10                        # H3C GR-5400AX WAN
  quit

interface gigabitEthernet 1/0/3
  switchport access vlan 20                        # R730xd
  quit

interface gigabitEthernet 1/0/4
  switchport access vlan 30                        # NVR
  quit

interface gigabitEthernet 1/0/5
  switchport access vlan 40                        # IoT
  quit

interface gigabitEthernet 1/0/8
  switchport access vlan 10                        # 电脑 192.168.1.5
  quit
```

### 路由表

| 设备 | 目标网段 | 下一跳 | 说明 |
|------|---------|--------|------|
| **H3C 防火墙** | 0.0.0.0/0 | **192.168.100.1** | 所有流量 → 软路由 |
| **H3C 防火墙** | 各 VLAN | 直连接口 | 各 VLAN 网关 |
| **软路由** | 0.0.0.0/0 | **10.0.99.1** | 默认路由 → 防火墙 |
| **软路由** | 192.168.100.0/24 | 直连 ETH0 | VLAN 2 主干 |

### H3C 防火墙配置要点

```bash
# PPPoE 拨号
interface Dialer 1
  dialer bundle 1
  ip address pppoe-negotiate
  quit

interface GigabitEthernet 1/0/1
  pppoe-client dial-bundle-number 1
  quit

# 各 VLAN 接口配置
interface GigabitEthernet 1/0/2
  port link-mode route
  ip address 10.0.99.1 255.255.255.252
  description VLAN1-Transit
  quit

interface GigabitEthernet 1/0/3
  port link-mode route
  ip address 192.168.100.254 255.255.255.0
  description VLAN2-主干
  quit

interface GigabitEthernet 1/0/4
  port link-mode route
  ip address 192.168.200.1 255.255.255.0
  description VLAN10-路由器
  quit

interface GigabitEthernet 1/0/5
  port link-mode route
  ip address 10.0.2.1 255.255.255.0
  description VLAN20-DMZ
  quit

interface GigabitEthernet 1/0/6
  port link-mode route
  ip address 10.0.3.1 255.255.255.0
  description VLAN30-监控
  quit

interface GigabitEthernet 1/0/7
  port link-mode route
  ip address 10.0.4.1 255.255.255.0
  description VLAN40-IoT
  quit

# 最关键：默认路由指向软路由
ip route-static 0.0.0.0 0.0.0.0 192.168.100.1

# 安全策略 - 放行所有
security-policy ip
  rule name permit-all
    source-zone any
    destination-zone any
    action pass
```

### 交换机 VLAN 配置（SKS7300-8GPY4XGS）

```bash
# 创建 VLAN
vlan 1,2,10,20,30,40
quit

# Trunk 口（接防火墙 GE1/0/4~GE1/0/7）
interface range gigabitEthernet 1/0/1-1/0/4
  switchport mode trunk
  switchport trunk allowed vlan 1,2,10,20,30,40
  quit

# Access 口（接各 VLAN 设备）
interface gigabitEthernet 1/0/5
  switchport access vlan 10     # GR-5400AX WAN
  quit
interface gigabitEthernet 1/0/6
  switchport access vlan 20     # R730xd
  quit
interface gigabitEthernet 1/0/7
  switchport access vlan 30     # NVR
  quit
interface gigabitEthernet 1/0/8
  switchport access vlan 40     # IoT
  quit
```

### H3C 防火墙配置要点

```bash
# PPPoE 拨号
interface Dialer 1
  dialer bundle 1
  ip address pppoe-negotiate
  quit

interface GigabitEthernet 1/0/1
  pppoe-client dial-bundle-number 1
  quit

# Transit VLAN 99
interface GigabitEthernet 1/0/2
  port link-mode route
  ip address 10.0.99.1 255.255.255.252
  description Transit-to-SoftRouter
  quit

# VLAN 各接口配置
interface GigabitEthernet 1/0/3
  port link-mode route
  ip address 192.168.100.254 255.255.255.0   # 仅管理
  quit

interface GigabitEthernet 1/0/4
  port link-mode route
  ip address 10.0.2.254 255.255.255.0
  quit

interface GigabitEthernet 1/0/5
  port link-mode route
  ip address 10.0.3.254 255.255.255.0
  quit

interface GigabitEthernet 1/0/6
  port link-mode route
  ip address 10.0.4.254 255.255.255.0
  quit

# 安全策略 - 放行所有经软路由的流量
security-policy ip
  rule name trust-all
    source-zone trust
    destination-zone any
    action pass
```

### 改造要点总结

| 需求 | 实现 |
|------|------|
| 防火墙拨号 | H3C GE1/0/1 PPPoE |
| 软路由只需 2 口 | ETH3(VLAN 1) + ETH0(VLAN 2) |
| 各 VLAN 网关 | 防火墙接口 IP |
| **所有流量必经软路由** | **防火墙默认路由 → 192.168.100.1** |
| 统一 NAT + DNS | 软路由 192.168.100.1 |
| VLAN 扩展 | 交换机 Trunk + Access |

---

## 物理走线图（改造后）

以下为改造后的设备物理端口连接关系：

### 设备端口对应表

防火墙拥有 12 个物理端口，各 VLAN 设备**直连防火墙对应端口**，无需经过交换机：

| 源设备 | 源端口 | 目标设备 | 目标端口 | 用途 |
|--------|--------|---------|---------|------|
| ISP 光猫 | LAN 口 | **H3C 防火墙** | **GE1/0/1** | WAN PPPoE 拨号 |
| **H3C 防火墙** | **GE1/0/2** | **软路由** | **ETH3** | VLAN 1 Transit |
| **H3C 防火墙** | **GE1/0/3** | **软路由** | **ETH0** | VLAN 2 主干 |
| **H3C 防火墙** | **GE1/0/4** | **H3C GR-5400AX** | **WAN 口** | VLAN 10 路由器 |
| **H3C 防火墙** | **GE1/0/5** | **R730xd** | **管理口** | VLAN 20 DMZ |
| **H3C 防火墙** | **GE1/0/6** | **NVR 录像机** | LAN 口 | VLAN 30 监控 |
| **H3C 防火墙** | **GE1/0/7** | **小米 IoT 中枢** | LAN 口 | VLAN 40 IoT |
| **GR-5400AX 路由器** | LAN 口 | **交换机** | 任意口 | 扩展内网（电脑等） |

### 物理连接示意图

{% img /img/physical-cabling.png '"物理走线图" "物理连接"' %}

### 接线要点

| 要点 | 说明 |
|------|------|
| 🔌 **防火墙 ↔ 软路由** | **必须用 2 根独立网线**：ETH3(VLAN1) + ETH0(VLAN2)，不能共用 |
| 🏷️ **网线标签** | 建议两端贴标签：`FW-GE1/0/2→SR-ETH3`、`FW-GE1/0/4→GR-5400AX` 等 |
| 🎨 **颜色区分** | WAN 线用红色、防火墙↔软路由用蓝色、设备线用绿色，便于排障 |
| 🔌 **一机一线** | 各 VLAN 设备直连防火墙对应端口，互不干扰 |
| 📏 **交换机角色** | 交换机接在路由器 LAN 口下，仅用于扩展有线端口（电脑等） |

---

无论改造前后，网络不通时的排查思路是一致的。下面整理常见场景的排障步骤。

### 排障总原则：「分层定位，逐层排查」

从物理层开始，逐层向上，在哪一层发现问题就在哪一层解决。

### 改造前（无防火墙）常见问题

#### 场景 1：内网设备无法上网

```mermaid
graph LR
    A[电脑 1.5] --> B[交换机 1.12]
    B --> C[路由器 1.1]
    C --> D[软路由 100.1 NAT]
    D --> E[ISP 光猫]
```

```
1. 物理层：检查网线指示灯是否亮，交换机端口状态是否正常
2. 链路层：电脑是否能获取 IP？`ipconfig` 看网关是否为 192.168.1.1
3. 网络层：ping 192.168.1.1 → 192.168.100.1 → 10.44.66.112 → 114.114.114.114
   在哪个节点断了，就说明问题出在到那个节点的这一段
4. 检查软路由 NAT 规则是否正常，PPPoE 拨号是否在线
5. 检查路由器 WAN 口网关是否指向 192.168.100.1
```

**快速验证命令：**
```bash
# 从电脑开始
ipconfig /all              # 确认 IP/网关/DNS
ping 192.168.1.1           # 路由器 LAN → 通说明内网正常
tracert 192.168.100.1      # 路径可达性 → 看是否经过路由器
tracert 10.44.66.112       # 软路由 WAN
tracert 114.114.114.114    # 外网
```

#### 场景 2：外网无法访问内网服务（端口映射）

```
1. 确认软路由上是否有对应的端口映射规则
2. 确认路由器上是否有端口转发（如有双重 NAT）
3. 检查目标服务是否在监听：netstat -an | findstr :80
4. 从外网 telnet 公网IP 端口 测试可达性
5. 检查软路由防火墙是否放行了对应端口
```

#### 场景 3：跨网段不通（ESXi / NVR / 电脑互访）

```
1. 确认各设备网关配置正确：
   - 电脑/ESXi/NVR：网关 = 192.168.1.1（路由器）
   - 路由器 WAN：网关 = 192.168.100.1（软路由）
2. 确认路由表：
   - 软路由上有 192.168.1.0/24 → 192.168.100.2 的路由
   - 路由器上有默认路由 → 192.168.100.1
3. ping 测试：从电脑 → 路由器 WAN(100.2) → 软路由(100.1)
```

### 改造后（含 H3C 防火墙）新增排查维度

#### 场景 4：透明模式下内网上网中断

```
1. 确认 H3C 各 VLAN 接口状态：display ip interface brief
2. 确认 PPPoE 拨号是否正常：display dialer
3. 检查安全策略是否误拦截：
   display security-policy ip
   display security-policy statistics
4. 确认软路由 WAN 口能否 ping 通 Transit 网关：ping 10.0.99.1
5. 跳过防火墙测试：临时将软路由 WAN 直连光猫并拨号，排查是否为防火墙故障
```

#### 场景 5：DMZ / 监控 / IoT VLAN 无法访问外网

```
┌────────────────────────────────────────────┐
│  隔离 VLAN 出网路径：                        │
│  DMZ(10.0.2.x) → H3C GE1/0/3              │
│  监控(10.0.3.x) → H3C GE1/0/4             │
│  IoT(10.0.4.x)  → H3C GE1/0/5             │
│       ↓                                    │
│  H3C NAT → WAN 桥接 → ISP                  │
└────────────────────────────────────────────┘
```

```
1. 确认接口配置：
   display ip interface brief
   检查 GE1/0/3、GE1/0/4、GE1/0/5 是否有 IP 且状态为 Up
2. 确认 NAT 规则：
   display nat outbound
   确保 ACL 包含了对应网段
3. 确认安全策略：
   display security-policy ip
   检查 surveillance-to-untrust、iot-to-untrust 规则是否生效
4. 从隔离 VLAN 内设备 ping 网关：
   ping 10.0.3.1 → 通说明 VLAN 内部正常
   ping 10.44.66.112 → 通说明 NAT 出网正常
5. 检查默认路由：
   display ip routing-table
   应有 0.0.0.0/0 指向 ISP 网关
```

#### 场景 6：内网无法访问 DMZ 服务器

```mermaid
graph LR
    A[内网 1.5] --> B[路由器 1.1]
    B --> C[软路由 100.1 eth0.10]
    C --> D[软路由 10.0.2.1 eth0.20]
    D --> E[DMZ 10.0.2.x]
```

```
1. 从内网 ping 10.0.2.252：
   - 不通 → 依次 ping 192.168.1.1 → 192.168.100.1 → 10.0.2.1
   - 在哪一步断了，问题就出在哪一步
2. 确认软路由 VLAN 子接口状态：
   ip addr show eth0.20
3. 确认软路由路由表：
   ip route show 应包含直连路由 10.0.2.0/24 dev eth0.20
4. 确认交换机端口 VLAN 分配正确：
   show vlan id 20
5. 确认 DMZ 服务器的网关指向 10.0.2.1（软路由）
```

#### 场景 7：防火墙管理地址无法访问

```bash
# 确认管理接口状态
display interface LoopBack 0

# 确认管理路由
display ip routing-table 192.168.100.254

# 确认管理服务已开启
display https status
display ssh server status

# 确认管理 ACL 未拦截源 IP
display acl 3001
```

### 常用诊断命令速查

| 场景 | 命令 | 说明 |
|------|------|------|
| 交换机端口状态 | `display interface brief` | 查看所有端口 Link/Admin 状态 |
| 防火墙会话 | `display firewall session table` | 查看活跃连接 |
| 防火墙 NAT 映射 | `display nat session` | 查看 NAT 转换状态 |
| 路由表 | `display ip routing-table` | 查看所有路由 |
| ARP 表 | `display arp` | 查看 IP ↔ MAC 映射 |
| CPU 占用 | `display cpu-usage` | 检查设备负载 |
| 日志 | `display logbuffer` | 查看设备日志 |
| 软路由连接追踪 | `cat /proc/net/nf_conntrack` | 查看 NAT 连接表 |

### 排障口诀

```
光猫亮不亮？——物理层
网线插没插？——链路层
IP 获取到？——网络层
网关能 ping？——路由层
端口通不通？——传输层
服务开着？——应用层

分层定位，逐层排查 —— 网工老司机
```

对照网络技能的最佳实践，当前架构有以下几个可优化点：

### ✅ 已做对的

| 实践 | 状态 | 说明 |
|------|------|------|
| 软路由做主网关 | ✅ | 192.168.100.1 统一出口，NAT 集中 |
| DHCP 静态分配 | ✅ | 各设备 IP 固定，避免变动 |
| 防火墙安全隔离 | ✅ | H3C 透明模式 + DMZ 独立网段 |
| 路由表规划 | ✅ | 软路由、路由器、防火墙各司其职 |

### ⚠️ 可优化项

#### 1. 内网子网冲突风险

当前内网使用 `192.168.1.0/24`，这是**最常用的默认子网**。如果以后需要连接 VPN（公司网络、酒店、机场 Wi-Fi），很多 VPN 也会使用同一网段，会导致路由冲突。

**建议改为不那么常见的子网：**

```
# 当前                      → 建议
192.168.1.0/24              → 192.168.50.0/24
路由器 LAN: 192.168.1.1     → 路由器 LAN: 192.168.50.1
电脑: 192.168.1.5           → 电脑: 192.168.50.5
ESXi 管理口: 192.168.1.252  → ESXi 管理口: 192.168.50.252
```

#### 2. VLAN 隔离

所有内网设备在同一个网段，属于扁平网络。IoT 设备被入侵后可直接访问电脑和服务器。

**建议增加 VLAN：**

| VLAN | 网段 | 用途 |
|------|------|------|
| VLAN 1 | 192.168.50.0/24 | 🖥️ 信任设备（电脑、手机） |
| VLAN 10 | 192.168.51.0/24 | 📱 IoT 设备（智能音箱、摄像头） |
| VLAN 20 | 10.0.2.0/24 | 🖥️ DMZ 服务器（已有） |
| VLAN 99 | 192.168.100.0/24 | 🔧 管理网段 |

#### 3. DHCP 地址池规划

保留地址池前面给静态设备，后面给 DHCP 动态分配：

```
192.168.50.1       — 网关
192.168.50.2–10    — 静态服务器（ESXi、NAS）
192.168.50.11–20   — 静态设备（打印机）
192.168.50.21–250  — DHCP 动态池（电脑、手机）
192.168.50.251–254 — 保留
```

#### 4. DNS 与电源

- **DNS**：建议部署 Pi-hole 做 DNS 缓存 + 广告过滤
- **UPS**：软路由、防火墙、R730xd 建议接入不间断电源

### 总结

当前网络功能已经完整，主要优化方向：**换子网避冲突 → 加 VLAN 隔离 IoT → 规整 DHCP → 加 DNS/UPS**。可分批次实施，不影响现有运行。

以上配置完成后，H3C F1000-T200 即可在生产环境中稳定运行，兼顾安全防护和网络连通性。
