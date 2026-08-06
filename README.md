# LinkForge 前端

> LinkForge 电商项目的 **Vue 3 前端**，采用「商城前台 + 管理后台」双端架构：普通用户登录进入商城（商品浏览、购物车、秒杀、AI 客服），管理员进入后台（商品/用户/订单/秒杀管理）。全站官网风格视觉 + 深色模式。

📖 详细文档：[前端架构详解](docs/FRONTEND.md)

## 功能总览

### 商城端（USER）
| 页面 | 能力 |
|------|------|
| 商城首页 | 商品网格（图片/价格/库存）、**加入购物车 + 立即购买** 双按钮、秒杀专区 |
| 购物车 | 数量调整/删除/全选/合计/结算（落库，角标实时计数） |
| 结算页 | 商品清单、优惠券选择、金额汇总、提交下单 → 订单详情 |
| 限时秒杀 | 活动列表、抢购、**我的秒杀**（支付/取消/退款/详情） |
| 我的订单 | 订单列表（按状态筛选）、详情、支付/取消/**确认收货** |
| 智能客服 | AI 对话（DeepSeek + RAG：可查订单状态/积分/发货），快捷问题 |
| 优惠券中心 | 可领券列表、我的券 |
| 个人中心 | 用户信息、修改 |

### 管理后台（ADMIN）
| 页面 | 能力 |
|------|------|
| 控制台 | 统计概览（订单/商品/用户/秒杀） |
| 用户管理 | 分页/搜索/启停/删除，**创建用户可选角色**（仅 ADMIN 可建 ADMIN） |
| 商品管理 | CRUD、**图片上传**、上下架、低库存预警（<10 黄色/=0 红色） |
| 订单管理 | 全量订单、**发货**、创建订单（代下单，含券/备注） |
| 秒杀管理 | 活动创建（弹窗表单）、启动/下架 |

### 通用能力
- 角色化路由守卫（未登录→登录页；USER 撞管理路由→弹回商城；已登录访问登录页→按角色跳转）
- 官网风格视觉：Design Token（主色 `#4F6BFF`）+ 渐变 + 卡片 + 大留白 + 响应式（移动端导航折叠）
- **深色/亮色模式**一键切换并持久化
- 统一组件：StatusTag / ProductImage（占位回退）/ PageHeader / EmptyState / AppAvatar

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3（Composition API + `<script setup>`） |
| 语言 | TypeScript |
| UI 组件 | Element Plus 2.9 |
| 构建 | Vite 6 |
| 状态管理 | Pinia（auth/app） |
| 路由 | Vue Router 4（双壳布局 + 守卫） |
| HTTP | Axios（拦截器统一错误处理/Token 注入） |
| 日期 | dayjs |

## 目录结构

```
src/
├── api/            # 接口层（request 封装 + auth/users/products/orders/seckill/cart/coupons/points/files/support）
├── components/     # 通用组件（StatusTag/ProductImage/ProductFormDialog/SeckillCreateDialog/...）
├── constants/      # 状态映射（订单/秒杀状态→标签）
├── layouts/        # 双壳布局（MainLayout 后台 / MallLayout 商城）
├── router/         # 路由（角色化守卫）
├── stores/         # Pinia（auth 持久化 token/role、app 主题）
├── styles/         # Design Token + 全局样式（深色模式）
├── types/          # TS 类型定义
├── utils/          # 格式化工具
└── views/
    ├── auth/       # 登录/注册（官网式）
    ├── mall/       # 商城：Home/Cart/Checkout/Support
    ├── seckill/    # 秒杀（活动+我的秒杀）
    ├── orders/     # 订单列表/详情
    ├── products/   # 商品管理
    ├── users/      # 用户管理
    ├── coupons/    # 优惠券中心
    └── dashboard/  # 控制台
```

## 快速开始

### 本地开发

```bash
npm install
npm run dev        # http://localhost:3000（/api 代理到 localhost:8080）
```

环境变量（`.env`）：`VITE_API_BASE_URL=/api`（相对路径，适配代理/nginx）

### 类型检查 / 构建

```bash
npm run type-check     # vue-tsc --noEmit（0 错误）
npm run build          # 产物 dist/
```

## Docker 部署

与后端整套编排（`reference-self/docker-compose.yml`）：

- `Dockerfile`：node:22-alpine 构建 → nginx:alpine 托管
- `nginx.conf`：静态资源 + `/api`、`/uploads` 反代后端 + SPA 回退 + 静态缓存

```bash
cd ../reference-self   # 在后端项目根执行
docker compose up -d --build
# 访问 http://localhost:3000（admin/Test@1234）
```

> 端口说明：Docker 环境 MySQL 3307 / Redis 6380 与本地开发环境隔离；后端 8080、前端 3000 与本地共用（两套同时跑需停其一）。

## 账号

| 账号 | 密码 | 入口 |
|------|------|------|
| `admin` | `Test@1234` | 管理后台（登录后自动进入） |
| `testuser` | `Test@1234` | 商城（登录后自动进入） |

## License

MIT
