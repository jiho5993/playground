import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { UserRateLimitSettingStatus, UserRateLimitSettingType } from './user-rate-limit-setting.constant';

@Entity()
@Index(['userId', 'type'], { unique: true })
export class UserRateLimitSetting {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => User, (user) => user.rateLimitSettings)
  user: User;

  @Column('bigint')
  userId: string;

  @Column('varchar', { length: 50, nullable: false })
  type: UserRateLimitSettingType;

  @Column('varchar', { length: 50, default: UserRateLimitSettingStatus.Deactivated })
  status: UserRateLimitSettingStatus;

  @Column('int')
  limit: number;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  modifiedDate: Date;
}
