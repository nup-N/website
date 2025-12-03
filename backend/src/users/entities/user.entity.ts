import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ 
    type: 'enum',
    enum: ['guest', 'user', 'premium', 'admin', 'super_admin'],
    default: 'user'
  })
  role: 'guest' | 'user' | 'premium' | 'admin' | 'super_admin';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}