export const CUSTOMER_COMPANY_CONTACTS_QUERY = `#graphql
  query CustomerCompanyContacts(
    $first: Int
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      companyContacts(first: $first) {
        nodes {
          id
          status
          title
          customer {
            firstName
            lastName
            emailAddress {
              emailAddress
            }
          }
        }
      }
    }
  }
` as const;
