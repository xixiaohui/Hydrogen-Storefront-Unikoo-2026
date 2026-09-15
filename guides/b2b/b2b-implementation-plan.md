# Hydrogen B2B 接入实施方案（implementation-ready）

> 依据官方文档 [B2B Commerce in Hydrogen](https://shopify.dev/docs/storefronts/headless/hydrogen/cookbook/b2b)，并按本项目（Hydrogen `2026.4.5` / React Router `7.16` / Tailwind v4 骨架）做了适配与优化。
> 所有代码块可直接复制粘贴，行号锚点对应当前仓库文件。

**状态：已实施（UI 方案 A）。** 代码已于 2026-09-15 落地，与本文的差异：
1. 地点选择用 `Aside` 抽屉（附录 1）实现，未新增 `.modal` 样式；新增组件导出名为 `LocationAside`。
2. PDP 加购数量取 `quantityRule.minimum || increment || 1`（而非仅 `increment`），避免违反最小起订量。
3. `B2BLocationProvider` 额外提供 `refetch()`，选完地点后立即刷新 `companyLocationId`。

---

## 0. 目标范围

落地后 B2B 客户可以：

1. 登录后选择 **公司地点（company location）**，用于上下文化定价；
2. 商品详情页展示 **数量规则**（minimum / maximum / increment）并用于加购与购物车增减；
3. 展示 **阶梯量价表**（quantity price breaks）；
4. PDP 查询通过 `@inContext(buyer:)` 携带 `companyLocationId + customerAccessToken`，拿到 B2B 专属价。

---

## 1. 前置条件（店铺侧）

- 套餐支持 B2B 且已启用 B2B；
- 已启用 **新客户账户（new customer accounts）**；
- 至少存在 1 个已配置客户权限的 **B2B 公司**，并为测试准备**两个以上地点**；
- 建议准备配置了 quantity rules / volume pricing 的商品用于验证。

本地仓库侧已具备（已核对 `.env`）：`PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID`、`PUBLIC_CUSTOMER_ACCOUNT_API_URL`、`SHOP_ID`。

> mock.shop 不支持 Customer Account API，必须用真实店铺联调：`npm run dev`（需要回调同步时加 `--customer-account-push__unstable`）。

---

## 2. 项目现状与适配要点（**本项目特有，务必注意**）

| 项 | 现状 | 影响 |
| --- | --- | --- |
| 路由双份 | `app/routes/` 下每个路由都存在 `xx.tsx` 与 `($locale).xx.tsx`，且**内容逐字节相同** | 新增/修改路由必须**同步两份**，否则多语言路径下 B2B 失效 |
| B2B 开关 | Hydrogen 2026.4.x 中 B2B 已 stable | **不需要** `unstableB2b`，`app/lib/context.ts` 无需改动 |
| GraphQL 约定 | 已有 `app/graphql/customer-account/` | 新查询放此处 |
| 弹层能力 | 已有 `Aside`（`type: search \| cart \| mobile` + overlay 样式） | 默认按官方自绘 modal（低风险）；附录给出 Aside 方案 |
| 缓存 | `storefront.query` 默认 `CacheShort` | buyer 上下文查询必须禁用共享缓存，否则**价格串号** |
| 类型生成 | `npm run codegen` 会重生成 `storefrontapi.generated.d.ts` | fragment 改完必须跑，否则 `quantityRule` 类型报错 |

---

## 3. 相对官方 cookbook 的优化点

1. **修正 modal 误显**：官方 `if (!company || !modalOpen) return <p>No company found...</p>` 会让所有访客都看到文案，改为 `return null`。
2. **Choice 默认值**：官方 Step 7 默认 `quantity: quantity || 1` 不满足「最小起订量」，改为 `quantity || minimum || increment || 1`（见 Step 7 说明，按你的业务二选一）。
3. **缓存安全**：新增 Step 15（强烈建议），buyer 上下文化查询禁用共享缓存。
4. **双份路由**：所有 `app/routes/**` 改动列出两份路径（本方案默认 UI 方案 B = 官方原样）。

**UI 方案（默认 B）**

- **B（推荐，官方原样）**：自绘 `.modal`，新增 CSS 约 30 行，diff 最小。
- **A（可选升级）**：复用 `Aside`，风格与站内抽屉一致（附录 1）。

---

## 4. 文件变更清单

**新增（7 个文件）**

| 文件 | 说明 |
| --- | --- |
| `app/graphql/customer-account/CustomerLocationsQuery.ts` | Customer Account API 查询公司地点 |
| `app/components/B2BLocationProvider.tsx` | 全局公司地点状态 Context |
| `app/components/B2BLocationSelector.tsx` | 地点选择弹层（CartForm BuyerIdentityUpdate） |
| `app/components/QuantityRules.tsx` | 数量规则表格 + `hasQuantityRules()` |
| `app/components/PriceBreaks.tsx` | 阶梯量价表格 |
| `app/routes/b2blocations.tsx` | 地点数据加载路由 |
| `app/routes/($locale).b2blocations.tsx` | **同上同名副本**（内容完全一致） |

**修改（注意双份）**

| 文件 | 改动摘要 |
| --- | --- |
| `app/root.tsx` | 导出公司类型；`B2BLocationProvider` 包裹 `PageLayout` 并挂载 `B2BLocationSelector` |
| `app/components/Header.tsx` | 顶部「切换地点」按钮（>1 个地点才显示） |
| `app/components/CartLineItem.tsx` | 购物车增减按 increment 步进、受 min/max 约束 |
| `app/components/ProductForm.tsx` | 新增 `quantity` 参数 |
| `app/lib/fragments.ts` | CartLine / CartLineComponent 增加 quantityRule + quantityPriceBreaks |
| `app/routes/products.$handle.tsx` **和** `($locale).products.$handle.tsx` | variant fragment + `$buyer` + 展示两个新组件 |
| `app/routes/account_.logout.tsx` **和** `($locale).account_.logout.tsx` | 登出清空 cart buyer identity |
| `app/styles/app.css` | 追加 B2B 样式 |
| `README.md` | 补充说明 |

---

## 5. 实施步骤

### Step 1 — `app/graphql/customer-account/CustomerLocationsQuery.ts`（新建）

```ts
// NOTE: https://shopify.dev/docs/api/customer/latest/objects/Customer
export const CUSTOMER_LOCATIONS_QUERY = `#graphql
  query CustomerLocations {
    customer {
      id
      emailAddress {
        emailAddress
      }
      companyContacts(first: 1) {
        edges {
          node {
            company {
              id
              name
              locations(first: 10) {
                edges {
                  node {
                    id
                    name
                    shippingAddress {
                      countryCode
                      formattedAddress
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
` as const;
```

### Step 2 — `app/components/B2BLocationProvider.tsx`（新建）

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {useFetcher} from 'react-router';
import {type CustomerCompany} from '~/root';

export type B2BLocationContextValue = {
  company?: CustomerCompany;
  companyLocationId?: string;
  modalOpen?: boolean;
  setModalOpen: (b: boolean) => void;
};

const defaultB2BLocationContextValue = {
  company: undefined,
  companyLocationId: undefined,
  modalOpen: undefined,
  setModalOpen: () => {},
};

const B2BLocationContext = createContext<B2BLocationContextValue>(
  defaultB2BLocationContextValue,
);

export function B2BLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetcher = useFetcher<B2BLocationContextValue>();
  const [modalOpen, setModalOpen] = useState(fetcher?.data?.modalOpen);

  useEffect(() => {
    if (fetcher.data || fetcher.state === 'loading') return;
    void fetcher.load('/b2blocations');
  }, [fetcher]);

  const value = useMemo<B2BLocationContextValue>(() => {
    return {
      ...defaultB2BLocationContextValue,
      ...fetcher.data,
      modalOpen: modalOpen ?? fetcher?.data?.modalOpen,
      setModalOpen,
    };
  }, [fetcher, modalOpen]);

  return (
    <B2BLocationContext.Provider value={value}>
      {children}
    </B2BLocationContext.Provider>
  );
}

export function useB2BLocation(): B2BLocationContextValue {
  return useContext(B2BLocationContext);
}
```

### Step 3 — `app/components/B2BLocationSelector.tsx`（新建）

```tsx
import {CartForm} from '@shopify/hydrogen';
import type {
  CustomerCompanyLocation,
  CustomerCompanyLocationConnection,
} from '~/root';
import {useB2BLocation} from '~/components/B2BLocationProvider';

export function B2BLocationSelector() {
  const {company, modalOpen, setModalOpen} = useB2BLocation();

  const locations = company?.locations?.edges
    ? company.locations.edges.map(
        (location: CustomerCompanyLocationConnection) => {
          return {...location.node};
        },
      )
    : [];

  // 官方写法会对所有访客渲染 “No company found”，这里改为 null
  if (!company || !modalOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Logged in for {company.name}</h2>
        <legend>Choose a location:</legend>
        <div className="location-list">
          {locations.map((location: CustomerCompanyLocation) => {
            const addressLines =
              location?.shippingAddress?.formattedAddress ?? [];
            return (
              <CartForm
                key={location.id}
                route="/cart"
                action={CartForm.ACTIONS.BuyerIdentityUpdate}
                inputs={{
                  buyerIdentity: {companyLocationId: location.id},
                }}
              >
                {(fetcher) => (
                  <div>
                    <button
                      aria-label={`Select B2B location: ${location.name}`}
                      onClick={(event) => {
                        setModalOpen(false);
                        fetcher.submit(event.currentTarget.form, {
                          method: 'POST',
                        });
                      }}
                      className="location-item"
                    >
                      <div>
                        <p>
                          <strong>{location.name}</strong>
                        </p>
                        {addressLines.map((line: string) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </button>
                  </div>
                )}
              </CartForm>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

### Step 4 — `app/components/QuantityRules.tsx`（新建）

```tsx
import type {Maybe} from '@shopify/hydrogen/customer-account-api-types';

export type QuantityRulesProps = {
  maximum?: Maybe<number> | undefined;
  minimum?: Maybe<number> | undefined;
  increment?: Maybe<number> | undefined;
};

export const hasQuantityRules = (quantityRule?: QuantityRulesProps) => {
  return (
    quantityRule &&
    (quantityRule?.increment != 1 ||
      quantityRule?.minimum != 1 ||
      quantityRule?.maximum)
  );
};

export function QuantityRules({
  maximum,
  minimum,
  increment,
}: QuantityRulesProps) {
  return (
    <>
      <h4>Quantity Rules</h4>
      <table className="rule-table">
        <thead>
          <tr>
            <th className="table-heading">Increment</th>
            <th className="table-heading">Minimum</th>
            <th className="table-heading">Maximum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th className="table-item">{increment}</th>
            <th className="table-item">{minimum}</th>
            <th className="table-item">{maximum}</th>
          </tr>
        </tbody>
      </table>
    </>
  );
}
```

### Step 5 — `app/components/PriceBreaks.tsx`（新建）

```tsx
import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

type PriceBreak = {
  minimumQuantity: number;
  price: MoneyV2;
};

export type PriceBreaksProps = {
  priceBreaks: PriceBreak[];
};

export function PriceBreaks({priceBreaks}: PriceBreaksProps) {
  return (
    <>
      <h4>Volume Pricing</h4>
      <table className="rule-table">
        <thead>
          <tr>
            <th className="table-heading">Minimum Quantity</th>
            <th className="table-heading">Unit Price</th>
          </tr>
        </thead>
        <tbody>
          {priceBreaks.map((priceBreak) => {
            return (
              <tr key={`price-break-${priceBreak.minimumQuantity}`}>
                <th className="table-item">
                  {priceBreak.minimumQuantity}
                </th>
                <th className="table-item">
                  <Money data={priceBreak.price} />
                </th>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
```

### Step 6 — `app/routes/b2blocations.tsx`（新建，**并整份复制**为 `($locale).b2blocations.tsx`）

```tsx
import {useLoaderData} from 'react-router';
import type {Route} from './+types/b2blocations';
import {B2BLocationSelector} from '../components/B2BLocationSelector';
import {CUSTOMER_LOCATIONS_QUERY} from '~/graphql/customer-account/CustomerLocationsQuery';

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;

  const buyer = await customerAccount.getBuyer();

  let companyLocationId = buyer?.companyLocationId || null;
  let company = null;

  // Logged in customer may be a B2B customer
  if (buyer) {
    const customer = await customerAccount.query(CUSTOMER_LOCATIONS_QUERY);
    company =
      customer?.data?.customer?.companyContacts?.edges?.[0]?.node?.company ||
      null;
  }

  // If there is only 1 company location, set it in session automatically
  if (!companyLocationId && company?.locations?.edges?.length === 1) {
    companyLocationId = company.locations.edges[0].node.id;

    customerAccount.setBuyer({
      companyLocationId,
    });
  }

  const modalOpen = Boolean(company) && !companyLocationId;

  return {company, companyLocationId, modalOpen};
}

export default function LocationsRoute() {
  const data = useLoaderData<typeof loader>();
  return data?.modalOpen ? <B2BLocationSelector /> : null;
}
```

> 注：官方此处导出组件名为 `CartRoute`，已改为更贴切的 `LocationsRoute`；两份文件内容必须完全一致。

### Step 7 — `app/root.tsx`（修改）

在 `import {PageLayout} from './components/PageLayout';` 之后追加：

```tsx
// @description Import B2B components and types for company location management
import {B2BLocationProvider} from '~/components/B2BLocationProvider';
import {B2BLocationSelector} from '~/components/B2BLocationSelector';
import type {
  Company,
  CompanyAddress,
  CompanyLocation,
  Maybe,
} from '@shopify/hydrogen/customer-account-api-types';
```

在 `export type RootLoader = typeof loader;` 之后追加：

```tsx
// @description Define B2B customer company types
export type CustomerCompanyLocation = Pick<CompanyLocation, 'name' | 'id'> & {
  shippingAddress?:
    | Maybe<Pick<CompanyAddress, 'countryCode' | 'formattedAddress'>>
    | undefined;
};

export type CustomerCompanyLocationConnection = {
  node: CustomerCompanyLocation;
};

export type CustomerCompany =
  | Maybe<
      Pick<Company, 'name' | 'id'> & {
        locations: {
          edges: CustomerCompanyLocationConnection[];
        };
      }
    >
  | undefined;
```

`App()` 中的 `<PageLayout {...data}><Outlet /></PageLayout>` 替换为：

```tsx
{/* @description Wrap PageLayout with B2B location provider */}
<B2BLocationProvider>
  <PageLayout {...data}>
    <Outlet />
  </PageLayout>
  <B2BLocationSelector />
</B2BLocationProvider>
```

### Step 8 — `app/components/Header.tsx`（修改）

在 `import {useAside} from '~/components/Aside';` 之后追加：

```tsx
// @description Import B2B types and hooks for company location management
import {type CustomerCompanyLocationConnection} from '~/root';
import {useB2BLocation} from './B2BLocationProvider';
```

在 `HeaderMenu` 的 `</nav>` 前追加：

```tsx
{/* @description Add B2B location selector to header navigation */}
<ChangeLocation />
```

在 `const FALLBACK_HEADER_MENU = {` **之前**追加：

```tsx
// @description Add B2B location change button for company location selection
function ChangeLocation() {
  const {company, companyLocationId, setModalOpen} = useB2BLocation();

  const locations = company?.locations?.edges
    ? company.locations.edges.map(
        (location: CustomerCompanyLocationConnection) => {
          return {...location.node};
        },
      )
    : [];

  if (locations.length <= 1 || !company) return null;

  return (
    <button onClick={() => setModalOpen(true)}>
      {locations.find(
        (companyLocation) => companyLocation.id == companyLocationId,
      )?.name || 'Select Location'}
    </button>
  );
}
```

### Step 9 — `app/lib/fragments.ts`（修改）

`CART_QUERY_FRAGMENT` 中有**两处** `selectedOptions { name value }`（分别属于 `CartLine`、`CartLineComponent`），在各自 `}` 链的外侧、`merchandise` 的 `... on ProductVariant` 块内追加相同内容（即原 patch 的 line ~52 与 ~102）：

```graphql
      # @description Add B2B quantity rules and price breaks
      quantityRule {
        maximum
        minimum
        increment
      }
      quantityPriceBreaks(first: 5) {
        nodes {
          minimumQuantity
          price {
            amount
            currencyCode
          }
        }
      }
```

具体落点为两处 `selectedOptions { name value }` 之后、`}`（variant）之前。

### Step 10 — `app/components/CartLineItem.tsx`（修改）

`CartLineQuantity` 中替换前两行计算逻辑：

```tsx
  // @description Calculate quantity changes based on B2B quantity rules
  const {increment, minimum, maximum} = line.merchandise.quantityRule || {
    increment: 1,
    minimum: 1,
    maximum: null,
  };
  const nextIncrement = increment - (quantity % increment);
  const prevIncrement =
    quantity % increment === 0 ? increment : quantity % increment;
  const prevQuantity = Number(Math.max(0, quantity - prevIncrement).toFixed(0));
  const nextQuantity = Number((quantity + nextIncrement).toFixed(0));
```

按钮 `disabled` 调整：

```tsx
  // decrease button
  disabled={prevQuantity < minimum || !!isOptimistic}

  // increase button
  disabled={Boolean((maximum && nextQuantity > maximum) || !!isOptimistic)}
```

### Step 11 — `app/components/ProductForm.tsx`（修改）

签名增加 `quantity`：

```tsx
export function ProductForm({
  productOptions,
  selectedVariant,
  quantity,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  quantity?: number;
}) {
```

`lines` 中：

```tsx
              {
                merchandiseId: selectedVariant.id,
                // @description Use B2B quantity (min/increment) or default to 1
                quantity: quantity || 1,
                selectedVariant,
              },
```

> 若希望「加购即满足最小起订量」，把调用处（Step 12）传值改为 `selectedVariant?.quantityRule?.minimum || increment || 1`；Step 12 中给的是 `increment`（与官方一致）。

### Step 12 — PDP（修改两份：`app/routes/products.$handle.tsx` 与 `app/routes/($locale).products.$handle.tsx`）

**12.1 import 追加**

```tsx
// @description Import B2B components for quantity rules and price breaks
import {QuantityRules, hasQuantityRules} from '~/components/QuantityRules';
import {PriceBreaks} from '~/components/PriceBreaks';

// @description Define B2B buyer variables type for contextualized queries
type BuyerVariables =
  | {
      buyer: {
        companyLocationId: string;
        customerAccessToken: string;
      };
    }
  | {};
```

**12.2 loader**

```tsx
export async function loader(args: Route.LoaderArgs) {
  // @description Get B2B buyer context for contextualized product queries
  const buyer = await args.context.customerAccount.getBuyer();

  const buyerVariables: BuyerVariables =
    buyer?.companyLocationId && buyer?.customerAccessToken
      ? {
          buyer: {
            companyLocationId: buyer.companyLocationId,
            customerAccessToken: buyer.customerAccessToken,
          },
        }
      : {};

  const deferredData = loadDeferredData({...args, buyerVariables});
  const criticalData = await loadCriticalData({...args, buyerVariables});

  return {...deferredData, ...criticalData};
}
```

`loadCriticalData` 签名改为 `({context, params, request, buyerVariables}: Route.LoaderArgs & {buyerVariables: BuyerVariables})`，查询改为：

```tsx
    storefront.query(PRODUCT_QUERY, {
      variables: {
        handle,
        selectedOptions: getSelectedProductOptions(request),
        ...buyerVariables,
      },
      // @description Avoid sharing B2B prices across customers (see Step 15)
      ...(buyerVariables.buyer
        ? {cache: storefront.CacheNone()}
        : {}),
    }),
```

`loadDeferredData` 签名同步改为 `Route.LoaderArgs & {buyerVariables: BuyerVariables}`（函数体仍返回 `{}`）。

**12.3 组件**

```tsx
        <ProductForm
          productOptions={productOptions}
          selectedVariant={selectedVariant}
          // @description Pass B2B quantity increment or default to 1
          quantity={selectedVariant?.quantityRule?.increment || 1}
        />
        <br />
        {/* @description Display B2B quantity rules if they exist */}
        {hasQuantityRules(selectedVariant?.quantityRule) ? (
          <QuantityRules
            maximum={selectedVariant?.quantityRule.maximum}
            minimum={selectedVariant?.quantityRule.minimum}
            increment={selectedVariant?.quantityRule.increment}
          />
        ) : null}
        <br />
        {/* @description Display B2B price breaks if they exist */}
        {selectedVariant?.quantityPriceBreaks?.nodes &&
        selectedVariant?.quantityPriceBreaks?.nodes?.length > 0 ? (
          <PriceBreaks priceBreaks={selectedVariant?.quantityPriceBreaks?.nodes} />
        ) : null}
```

**12.4 `PRODUCT_VARIANT_FRAGMENT`**（在 `sku` 之前）追加：

```graphql
    # @description Add B2B quantity rules and price breaks to variant fragment
    quantityRule {
      maximum
      minimum
      increment
    }
    quantityPriceBreaks(first: 5) {
      nodes {
        minimumQuantity
        price {
          amount
          currencyCode
        }
      }
    }
```

**12.5 `PRODUCT_QUERY`**

```graphql
  query Product(
    $country: CountryCode
    $buyer: BuyerInput
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
```

### Step 13 — 登出清理（修改两份：`account_.logout.tsx` 与 `($locale).account_.logout.tsx`）

```tsx
export async function action({context}: Route.ActionArgs) {
  // @description Clear B2B company location on logout
  await context.cart.updateBuyerIdentity({
    companyLocationId: null,
    customerAccessToken: null,
  });
  return context.customerAccount.logout();
}
```

### Step 14 — 样式 `app/styles/app.css`（追加到文件末尾）

```css
/*
* --------------------------------------------------
* B2B: location modal, quantity rules, price breaks
* --------------------------------------------------*/
.modal {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);

  .modal-content {
    background: var(--color-light);
    border: 1px solid var(--color-dark);
    padding: 1.5rem;
    max-width: 480px;
    width: calc(100% - 2rem);
    max-height: 80vh;
    overflow-y: auto;
  }
}

.location-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.location-item {
  text-align: left;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-dark);
  background: var(--color-light);
  cursor: pointer;
}

.rule-table {
  border-collapse: collapse;
  width: 100%;
  max-width: 420px;

  th {
    border: 1px solid var(--color-dark);
    padding: 0.375rem 0.75rem;
    text-align: left;
  }

  .table-heading {
    font-weight: 700;
  }

  .table-item {
    font-weight: 400;
  }
}
```

### Step 15 — 缓存安全（**建议，已并入 Step 12.2**）

带 `$buyer` 的查询若走默认 `CacheShort`，不同客户可能共享同一份缓存 → **B2B 价格串号**。Step 12.2 已按「有 buyer 时 `CacheNone()`」处理。若后续把 buyer 上下文扩展到 collections / index / search，**每个查询都要同样处理**。

### Step 16 — README（可选，官方 Step 1）

在 `README.md` 的 features 列表后追加 “B2B Features” 章节（内容可照搬官方 Step 1 的 markdown，文件列表按本方案表格填写）。

---

## 6. 完成后必跑

```bash
npm run codegen     # 重生成 storefrontapi.generated.d.ts / customer-accountapi.generated.d.ts
npm run typecheck   # 类型校验
npm run lint
npm run dev
```

---

## 7. 验收清单

- [ ] 未登录访问 PDP：无地点弹窗、无`.modal` DOM、头部无「切换地点」按钮
- [ ] B2B 客户登录（**多地点公司**）：自动弹出地点选择
- [ ] 选择地点后：PDP 显示 B2B 价 + Quantity Rules + Volume Pricing
- [ ] 单地点公司：登录后自动 `setBuyer`，不弹窗
- [ ] 头部出现当前地点名按钮，可再次打开选择器并切换
- [ ] 购物车加减：按 increment 步进；到 minimum 时减号禁用；超 maximum 时加号禁用
- [ ] 登出后：价格回到公开价，购物车 buyer identity 已清空
- [ ] 多语言路径（如 `/en-us/products/xxx`）下上述行为一致
- [ ] 两个 B2B 客户先后访问同一 PDP，价格**不串号**（Step 15 生效）

---

## 8. 回滚

本次改动均为新增/局部替换，回滚方式：`git diff` 检视后按文件 revert 即可；删除新增的 7 个文件、还原 `app.css` 追加块即可完全回到现状。

---

## 附录 1 — 可选升级：用 `Aside` 承载地点选择（方案 A）

若不想新增 `.modal` 系列 CSS，可改为：

1. `app/components/Aside.tsx`：`type AsideType = 'search' | 'cart' | 'mobile' | 'location' | 'closed';`
2. `app/components/PageLayout.tsx`：新增 `<Aside type="location" heading="LOCATION"><Suspense fallback={null}><LocationAside /></Suspense></Aside>`，`LocationAside` 内部用 `useB2BLocation()` 渲染地点 `CartForm` 列表（内容同 `B2BLocationSelector` 去掉外层 `.modal` div）。
3. `B2BLocationProvider`：`modalOpen` 变为 true 时 `useAside().open('location')`（在 provider 内 `useEffect`）。

优点：与站内抽屉一致、零新 CSS；缺点：多改动了两个既有文件。

## 附录 2 — 已知官方写法的小坑

1. `B2BLocationSelector` 官方对无 company 的访客渲染「No company found」，Step 3 已修正为 `return null`。
2. `b2blocations.tsx` 官方导出组件名沿用 `CartRoute`，Step 6 已重命名。
3. `CartForm.ACTIONS.BuyerIdentityUpdate` 提交后 cart 会返回新数据，但 provider 里的 `companyLocationId` 需下一次 `/b2blocations` 才会刷新；若要即时更新，可在提交成功后再次 `fetcher.load('/b2blocations')`。
4. `quantityPriceBreaks(first: 5)` 默认只取前 5 档，档位多的商品需调整 `first`。
