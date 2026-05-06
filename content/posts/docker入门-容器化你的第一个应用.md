---
title: "Docker入门：容器化你的第一个应用"
date: "2026-05-06"
category: "编程实战"
tags: ["编程实战", "Docker"]
description: "Docker入门：容器化你的第一个应用 - 详细教程与实战指南"
draft: "false"
---

# Docker入门：容器化你的第一个应用

当你新加入一个团队，或者换了一台开发机器，最头疼的事莫过于“在我电脑上明明能跑”——环境不一致、依赖缺失、系统版本差异……Docker 正是为了解决这个痛点而生。本文将通过一个简单的 Node.js Web 应用，带你从零开始体验容器化的完整流程。

## 1. 为什么需要 Docker？

传统开发中，应用运行依赖操作系统、运行时、库文件、环境变量等。哪怕只是从开发机部署到测试服务器，都可能在“环境配置”这一步翻车。

Docker 的核心思路是**将应用及其所有依赖打包成一个标准化的“容器”**，这个容器可以在任何安装了 Docker 的机器上以相同方式运行。相当于给你的应用造了一个“移动小房子”，无论搬到哪台机器，里面的环境都一模一样。

## 2. 准备工作：安装 Docker

在开始之前，请确保你的机器已经安装了 Docker。

**macOS / Windows**：下载 [Docker Desktop](https://www.docker.com/products/docker-desktop) 并安装。
**Linux（Ubuntu为例）**：
```bash
sudo apt update
sudo apt install docker.io
sudo systemctl start docker
sudo systemctl enable docker
```

安装完成后，在终端运行 `docker --version` 确认安装成功。

## 3. 编写一个极简的 Node.js 应用

我们在一个空目录下创建两个文件。

**app.js**（一个简单的 HTTP 服务）：
```javascript
const http = require('http');
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, Docker!\n');
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
```

**package.json**（定义依赖，这里没有额外依赖，但需要声明入口）：
```json
{
  "name": "docker-demo",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  }
}
```

现在运行 `node app.js`，访问 `http://localhost:3000` 可以看到 "Hello, Docker!"。接下来我们把它装进 Docker 容器。

## 4. 编写 Dockerfile：描述你的容器

在项目根目录创建一个名为 `Dockerfile` 的文件（注意没有扩展名）：

```dockerfile
# 使用官方 Node.js 镜像作为基础
FROM node:18-alpine

# 设置容器内的工作目录
WORKDIR /app

# 将 package.json 复制到工作目录
COPY package.json .

# 安装依赖（这里没有依赖，但保留此步骤）
RUN npm install

# 将���目所有文件复制到容器
COPY . .

# 暴露容器内的端口 3000
EXPOSE 3000

# 容器启动时执行的命令
CMD ["npm", "start"]
```

**关键指令解释**：
- `FROM`：指定基础镜像。`node:18-alpine` 是精简版 Node.js 镜像，体积小。
- `WORKDIR`：设置容器内的工作目录，后续命令都在此目录执行。
- `COPY`：将宿主机文件复制到容器内。
- `RUN`：在容器构建过程中执行命令（如安装依赖）。
- `EXPOSE`：声明容器运行时监听的端口（仅作文档说明，不实际映射）。
- `CMD`：容器启动时默认执行的命令。

## 5. 构建并运行你的第一个容器

### 5.1 构建镜像

在项目根目录执行：
```bash
docker build -t my-node-app .
```

- `-t my-node-app`：给镜像打上标签（名字），方便识别。
- `.`：指定构建上下文为当前目录。

构建成功后，运行 `docker images` 可以看到名为 `my-node-app` 的镜像。

### 5.2 运行容器

```bash
docker run -d -p 8080:3000 --name my-app my-node-app
```

- `-d`：后台运行（detached）。
- `-p 8080:3000`：将宿主机的 8080 端口映射到容器内的 3000 端口。
- `--name my-app`：给容器起个名字。

现在访问 `http://localhost:8080`，你应该能看到 "Hello, Docker!"。

### 5.3 常用容器操作

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 停止容器
docker stop my-app

# 启动已停止的容器
docker start my-app

# 查看容器日志
docker logs my-app

# 删除容器（需先停止）
docker rm my-app

# 删除镜像
docker rmi my-node-app
```

## 6. 实际场景：为什么这样写才是最佳实践？

你可能会问：为什么要把 `package.json` 和源代码分开两次 `COPY`？这背后是 Docker 构建缓存的优化策略。

Docker 构建镜像时，每一行指令都会产生一个缓存层。当修改了源代码（`app.js`），但 `package.json` 没变时，Docker 会复用 `COPY package.json .` 和 `RUN npm install` 的缓存，只重新执行后续步骤。这能大幅缩短构建时间，尤其是在项目依赖较多时。

**反例**：如果写成 `COPY . .` 放在 `RUN npm install` 前面，那么每次修改任何文件都会导致整个安装依赖的步骤重新执行。

## 总结

通过本文，你完成了 Docker 的第一次实战：
1. 理解容器化解决环境一致性问题。
2. 编写了一个简单的 Node.js 应用。
3. 用 `Dockerfile` 描述应用如何打包。
4. 构建镜像并运行容器，验证服务正常。

接下来你可以尝试：将同一个镜像部署到另一台机器（只需安装 Docker），或者使用 `docker-compose` 编排多个容器（如 Web + 数据库）。容器化的世界，才刚刚开始。