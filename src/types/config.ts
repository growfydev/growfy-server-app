export type Config = {
	port: string;
	client_url: string;
	database: {
		user: string;
		password: string;
		host: string;
		port: number;
		name: string;
	};
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
	sms: {
		accountSid: string;
		authToken: string;
		from: string;
	};
	google: {
		drive: {
			clientId: string;
			clientSecret: string;
			redirectUri: string;
			scope: string[];
		};
	};
	dropbox: {
		clientId: string;
		clientSecret: string;
		redirect: string;
	};
	shopify: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		scopes: string;
		webhooksUri: string;
	};
};
