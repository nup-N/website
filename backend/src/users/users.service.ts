import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 创建新用户
   * 
   * @param createUserDto 用户注册数据
   * @returns 创建的用户信息（不含密码）
   * @throws ConflictException 当用户名或邮箱已存在时
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // 检查用户名是否已存在
    const existingUsername = await this.userRepository.findOne({ 
      where: { username: createUserDto.username } 
    });
    if (existingUsername) {
      throw new ConflictException('用户名已被使用');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findOne({ 
      where: { email: createUserDto.email } 
    });
    if (existingEmail) {
      throw new ConflictException('邮箱已被注册');
    }

    // 创建新用户实例
    const user = this.userRepository.create(createUserDto);
    
    // 加密密码
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    
    // 保存用户到数据库
    const savedUser = await this.userRepository.save(user);
    
    // 返回用户信息（不包含密码）
    const { password, ...result } = savedUser;
    return result;
  }

  /**
   * 获取所有用户列表
   * 
   * @returns 用户列表
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * 根据ID查找用户
   * 
   * @param id 用户ID
   * @returns 用户信息
   * @throws NotFoundException 当用户不存在时
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`ID为${id}的用户不存在`);
    }
    
    return user;
  }

  /**
   * 根据用户名查找用户（包含密码字段）
   * 
   * 主要用于登录验证
   * 
   * @param username 用户名
   * @returns 用户信息（包含密码）
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .addSelect('user.password')
      .getOne();
  }

  /**
   * 更新用户信息
   * 
   * @param id 用户ID
   * @param updateUserDto 更新的用户数据
   * @returns 更新后的用户信息
   * @throws NotFoundException 当用户不存在时
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // 先检查用户是否存在
    await this.findOne(id);
    
    // 更新用户信息
    await this.userRepository.update(id, updateUserDto);
    
    // 返回更新后的用户信息
    return this.findOne(id);
  }

  /**
   * 删除用户
   * 
   * @param id 用户ID
   * @returns 操作结果
   * @throws NotFoundException 当用户不存在时
   */
  async remove(id: number): Promise<{ message: string }> {
    // 先检查用户是否存在
    await this.findOne(id);
    
    // 删除用户
    await this.userRepository.delete(id);
    
    return { message: '用户删除成功' };
  }
}