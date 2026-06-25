import { ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService role update', () => {
  const makeRepo = () => ({
    findOne: jest.fn(),
    update: jest.fn(),
  });

  const makeUser = (id: number, role: any) => ({
    id,
    username: 'u' + id,
    email: `u${id}@test.com`,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('admin can set target to guest/user/premium', async () => {
    const repo = makeRepo();
    const service = new UsersService(repo as any);

    repo.findOne.mockResolvedValueOnce(makeUser(2, 'user'));
    repo.update.mockResolvedValueOnce(undefined);
    repo.findOne.mockResolvedValueOnce(makeUser(2, 'premium'));

    const result = await service.update(2, { role: 'premium' } as any, { userId: 1, role: 'admin' });
    expect(result.role).toBe('premium');
  });

  it('admin cannot set target to admin', async () => {
    const repo = makeRepo();
    const service = new UsersService(repo as any);

    repo.findOne.mockResolvedValueOnce(makeUser(2, 'user'));

    await expect(service.update(2, { role: 'admin' } as any, { userId: 1, role: 'admin' })).rejects.toThrow(ForbiddenException);
  });

  it('admin cannot change role of admin/super_admin target', async () => {
    const repo = makeRepo();
    const service = new UsersService(repo as any);

    repo.findOne.mockResolvedValueOnce(makeUser(2, 'super_admin'));

    await expect(service.update(2, { role: 'user' } as any, { userId: 1, role: 'admin' })).rejects.toThrow(ForbiddenException);
  });

  it('super_admin can set target to super_admin', async () => {
    const repo = makeRepo();
    const service = new UsersService(repo as any);

    repo.findOne.mockResolvedValueOnce(makeUser(2, 'user'));
    repo.update.mockResolvedValueOnce(undefined);
    repo.findOne.mockResolvedValueOnce(makeUser(2, 'super_admin'));

    const result = await service.update(2, { role: 'super_admin' } as any, { userId: 1, role: 'super_admin' });
    expect(result.role).toBe('super_admin');
  });

  it('nobody can change their own role', async () => {
    const repo = makeRepo();
    const service = new UsersService(repo as any);

    repo.findOne.mockResolvedValueOnce(makeUser(1, 'super_admin'));

    await expect(service.update(1, { role: 'admin' } as any, { userId: 1, role: 'super_admin' })).rejects.toThrow(ForbiddenException);
  });
});

