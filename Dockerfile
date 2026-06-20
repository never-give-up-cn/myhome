FROM nginx:alpine

# 安装必要的工具
RUN apk add --no-cache openssh-client

# 复制构建产物
COPY public/ /usr/share/nginx/html/

# Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 7600

CMD ["nginx", "-g", "daemon off;"]
