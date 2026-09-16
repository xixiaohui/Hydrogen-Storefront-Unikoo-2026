# Shopify Flow 集成配置指南

本文档说明如何配置 Shopify Flow 工作流，在 Draft Order 创建时自动通知销售团队。

## 前置条件

1. Shopify Plus 计划（Flow 仅限 Plus）
2. Shopify Admin 中已启用 Flow 应用
3. （可选）Slack 或 Microsoft Teams incoming webhook URL

---

## 方案 A：Hydrogen 直接通知（推荐，无需 Flow）

Draft Order 创建后，Hydrogen 自动发送 Slack/Teams 通知。

### 配置

1. 创建 Slack Incoming Webhook：
   - https://api.slack.com/messaging/webhooks → Create webhook
   - 选择目标频道（如 #sales-quotes）
   - 复制 webhook URL

2. 或创建 Microsoft Teams webhook：
   - Teams → 频道 → Connectors → Incoming Webhook
   - 复制 webhook URL

3. 设置环境变量：
   ```bash
   # .env 或 Oxygen 环境变量
   SLACK_WEBHOOK_URL=<your-slack-incoming-webhook-url>
   # 或
   TEAMS_WEBHOOK_URL=<your-teams-incoming-webhook-url>
   ```

4. 完成！Quote 提交创建 Draft Order 后，销售团队会自动收到结构化通知（公司/联系人/邮箱/电话/项目描述 + Shopify Admin invoice 链接）。

---

## 方案 B：Shopify Flow 工作流（Plus 用户）

通过 Flow 工作流，在 Shopify Admin 中配置自动化。

### 步骤

1. 进入 **Shopify Admin → Apps → Shopify Flow**

2. 点击 **Create workflow**

3. **Trigger（触发器）**：
   - 选择 `Shopify`
   - 触发事件：`Draft order created`
   - 条件：`draft_order.note contains "website_quote_form"`（只匹配来自网站 Quote 表单的 Draft Order）

4. **Action 1（发送 HTTP 请求）**：
   - 选择 `Send HTTP request`
   - HTTP method: `POST`
   - URL: `https://your-domain.com/webhooks/flow`
   - Headers: `Content-Type: application/json`
   - Body:
     ```json
     {
       "draft_order": {
         "name": "{{ draft_order.name }}",
         "invoice_url": "{{ draft_order.invoice_url }}",
         "email": "{{ draft_order.email }}",
         "note": "{{ draft_order.note }}",
         "line_items": {{ draft_order.line_items | json }},
         "company": "{{ draft_order.company.name }}",
         "contact_name": "{{ draft_order.customer.first_name }} {{ draft_order.customer.last_name }}",
         "phone": "{{ draft_order.phone }}"
       }
     }
     ```

5. **Action 2（可选：发送邮件通知）**：
   - 添加 `Send email` action
   - To: sales@your-domain.com
   - Subject: `New Quote Request: {{ draft_order.name }}`
   - Body: 包含 Draft Order 详情链接

6. **保存并启用工作流**

### 工作流效果

```
Draft Order created (with note "website_quote_form")
  ↓
Send HTTP request → /webhooks/flow
  ↓
Hydrogen 接收 → 发送 Slack/Teams 通知 → 销售团队收到结构化消息
```

---

## 方案对比

| 特性 | 方案 A（直接通知） | 方案 B（Flow 工作流） |
|------|-------------------|---------------------|
| 依赖 | Slack/Teams webhook | Shopify Plus + Flow |
| 触发点 | Hydrogen action 创建 Draft Order 后 | Shopify Admin Draft Order 创建事件 |
| 配置位置 | 环境变量 | Shopify Admin UI |
| 延迟 | 即时（与创建同步） | 秒级（Flow 轮询） |
| 可扩展 | 修改代码 | Flow UI 拖拽 |

**推荐**：方案 A 为主（即时、无 Plus 依赖），方案 B 为辅（Plus 用户可额外配置 Flow 做更多自动化，如自动分配销售、创建任务等）。

---

## 环境变量清单

| 变量名 | 用途 | 必需 |
|--------|------|------|
| `SHOPIFY_ADMIN_API_TOKEN` | Admin API 创建 Draft Order | 是（无则降级 mailto） |
| `SLACK_WEBHOOK_URL` | Slack 通知 | 否（二选一） |
| `TEAMS_WEBHOOK_URL` | Teams 通知 | 否（二选一） |
| `SHOPIFY_WEBHOOK_SECRET` | 验证 Flow webhook 签名 | 否（生产推荐） |
