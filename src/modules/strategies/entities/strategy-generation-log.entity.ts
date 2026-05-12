import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// One row per *successful* generation. Used to enforce the per-user daily
// rate limit defined in the RFC (sections 2 and 7). We log only successes.
// Failed generations don't count against the cap, otherwise a flaky LLM
// would lock users out.
@Entity({ name: 'strategy_generation_logs' })
@Index('IDX_strategy_generation_logs_user_day', ['user_id', 'created_at'])
export class StrategyGenerationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({ type: 'uuid', nullable: false })
  strategy_id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}
