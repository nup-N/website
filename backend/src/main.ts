import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用 CORS
  app.enableCors({
    origin: true, // 允许所有来源（开发环境）
    credentials: true,
  });
  
  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
