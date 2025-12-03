import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 用户控制器
 * 
 * 提供用户相关的API端点，包括用户注册、查询、更新和删除等
 * 除了注册接口外，其他所有接口都需要JWT认证
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 用户注册（公开接口）
   * 
   * 创建新用户账号，此接口无需认证，任何人都可以访问
   * 
   * @param createUserDto 用户注册数据
   * @returns 创建的用户信息（不含密码）
   */
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * 创建用户（管理员功能）
   * 
   * 创建新用户账号，需要JWT认证
   * 
   * @param createUserDto 用户创建数据
   * @returns 创建的用户信息（不含密码）
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * 获取所有用户
   * 
   * 返回系统中的所有用户列表，需要JWT认证
   * 
   * @returns 用户列表
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * 获取指定用户
   * 
   * 根据用户ID查询特定用户信息，需要JWT认证
   * 
   * @param id 用户ID
   * @returns 用户信息
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  /**
   * 更新用户信息
   * 
   * 修改指定用户的信息，需要JWT认证
   * 
   * @param id 用户ID
   * @param updateUserDto 更新的用户数据
   * @returns 更新后的用户信息
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  /**
   * 删除用户
   * 
   * 从系统中移除指定用户，需要JWT认证
   * 
   * @param id 用户ID
   * @returns 操作结果
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}