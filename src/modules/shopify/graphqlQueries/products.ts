import { Prisma } from '@prisma/client';
import { ShopifyProductNode } from './types';

const GetAllProducts = (first: number = 50, after?: string): string => `
    query GetAllProducts {
      products(
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
            title
            vendor
            featuredImage {
              url
              altText
            }
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            collections(first: 1) {
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      }
    }
  `;

const parseProducts = (productNodes: ShopifyProductNode[]) => {
	return productNodes.map((product) => ({
		productId: product.id,
		title: product.title || null,
		vendor: product.vendor || null,
		featuredImage: product.featuredImage?.url || null,
		featuredImageAltText: product.featuredImage?.altText || null,
		minPrice: product.priceRangeV2.minVariantPrice.amount
			? new Prisma.Decimal(product.priceRangeV2.minVariantPrice.amount)
			: null,
		maxPrice: product.priceRangeV2.maxVariantPrice.amount
			? new Prisma.Decimal(product.priceRangeV2.maxVariantPrice.amount)
			: null,
		currency: product.priceRangeV2.minVariantPrice.currencyCode || null,
		collections: product.collections.edges.map(
			(edge) => edge.node.title || null,
		),
	}));
};

export { GetAllProducts, parseProducts };
