import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { Strategy } from './strategy.entity';
import { FunnelTask } from './funnel-task.entity';

@Entity({ name: 'funnel_stages' })
@Index('IDX_funnel_stages_strategy_order', ['strategy_id', 'stage_order'], { unique: true })
export class FunnelStage extends AbstractBaseEntity {
  @Column({ type: 'uuid', nullable: false })
  strategy_id: string;

  @ManyToOne(() => Strategy, (strategy) => strategy.funnel_stages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'strategy_id' })
  strategy: Strategy;

  @Column({ type: 'smallint', nullable: false })
  stage_order: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => FunnelTask, (task) => task.funnel_stage, { cascade: false })
  tasks: FunnelTask[];
}
