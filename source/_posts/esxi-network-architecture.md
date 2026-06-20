---
title: ESXi 网络架构详解：虚拟交换机、端口组、VMkernel 与防火墙
date: 2026-06-20
tags:
  - ESXi
  - 虚拟化
  - 网络
  - 服务器
categories:
  - 技术笔记
photos:
  - /img/esxi-network.png
---

ESXi 的网络是虚拟化的核心，但也是很多人搞不清楚的部分。物理网卡、虚拟交换机、端口组、VMkernel 网卡、TCP/IP 堆栈、防火墙规则——这些组件之间的关系是怎样的？数据包从虚拟机到物理网络，中间经过了哪些环节？

这篇文章把 ESXi 网络架构从头到尾拆开来讲。

---

## ESXi 网络全景图

{% img /img/esxi-network.png '"ESXi网络架构全景图" "ESXi网络"' %}

上图展示了从物理网卡到虚拟机的完整数据路径。下面逐层说明。

---

## 1. 物理网卡（vmnic）

ESXi 宿主机上的物理网卡在 ESXi 中被识别为 `vmnic0`、`vmnic1` 等。

在 Dell R730xd 上，通常有 4 个板载网口：
- `vmnic0` → 连接到交换机 6口（主用）
- `vmnic1` → 可用于备用链路聚合
- `vmnic2` / `vmnic3` → 可用于独立存储网络

**角色：** 物理网卡是 ESXi 与外部物理网络通信的唯一出入口。所有虚拟机的流量、管理流量、存储流量，最终都要通过 vmnic 进出。

---

## 2. 虚拟交换机（vSwitch）

ESXi 的标准虚拟交换机（vSwitch）是一个纯软件交换机，工作在第 2 层。功能类似于一台物理交换机：MAC 地址学习、帧转发、VLAN 隔离。

### 创建方式

```bash
# 通过 esxcli 创建标准虚拟交换机
esxcli network vswitch standard add --vswitch-name=vSwitch1

# 添加上行链路
esxcli network vswitch standard uplink add --vswitch-name=vSwitch1 --uplink-name=vmnic0

# 设置 VLAN ID 为 4095（VLAN 透传）
esxcli network vswitch standard set --vswitch-name=vSwitch1 --vlan-id=4095
```

### 上行链路（Uplink）

上行链路将 vSwitch 连接到物理网卡。如果配置多个上行链路，可以实现：

| 模式 | 说明 |
|------|------|
| **负载均衡** | 基于源虚拟端口 ID 或 IP 哈希分发流量 |
| **故障转移** | 一个上行链路故障时自动切换到另一个 |
| **链路聚合** | 配合物理交换机配置 LACP |

---

## 3. 端口组（Port Group）

端口组是 vSwitch 上的逻辑端口集合，是虚拟机连接网络的入口。每个端口组可以指定：

- **VLAN ID**：0（无标签）、1–4094（特定 VLAN）、4095（VLAN 透传）
- **安全策略**：混杂模式、MAC 地址更改、伪信号
- **流量调整**：平均带宽、峰值带宽、突发大小

### 常见端口组

```bash
# 创建 VM 网络端口组
esxcli network vswitch standard portgroup add --portgroup-name="VM Network" --vswitch-name=vSwitch0

# 创建管理网络端口组
esxcli network vswitch standard portgroup add --portgroup-name="Management Network" --vswitch-name=vSwitch0

# 设置端口组 VLAN ID
esxcli network vswitch standard portgroup set --portgroup-name="VM Network" --vlan-id=1
```

| 端口组 | 用途 | VLAN |
|-------|------|------|
| **VM Network** | 虚拟机连接 | VLAN 1（或透传） |
| **Management Network** | ESXi 管理 + VMkernel | VLAN 1 |

每个虚拟机的虚拟网卡（vmxnet3 / E1000e）连接到端口组，数据流路径为：

```
虚拟机 → 虚拟网卡 → 端口组 → vSwitch → 上行链路 → vmnic → 物理交换机
```

---

## 4. VMkernel 网卡

VMkernel 网卡是 ESXi 内核的网络接口，用于 ESXi 自身的网络通信——不直接服务于虚拟机。

### 常见 VMkernel 网卡用途

| 名称 | 用途 | 推荐网段 |
|------|------|---------|
| **vmk0** | ESXi 管理（Web UI、SSH） | 与内网同网段 |
| **vmk1** | vMotion（虚拟机热迁移） | **独立网段**，建议 10Gbps |
| **vmk2** | iSCSI / NFS（存储网络） | **独立网段**，建议 10Gbps |
| **vmk3** | FT（容错日志流量） | 独立网段，低延迟 |

```bash
# 创建 VMkernel 网卡
esxcli network ip interface add --interface-name=vmk1 --portgroup-name="vMotion Network"

# 分配 IP
esxcli network ip interface ipv4 set --interface-name=vmk1 --ipv4=10.0.10.252 --netmask=255.255.255.0 --type=static

# 启用 vMotion 服务
esxcli system vnic vmotion set --enabled=true
```

### 注意事项

- **VMkernel 网卡必须绑定到端口组**，端口组再绑定到 vSwitch
- **管理与 vMotion 建议分开**：同一网段也可以，但如果流量大建议独立

---

## 5. TCP/IP 堆栈

ESXi 有多个 TCP/IP 堆栈，用于隔离不同类型的网络流量。每个堆栈有独立的路由表、DNS 配置和默认网关。

| TCP/IP 堆栈 | 用途 | 说明 |
|-------------|------|------|
| **default** | 管理 + VM 流量 | 默认堆栈，所有流量走此路由 |
| **vmotion** | vMotion 流量 | 必须绑定到 vmk1 使用独立网关 |
| **provisioning** | 存储流量（NFS/iSCSI） | 可与默认共用，建议独立 |

```bash
# 查看 TCP/IP 堆栈
esxcli network ip netstack list

# 为 vMotion 创建独立堆栈
esxcli network ip netstack add --netstack=vmotion
esxcli network ip interface set --interface-name=vmk1 --netstack=vmotion
```

---

## 6. ESXi 防火墙

ESXi 内置了基于服务的防火墙。默认情况下只开放必要的端口，其他端口关闭。

### 常见防火墙服务

```bash
# 查看所有防火墙规则
esxcli network firewall ruleset list

# 查看某规则详情
esxcli network firewall ruleset rule list --ruleset-id=httpServer

# 开启 SSH
esxcli network firewall ruleset set --ruleset-id=sshServer --enabled=true

# 开启 vMotion
esxcli network firewall ruleset set --ruleset-id=vMotion --enabled=true

# 开启 NFS 客户端
esxcli network firewall ruleset set --ruleset-id=nfsClient --enabled=true
```

| 服务 | 端口 | 用途 | 默认状态 |
|------|------|------|---------|
| **sshServer** | 22/tcp | SSH 远程管理 | ❌ 关闭 |
| **httpServer** | 443/tcp | Web UI（必须开启） | ✅ 开启 |
| **vMotion** | 8000/tcp | 热迁移 | ❌ 关闭 |
| **nfsClient** | 2049/tcp | NFS 挂载 | ❌ 关闭 |
| **nfsServer** | 2049/tcp | NFS 服务 | ❌ 关闭 |
| **DHCP client** | 68/udp | DHCP | ✅ 开启 |
| **NTP client** | 123/udp | 时间同步 | ✅ 开启 |
| **CIM Server** | 5988/tcp | 硬件监控 | ✅ 开启 |

### 全局防火墙开关

```bash
# 查看防火墙状态
esxcli network firewall get

# 临时关闭防火墙（仅排障时使用，生产环境不可用）
esxcli network firewall set --enabled=false
```

---

## 7. 完整数据流路径

### 虚拟机 → 外网

```
VM 虚拟网卡(vmxnet3)
    → VM Network 端口组
    → vSwitch0
    → 上行链路(vmnic0)
    → 物理交换机 6口
    → 路由器(192.168.1.1)
    → 软路由(192.168.100.1 NAT)
    → H3C 防火墙
    → ISP → Internet
```

### 物理机管理 ESXi

```
浏览器/SSH 客户端(192.168.1.5)
    → 交换机 → vmk0(192.168.1.252)
    → 防火墙检查(httpServer / sshServer)
    → ESXi Hostd 服务
```

### vMotion 热迁移

```
源 ESXi vmk1 → 交换机 → 目标 ESXi vmk1
    → 防火墙检查(vMotion)
    → 内存数据通过 8000/tcp 传输
```

---

## 8. 最佳实践

| 实践 | 说明 |
|------|------|
| **管理和业务分离** | 管理网络（vmk0）与 VM 流量走不同上行链路 |
| **vMotion 专用网络** | 建议独立网段 + 10Gbps，避免抢占带宽 |
| **存储网络隔离** | iSCSI/NFS 走独立 vmnic，不与业务混跑 |
| **VLAN 透传用 4095** | 虚拟机内部自己做 VLAN 标记 |
| **防火墙最小原则** | 只开启需要的服务，关闭不必要的端口 |
| **网卡绑定** | 生产环境至少用两个 vmnic 做主备 |
| **MTU 一致** | 如果启用了 Jumbo Frame（MTU 9000），需要从物理交换机到 VM 全线一致 |

---

ESXi 的网络看似复杂，但理解了分层结构之后就清晰了：**物理网卡 → 虚拟交换机 → 端口组 → VMkernel/虚拟机的路径，每层都有自己的职责和配置要点。** 网络不通时，沿着这条链路逐层排查，就能定位问题。
