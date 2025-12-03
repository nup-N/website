import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

/**
 * 用户模块
 * 
 * 负责用户相关功能，包括用户注册、查询、更新和删除等操作
 * 通过 TypeORM 与数据库交互，管理用户数据
 */
@Module({
  imports: [
    // 导入 TypeORM 功能模块，注册 User 实体
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // 导出 UsersService 以便其他模块使用
})
export class UsersModule {}