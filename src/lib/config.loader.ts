export const configLoader: () => { port: string; database: string } = (): {
  port: string;
  database: string;
} => {
  return {
    port: process.env.PORT,
    database: process.env.DATABASE_URL,
  };
};
