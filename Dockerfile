# ============================================================
# LinkForge 前端 Dockerfile（多阶段构建）
# 构建：node:22-alpine → npm run build（含 vue-tsc 类型检查）
# 运行：nginx:alpine 托管静态资源 + 反向代理 /api、/uploads 到后端
# ============================================================

# ---- 构建阶段 ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- 运行阶段 ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
