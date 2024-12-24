import { Config } from 'src/types/config';

const {
	PORT,
	CLIENT_URL,
	DB_USER,
	DB_PASSWORD,
	DB_HOST,
	DB_PORT,
	DB_NAME,
	JWT_SECRET,
	REFRESH_SECRET_KEY,
	LINKEDIN_API_KEY,
	LINKEDIN_SECRET_KEY,
	LINKEDIN_CALLBACK_URI,
	LINKEDIN_SCOPES,
	TIKTOK_CLIENT_KEY,
	TIKTOK_CLIENT_SECRET,
	TIKTOK_REDIRECT_URI,
	TWITTER_CLIENT_ID,
	TWITTER_CLIENT_SECRET,
	TWITTER_CALLBACK_URI,
	STRIPE_API_KEY,
	REDIS_HOST,
	REDIS_PORT,
	AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY,
	AWS_S3_BUCKET_NAME,
	AWS_REGION,
	SMS_ACCOUNTID,
	SMS_AUTH_TOKEN,
	SMS_FROM,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_REDIRECT_URI,
	DROPBOX_ID,
	DROPBOX_SECRET,
	DROPBOX_REDIRECT,
	SHOPIFY_CLIENT_ID,
	SHOPIFY_CLIENT_SECRET,
	SHOPIFY_REDIRECT_URI,
	SHOPIFY_SCOPES,
} = process.env;

function configLoader(): Config {
	return {
		port: PORT,
		client_url: CLIENT_URL,
		database: {
			user: DB_USER,
			password: DB_PASSWORD,
			host: DB_HOST,
			port: Number(DB_PORT),
			name: DB_NAME,
		},
		jwt: {
			secret_key: JWT_SECRET,
			refresh_key: REFRESH_SECRET_KEY,
		},
		linkedin: {
			api_key: LINKEDIN_API_KEY,
			secret_key: LINKEDIN_SECRET_KEY,
			callback_uri: LINKEDIN_CALLBACK_URI,
			scopes: LINKEDIN_SCOPES,
		},
		tiktok: {
			client_key: TIKTOK_CLIENT_KEY,
			client_secret: TIKTOK_CLIENT_SECRET,
			redirect_uri: TIKTOK_REDIRECT_URI,
		},
		twitter: {
			client_id: TWITTER_CLIENT_ID,
			client_secret: TWITTER_CLIENT_SECRET,
			callback_uri: TWITTER_CALLBACK_URI,
		},
		stripe: {
			key: STRIPE_API_KEY,
		},
		redis: {
			host: REDIS_HOST,
			port: Number(REDIS_PORT),
		},
		s3: {
			key_id: AWS_ACCESS_KEY_ID,
			access_key: AWS_SECRET_ACCESS_KEY,
			bucket_name: AWS_S3_BUCKET_NAME,
			region: AWS_REGION,
		},
		sms: {
			accountSid: SMS_ACCOUNTID,
			authToken: SMS_AUTH_TOKEN,
			from: SMS_FROM,
		},
		google: {
			drive: {
				clientId: GOOGLE_CLIENT_ID,
				clientSecret: GOOGLE_CLIENT_SECRET,
				redirectUri: GOOGLE_REDIRECT_URI,
				scope: ['https://www.googleapis.com/auth/drive'],
			},
		},
		dropbox: {
			clientId: DROPBOX_ID,
			clientSecret: DROPBOX_SECRET,
			redirect: DROPBOX_REDIRECT,
		},
		shopify: {
			clientId: SHOPIFY_CLIENT_ID,
			clientSecret: SHOPIFY_CLIENT_SECRET,
			redirectUri: SHOPIFY_REDIRECT_URI,
			scopes: SHOPIFY_SCOPES,
		},
	};
}

export default configLoader;
