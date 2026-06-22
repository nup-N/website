import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    let status = 500;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        const msg = body.message;
        if (Array.isArray(msg)) {
          message = msg.join('; ');
        } else if (typeof msg === 'string') {
          message = msg;
        }
      }
    } else if (!isProduction) {
      message = (exception as Error).message || message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(isProduction ? {} : { stack: (exception as Error).stack }),
    });
  }
}
