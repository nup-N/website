import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  /**
   * 用户角色
   * 
   * 可选值：guest, user, premium, admin, super_admin
   */
  @IsOptional()
  @IsEnum(['guest', 'user', 'premium', 'admin', 'super_admin'], {
    message: '角色必须是以下值之一: guest, user, premium, admin, super_admin',
  })
  role?: 'guest' | 'user' | 'premium' | 'admin' | 'super_admin';
}
