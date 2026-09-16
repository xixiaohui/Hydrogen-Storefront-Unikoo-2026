export const CUSTOMER_DRAFT_ORDERS_QUERY = `#graphql
  query CustomerDraftOrders(
    $first: Int
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      draftOrders(first: $first) {
        nodes {
          id
          name
          status
          createdAt
          totalPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;
