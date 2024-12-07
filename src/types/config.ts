export type Config = {
	port: string;
	database: string;
	client_url: string;
	jwt: {
		secret_key: string;
		refresh_key: string;
	};
	tiktok: {
		client_key: string;
		client_secret: string;
		redirect_uri: string;
	};
	twitter: {
		client_id: string;
		client_secret: string;
		callback_uri: string;
	};
	linkedin: {
		api_key: string;
		secret_key: string;
		callback_uri: string;
		scopes: string;
	};
	stripe: {
		key: string;
	};
	redis: {
		host: string;
		port: number;
	};
	s3: {
		key_id: string;
		access_key: string;
		bucket_name: string;
		region: string;
	};
};
