/**
 * Shopify Admin API client for server-side mutations.
 *
 * Used to create Draft Orders from Quote requests.
 * The admin token must NEVER be exposed to the client — only call
 * these functions from route actions/loaders (server-side).
 */

const ADMIN_API_VERSION = '2025-07';

export function hasAdminApi(env: Env | Record<string, string | undefined>): boolean {
  return Boolean((env as unknown as Record<string, unknown>)?.SHOPIFY_ADMIN_API_TOKEN);
}

function getAdminEndpoint(env: Env | Record<string, string | undefined>): string {
  const domain = env?.PUBLIC_STORE_DOMAIN || '';
  if (!domain) {
    throw new Error('PUBLIC_STORE_DOMAIN is not set');
  }
  return `https://${domain}/admin/api/${ADMIN_API_VERSION}/graphql.json`;
}

type AdminFetchResult<T> = {
  data?: T;
  errors?: Array<{message: string}>;
};

async function adminFetch<T>(
  env: Env,
  query: string,
  variables: Record<string, unknown>,
): Promise<AdminFetchResult<T>> {
  const endpoint = getAdminEndpoint(env);
  const token = (env as unknown as Record<string, unknown>)?.SHOPIFY_ADMIN_API_TOKEN as string;

  if (!token) {
    throw new Error('SHOPIFY_ADMIN_API_TOKEN is not set');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({query, variables}),
  });

  if (!response.ok) {
    throw new Error(
      `Admin API error: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as AdminFetchResult<T>;
}

/* ------------------------------------------------------------------ */
/* Draft Order                                                        */
/* ------------------------------------------------------------------ */

export type DraftOrderLineItem = {
  variantId: string;
  quantity: number;
};

export type DraftOrderResult = {
  id: string;
  name: string;
  invoiceUrl: string;
};

type DraftOrderCreateResponse = {
  draftOrderCreate: {
    draftOrder?: {
      id: string;
      name: string;
      invoiceUrl: string;
    };
    userErrors: Array<{field?: string[]; message: string}>;
  };
};

const DRAFT_ORDER_CREATE = `#graphql
  mutation draftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        invoiceUrl
      }
      userErrors {
        field
        message
      }
    }
  }
` as const;

export async function createDraftOrder(
  env: Env,
  input: {
    lineItems: DraftOrderLineItem[];
    email?: string;
    note?: string;
    metafields?: Array<{namespace: string; key: string; value: string}>;
    companyLocationId?: string;
  },
): Promise<DraftOrderResult> {
  const draftOrderInput: Record<string, unknown> = {
    lineItems: input.lineItems.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    })),
  };

  if (input.email) draftOrderInput.email = input.email;
  if (input.note) draftOrderInput.note = input.note;

  if (input.metafields?.length) {
    draftOrderInput.metafields = input.metafields;
  }

  if (input.companyLocationId) {
    draftOrderInput.buyerIdentity = {
      companyLocationId: input.companyLocationId,
    };
  }

  const result = await adminFetch<DraftOrderCreateResponse>(
    env,
    DRAFT_ORDER_CREATE,
    {input: draftOrderInput},
  );

  if (result.errors?.length) {
    throw new Error(result.errors.map((e) => e.message).join(', '));
  }

  const draft = result.data?.draftOrderCreate;
  if (!draft?.draftOrder) {
    const userErrors = draft?.userErrors ?? [];
    if (userErrors.length) {
      throw new Error(
        userErrors.map((e) => `${e.field?.join('.') ?? ''}: ${e.message}`).join('; '),
      );
    }
    throw new Error('Draft order creation returned no result');
  }

  return draft.draftOrder;
}
