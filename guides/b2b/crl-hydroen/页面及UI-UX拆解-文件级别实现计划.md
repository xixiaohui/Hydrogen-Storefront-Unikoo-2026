# 页面及UI-UX拆解-文件级别实现计划
1.CRL 每个页面应该长什么样
2.Hydrogen 每个页面对应哪些 route/component
3.Shopify 哪些数据负责提供
4.Claude Code 按什么顺序开发、每一步验收什么

# 特别注意
另外我会把一个关键点提前纠正：B2B 页面不能简单按照普通 Shopify storefront 做缓存。Shopify 官方明确提醒，带 customerAccessToken + companyLocationId 的查询会返回客户专属价格和产品数据，如果错误缓存，可能把一个客户的 B2B 价格返回给另一个客户。

# 项目目标
以 CR Laurence（CRL）为产品、信息架构、B2B 购物流程和视觉交互参考，重新设计一个基于 Shopify + Hydrogen + TypeScript 的现代 B2B Commerce 网站；Shopify 负责商品、分类、客户、公司、Company Location、Catalog、价格、库存、订单、购物车和结账等核心数据，Hydrogen 负责全部前端体验。


CRL → Shopify Hydrogen
页面级 UI/UX + 文件级开发 Specification

Version: 1.1
Frontend: Shopify Hydrogen / React Router / TypeScript
Backend: Shopify
Reference: C.R. Laurence
Deployment: Shopify Oxygen

0. 总体开发原则

整个项目必须遵循：

Shopify
    ↓
Commerce / B2B / Data
    ↓
Storefront API
Customer Account API
    ↓
Hydrogen
    ↓
UI / UX / SEO / Interaction
    ↓
Oxygen

Hydrogen 不应该成为第二个 ERP。

1. CRL 网站应该被拆成 7 个系统

不要把 CRL 当成一个普通电商网站。

实际上应该拆成：

┌────────────────────────────────────┐
│ 1. Global Navigation               │
├────────────────────────────────────┤
│ 2. Product Catalog                 │
├────────────────────────────────────┤
│ 3. Product Search                  │
├────────────────────────────────────┤
│ 4. B2B Commerce                    │
├────────────────────────────────────┤
│ 5. Technical Resources             │
├────────────────────────────────────┤
│ 6. Customer Account                │
├────────────────────────────────────┤
│ 7. Distribution / Location         │
└────────────────────────────────────┘

其中：

Product Catalog + Search + B2B Commerce 是第一优先级。

2. 最终 Route Map

Claude Code 最终应该形成：

app/routes/

├── _index.tsx

├── search.tsx

├── collections.$handle.tsx
├── products.$handle.tsx

├── products._index.tsx
├── collections._index.tsx

├── brands._index.tsx
├── brands.$handle.tsx

├── resources._index.tsx
├── resources.$handle.tsx

├── locations._index.tsx
├── locations.$handle.tsx

├── quick-order.tsx
├── quote-request.tsx

├── cart.tsx

├── account.tsx
├── account.profile.tsx
├── account.orders.tsx
├── account.orders.$id.tsx
├── account.locations.tsx
├── account.addresses.tsx
├── account.logout.tsx

├── b2blocations.tsx

注意：

如果你的当前 Hydrogen starter 已经有不同的 route 命名，不要为了匹配本文档强行重命名已有官方 starter 文件。

Shopify 的 B2B cookbook 本身就是以 Hydrogen 默认模板为基础，因此你的项目文件可能与示例存在差异。

3. Component 总架构

最终：

app/components/

├── layout/
│   ├── Header.tsx
│   ├── TopBar.tsx
│   ├── MainNavigation.tsx
│   ├── MegaMenu.tsx
│   ├── MobileMenu.tsx
│   ├── Breadcrumbs.tsx
│   └── Footer.tsx
│
├── search/
│   ├── SearchBar.tsx
│   ├── SearchOverlay.tsx
│   ├── PredictiveSearch.tsx
│   ├── SearchSuggestions.tsx
│   └── SearchResults.tsx
│
├── product/
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── ProductGallery.tsx
│   ├── ProductInfo.tsx
│   ├── ProductVariantSelector.tsx
│   ├── ProductPrice.tsx
│   ├── QuantitySelector.tsx
│   ├── QuantityRules.tsx
│   ├── PriceBreaks.tsx
│   ├── ProductAvailability.tsx
│   ├── ProductDocuments.tsx
│   └── RelatedProducts.tsx
│
├── collection/
│   ├── CollectionHeader.tsx
│   ├── CollectionToolbar.tsx
│   ├── CollectionFilters.tsx
│   ├── CollectionSort.tsx
│   ├── CollectionGrid.tsx
│   └── Pagination.tsx
│
├── b2b/
│   ├── B2BLocationProvider.tsx
│   ├── B2BLocationSelector.tsx
│   ├── CompanySelector.tsx
│   ├── LocationBadge.tsx
│   ├── B2BPrice.tsx
│   └── B2BStatus.tsx
│
├── cart/
│   ├── CartDrawer.tsx
│   ├── CartLine.tsx
│   ├── CartQuantity.tsx
│   ├── CartSummary.tsx
│   └── CartEmpty.tsx
│
├── account/
│   ├── AccountLayout.tsx
│   ├── AccountSidebar.tsx
│   ├── AccountDashboard.tsx
│   ├── OrderList.tsx
│   ├── OrderDetail.tsx
│   ├── CompanyLocations.tsx
│   └── AddressBook.tsx
│
├── resources/
│   ├── ResourceCard.tsx
│   ├── ResourceGrid.tsx
│   ├── DocumentCard.tsx
│   └── DownloadButton.tsx
│
└── common/
    ├── Button.tsx
    ├── Input.tsx
    ├── Select.tsx
    ├── Modal.tsx
    ├── Drawer.tsx
    ├── Tabs.tsx
    ├── Badge.tsx
    ├── Skeleton.tsx
    └── EmptyState.tsx
4. Global Layout
PAGE 01 — Header
CRL 对标目标

Header 是整个站点最重要的 UI。

设计：

┌───────────────────────────────────────────────────────────────┐
│ LOGO       Search products / SKU / keywords      Account Cart │
├───────────────────────────────────────────────────────────────┤
│ Products   Brands   Resources   Online Tools   Locations      │
└───────────────────────────────────────────────────────────────┘
Hydrogen 文件
app/components/layout/Header.tsx
app/components/layout/MainNavigation.tsx
app/components/layout/MegaMenu.tsx
Header 数据

Shopify：

shop
navigation
customer
cart

B2B：

company
companyLocation
Header 状态

必须支持：

Public

Logged In

B2B Logged In

Multiple Company Locations

Cart has items

Search active

Mega Menu active

Mobile menu active
5. Header UI 状态机

Claude Code 不要把 Header 写成一坨 JSX。

应该理解为：

HEADER
│
├── Search closed
│
├── Search opened
│
├── MegaMenu closed
│
├── MegaMenu opened
│
├── Account dropdown
│
├── Cart drawer
│
└── Mobile navigation
6. Mega Menu
Route

全局组件，不单独 route。

app/components/layout/MegaMenu.tsx
Desktop
Products
   ↓ hover
┌───────────────────────────────────────────────┐
│ Product Categories                            │
│                                               │
│ Shower Hardware      Door Hardware            │
│ Hinges               Handles                  │
│ Pulls                Locks                    │
│ Channels             Hinges                   │
│ Clamps               Closers                  │
│                                               │
│ Railing              Glazing                  │
│ Posts                Tools                    │
│ Balustrade           Sealants                 │
│                                               │
│             VIEW ALL PRODUCTS →               │
└───────────────────────────────────────────────┘
7. Mega Menu Shopify 数据模型

不要在 TS 中写：

const categories = [
  'Shower Hardware',
  'Door Hardware',
];

使用：

Shopify Navigation

或者：

Metaobjects

如果未来需要：

category image
featured products
featured brands
marketing banner

建议：

MegaMenuItem Metaobject

结构：

MegaMenuItem

title
menu
image
featured
description
8. Search
Route
/search

组件：

SearchBar
SearchOverlay
PredictiveSearch
SearchResults
Search 输入

支持：

Product Name
SKU
Product Type
Brand
Keyword

Shopify Storefront API 当前的 predictiveSearch 可以返回 products、collections、pages、articles，以及 search suggestions，因此非常适合 CRL 风格的 type-ahead search。

9. Search UX

输入：

hinge

显示：

PRODUCTS

CRL Glass Door Hinge
CRL Brushed Nickel Hinge
CRL Wall Mount Hinge

CATEGORIES

Door Hardware

COLLECTIONS

Glass Door Hardware

SEARCH FOR "HINGE" →
10. Search 文件
app/components/search/SearchBar.tsx
app/components/search/PredictiveSearch.tsx
app/components/search/SearchOverlay.tsx
app/routes/search.tsx

GraphQL：

app/graphql/search/PredictiveSearchQuery.ts
app/graphql/search/SearchQuery.ts
11. Homepage
Route
app/routes/_index.tsx

结构：

HEADER

HERO

FEATURED CATEGORIES

FEATURED PRODUCTS

APPLICATIONS

FEATURED BRANDS

TECHNICAL RESOURCES

CASE STUDIES

CTA

FOOTER
12. Homepage Hero

不要做成普通 Shopify theme：

图片
标题
按钮

应该更像工业品网站：

┌─────────────────────────────────────────────┐
│                                             │
│ Architectural Hardware                     │
│ Engineered for Professionals                │
│                                             │
│ From concept to installation                │
│                                             │
│ [ SHOP PRODUCTS ]                           │
│                                             │
└─────────────────────────────────────────────┘

Shopify：

Hero Metaobject

字段：

title
subtitle
image
mobileImage
ctaText
ctaUrl
13. Featured Categories
Featured Categories

┌────────────┐ ┌────────────┐ ┌────────────┐
│            │ │            │ │            │
│  Shower    │ │   Door     │ │  Railing   │
│ Hardware   │ │ Hardware   │ │            │
│            │ │            │ │            │
└────────────┘ └────────────┘ └────────────┘

数据：

Shopify Collection
14. Collection Page
Route
app/routes/collections.$handle.tsx
Layout
Breadcrumb

Collection Hero

Collection Description

┌──────────────┬───────────────────────────────┐
│              │                               │
│ FILTERS      │ Sort By                       │
│              │                               │
│ Category     │ Product Product Product       │
│ Brand        │                               │
│ Finish       │ Product Product Product       │
│ Material     │                               │
│ Size         │ Product Product Product       │
│ Availability │                               │
│              │                               │
└──────────────┴───────────────────────────────┘
15. Collection 文件
app/routes/collections.$handle.tsx

app/components/collection/
    CollectionHeader.tsx
    CollectionToolbar.tsx
    CollectionFilters.tsx
    CollectionSort.tsx
    CollectionGrid.tsx
    Pagination.tsx

GraphQL：

app/graphql/collections/CollectionQuery.ts
16. Filter Architecture

不要在 ProductGrid 里面处理 filter。

：

CollectionRoute
      ↓
parse URL search params
      ↓
CollectionQuery
      ↓
ProductGrid

URL：

/collections/shower-hardware?
brand=CRL
&finish=chrome
&size=24
&sort=price-asc
17. Product Card

文件：

app/components/product/ProductCard.tsx
Public
┌─────────────────────────────┐
│                             │
│        PRODUCT IMAGE        │
│                             │
├─────────────────────────────┤
│ CRL                         │
│                             │
│ Ladder Pull Handle          │
│                             │
│ SKU: LP24MBL                │
│                             │
│ $129.00                     │
│                             │
│ [ VIEW PRODUCT ]            │
└─────────────────────────────┘
B2B
$115.00

Your Price

如果有阶梯价格：

From $99.00
18. Product Detail
Route
app/routes/products.$handle.tsx
页面结构
Breadcrumb

┌───────────────────────────────────────────────┐
│                                               │
│ Product Gallery       Product Information     │
│                                               │
│                       Brand                   │
│                       Product Name            │
│                       SKU                     │
│                       Rating                  │
│                       Price                   │
│                       B2B Price               │
│                       Quantity                │
│                       [ ADD TO CART ]          │
│                                               │
└───────────────────────────────────────────────┘

Product Description

Specifications

Documents

Availability

Related Products
19. Product Gallery
ProductGallery.tsx

支持：

Main image
Thumbnail
Zoom
Video
360

数据来自 Shopify Product Media。

20. Product Information
ProductInfo.tsx

必须拆：

ProductBrand
ProductTitle
ProductSKU
ProductPrice
ProductAvailability
VariantSelector
QuantitySelector
AddToCart

不要全部写在：

ProductInfo.tsx

里面。

21. Variant Selector

例如：

Finish

○ Chrome
○ Brushed Nickel
○ Matte Black
○ Satin Brass

或者：

Size

24"
36"
48"

必须通过 Shopify Variant 数据。

22. B2B Price

文件：

app/components/product/ProductPrice.tsx

逻辑：

Public
   ↓
Retail price

B2B
   ↓
Contextual price

不要自己计算：

price * 0.9
23. B2B Context

这一部分直接采用 Shopify 官方 B2B 架构。

Shopify 官方 Hydrogen B2B cookbook 当前明确提供：

B2BLocationProvider
B2BLocationSelector
PriceBreaks
QuantityRules
CustomerLocationsQuery
b2blocations route

这些文件可以作为你的实现基础。

24. B2B 文件

建议：

app/components/b2b/
    B2BLocationProvider.tsx
    B2BLocationSelector.tsx
    CompanySelector.tsx
    LocationBadge.tsx
    B2BPrice.tsx

GraphQL：

app/graphql/customer-account/
    CustomerLocationsQuery.ts

Route：

app/routes/b2blocations.tsx
25. B2B Location UX

用户登录：

John Smith

ABC Glass Inc.

Choose your location

┌────────────────────────────┐
│ Phoenix Branch             │
│ Phoenix, AZ                │
└────────────────────────────┘

┌────────────────────────────┐
│ Los Angeles Branch         │
│ Los Angeles, CA            │
└────────────────────────────┘
26. 一个 Location

如果用户只有一个 Company Location：

Login
 ↓
Get location
 ↓
Automatically select
 ↓
Homepage

Shopify 官方方案也是单 location 自动设置、多 location 提供选择。

27. 多 Location

Header：

ABC Glass Inc.
Phoenix Branch ▼

点击：

Phoenix Branch
Los Angeles Branch
Denver Branch
28. 最关键：Buyer Context

所有 B2B product queries：

buyer:
{
  companyLocationId,
  customerAccessToken
}

不要只在：

/products/:handle

使用。

必须覆盖：

Homepage products
Collection
Search
Product
Recommendations
Cart

Shopify 官方 Hydrogen B2B 文档特别指出，生产环境应该让所有产品查询都使用 buyer context。

29. B2B Cache

这是 Claude Code 必须特别注意的规则。

Public Catalog

可以考虑：

Cache.long()
B2B Contextual Query

不能随便缓存。

因为：

Customer A
companyLocationId=A
price=$90

和：

Customer B
companyLocationId=B
price=$105

不能共用一个缓存结果。

Shopify 官方明确警告了这一点。

所以 CLAUDE.md 必须加入：

Never cache buyer-specific B2B GraphQL responses
unless the cache key explicitly includes buyer identity
and company location context.
30. Quantity Rules

Product 页面：

Minimum quantity: 10
Order increment: 5
Maximum quantity: 100

组件：

QuantityRules.tsx
QuantitySelector.tsx

Shopify 官方 B2B cookbook 已提供 minimum / maximum / increment 的处理方式。

31. Quantity Selector

不要简单：

1  +  -

而应该：

Quantity

[ − ]   10   [ + ]

Minimum: 10
Increment: 5

用户点击 +：

10
15
20
25

而不是：

10
11
12
13
32. Volume Pricing

组件：

PriceBreaks.tsx

显示：

Volume Pricing

Quantity        Your Price

1+              $115
10+             $108
50+             $99
100+            $91

Shopify B2B Hydrogen 官方 recipe 已包含 quantityPriceBreaks 的实现。

33. Add to Cart

按钮：

ADD TO CART

状态：

ADDING...

成功：

ADDED ✓

同时：

Cart Drawer

打开。

34. Cart Drawer

CRL 风格可以做成：

┌───────────────────────────────────┐
│ YOUR CART                     ×   │
├───────────────────────────────────┤
│                                   │
│ Product                           │
│                                   │
│ Ladder Pull                      │
│ Qty: [−] 10 [+]                  │
│ $108                             │
│                                   │
├───────────────────────────────────┤
│ Subtotal                  $1,080 │
│                                   │
│ [ VIEW CART ]                     │
│ [ CHECKOUT ]                      │
└───────────────────────────────────┘
35. Cart Route
app/routes/cart.tsx

Components：

CartDrawer
CartLine
CartQuantity
CartSummary
36. Cart Buyer Identity

这是 B2B 必须做的。

Customer
   ↓
Company Location
   ↓
Cart Buyer Identity
   ↓
B2B Price

Shopify 官方 headless B2B 流程就是：

customerAccessToken
+
companyLocationId

然后用于：

product query
cart

37. Checkout

不要自己开发 Checkout。

Hydrogen：

Cart
 ↓
Checkout URL
 ↓
Shopify Checkout
38. Account

Route：

/account

布局：

┌────────────────────────────────────┐
│ MY ACCOUNT                         │
├───────────────┬────────────────────┤
│ Dashboard     │                    │
│ Orders        │ Welcome John       │
│ Locations     │                    │
│ Addresses     │ Recent Orders      │
│ Logout        │                    │
└───────────────┴────────────────────┘
39. Account 文件
app/routes/account.tsx

app/routes/account.profile.tsx
app/routes/account.orders.tsx
app/routes/account.orders.$id.tsx
app/routes/account.locations.tsx
app/routes/account.addresses.tsx
app/routes/account.logout.tsx
40. Authentication

必须使用：

Shopify Customer Account API

不要自己实现：

JWT
bcrypt
password database

Shopify 当前 Hydrogen Customer Account API 官方教程就是用于 Hydrogen storefront customer authentication。

41. Order History
Orders

#10452
Sep 15, 2026
$2,340
Processing

[ VIEW ]

#10401
Sep 08, 2026
$980
Fulfilled

[ VIEW ]
42. Order Detail
Order #10452

Status
Processing

Shipping Address

Items

SKU
Description
Quantity
Price

Subtotal
Shipping
Tax
Total

支持：

Reorder
43. Quick Order

这是 B2B 项目非常值得增加的功能。

Route：

/quick-order

UI：

QUICK ORDER

SKU / ITEM NUMBER       QTY

[ LP24MBL              ] [20]
[ SH1002               ] [10]
[ CLAMP-32             ] [50]

+ ADD ANOTHER PRODUCT

[ ADD ALL TO CART ]
44. Quick Order 搜索

用户输入：

LP24

autocomplete：

LP24MBL
CRL Ladder Pull 24"
$115

点击：

Add
45. CSV Quick Order

P2 功能：

Upload CSV

CSV：

sku,quantity
LP24MBL,20
SH1002,10
CLAMP32,50

然后：

Validate
 ↓
Show errors
 ↓
Add valid products
 ↓
Cart
46. Quote Request

Route：

/quote-request

页面：

REQUEST A QUOTE

Company
Contact
Project
Required Date

Products

SKU
Quantity

Notes

Attachments

[ SUBMIT REQUEST ]
47. Resources

Route：

/resources
/resources/:handle

Shopify：

Metaobjects
48. Resource 数据模型

建议：

Resource

title
slug
type
description
thumbnail
file
externalUrl
relatedProducts
relatedCollections

Type：

PDF
CAD
INSTALLATION
CATALOG
VIDEO
TECHNICAL
CASE_STUDY
49. Product Documents

Product：

Technical Documents

[ Installation Guide PDF ]

[ Specification Sheet ]

[ CAD Drawing ]

[ Catalog Page ]
50. Locations

Route：

/locations

UI：

FIND A LOCATION

[ ZIP CODE                    ]

[ SEARCH ]

Nearby Locations

Phoenix Distribution Center

Address
Phone
Hours

[ VIEW LOCATION ]
51. Location 数据

这里要注意：

Shopify Location ≠ 前台一定直接显示成“门店页面”。

后台 Shopify Location 是库存/履约地点。

如果前台需要：

address
phone
hours
services
map
description

建议建立：

Location Metaobject

关联：

Shopify Location ID

这样：

Shopify Location
       +
Location Metaobject

共同形成前台 Location。

52. Brands

建议：

Brand Metaobject

字段：

name
slug
logo
description
banner
website
collections
featuredProducts
53. Brand Page
Brand

[ Logo ]

About Brand

Featured Products

Product Categories

Technical Resources
54. Footer

Footer 不要写死。

Shopify Navigation：

Footer Menu

Products
Resources
Company
Support
Account

Hydrogen：

Footer.tsx

动态渲染。

55. CSS Architecture

建议：

app/styles/

reset.css
tokens.css
global.css
layout.css
components.css
utilities.css
56. Design Tokens

建立：

:root {
  --color-primary: ...;
  --color-secondary: ...;
  --color-text: ...;
  --color-muted: ...;
  --color-border: ...;
  --color-background: ...;

  --space-1: ...;
  --space-2: ...;
  --space-3: ...;

  --container-max: 1440px;

  --radius-sm: ...;
  --radius-md: ...;
}

具体颜色不要复制 CRL 品牌颜色。

应该根据你的品牌重新定义。

57. Responsive Breakpoints

建议：

1440+
1200
1024
768
480
58. Desktop UX

重点：

Mega Menu
Search
Filters
Product comparison
Dense product information
59. Mobile UX

Mobile 不应该简单缩小 Desktop。

例如：

Desktop：

Sidebar Filter

Mobile：

[ FILTER ] [ SORT ]

点击：

┌─────────────────────┐
│ FILTER          ×   │
├─────────────────────┤
│ Brand               │
│ Finish              │
│ Size                │
│ Availability        │
│                     │
│ [ APPLY FILTERS ]   │
└─────────────────────┘
60. Mobile Header
☰    LOGO       🔍  🛒

点击：

Products
   >
Resources
   >
Brands
   >
Locations
61. Breadcrumb

统一：

Home
/
Door Hardware
/
Handles
/
Ladder Pull

组件：

Breadcrumbs.tsx
62. Loading State

所有主要页面都需要：

Skeleton

不要：

Loading...

Product：

┌───────────────┐
│ ░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░ │
└───────────────┘
63. Error State

Product 不存在：

Product Not Found

The product you're looking for
could not be found.

[ BACK TO PRODUCTS ]
64. Empty State

Search：

No results found.

Try searching by:
• SKU
• Product name
• Category

[ CLEAR SEARCH ]
65. SEO

每一个 route 必须有：

title
description
canonical
Open Graph

Product：

Product structured data

Collection：

Breadcrumb structured data
66. GraphQL 文件结构

最终：

app/graphql/

├── fragments/
│   ├── ProductFragment.ts
│   ├── ProductVariantFragment.ts
│   ├── CollectionFragment.ts
│   └── CartFragment.ts
│
├── products/
│   ├── ProductQuery.ts
│   └── ProductsQuery.ts
│
├── collections/
│   └── CollectionQuery.ts
│
├── search/
│   ├── PredictiveSearchQuery.ts
│   └── SearchQuery.ts
│
├── customer-account/
│   └── CustomerLocationsQuery.ts
│
└── navigation/
    └── NavigationQuery.ts
67. Shopify 数据模型

这是整个项目最重要的数据设计。

Product
│
├── Product Type
├── Vendor
├── Tags
├── Collections
├── Metafields
├── Variants
│    ├── SKU
│    ├── Price
│    └── Inventory
│
└── Metaobjects
      ├── Brand
      ├── Technical Document
      └── Resource

B2B：

Company
│
└── Company Location
      │
      └── Catalog
            │
            ├── Product
            ├── Price
            ├── Quantity Rules
            └── Volume Pricing
68. Shopify Admin 配置阶段

Claude Code 不负责创建 Shopify 后台业务数据。

你需要先在 Shopify Admin 配：

Products
Collections
Navigation
Customers
Companies
Company Locations
Catalogs
Markets
Locations
Metaobjects
69. 开发阶段划分

现在不要 20 个页面同时做。

严格：

PHASE 0
Foundation

PHASE 1
Header + Mega Menu

PHASE 2
Homepage

PHASE 3
Collection

PHASE 4
Search

PHASE 5
Product

PHASE 6
B2B

PHASE 7
Cart

PHASE 8
Account

PHASE 9
Resources

PHASE 10
Quick Order / Quote
70. PHASE 0 — Foundation

Claude Code Task：

TASK: Audit and prepare Hydrogen architecture

Requirements:

1. Inspect existing Hydrogen project.
2. Do not overwrite existing working routes.
3. Identify current Hydrogen version.
4. Identify React Router version.
5. Identify Storefront API setup.
6. Identify Customer Account API setup.
7. Identify current cart implementation.
8. Identify current Header/Footer.
9. Identify existing GraphQL fragments.
10. Generate architecture report.

Create:

ARCHITECTURE.md

Do not implement visual redesign yet.
71. PHASE 1 — Header

Claude Code：

TASK: Implement CRL-inspired global navigation

Build:

Header
TopBar
MainNavigation
MegaMenu
MobileMenu
SearchBar
AccountMenu
CartButton

Requirements:

- Responsive
- TypeScript
- Accessible keyboard navigation
- Shopify Navigation data
- No hardcoded category data
- B2B location indicator
- Cart quantity badge
72. PHASE 2 — Homepage
TASK: Build B2B industrial homepage

Sections:

Hero
Featured Categories
Featured Products
Featured Brands
Applications
Resources
CTA

Data source:

Shopify Collections
Shopify Products
Shopify Metaobjects

Do not hardcode product data.
73. PHASE 3 — Collection
TASK: Build CRL-style collection page

Requirements:

- Breadcrumb
- Collection header
- Description
- Product grid
- Filters
- Sorting
- Pagination
- Responsive layout
- URL-based filters
- Product cards
- B2B contextual pricing
74. PHASE 4 — Search
TASK: Implement industrial B2B search

Requirements:

- Predictive search
- SKU search
- Product search
- Collection suggestions
- Search suggestions
- Search result page
- Mobile search
- Keyboard navigation
- Debounced input

Shopify 的 predictiveSearch 当前支持 products、collections、pages、articles 和 query suggestions，适合这里的实现。

75. PHASE 5 — Product
TASK: Build CRL-style B2B product detail page

Requirements:

- Gallery
- Variants
- SKU
- Price
- B2B price
- Quantity rules
- Volume pricing
- Availability
- Technical documents
- Related products
- Add to cart
76. PHASE 6 — B2B

这是整个项目的核心。

TASK: Implement Shopify B2B contextual commerce

Requirements:

- Customer Account API
- Company locations
- Location selector
- Buyer context
- Contextual product queries
- Contextual pricing
- Quantity rules
- Volume pricing
- Cart buyer identity
- Logout cleanup

官方 Hydrogen B2B recipe 的文件结构可以直接作为这一阶段的参考基线。

77. PHASE 7 — Cart
TASK: Implement B2B-aware cart

Requirements:

- Cart drawer
- Cart page
- Quantity updates
- Quantity rule validation
- Buyer identity
- B2B pricing
- Checkout
78. PHASE 8 — Account
TASK: Implement B2B account dashboard

Pages:

Dashboard
Orders
Order Detail
Company Locations
Addresses
Logout

Use:

Shopify Customer Account API
79. PHASE 9 — Resources
TASK: Implement technical resource center

Types:

PDF
CAD
Installation
Catalog
Video
Technical
Case Study

Data:

Shopify Metaobjects
80. PHASE 10 — Quick Order
TASK: Implement B2B Quick Order

Requirements:

SKU lookup
Autocomplete
Quantity
Add row
Remove row
Validation
Add all to cart
81. Phase 11 — Quote
TASK: Implement B2B quote request

Requirements:

Company
Contact
Project
Products
Quantity
Notes
Attachments
Submit
Success state
Error state
82. Claude Code 验收标准

每个任务结束必须执行：

npm run typecheck
npm run build

并检查：

TypeScript errors = 0
Build errors = 0
Console errors = 0
83. UI 验收

每个页面至少检查：

1440px
1280px
1024px
768px
390px
84. B2B 验收

必须建立至少两个测试用户：

Customer A
Company A
Location A
Catalog A

Customer B
Company B
Location B
Catalog B

验证：

A 登录
↓
Price A

B 登录
↓
Price B

然后：

A logout
↓
B login
↓
不能看到 A 的价格
85. 最关键的 Security Test

必须测试：

Public
Customer A
Customer B

分别请求：

Homepage
Collection
Search
Product
Cart

检查：

价格不能串
Catalog 不能串
Company Location 不能串
Cart 不能串
86. Cache Test

特别测试：

Customer A
    ↓
Product
    ↓
$90

然后：

Customer B
    ↓
同 Product
    ↓
$110

如果 B 看到 $90：

立即停止开发并修复 cache/context。

因为这属于严重 B2B 数据隔离问题。Shopify 官方对此有明确警告。

87. 最终页面树

最后的网站应该变成：

HOME
│
├── PRODUCTS
│   ├── All Products
│   ├── Shower Hardware
│   ├── Door Hardware
│   ├── Glass Hardware
│   ├── Railing
│   └── Tools
│
├── SEARCH
│
├── PRODUCT
│   ├── Gallery
│   ├── Pricing
│   ├── B2B Pricing
│   ├── Quantity Rules
│   ├── Inventory
│   ├── Documents
│   └── Related
│
├── BRANDS
│
├── RESOURCES
│   ├── CAD
│   ├── PDF
│   ├── Catalog
│   ├── Installation
│   └── Videos
│
├── LOCATIONS
│
├── QUICK ORDER
│
├── REQUEST QUOTE
│
├── ACCOUNT
│   ├── Dashboard
│   ├── Orders
│   ├── Locations
│   └── Addresses
│
└── CART
    └── CHECKOUT
88. 现在你这个项目最推荐的开发顺序

结合你目前已经有 Hydrogen TypeScript 项目，而且 B2B 登录已经能够工作但 buyer/catalog context 还没有完整接起来的情况，我建议不要重新创建项目。

直接在现有项目上做：

STEP 1
现有项目 Audit
        ↓
STEP 2
Design System
        ↓
STEP 3
Header
        ↓
STEP 4
Mega Menu
        ↓
STEP 5
Homepage
        ↓
STEP 6
Collection
        ↓
STEP 7
Search
        ↓
STEP 8
Product Detail
        ↓
STEP 9
B2B Location Provider
        ↓
STEP 10
Buyer Context
        ↓
STEP 11
B2B Pricing
        ↓
STEP 12
Quantity Rules
        ↓
STEP 13
Volume Pricing
        ↓
STEP 14
Cart Buyer Identity
        ↓
STEP 15
Account
        ↓
STEP 16
Quick Order
        ↓
STEP 17
Quote
        ↓
STEP 18
Resources

这其中 STEP 9～14 是业务核心，STEP 3～8 是 CRL 风格前端核心。

给 Claude Code 的总任务入口

你可以把下面这一段直接放到项目的 CLAUDE.md 开头：

# CRL-STYLE SHOPIFY HYDROGEN B2B STOREFRONT

## Project Goal

Build a professional B2B industrial commerce storefront using:

- Shopify
- Hydrogen
- React
- React Router
- TypeScript
- Storefront API
- Customer Account API
- Oxygen

The UX and information architecture should be inspired by
C.R. Laurence (CRL), but all frontend implementation,
branding, content, images and UI must be independently implemented.

## Source of Truth

Shopify is the source of truth for:

- Products
- Variants
- SKU
- Inventory
- Collections
- Navigation
- Customers
- Companies
- Company Locations
- Catalogs
- B2B pricing
- Quantity rules
- Volume pricing
- Cart
- Orders
- Checkout

Hydrogen is responsible for:

- UI
- UX
- Routing
- Responsive design
- Search experience
- Product presentation
- B2B interaction
- Account experience
- SEO

## Critical B2B Rule

All buyer-specific product queries must use:

customerAccessToken
+
companyLocationId

Buyer-specific responses must not be incorrectly cached.

Never expose one customer's B2B price or catalog data to another customer.

## Development Rules

- TypeScript strict
- Reusable components
- No hardcoded product data
- No hardcoded B2B prices
- No custom authentication system
- No duplicate commerce database
- No business logic inside presentation components
- GraphQL queries must be organized under app/graphql
- UI components must be reusable
- Mobile-first responsive implementation
- Keyboard accessible navigation
- SEO metadata for every page
- Build must pass after every major task

## Development Order

1. Foundation
2. Design system
3. Header
4. Mega Menu
5. Homepage
6. Collection
7. Search
8. Product Detail
9. B2B Location
10. Buyer Context
11. B2B Pricing
12. Quantity Rules
13. Volume Pricing
14. Cart
15. Checkout
16. Account
17. Resources
18. Locations
19. Quick Order
20. Quote Request