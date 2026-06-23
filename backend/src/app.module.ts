import { join } from 'path';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { AllExceptionsFilter } from './common/exception.filter';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: 60000,
          limit: config.get('NODE_ENV') === 'production' ? 30 : 60,
        }],
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        if (process.env.DB_DRIVER === 'sqlite') {
          return {
            type: 'sqljs' as any,
            location: 'data/local.db',
            autoSave: true,
            entities: [User],
            synchronize: true,
            logging: configService.get('NODE_ENV') === 'development',
          };
        }
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          synchronize: configService.get('NODE_ENV') === 'development',
          autoLoadEntities: true,
          migrations: ['dist/migrations/*.js'],
          migrationsRun: false,
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
    }),
    UsersModule,
    AuthModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}