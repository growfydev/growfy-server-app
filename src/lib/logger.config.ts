import { LoggerModule } from 'nestjs-pino';

const loggerConfig: any = {
    pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                singleLine: true,
                ignore: 'pid,hostname',
            },
        },
        serializers: {
            req: (req: { method: string; url: string }) => ({
                method: req.method,
                url: req.url,
            }),
            res: (res: { statusCode: number }) => ({
                statusCode: res.statusCode,
            }),
        },
    },
};

const loggerConfigAsync = {
    useFactory: async (): Promise<any> => {
        return loggerConfig;
    },
};

export const LoggerConfiguredModule = LoggerModule.forRootAsync(loggerConfigAsync);
