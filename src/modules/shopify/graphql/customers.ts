import { ShopifyCustomerNode } from './types';

const GetAllCustomers = (first: number = 50, after?: string): string => `
    query GetAllCustomers {
      customers(
        first: ${first},
        after: ${after ? `"${after}"` : 'null'}
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            displayName
            email
            phone
          }
        }
      }
    }
  `;

const parseCustomers = (data: ShopifyCustomerNode[]) => {
	return data.map((customer) => ({
		shopifyCustomerId: customer.id,
		name: customer.displayName,
		email: customer.email,
		phone: customer.phone || null,
	}));
};

export { GetAllCustomers, parseCustomers };
