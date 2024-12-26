import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserStatus } from './user.constant';
import { UserRateLimitSetting } from '../user-rate-limit-setting/user-rate-limit-setting.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column('varchar', { length: 30 })
  name: string;

  @Column('varchar', { length: 50 })
  status: UserStatus;

  @OneToMany(() => UserRateLimitSetting, (userRateLimitSetting) => userRateLimitSetting.user)
  rateLimitSettings: UserRateLimitSetting[];

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  modifiedDate: Date;
}
