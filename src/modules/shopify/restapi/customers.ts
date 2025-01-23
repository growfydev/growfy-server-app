import { Customer } from './types';

const parseCustomers = (data: Customer[]) => {
	return data.map((customer) => ({
		shopifyCustomerId: customer.admin_graphql_api_id,
		name: `${customer.first_name} ${customer.last_name}`,
		email: customer.email,
		phone: customer.phone || null,
	}));
};

export { parseCustomers };
