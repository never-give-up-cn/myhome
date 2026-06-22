---
title: 无盘系统搭建全指南：从零开始构建 PXE 网络启动环境
date: 2026-06-22
tags:
  - 无盘系统
  - PXE
  - 网络启动
  - Linux
  - 服务器
categories:
  - 技术笔记
photos:
  - /img/posts/diskless-system-setup.png
---

## 什么是无盘系统？

无盘系统（Diskless System）是指客户端计算机没有本地硬盘，通过网络从服务器启动操作系统并运行。所有数据都存储在服务器端，客户端只负责计算。

{% blockquote %}
无盘系统的核心思想：**计算本地化，存储集中化**
{% endblockquote %}

### 适用场景

- **学校/培训机构机房** — 统一管理大量 PC，系统更新只需维护一个镜像
- **网吧/电竞酒店** — 游戏更新快，无盘方案省去每台机器装系统的麻烦
- **企业办公** — 数据不落地，安全性高，防止员工带走机密文件
- **IDC 机房** — 无盘批量部署服务器节点，免去逐台安装系统

### 优势 vs 劣势

| 优势 | 劣势 |
|------|------|
| 集中管理，运维成本低 | 依赖网络，网络故障则所有客户端瘫痪 |
| 数据安全，客户端不留数据 | 网络带宽要求高（尤其启动瞬间） |
| 硬件利用率高，无盘站可用旧机器 | 服务器单点故障风险（可做高可用） |
| 系统更新快，重启即还原 | 对 PXE 和网络配置有一定技术要求 |

<!-- more -->

---

## 无盘系统的原理

整个无盘启动流程如下：

```
客户端开机 → BIOS/UEFI → PXE → DHCP获取IP → TFTP下载引导程序
  → 加载内核/initrd → NFS/NBD/iSCSI挂载根文件系统 → 启动完成
```

### 关键组件

1. **DHCP 服务器** — 给客户端分配 IP，告诉它从哪里下载引导文件
2. **TFTP 服务器** — 提供小文件传输（引导加载器、内核、initrd）
3. **引导加载器** — pxelinux.0（BIOS）或 grubx64.efi（UEFI），负责加载内核
4. **内核 + initrd** — Linux 内核和初始内存文件系统
5. **根文件系统** — 通过 NFS / NBD / iSCSI 挂载的远程根目录

---

## 方案一：基于 NFS 的无盘 Linux（最简单）

这是最经典的方案，客户端通过网络文件系统（NFS）挂载根文件系统。

### 环境准备

| 组件 | 配置 |
|------|------|
| 服务器 OS | Ubuntu 22.04 LTS |
| 服务器 IP | 192.168.1.10 |
| 客户端 | 任意支持 PXE 的机器 |
| 网络 | 同一个二层广播域 |

### 1. 安装必要服务

```bash
# 在服务器上执行
apt update && apt install -y dnsmasq nfs-kernel-server debootstrap
```

### 2. 创建客户端根文件系统

```bash
# 创建根文件系统目录
mkdir -p /srv/diskless/node1

# 用 debootstrap 安装最小系统
debootstrap --arch=amd64 noble /srv/diskless/node1 http://archive.ubuntu.com/ubuntu/

# chroot 进去做基本配置
chroot /srv/diskless/node1 /bin/bash
```

在 chroot 环境中：

```bash
# 设置 root 密码
passwd root

# 安装必要工具
apt install -y vim openssh-server linux-image-generic

# 配置网络（使用 DHCP）
cat > /etc/netplan/01-netcfg.yaml << 'EOF'
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: yes
EOF

# 配置 fstab（NFS 挂载）
cat >> /etc/fstab << 'EOF'
192.168.1.10:/srv/diskless/node1 / nfs defaults 0 0
EOF

# 启用 SSH
systemctl enable ssh

exit  # 退出 chroot
```

### 3. 配置 NFS 导出

```bash
cat >> /etc/exports << 'EOF'
/srv/diskless/node1 192.168.1.0/24(rw,no_root_squash,sync,no_subtree_check)
EOF

exportfs -a
systemctl restart nfs-kernel-server
```

### 4. 配置 DHCP + TFTP（使用 dnsmasq）

```bash
# 备份原配置
mv /etc/dnsmasq.conf /etc/dnsmasq.conf.bak

cat > /etc/dnsmasq.conf << 'EOF'
# DHCP 范围
dhcp-range=192.168.1.100,192.168.1.200,12h

# PXE 引导
dhcp-boot=pxelinux.0

# TFTP
enable-tftp
tftp-root=/srv/tftp

# DNS（可选）
port=0
EOF

systemctl restart dnsmasq
```

### 5. 准备 TFTP 引导文件

```bash
mkdir -p /srv/tftp

# 安装 syslinux 获取 PXE 引导文件
apt install -y syslinux
cp /usr/lib/syslinux/modules/bios/pxelinux.0 /srv/tftp/
cp /usr/lib/syslinux/modules/bios/ldlinux.c32 /srv/tftp/
cp /usr/lib/syslinux/modules/bios/vesamenu.c32 /srv/tftp/
cp /usr/lib/syslinux/modules/bios/libcom32.c32 /srv/tftp/
cp /usr/lib/syslinux/modules/bibs/libutil.c32 /srv/tftp/

# 复制内核和 initrd
cp /boot/vmlinuz-* /srv/tftp/vmlinuz
cp /boot/initrd.img-* /srv/tftp/initrd.img

# 创建 PXE 配置文件
mkdir -p /srv/tftp/pxelinux.cfg
cat > /srv/tftp/pxelinux.cfg/default << 'EOF'
DEFAULT menu
PROMPT 0
MENU TITLE Diskless Boot
TIMEOUT 100

LABEL linux
  MENU LABEL Boot Ubuntu (NFS Root)
  KERNEL vmlinuz
  APPEND root=/dev/nfs nfsroot=192.168.1.10:/srv/diskless/node1 ip=dhcp rw initrd=initrd.img
EOF
```

### 6. 测试

将客户端设置为网络启动（PXE Boot），开机后：

1. 客户端通过 DHCP 获取 IP
2. 通过 TFTP 下载 pxelinux.0
3. 显示引导菜单，选择 "Boot Ubuntu (NFS Root)"
4. 加载内核，通过 NFS 挂载根文件系统
5. 启动完成

---

## 方案二：基于 iSCSI 的无盘系统（性能更好）

NFS 方案适合 Linux，但 Windows 无盘通常使用 iSCSI。iSCSI 将远程磁盘模拟为本地块设备，性能优于 NFS。

### iSCSI 服务端配置

```bash
# 安装 iSCSI 目标
apt install -y tgt

# 创建磁盘镜像（也可以使用独立分区或 LVM）
dd if=/dev/zero of=/srv/iscsi/disk1.img bs=1M count=20480  # 20GB
chmod 600 /srv/iscsi/disk1.img

# 配置 iSCSI 目标
cat > /etc/tgt/conf.d/diskless.conf << 'EOF'
<target iqn:2026-01.diskless:node1>
  backing-store /srv/iscsi/disk1.img
  initiator-address 192.168.1.0/24
  incominguser username password
</target>
EOF

systemctl restart tgt
```

客户端可以通过 iPXE 或 initrd 中的 iSCSI 发起端连接目标并引导系统。

---

## 方案三：商业无盘软件

如果不想从零搭建，市面上也有成熟的无盘解决方案：

| 软件 | 特点 |
|------|------|
| **锐起无盘** | 国内主流，支持 Windows/Linux，网吧行业首选 |
| **网众无盘** | 性能好，适合游戏场景 |
| **CCBoot** | 免费版可用，适合小规模部署 |
| **FOG Project** | 开源免费，带 Web 管理面板 |
| **iVentoy** | 国产开源，支持网络安装/启动多种 ISO |

---

## 踩坑记录

### 1. UEFI 与 BIOS 的兼容性

现在的新机器都是 UEFI 启动，引导文件完全不同：

- **BIOS** → `pxelinux.0` + `pxelinux.cfg/default`
- **UEFI** → `grubx64.efi` + `grub.cfg`

### 2. 网卡驱动

启动早期的内核可能缺少新网卡驱动。解决方法：

```bash
# 在服务器上重建 initrd 时注入驱动
mkinitramfs -o /srv/tftp/initrd.img $(uname -r)
```

如果还是不行，编译定制内核或在 TinyCore 中集成驱动。

### 3. DHCP 代理（Proxy DHCP）

如果现有网络已有 DHCP 服务器，可以使用 Proxy DHCP（dnsmasq 的 `--dhcp-proxy` 功能）只提供 PXE 引导信息，不冲突。

### 4. 交换机配置

有些交换机需要开启 IGMP Snooping 或禁止端口隔离，否则 PXE 广播包无法到达客户端。

---

## 总结

无盘系统的搭建技术栈其实很成熟，核心就是把启动流程搞清楚：

> **IP → 引导文件 → 内核 → 根文件系统**

每一层都有多种选择方案，从最简单的 dnsmasq + NFS 到企业级的 iSCSI + 高可用集群。对于家庭实验室或小型机房，NFS 方案完全够用且最容易上手。

建议初学者先用虚拟机（VirtualBox 或 VMware）搭建实验环境：一台虚拟机做服务器 + 一台虚拟机做无盘客户端，局域网内在同一个虚拟网络即可。
