import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private canAdminChangeTargetRole(currentTargetRole: User['role'], nextRole: User['role']) {
    if (currentTargetRole === 'admin' || currentTargetRole === 'super_admin') {
      throw new ForbiddenException('不能调整管理员及以上角色用户');
    }
    if (nextRole !== 'guest' && nextRole !== 'user' && nextRole !== 'premium') {
      throw new ForbiddenException('管理员只能将角色设置为 guest/user/premium');
    }
  }

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const existingUsername = await this.userRepository.findOne({ where: { username: createUserDto.username } });
    if (existingUsername) throw new ConflictException('用户名已被使用');

    const existingEmail = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existingEmail) throw new ConflictException('邮箱已被注册');

    const user = this.userRepository.create(createUserDto);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    return result;
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepository.find();
    return users.map(({ password, ...rest }) => rest);
  }

  async findOne(id: number): Promise<SafeUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`ID 为 ${id} 的用户不存在`);
    const { password, ...result } = user;
    return result;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .addSelect('user.password')
      .getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto, actor?: { userId?: number; role?: string }): Promise<SafeUser> {
    const targetUser = await this.userRepository.findOne({ where: { id } });
    if (!targetUser) throw new NotFoundException(`ID 为 ${id} 的用户不存在`);

    if (updateUserDto.role) {
      if (actor?.userId === id) {
        throw new ForbiddenException('不能修改自己的角色');
      }

      const actorRole = actor?.role;
      if (actorRole === 'admin') {
        this.canAdminChangeTargetRole(targetUser.role, updateUserDto.role);
      } else if (actorRole !== 'super_admin') {
        throw new ForbiddenException('权限不足');
      }
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.userRepository.delete(id);
    return { message: '用户删除成功' };
  }
}
