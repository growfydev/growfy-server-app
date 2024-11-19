import { NestInterceptor, ExecutionContext, CallHandler, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {

    constructor(private reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        const message =
            this.reflector.get<string>('responseMessage', context.getHandler()) ||
            'Request successful';

        return next.handle().pipe(
            map(data => ({
                statusCode: statusCode,
                timestamp: new Date().toISOString(),
                success: true,
                message,
                data,
            }))
        );
    }
}