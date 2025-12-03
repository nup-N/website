import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 用户登录数据传输对象
 * 
 * 用于验证用户登录时提交的凭据
 */
export class LoginDto {
  /**
   * 用户名
   * 
   * 用户登录系统的标识符，可以是用户名或邮箱
   */
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串类型' })
  username: string;

  /**
   * 密码
   * 
   * 用户账号的登录密码
   */
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串类型' })
  password: string;
}