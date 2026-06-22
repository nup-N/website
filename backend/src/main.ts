import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // 启用 CORS
  const corsOrigin = configService.get('CORS_ORIGIN');
  if (!corsOrigin) {
    console.error('CORS_ORIGIN 未配置，拒绝所有跨域请求');
  }
  app.enableCors({
    origin: corsOrigin
      ? corsOrigin.split(',').map(origin => origin.trim())
      : false,
    credentials: true,
  });
  
  // 全局路由前缀
  app.setGlobalPrefix('api');

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // 自动过滤未定义的属性
    forbidNonWhitelisted: true, // 禁止未定义的属性
    transform: true, // 自动转换类型
  }));
  
  // 从环境变量读取端口
  const port = configService.get('PORT', 3000);
  await app.listen(port, '0.0.0.0');
  
  const nodeEnv = configService.get('NODE_ENV', 'development');
  console.log(`🚀 统一认证服务运行在: http://0.0.0.0:${port} [${nodeEnv}]`);
}
bootstrap();
