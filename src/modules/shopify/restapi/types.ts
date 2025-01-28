interface MoneySet {
	shop_money: Money;
	presentment_money: Money;
}

interface Money {
	amount: string;
	currency_code: string;
}

interface ClientDetails {
	accept_language: string | null;
	browser_height: number | null;
	browser_ip: string;
	browser_width: number | null;
	session_hash: string | null;
	user_agent: string;
}

interface Company {
	id: number;
	location_id: number;
}

interface ShopifyCustomer {
	id: number;
	email: string;
	created_at: string;
	updated_at: string;
	first_name: string;
	last_name: string;
	state: string;
	note: string | null;
	verified_email: boolean;
	multipass_identifier: string | null;
	tax_exempt: boolean;
	phone: string | null;
	email_marketing_consent: MarketingConsent;
	sms_marketing_consent: MarketingConsent;
	tags: string;
	currency: string;
	tax_exemptions: any[];
	admin_graphql_api_id: string;
	default_address: Address | null;
	addresses: Address[];
}

interface Address {
	id: number;
	customer_id: number;
	first_name: string;
	last_name: string;
	company: string | null;
	address1: string;
	address2: string | null;
	city: string;
	province: string;
	country: string;
	zip: string;
	phone: string;
	name: string;
	province_code: string;
	country_code: string;
	country_name: string;
	default: boolean;
}

interface MarketingConsent {
	state: string;
	opt_in_level: string;
	consent_updated_at: string | null;
	consent_collected_from?: string;
}

interface LineItem {
	id: number;
	admin_graphql_api_id: string;
	attributed_staffs: any[];
	current_quantity: number;
	fulfillable_quantity: number;
	fulfillment_service: string;
	fulfillment_status: string | null;
	gift_card: boolean;
	grams: number;
	name: string;
	price: string;
	price_set: MoneySet;
	product_exists: boolean;
	product_id: number;
	properties: any[];
	quantity: number;
	requires_shipping: boolean;
	sku: string | null;
	taxable: boolean;
	title: string;
	total_discount: string;
	total_discount_set: MoneySet;
	variant_id: number;
	variant_inventory_management: string;
	variant_title: string;
	vendor: string;
	tax_lines: any[];
	duties: any[];
	discount_allocations: any[];
}

interface ShippingAddress {
	first_name: string | null;
	address1: string;
	phone: string;
	city: string;
	zip: string;
	province: string;
	country: string;
	last_name: string;
	address2: string | null;
	company: string | null;
	latitude: number;
	longitude: number;
	name: string;
	country_code: string;
	province_code: string;
}

interface ShippingLine {
	id: number;
	carrier_identifier: string | null;
	code: string;
	current_discounted_price_set: MoneySet;
	discounted_price: string;
	discounted_price_set: MoneySet;
	is_removed: boolean;
	phone: string | null;
	price: string;
	price_set: MoneySet;
	requested_fulfillment_service_id: string | null;
	source: string;
	title: string;
	tax_lines: any[];
	discount_allocations: any[];
}

interface ShopifyOrder {
	id: number;
	admin_graphql_api_id: string;
	app_id: number;
	browser_ip: string;
	buyer_accepts_marketing: boolean;
	cancel_reason: string | null;
	cancelled_at: string | null;
	cart_token: string | null;
	checkout_id: number;
	checkout_token: string;
	client_details: ClientDetails;
	closed_at: string | null;
	company: Company;
	confirmation_number: string;
	confirmed: boolean;
	contact_email: string;
	created_at: string;
	currency: string;
	current_shipping_price_set: MoneySet;
	current_subtotal_price: string;
	current_subtotal_price_set: MoneySet;
	current_total_additional_fees_set: MoneySet | null;
	current_total_discounts: string;
	current_total_discounts_set: MoneySet;
	current_total_duties_set: MoneySet | null;
	current_total_price: string;
	current_total_price_set: MoneySet;
	current_total_tax: string;
	current_total_tax_set: MoneySet;
	customer_locale: string;
	device_id: string | null;
	discount_codes: any[];
	duties_included: boolean;
	email: string;
	estimated_taxes: boolean;
	financial_status: string;
	fulfillment_status: string | null;
	landing_site: string | null;
	landing_site_ref: string | null;
	location_id: string | null;
	merchant_business_entity_id: string;
	merchant_of_record_app_id: string | null;
	name: string;
	note: string | null;
	note_attributes: any[];
	number: number;
	order_number: number;
	order_status_url: string;
	original_total_additional_fees_set: MoneySet | null;
	original_total_duties_set: MoneySet | null;
	payment_gateway_names: string[];
	phone: string;
	po_number: string | null;
	presentment_currency: string;
	processed_at: string;
	reference: string | null;
	referring_site: string | null;
	source_identifier: string | null;
	source_name: string;
	source_url: string | null;
	subtotal_price: string;
	subtotal_price_set: MoneySet;
	tags: string;
	tax_exempt: boolean;
	tax_lines: any[];
	taxes_included: boolean;
	test: boolean;
	token: string;
	total_cash_rounding_payment_adjustment_set: MoneySet;
	total_cash_rounding_refund_adjustment_set: MoneySet;
	total_discounts: string;
	total_discounts_set: MoneySet;
	total_line_items_price: string;
	total_line_items_price_set: MoneySet;
	total_outstanding: string;
	total_price: string;
	total_price_set: MoneySet;
	total_shipping_price_set: MoneySet;
	total_tax: string;
	total_tax_set: MoneySet;
	total_tip_received: string;
	total_weight: number;
	updated_at: string;
	user_id: string | null;
	billing_address: any | null;
	customer: ShopifyCustomer;
	discount_applications: any[];
	fulfillments: any[];
	line_items: LineItem[];
	payment_terms: string | null;
	refunds: any[];
	shipping_address: ShippingAddress;
	shipping_lines: ShippingLine[];
	returns: any[];
}

interface ShopifyOrderDelete {
	id: number;
}

interface ShopifyProduct {
	admin_graphql_api_id: string;
	body_html: string;
	created_at: string;
	handle: string;
	id: number;
	product_type: string;
	published_at: string;
	template_suffix: string;
	title: string;
	updated_at: string;
	vendor: string;
	status: string;
	published_scope: string;
	tags: string;
	variants: Variant[];
	options: Option[];
	images: Image[];
	image: Image;
	media: Media[];
	variant_gids: VariantGid[];
	has_variants_that_requires_components: boolean;
	category: Category;
}

interface Variant {
	admin_graphql_api_id: string;
	barcode: string;
	compare_at_price: string | null;
	created_at: string;
	id: number;
	inventory_policy: string;
	position: number;
	price: string;
	product_id: number;
	sku: string;
	taxable: boolean;
	title: string;
	updated_at: string;
	option1: string;
	option2: string | null;
	option3: string | null;
	image_id: number | null;
	inventory_item_id: number;
	inventory_quantity: number;
	old_inventory_quantity: number;
}

interface Option {
	name: string;
	id: number;
	product_id: number;
	position: number;
	values: string[];
}

interface Image {
	id: number;
	product_id: number;
	position: number;
	created_at: string;
	updated_at: string;
	alt: string | null;
	width: number;
	height: number;
	src: string;
	variant_ids: number[];
	admin_graphql_api_id: string;
}

interface Media {
	id: number;
	product_id: number;
	position: number;
	created_at: string;
	updated_at: string;
	alt: string | null;
	status: string;
	media_content_type: string;
	preview_image: PreviewImage;
	variant_ids: number[];
	admin_graphql_api_id: string;
}

interface PreviewImage {
	width: number;
	height: number;
	src: string;
	status: string;
}

interface VariantGid {
	admin_graphql_api_id: string;
	updated_at: string;
}

interface Category {
	admin_graphql_api_id: string;
	name: string;
	full_name: string;
}

interface ShopifyProductDelete {
	id: number;
}

export {
	ShopifyOrder,
	ClientDetails,
	Company,
	ShopifyCustomer,
	LineItem,
	MarketingConsent,
	Money,
	MoneySet,
	ShippingAddress,
	ShippingLine,
	ShopifyOrderDelete,
	ShopifyProduct,
	ShopifyProductDelete,
};
