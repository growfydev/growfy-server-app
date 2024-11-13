type Config = {
  port: string;
  database: string;
  jwt: {
    secret_key: string;
    refresh_key: string;
  }
};

export const configLoader: () => Config = (): Config => {
  return {
    port: process.env.PORT,
    database: process.env.DATABASE_URL,
    jwt: {
      secret_key: process.env.JWT_SECRET,
      refresh_key: process.env.REFRESH_SECRET_KEY
    }
  };
};
