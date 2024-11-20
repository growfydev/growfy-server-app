import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong.';
    let errors = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseMessage = exception.getResponse();
      if (typeof responseMessage === 'object' && responseMessage['message']) {
        if (Array.isArray(responseMessage['message'])) {
          errors = responseMessage['message'];
        } else {
          errors = [responseMessage['message']];
        }

        message = typeof responseMessage['message'] === 'string' ? responseMessage['message'] : 'Validation Errors';
      } else {
        message = responseMessage as string;
      }
    } else {
      message = (exception as any).message || message;
    }

    if (errors.length === 0) {
      errors = [message];
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      success: false,
      data: null,
      message,
      errors,
    });
  }
}
