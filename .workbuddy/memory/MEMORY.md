# MEMORY.md - 长期记忆

## 环境配置
- **Node.js 安装路径**：`F:\Node_js\`（注意：原名 Node js，已重命名消除空格）
- **Redis 安装路径**：`F:\redis`（版本 5.0.14.1，64位）
- **Redis 密码**：`123456`
- **Redis 启动方式**：必须带配置文件 `cd F:\redis && redis-server redis.windows.conf`
- **Redis 配置文件**：`F:\redis\redis.windows.conf` 中设置了 `requirepass 123456`
- **Spring Boot Redis 配置**：application.yml 中 password 为 `123456`，与 Redis 保持一致
- **MySQL**：localhost:3306/demo_db，用户 root，密码 123456
- **后端端口**：Spring Boot 运行在某个端口（需确认），前端代理到 localhost:3000/api

## 项目信息
- **referenceFrontEnd**：Vue 3 + TypeScript + Element Plus + Vite 前端项目
- 技术栈：Vue3、Pinia、Vue Router、Element Plus、dayjs、Axios 封装
- 主要功能模块：用户管理、订单管理、个人中心、登录认证
- API 基础路径：`/api/*`，通过 Vite 代理转发到后端

## 踩坑经验
- npm 缓存目录路径不能有空格，否则 EPERM 权限错误
- Spring Boot 的 redis password 配置必须与 Redis 服务端实际密码一致，否则所有涉及缓存的操作都报 500
- Redis 用 CONFIG SET 设的密码是临时的，重启即丢失；要持久化需改 redis.conf 并带配置文件启动
- Redis 直接 `redis-server` 不带配置文件，不会加载 redis.windows.conf 中的设置
