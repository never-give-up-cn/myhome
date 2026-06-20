#!/bin/bash
# 部署 Hexo 博客到本机 Docker
# 在服务器上执行：bash deploy.sh

set -e

echo "=== 1. 安装依赖 ==="
which docker >/dev/null 2>&1 || { echo "请先安装 Docker: curl -fsSL https://get.docker.com | sh"; exit 1; }

echo "=== 2. 获取代码 ==="
cd /opt
if [ -d "myhome" ]; then
  cd myhome && git pull
else
  git clone https://github.com/never-give-up-cn/myhome.git
  cd myhome
fi

echo "=== 3. 构建镜像 ==="
docker build -t hexo-blog .

echo "=== 4. 停止旧容器 ==="
docker rm -f cyh-photo-blog 2>/dev/null || true

echo "=== 5. 启动新容器 ==="
docker run -d \
  --name cyh-photo-blog \
  -p 7600:7600 \
  --restart unless-stopped \
  hexo-blog

echo "=== 6. 检查状态 ==="
sleep 2
docker ps | grep cyh-photo-blog
echo ""
echo "✅ 部署完成！访问 http://$(hostname -I | awk '{print $1}'):7600"
