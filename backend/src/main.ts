import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const corsOrigin = configService.get('CORS_ORIGIN');
  const origins = corsOrigin
    ? corsOrigin.split(',').map((o) => o.trim()).filter((o) => {
        if (!o.startsWith('http://') && !o.startsWith('https://')) {
          console.warn(`[CORS] 忽略无效 origin: ${o}`);
          return false;
        }
        return true;
      })
    : [];

  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = configService.get('PORT', 3000);
  await app.listen(port, '0.0.0.0');

  const nodeEnv = configService.get('NODE_ENV', 'development');
  console.log(`\u{1F680} Auth Service running at http://0.0.0.0:${port} [${nodeEnv}]`);
}
bootstrap();
