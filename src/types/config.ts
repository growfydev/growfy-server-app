export type Config = {
    port: string;
    database: string;
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
};
