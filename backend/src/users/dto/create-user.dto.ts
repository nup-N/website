import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * 用户注册数据传输对象
 * 
 * 用于验证用户注册时提交的数据
 */
export class CreateUserDto {
  /**
   * 用户名
   * 
   * 用户登录系统的唯一标识符，长度为3-20个字符
   */
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串类型' })
  @Length(3, 20, { message: '用户名长度必须在3到20个字符之间' })
  username: string;

  /**
   * 电子邮箱
   * 
   * 用户的联系邮箱，同时也可用于登录，必须是有效的邮箱格式
   */
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  /**
   * 密码
   * 
   * 用户账号的登录密码，长度为6-20个字符
   */
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串类型' })
  @Length(6, 20, { message: '密码长度必须在6到20个字符之间' })
  password: string;
}