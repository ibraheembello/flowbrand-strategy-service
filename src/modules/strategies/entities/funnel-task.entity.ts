import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { FunnelStage } from './funnel-stage.entity';

@Entity({ name: 'funnel_tasks' })
export class FunnelTask extends AbstractBaseEntity {
  @Column({ type: 'uuid', nullable: false })
  funnel_stage_id: string;

  @ManyToOne(() => FunnelStage, (stage) => stage.tasks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'funnel_stage_id' })
  funnel_stage: FunnelStage;

  @Column({ type: 'smallint', nullable: false })
  task_order: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title: string;
}
