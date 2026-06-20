---
title: H3C F1000-T200 防火墙配置实录
date: 2026-06-20
tags:
  - 网络
  - 防火墙
  - H3C
  - 配置
categories:
  - 技术笔记
---

2026年6月20日，通过 Console（COM5）连接 H3C F1000-T200 防火墙并完成初始配置。以下是配置过程记录和当前状态。

---

## 连接方式

- **接口**：COM5（串口）
- **速率**：9600 波特
- **终端**：PuTTY / plink
- **登录**：无需密码（Console 直连已进入 CLI）

---

## 配置命令记录

### 基础配置

```bash
system-view
sysname H3C-F1000-T200
```

### PPPoE 拨号

```bash
interface Dialer 1
  ppp chap user 102
  ppp chap password simple 226
  ppp pap local-user 102 password simple 226
  dialer bundle enable
  dialer-group 1
  ip address ppp-negotiate
  quit

interface GigabitEthernet 1/0/1
  description WAN-PPPoE
  pppoe-client dial-bundle-number 1
  quit
```

### VLAN 接口配置

```bash
# VLAN 1 - Transit（到软路由 WAN）
interface GigabitEthernet 1/0/2
  port link-mode route
  ip address 10.0.99.1 255.255.255.252
  description VLAN1-Transit-to-SoftRouter
  quit

# VLAN 2 - 主干（到软路由 LAN）
interface GigabitEthernet 1/0/3
  port link-mode route
  ip address 192.168.100.254 255.255.255.0
  description VLAN2-Backbone-to-SoftRouter-LAN
  quit

# VLAN 10 - 路由器
interface GigabitEthernet 1/0/4
  port link-mode route
  ip address 192.168.200.1 255.255.255.0
  description VLAN10-Router-GR5400AX
  quit

# VLAN 20 - DMZ
interface GigabitEthernet 1/0/5
  port link-mode route
  ip address 10.0.2.1 255.255.255.0
  description VLAN20-DMZ-R730xd
  quit

# VLAN 30 - 监控
interface GigabitEthernet 1/0/6
  port link-mode route
  ip address 10.0.3.1 255.255.255.0
  description VLAN30-Surveillance-NVR
  quit

# VLAN 40 - IoT
interface GigabitEthernet 1/0/7
  port link-mode route
  ip address 10.0.4.1 255.255.255.0
  description VLAN40-IoT
  quit
```

### 路由与安全策略

```bash
# 默认路由到软路由（所有流量必经转发）
ip route-static 0.0.0.0 0.0.0.0 192.168.100.1

# 安全策略放行
security-policy ip
  rule name permit-all
    source-zone any
    destination-zone any
    action pass
  quit
```

### 保存配置

```bash
save
# 确认保存到 flash:/startup.cfg
```

---

## 当前接口状态

```
display ip interface brief
*down: administratively down
(s): spoofing  (l): loopback

Interface                Physical Protocol IP Address      Description
Dia1                     up       down     --              PPPoE
GE1/0/1                  down     down     --              WAN-PPPoE
GE1/0/2                  down     down     10.0.99.1       VLAN1-Transit
GE1/0/3                  down     down     192.168.100.254 VLAN2-Backbone
GE1/0/4                  down     down     192.168.200.1   VLAN10-Router
GE1/0/5                  down     down     10.0.2.1        VLAN20-DMZ
GE1/0/6                  down     down     10.0.3.1        VLAN30-Surveillance
GE1/0/7                  down     down     10.0.4.1        VLAN40-IoT
```

### 接口状态说明

| 状态 | 含义 |
|------|------|
| **Physical down** | 网线未连接或对端设备未开机 |
| **Protocol down** | 物理不通导致协议无法建立 |
| **Dia1 up/down** | 拨号接口已创建，等待 PPPoE 协商 |

> 所有接口显示 down 是**正常现象**——物理线缆尚未全部接通。插上线缆并连接对应设备后，接口会自动变为 up。

---

## 路由表

```
display ip routing-table

Destinations : 9    Routes : 9

Destination/Mask   Proto  Pre Cost  NextHop         Interface
0.0.0.0/32        Direct 0   0     127.0.0.1       InLoop0
0.0.0.0/0         Static 60  0     192.168.100.1   GE1/0/3
0.0.0.0/0         Static 60  0     Dialer1         Dialer1
10.0.2.0/24       Direct 0   0     10.0.2.1        GE1/0/5
10.0.3.0/24       Direct 0   0     10.0.3.1        GE1/0/6
10.0.4.0/24       Direct 0   0     10.0.4.1        GE1/0/7
10.0.99.0/30      Direct 0   0     10.0.99.1       GE1/0/2
192.168.100.0/24  Direct 0   0     192.168.100.254 GE1/0/3
192.168.200.0/24  Direct 0   0     192.168.200.1   GE1/0/4
```

---

## 配置要点总结

| VLAN | 接口 | 网段 | 网关 | 说明 |
|------|------|------|------|------|
| VLAN 1 | GE1/0/2 | 10.0.99.0/30 | 10.0.99.1 | Transit 到软路由 WAN |
| VLAN 2 | GE1/0/3 | 192.168.100.0/24 | 192.168.100.254 | 主干到软路由 LAN |
| VLAN 10 | GE1/0/4 | 192.168.200.0/24 | 192.168.200.1 | H3C GR-5400AX |
| VLAN 20 | GE1/0/5 | 10.0.2.0/24 | 10.0.2.1 | R730xd DMZ |
| VLAN 30 | GE1/0/6 | 10.0.3.0/24 | 10.0.3.1 | NVR 监控 |
| VLAN 40 | GE1/0/7 | 10.0.4.0/24 | 10.0.4.1 | IoT 设备 |

### 关键路由

```
防火墙默认路由: 0.0.0.0/0 → 192.168.100.1（软路由）
软路由默认路由: 0.0.0.0/0 → 10.0.99.1（防火墙）
```

### PPPoE 拨号

```
账号: 102
密码: 226
状态: 等待物理连接（GE1/0/1 网线未插入）
```

---

## 后续操作

1. ✅ 防火墙配置完成并保存
2. ⬜ 插入 ISP 光猫网线到 **GE1/0/1**
3. ⬜ 连接软路由 ETH3 到 **GE1/0/2**（VLAN 1 Transit）
4. ⬜ 连接软路由 ETH0 到 **GE1/0/3**（VLAN 2 主干）
5. ⬜ 连接各设备到对应 VLAN 接口
6. ⬜ 配置软路由 WAN（10.0.99.2/30）和 LAN（192.168.100.1/24）
