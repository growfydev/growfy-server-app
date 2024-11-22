import { Config } from "src/types/config";

export const configLoader: () => Config = (): Config => {
  return {
    port: process.env.PORT,
    database: process.env.DATABASE_URL,
    client_url: process.env.CLIENT_URL,
    jwt: {
      secret_key: process.env.JWT_SECRET,
      refresh_key: process.env.REFRESH_SECRET_KEY
    },
    linkedin: {
      api_key: process.env.LINKEDIN_API_KEY,
      secret_key: process.env.LINKEDIN_SECRET_KEY,
      callback_uri: process.env.LINKEDIN_CALLBACK_URI,
      scopes: process.env.LINKEDIN_SCOPES,
    },
    tiktok: {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      redirect_uri: process.env.TIKTOK_REDIRECT_URI
    },
    twitter: {
      client_id: process.env.TWITTER_CLIENT_ID,
      client_secret: process.env.TWITTER_CLIENT_SECRET,
      callback_uri: process.env.TWITTER_CALLBACK_URI
    },
    stripe: {
      key: process.env.STRIPE_API_KEY
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379
    }
  };
};
