import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

/**
 * 应用程序主模块
 * 
 * 负责整合所有功能模块，配置全局服务和数据库连接
 */
@Module({
  imports: [
    // 配置模块 - 用于加载和访问环境变量
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'], // 优先使用当前目录，然后是父目录
    }),
    
    // 数据库连接模块 - 使用异步配置方式
    TypeOrmModule.forRootAsync({
      // 注入 ConfigService 以读取环境变量
      inject: [ConfigService],
      // 使用工厂函数根据环境变量创建数据库配置
      useFactory: (configService: ConfigService) => ({
        // 数据库类型
        type: 'postgres',
        
        // 从环境变量读取数据库连接参数
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        
        // 自动同步实体到数据库表结构（开发环境使用，生产环境应关闭）
        synchronize: configService.get('NODE_ENV') === 'development',
        
        // 自动加载实体类，无需手动指定实体数组
        autoLoadEntities: true,
        
        // 是否显示SQL日志
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    
    // 用户模块 - 提供用户管理功能
    UsersModule,
    
    // 认证模块 - 提供用户认证和授权功能
    AuthModule,
  ],
  // 保留原有的控制器
  controllers: [AppController],
  // 保留原有的服务提供者
  providers: [AppService],
})
export class AppModule {}