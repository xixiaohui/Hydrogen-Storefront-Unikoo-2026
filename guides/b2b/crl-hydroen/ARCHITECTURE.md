# ARCHITECTURE（PHASE 0 审计报告）

> 依据 `页面及UI-UX拆解-文件级别实现计划.md`，对当前仓库做现状审计与差距分析。
> 审计时间：2026-09-15。只做审计，不改 UI。

## 1. 技术栈现状

| 项 | 当前值 | 备注 |
| --- | --- | --- |
| Hydrogen | `2026.4.5` | B2B 已 stable，`context.ts` 无需 `unstableB2b` |
| React Router | `7.16.0` | `flatRoutes()` + `hydrogenRoutes()` |
| React | `18.3.1` | |
| Tailwind | `4.1.6`（`@tailwindcss/vite`），此前**未接入入口样式** | 已由 `root.tsx` 引入 `styles/tailwind.css`，见 §5 |
| 样式文件 | `app/styles/{app.css, reset.css, tailwind.css}` | `app.css` 是骨架自带的语义化 CSS（`.header`、`.product`…） |
| Storefront API client | `createHydrogenContext`（`app/lib/context.ts`） | i18n 硬编码 `EN/US` |
| 会话 | `AppSession`（cookie session，含 `buyer` 键） | 见 `HydrogenSessionData` |
| 路由 | 60 个，`xx.tsx` + `($locale).xx.tsx` **双份** | 新增路由必须复制两份 |

## 2. 已具备的能力（B2B 基线，来自上一阶段）

| 能力 | 文件 | 状态 |
| --- | --- | --- |
| 公司地点查询 | `app/graphql/customer-account/CustomerLocationsQuery.ts` | ✅ |
| 地点 Provider | `app/components/B2BLocationProvider.tsx` | ✅ 含 `refetch()` + revalidate |
| 地点选择器 | `app/components/B2BLocationSelector.tsx` | ✅ Aside 方案 + POST `/b2blocations` |
| buyer 上下文化 | `app/lib/b2b.ts`（`getBuyerVariables` / `b2bCacheOptions`） | ✅ 已应用到首页/集合/all/搜索/PDP |
| 数量规则 | `app/components/QuantityRules.tsx` | ✅ |
| 阶梯价 | `app/components/PriceBreaks.tsx` | ✅ |
| 购物车 buyer identity | `b2blocations` action | ✅ |

## 3. 目标架构（规格 §1 的 7 个系统）vs 现状

| 系统 | 目标 | 现状 | 差距 |
| --- | --- | --- | --- |
| 1 Global Navigation | TopBar / Header / MainNav / MegaMenu / 移动端 | 仅 `Header.tsx` 单层菜单 + `Aside` | 缺 TopBar、MegaMenu、移动菜单、B2B 状态位 |
| 2 Product Catalog | 集合页筛选/排序/分页/面包屑 | `collections.*` 有分页，无筛选、无排序、无面包屑 | 缺 Filters/Sort/Toolbar/Breadcrumbs |
| 3 Product Search | 搜索框 + 预测搜索 + 结果页 + SKU 命中 | 骨架版 `SearchForm*` 已有 | 未做 SKU 优化、suggestions 分组、键盘导航 |
| 4 B2B Commerce | 地点/目录/价格/数量规则/阶梯价/快速下单/询价 | 基线已完成（§2） | 缺 `/quick-order`、`/quote-request` |
| 5 Technical Resources | Metaobject 资料中心 | 无 | 缺 `resources.*` 路由 + Metaobject 定义 |
| 6 Customer Account | Dashboard/Orders/Order Detail/Locations/Addresses | 骨架 `account.*` 已存在（订单、地址） | 缺 B2B 地点管理页、Reorder |
| 7 Distribution/Location | 门店/仓库查询 | 无 | 缺 `locations.*` + Location Metaobject |

## 4. 目录组织差距

规格要求 `app/components/{layout,search,product,collection,b2b,cart,account,resources,common}` 分目录；
现状是 22 个组件**平铺**在 `app/components/`（`ProductItem`、`ProductForm`、`CartMain`、`SearchResults`…）。

`app/graphql/` 现状只有 `customer-account/`，其余 query 内联在各 route 文件里。

## 5. 需要决策的两处偏差

1. **样式体系**：规格建议 `tokens.css + components.css`；本项目是 Tailwind v4。
   已采用：保留 Tailwind（布局/工具类）+ `app/styles/tokens.css`（`@theme` 令牌，同时输出 `:root` 变量）
   + `app/styles/components.css`（语义类）。`app.css` 的骨架样式逐步迁移，避免两套体系打架。
2. **路由双份**：所有新路由必须同时创建 `xx.tsx` 与 `($locale).xx.tsx`（内容一致），否则多语言路径 404/降级。
   建议加一个 npm script 做副本同步校验。

## 6. 硬性规则（写进 CLAUDE.md / 每次改动前复核）

1. **buyer 上下文**：任何读产品/集合/价格的查询都要 `$buyer: BuyerInput` + `@inContext(buyer:)`，
   统一走 `getBuyerVariables(context)`，不要手写。
2. **缓存隔离**：有 buyer 的查询必须 `b2bCacheOptions()`（→ `CacheNone()`）。
   违反会导致 A 客户看到 B 客户的价格/目录（规格 §85/§86 定义为严重事故）。
3. **不硬编码**：分类、品牌、导航、资源一律来自 Shopify Navigation / Collection / Metaobject，禁止 TS 常量数组。
4. **不自建账号体系**：只用 Customer Account API；Checkout 走 Shopify Checkout URL。
5. **双份路由同步**，改完必跑 `npm run codegen && npm run typecheck`。

## 7. 阶段计划（对齐规格 §88 的 18 步，映射到本仓库）

| # | 阶段 | 主要文件 | 依赖 |
| --- | --- | --- | --- |
| P0 | Foundation / 设计系统 | `app/styles/tokens.css`、`app/components/common/*`、`CLAUDE.md` | — |
| P1 | Header + Mega Menu | `layout/TopBar|Header|MainNavigation|MegaMenu|MobileMenu` | P0 |
| P2 | Homepage | `_index.tsx` + Hero/FeaturedCategories/Brands/Resources Metaobject | P1 |
| P3 | Collection（筛选/排序/分页） | `collection/*` + `collections.$handle.tsx` 筛选参数 | P1 |
| P4 | Search（SKU/预测/建议） | `search/*` + `search.tsx` | P1 |
| P5 | PDP（Gallery/规格/文档/关联） | `product/*` + `products.$handle.tsx` | P0 |
| P6 | B2B 收口（目录/价格/缓存回归） | 已有文件 + 双客户验收 | P3/P4/P5 |
| P7 | Cart（抽屉 + 数量规则） | `cart/*` + `cart.tsx` | P5 |
| P8 | Account（B2B 地点/复购） | `account/*` | P6 |
| P9 | Resources（Metaobject） | `resources.*` | P0 + 后台建 Metaobject |
| P10 | Quick Order（SKU 批量） | `quick-order.tsx` | P7 |
| P11 | Quote Request | `quote-request.tsx` | P7 |
| P12 | Locations | `locations.*` | P0 + Metaobject |

业务核心 = P6/P7/P10；CRL 风格前端核心 = P1~P5。

## 8. 已落地：P0 设计系统 + P1 导航

| 文件 | 说明 |
| --- | --- |
| `app/styles/tokens.css` | `@theme` 令牌（品牌色/中性色/状态色/高度/阴影），同时输出为 `:root` 变量 |
| `app/styles/components.css` | 语义组件类：container/section/button/card/badge/data-table/form/breadcrumb + header/mega menu/mobile nav |
| `app/styles/tailwind.css` | 入口样式（此前未接入），由 `root.tsx` 引入 |
| `app/lib/menu.ts` | `resolveMenuUrl()`：把 Shopify 绝对菜单地址转为站内路径 |
| `app/components/layout/TopBar.tsx` | 顶部工具条：账号状态 + B2B 公司/地点上下文 |
| `app/components/layout/MainNavigation.tsx` | 桌面主导航（hover/focus 展开，键盘可达，Escape 关闭） |
| `app/components/layout/MegaMenu.tsx` | 二级菜单面板 + 「Shop all」特色区 |
| `app/components/layout/MobileMenu.tsx` | 移动端手风琴导航（渲染在 `Aside` 内） |
| `app/components/Header.tsx` | 重写：TopBar + Logo + MainNavigation + 搜索/账号/购物车 |
| `app/components/PageLayout.tsx` | 移动抽屉改用 `MobileMenu` |
| `app/root.tsx` | 引入 `tailwind.css` |
| `app/styles/app.css` | `:root` 不再覆盖 `--header-height` / `--color-dark` / `--color-light` |

顺带修复 `B2BLocationProvider.tsx`、`B2BLocationSelector.tsx` 的 floating promise lint 错误。

验收：`npm run build` 成功、`npx tsc --noEmit` 无错误、`npm run lint` 0 problem、
`npm run preview` 首页 200 且 SSR 输出含 `site-topbar` / `main-nav` / `brand`，
产物 `tailwind-*.css` 含 `--color-brand-600` 与 `.mega-menu`。

## 9. 已落地：P3 集合页筛选 / 排序

| 文件 | 说明 |
| --- | --- |
| `app/lib/filters.ts` | URL 驱动筛选：`parseProductFilters()` 把 `filter.*` 参数解析为 Storefront `ProductFilter`；`toggleFilterUrl/setFilterUrl/clearFiltersUrl/sortUrl`；`SORT_OPTIONS` 与 `getSortValues()` |
| `app/components/collection/FilterSidebar.tsx` | 分面筛选（列表/价格区间/可用性），值即链接，可分享、无 JS 可用；含 Clear all |
| `app/components/collection/SortSelect.tsx` | 排序下拉，GET 提交并用 hidden input 保留筛选条件 |
| `app/components/Breadcrumbs.tsx` | 通用面包屑 |
| `app/components/ProductItem.tsx` | 升级为工业风卡片：品牌、标题、SKU、价格 |
| `app/routes/collections.$handle.tsx`（+ `($locale)` 副本） | loader 计算 filters/sortKey/reverse，查询加 `filters` 与 `products.filters`，页面=面包屑+工具栏+筛选栏+网格 |
| `app/styles/app.css` | 集合页工具栏/筛选栏/产品卡样式 |

约束：`filters` 与 `sortKey` 走 URL，保证可分享；查询仍带 `$buyer` 并用 `b2bCacheOptions()`（B2B 价与目录不进共享缓存）。

验收：`npm run codegen` + `react-router typegen` + `npx tsc --noEmit` 无错误、`npm run lint` 0 error 0 warning、
`npm run build` 成功；预览下 `/collections/construction-gold?sort=price-low-high` 返回 200，SSR 输出含
`class="filters"`、`product-card`、`sort-select`、`breadcrumb`、`collection-count`。

## 10. 后台（Shopify Admin）前置依赖

规格 §68：产品、集合、导航、客户、公司/公司地点、目录、Markets、Locations，
以及 Metaobject 定义：`Hero`、`MegaMenuItem`、`Brand`、`Resource`、`TechnicalDocument`、`Location`。
这些不属于前端实现，需先在 Admin 配置，否则页面只能渲染空态。
