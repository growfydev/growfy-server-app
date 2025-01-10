// ==========================================
// Common Types
// ==========================================

/** Representa un conjunto de valores monetarios */
interface MoneySet {
	shopMoney: {
		amount: string;
		currencyCode?: string;
	};
}

/** Información de paginación común para las respuestas de Shopify */
interface PageInfo {
	hasNextPage: boolean;
	endCursor: string;
}

/** Estructura de dirección para envíos y facturación */
interface Address {
	address1: string | null;
	latitude: number | null;
	longitude: number | null;
	trackingLink?: string | null;
}

// ==========================================
// Order Related Types
// ==========================================

/** Representa un ítem individual en una orden */
interface ShopifyLineItemNode {
	id: string;
	quantity: number;
	product: {
		id: string;
	};
	originalUnitPriceSet: MoneySet;
	discountedUnitPriceSet: MoneySet;
	originalTotalSet: MoneySet;
	discountedTotalSet: MoneySet;
}

interface ShopifyLineItemEdge {
	node: ShopifyLineItemNode;
}

/** Representa una orden completa de Shopify */
interface ShopifyOrderNode {
	id: string;
	name: string;
	processedAt: string;
	displayFinancialStatus: string;
	totalPriceSet: MoneySet;
	subtotalPriceSet: MoneySet;
	customer: {
		id: string;
	} | null;
	billingAddress: Address | null;
	shippingAddress: Address | null;
	lineItems: {
		edges: ShopifyLineItemEdge[];
	};
	currentTotalDiscountsSet: MoneySet;
	currentTotalTaxSet: MoneySet;
	paymentGatewayNames: string[];
}

interface ShopifyOrderEdge {
	node: ShopifyOrderNode;
}

/** Respuesta completa del query de órdenes */
interface ShopifyOrdersResponse {
	orders: {
		pageInfo: PageInfo;
		edges: ShopifyOrderEdge[];
	};
}

// ==========================================
// Customer Related Types
// ==========================================

/** Representa un cliente de Shopify */
interface ShopifyCustomerNode {
	id: string;
	displayName: string;
	email: string;
	phone: string | null;
}

interface ShopifyCustomerEdge {
	node: ShopifyCustomerNode;
}

/** Respuesta completa del query de clientes */
interface ShopifyCustomerResponse {
	customers: {
		pageInfo: PageInfo;
		edges: ShopifyCustomerEdge[];
	};
}

// ==========================================
// Product Related Types
// ==========================================

/** Representa una imagen destacada de producto */
interface FeaturedImage {
	url: string;
	altText: string | null;
}

/** Rango de precios para un producto */
interface PriceRange {
	minVariantPrice: {
		amount: string;
		currencyCode: string;
	};
	maxVariantPrice: {
		amount: string;
		currencyCode: string;
	};
}

interface CollectionNode {
	title: string;
}

interface CollectionEdge {
	node: CollectionNode;
}

/** Representa un producto de Shopify */
interface ShopifyProductNode {
	id: string;
	title: string;
	vendor: string;
	featuredImage: FeaturedImage | null;
	priceRangeV2: PriceRange;
	collections: {
		edges: CollectionEdge[];
	};
}

interface ShopifyProductEdge {
	node: ShopifyProductNode;
}

/** Respuesta completa del query de productos */
interface ShopifyProductResponse {
	products: {
		pageInfo: PageInfo;
		edges: ShopifyProductEdge[];
	};
}

export {
	// Common Types
	MoneySet,
	PageInfo,
	Address,

	// Order Related
	ShopifyLineItemNode,
	ShopifyLineItemEdge,
	ShopifyOrderNode,
	ShopifyOrderEdge,
	ShopifyOrdersResponse,

	// Customer Related
	ShopifyCustomerNode,
	ShopifyCustomerEdge,
	ShopifyCustomerResponse,

	// Product Related
	ShopifyProductNode,
	ShopifyProductResponse,
	FeaturedImage,
	PriceRange,
};
