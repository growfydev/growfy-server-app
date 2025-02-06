import { ShopifyCustomer } from './types';

const parseCustomers = (data: ShopifyCustomer[]) => {
	return data.map((customer) => ({
		shopifyCustomerId: customer.admin_graphql_api_id,
		name: `${customer.first_name} ${customer.last_name}`,
		email: customer.email,
		phone: customer.phone || null,
	}));
};

const parseCustomer = (customer: ShopifyCustomer, profileId: number) => {
	return {
		shopifyCustomerId: customer.admin_graphql_api_id,
		name: `${customer.first_name} ${customer.last_name}`,
		email: customer.email,
		phone: customer.phone || null,
		profileId,
	};
};

export { parseCustomers, parseCustomer };
