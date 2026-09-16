# Shopify App 配置指南：Admin API Token + Scope

本文档详细说明如何创建 Shopify Custom App、配置 Admin API token 和 scope，使 Hydrogen 能够自动创建 Draft Order。

---

## 一、创建 Custom App

> **前提**：你需要是 Shopify 商店的店主或拥有 `Settings` 权限的管理员。

### 步骤

1. 登录 **Shopify Admin**（`https://your-store.myshopify.com/admin`）

2. 进入 **Settings → Apps and sales channels**

3. 点击 **Develop apps for your store**（如果看不到此选项，需要店主在 `Settings → Apps → Allow app development` 中启用）

4. 点击 **Create app**

5. 填写：
   - **App name**: `Hydrogen Quote Automation`（自定义名称）
   - **App developer**: 选择你自己或团队

6. 点击 **Create app**

---

## 二、配置 Admin API Scope

1. 在刚创建的 App 页面，点击 **Configuration** 标签

2. 找到 **Admin API access scopes** 区域

3. 配置以下 scope：

   | Scope | 权限级别 | 用途 |
   |-------|---------|------|
   | `draft_orders` | **Read and write** | 创建/读取 Draft Order（Quote 自动创建） |
   | `orders` | Read-only | 读取订单信息（可选，用于报表） |
   | `products` | Read-only | 读取产品目录（可选，Quick Order 验证） |
   | `customers` | Read-only | 读取客户信息（可选，B2B 展示） |
   | `company_contacts` | Read-only | 读取公司联系人（Team Members 展示） |

4. 点击 **Save**

---

## 三、安装 App 并获取 Token

1. 回到 App 概览页，点击 **Install app**（或 **Install** 按钮）

2. 确认权限弹窗中点击 **Install**

3. 安装完成后，页面会显示 **Admin API access token**：
   - 格式：`shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **立即复制并保存** — 离开页面后不再显示完整 token

4. **安全存储**：
   - 不要提交到 git
   - 不要写入前端代码
   - 只存入环境变量（`.env` 或 Oxygen 环境变量）

---

## 四、配置 Hydrogen 环境变量

### 本地开发

```bash
# .env 文件（从 .env.example 复制）
SESSION_SECRET=your-session-secret-min-32-chars-long
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
PUBLIC_STOREFRONT_API_TOKEN=your-public-storefront-api-token
PUBLIC_STOREFRONT_ID=your-storefront-id
PUBLIC_CHECKOUT_DOMAIN=checkout.your-store.com

# Admin API (本次新增)
SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 通知 (可选)
SLACK_WEBHOOK_URL=<your-slack-incoming-webhook-url>
```

### Oxygen 生产环境

1. 进入 **Shopify Admin → Online Store → Hydrogen → Settings**
2. 找到 **Environment variables** 区域
3. 添加：
   - Key: `SHOPIFY_ADMIN_API_TOKEN`
   - Value: `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 勾选 **Secret**（加密存储）
4. 保存并重新部署

---

## 五、验证配置

### 本地验证

```bash
# 启动开发服务器
npm run dev

# 访问 Quote 页面
# http://localhost:3000/quote

# 添加商品到购物车 → 填写报价表单 → 提交
# 预期结果：
#   - 成功 banner 显示 Draft Order 名称
#   - "View invoice" 按钮链接到 Shopify Admin
#   - Slack/Teams 收到通知（如配置了 webhook）
```

### 验证 Admin API 连通性

```bash
# 用 curl 测试 Admin API
curl -X POST \
  "https://your-store.myshopify.com/admin/api/2025-07/graphql.json" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: $SHOPIFY_ADMIN_API_TOKEN" \
  -d '{"query":"{ shop { name } }"}'

# 预期返回：
# {"data":{"shop":{"name":"Your Store Name"}}}
```

---

## 六、Scope 权限矩阵

| 功能 | 需要 Scope | 权限级别 | 文件 |
|------|-----------|---------|------|
| Quote → Draft Order 创建 | `draft_orders` | write | `lib/admin-api.ts` |
| 读取待审批 Draft Order | `draft_orders` | read | `graphql/CustomerDraftOrdersQuery` |
| 读取公司联系人 | `company_contacts` | read | `graphql/CustomerCompanyContactsQuery` |
| 读取订单（Dashboard） | — (Customer Account API) | — | `graphql/CustomerOrdersQuery` |
| 读取地址/资料 | — (Customer Account API) | — | `graphql/CustomerDetailsQuery` |

> **注意**：Customer Account API 的查询不需要 Admin API token — 它使用客户登录后的 OAuth token。Admin API token 只用于**服务端创建 Draft Order**。

---

## 七、安全最佳实践

1. **永远不要**把 Admin API token 放入前端代码或 `.env` 提交到 git
2. **永远不要**在浏览器中暴露 Admin API token
3. `.env` 已在 `.gitignore` 中
4. 在 Oxygen 中标记为 Secret
5. 定期轮换 token（Admin → App → API access → Rotate）
6. 最小权限原则：只配置必需的 scope

---

## 八、故障排除

### "SHOPIFY_ADMIN_API_TOKEN is not set"
- `.env` 文件中未配置 token
- Oxygen 环境变量未设置
- → Quote 会自动降级为 mailto: 模式（不阻塞用户）

### "Admin API error: 401 Unauthorized"
- Token 无效或已过期
- → 在 Shopify Admin 中重新安装 App 获取新 token

### "Admin API error: 403 Forbidden"
- Scope 不足
- → 确认 `draft_orders` scope 配置为 "Read and write"

### "Cannot query field draftOrders on type Customer"
- Customer Account API 版本太旧
- → 确认 Hydrogen 2026.4.x+ 和 Customer Account API 2024-07+

### Draft Order 创建成功但通知未收到
- `SLACK_WEBHOOK_URL` 或 `TEAMS_WEBHOOK_URL` 未配置
- webhook URL 无效或频道已删除
- → 检查环境变量和 webhook URL 有效性
