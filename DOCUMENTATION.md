# 参考管理系统前端 — 功能文档

---

## 一、项目简介

本项目是基于 Spring Boot 后端（`reference` 项目）开发的配套 Vue3 前端应用，覆盖了后端全部核心业务模块：用户管理、订单管理与身份认证。

**技术栈**：Vue 3 + TypeScript + Vite + Pinia + Vue Router 4 + Element Plus + Axios

---

## 二、环境要求

| 工具 | 版本要求 |
|------|---------|
| Node.js | >= 18.x |
| npm | >= 9.x（或 pnpm >= 8） |
| 后端服务 | Spring Boot 项目运行在 `localhost:8080` |

---

## 三、启动步骤

### 1. 安装依赖

```bash
cd F:/vscode/referenceFrontEnd
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

### 3. 构建生产包

```bash
npm run build
```

产物输出至 `dist/` 目录

### 4. 预览构建结果

```bash
npm run preview
```

### 演示账号（后端预置）

| 账号 | 密码 |
|------|------|
| admin | Test@1234 |
| testuser | Test@1234 |

---

## 四、关键依赖说明

| 依赖 | 版本 | 用途 |
|------|------|------|
| `vue` | ^3.4 | 核心框架，Composition API |
| `vue-router` | ^4.2 | 客户端路由，Hash/History 模式 |
| `pinia` | ^2.1 | 全局状态管理，替代 Vuex |
| `axios` | ^1.6 | HTTP 请求，统一封装拦截器 |
| `element-plus` | ^2.4 | UI 组件库，按需自动导入 |
| `@element-plus/icons-vue` | ^2.3 | Element Plus 图标库 |
| `dayjs` | ^1.11 | 轻量日期格式化工具 |
| `vite` | ^5.0 | 构建工具，开发代理配置 |
| `unplugin-auto-import` | ^0.17 | Vue/Router/Pinia 函数自动导入 |
| `unplugin-vue-components` | ^0.26 | Element Plus 组件按需自动导入 |

---

## 五、目录结构

```
src/
├── api/                # API 请求层
│   ├── request.ts      # Axios 实例、拦截器、useAPI() Hook
│   ├── auth.ts         # 认证相关接口
│   ├── users.ts        # 用户相关接口
│   └── orders.ts       # 订单相关接口
├── layouts/
│   └── MainLayout.vue  # 主布局（侧边栏 + Header + 内容区）
├── router/
│   └── index.ts        # 路由配置 + 导航守卫
├── stores/
│   ├── auth.ts         # 认证状态（token、用户信息、持久化）
│   └── app.ts          # 应用状态（主题、侧边栏收起）
├── styles/
│   └── main.css        # 全局 CSS 变量、深色模式、基础样式
├── types/
│   └── index.ts        # TypeScript 类型定义
└── views/
    ├── auth/
    │   ├── LoginView.vue       # 登录页
    │   └── RegisterView.vue    # 注册页
    ├── dashboard/
    │   └── DashboardView.vue   # 控制台（数据概览）
    ├── users/
    │   ├── UserListView.vue    # 用户列表（查询/增/删/改）
    │   └── UserDetailView.vue  # 用户详情
    ├── orders/
    │   ├── OrderListView.vue   # 订单列表（筛选/创建/支付/取消）
    │   └── OrderDetailView.vue # 订单详情 + 状态流转时间线
    ├── profile/
    │   └── ProfileView.vue     # 个人中心（密码修改/主题切换）
    └── error/
        └── NotFoundView.vue    # 404 页面
```

---

## 六、界面设计说明

### 整体风格

- 采用 Element Plus 2.x 组件库，配合自定义 CSS 变量实现一致视觉规范
- 主色调：蓝色 `#409EFF`，整体风格简洁清爽
- 圆角、阴影统一通过 CSS 变量管理，方便主题扩展

### 响应式适配

- 主布局采用 Flex，侧边栏固定宽度 `220px`，内容区自适应
- 侧边栏支持折叠为 `64px`，通过动画平滑过渡
- 数据统计卡片使用 CSS Grid，桌面 4 列，平板 2 列自动切换
- 内容详情页双栏布局在 `<960px` 时自动切换为单列

### 深色模式

- 通过 `html.dark` 类切换 CSS 变量实现，利用 Element Plus 官方 dark CSS vars
- 登录/注册页背景渐变也随深色模式自动适配
- 主题选择持久化至 `localStorage`，刷新页面保持

### 关键交互

- **登录/注册**：带有渐变装饰背景，表单内置校验，演示账号一键填入
- **侧边栏**：折叠按钮带有 Tooltip 提示，Logo 文字 Fade 动画
- **用户头像**：根据用户名哈希取色，系统字母头像
- **删除/禁用等危险操作**：均有 `ElMessageBox.confirm` 二次确认
- **订单状态**：使用 Timeline 展示流转步骤，当前/已完成/待处理颜色区分

---

## 七、前后端对接说明

### API 基础配置

开发环境通过 Vite 代理转发：

```
请求 /api/xxx  →  代理至  http://localhost:8080/api/xxx
```

配置文件：`vite.config.ts` → `server.proxy`

生产环境修改 `.env` 中的 `VITE_API_BASE_URL` 为实际后端地址。

### 认证机制

1. 调用 `POST /api/auth/login` 获取 JWT Token
2. Token 保存于 `localStorage`（通过 `useAuthStore`）
3. 每次请求由 `request.ts` 请求拦截器自动附加 `Authorization: Bearer <token>`
4. 响应拦截器捕获 401，弹出会话过期提示并跳转登录页

### 错误处理

| HTTP 状态 | 处理方式 |
|-----------|---------|
| 200 但 code !== 200 | `ElMessage.error(message)` |
| 400 | 提示"请求参数有误" |
| 401 | 弹框提示过期，清除 Token，跳转登录 |
| 403 | 提示"无权限" |
| 500 | 提示"服务器内部错误" |
| 网络错误 | 提示"网络连接失败" |

### 接口映射

| 功能 | 方法 | 路径 |
|------|------|------|
| 登录 | POST | `/api/auth/login` |
| 注册 | POST | `/api/users` |
| 获取用户列表 | GET | `/api/users` |
| 获取用户详情 | GET | `/api/users/{id}` |
| 更新用户 | PUT | `/api/users/{id}` |
| 修改用户状态 | PATCH | `/api/users/{id}/status` |
| 删除用户 | DELETE | `/api/users/{id}` |
| 获取订单列表 | GET | `/api/orders` |
| 获取订单详情 | GET | `/api/orders/{id}` |
| 创建订单 | POST | `/api/orders` |
| 支付订单 | POST | `/api/orders/{id}/pay` |
| 取消订单 | POST | `/api/orders/{id}/cancel` |

---

## 八、路由结构与守卫

```
/login              — 登录页（公开）
/register           — 注册页（公开）
/                   — 主布局（需鉴权）
  /dashboard        — 控制台
  /users            — 用户列表
  /users/:id        — 用户详情
  /orders           — 订单列表
  /orders/:id       — 订单详情
  /profile          — 个人中心
/*                  — 404 Not Found
```

**路由守卫规则**：
- 未登录访问受保护路由 → 重定向至 `/login?redirect=原路径`
- 已登录访问 `/login`、`/register` → 重定向至 `/dashboard`
- 登录成功后自动跳回 `redirect` 参数中的原路径

---

## 九、状态管理（Pinia）

### `useAuthStore`

| 属性/方法 | 说明 |
|-----------|------|
| `token` | JWT Token，持久化至 localStorage |
| `user` | 登录响应完整对象 |
| `isLoggedIn` | 计算属性，判断是否已登录 |
| `userId` | 当前用户 ID |
| `nickname` | 昵称（fallback 用户名） |
| `setAuth(data)` | 保存登录信息 |
| `logout()` | 清除 Token 和用户信息 |

### `useAppStore`

| 属性/方法 | 说明 |
|-----------|------|
| `theme` | 当前主题 `'light'` / `'dark'` |
| `sidebarCollapsed` | 侧边栏是否折叠 |
| `initTheme()` | 初始化时应用保存的主题 |
| `toggleTheme()` | 切换主题并持久化 |
| `toggleSidebar()` | 切换侧边栏状态 |

---

## 十、代码规范摘要

- **语言**：TypeScript（严格模式），所有组件使用 `<script setup lang="ts">`
- **命名**：组件文件 `PascalCase`，API 函数文件 `camelCase`，CSS 类 `kebab-case`
- **API 层**：所有请求封装在 `src/api/` 下对应模块，通过 `useAPI()` Hook 调用，不直接使用 axios
- **类型**：公共类型统一定义在 `src/types/index.ts`，避免重复声明
- **样式**：组件内使用 `<style scoped>`；全局变量定义在 `main.css`；避免直接覆盖 Element Plus 默认样式
- **确认弹窗**：所有破坏性操作（删除、禁用、支付、取消订单）必须经过 `ElMessageBox.confirm`
- **成功提醒**：所有写操作成功后调用 `ElMessage.success()`
- **错误处理**：业务错误由 Axios 响应拦截器统一处理，组件层无需重复 try/catch 展示错误

---

*文档生成时间：2026-04-17*
所有文件已创建完毕。以下是完整总结：

  ---
  项目已生成完毕

  目录：F:/vscode/referenceFrontEnd（共 30 个文件）

  文件清单

  ┌───────┬─────────────────────────────────────────────┬────────────────────────────────────────────────────────────┐
  │ 类别  │                    文件                     │                            说明                            │
  ├───────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 配置  │ package.json, vite.config.ts, tsconfig.json │ 项目构建配置                                               │
  ├───────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 入口  │ index.html, src/main.ts, src/App.vue        │ 应用入口，初始化 Pinia/Router/ElementPlus                  │
  ├───────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 样式  │ src/styles/main.css                         │ 全局 CSS 变量、深色模式、响应式基础                        │
  ├───────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 类型  │ src/types/index.ts                          │ 全部 TypeScript 类型定义                                   │
  ├───────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ API层 │ src/api/request.ts + auth/users/orders.ts   │ Axios 实例 + 拦截器 + 各模块接口                           │
  ├───────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 状态  │ src/stores/auth.ts + app.ts                 │ Pinia：认证状态、主题/侧边栏状态                           │
  ├───────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 路由  │ src/router/index.ts                         │ 路由配置 + 导航守卫鉴权                                    │
  ├───────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 布局  │ src/layouts/MainLayout.vue                  │ 折叠侧边栏 + Header（主题切换/用户菜单）                   │
  ├───────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 页面  │ 8 个 View 组件                              │ 登录、注册、控制台、用户列表/详情、订单列表/详情、个人中心 │
  ├───────┼─────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ 文档  │ DOCUMENTATION.md                            │ 完整功能文档                                               │
  └───────┴─────────────────────────────────────────────┴────────────────────────────────────────────────────────────┘

  启动步骤

  cd F:/vscode/referenceFrontEnd
  npm install
  npm run dev
  # 访问 http://localhost:3000

  确保后端 reference 项目运行在 localhost:8080，Vite 会自动代理 /api 请求。

  核心功能覆盖

  - 认证：JWT 登录/注册，Token 持久化，401 自动跳转，路由守卫
  - 控制台：用户/订单数量统计，状态分布图，最近订单列表
  - 用户管理：分页列表、关键词搜索、状态筛选、增删改、启用/禁用（二次确认）
  - 订单管理：分页列表、快捷状态 Tab 筛选、创建订单、支付、取消（二次确认）
  - 详情页：用户详情含关联订单；订单详情含流转时间线
  - 个人中心：修改密码、切换主题、退出登录
  - 深色模式：全局切换，持久化，含 Element Plus 官方 dark vars