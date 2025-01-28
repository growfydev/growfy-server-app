import { Prisma } from '@prisma/client';
import { ShopifyProduct } from './types';

const parseProduct = (
	product: ShopifyProduct,
	shopifyIntegrationId: number,
) => {
	return {
		productId: product.admin_graphql_api_id,
		title: product.title || null,
		totalInventory:
			product.variants.reduce(
				(total, variant) => total + (variant.inventory_quantity || 0),
				0,
			) || null,
		vendor: product.vendor || null,
		featuredImage: product.image?.src || null,
		featuredImageAltText: product.image?.alt || null,
		minPrice: product.variants[0]?.price
			? new Prisma.Decimal(product.variants[0]?.price)
			: null,
		maxPrice: product.variants[0]?.price
			? new Prisma.Decimal(product.variants[0]?.price)
			: null,
		currency: null,
		collections: product.category ? [product.category.name] : [],
		shopifyIntegrationId,
	};
};

export { parseProduct };
