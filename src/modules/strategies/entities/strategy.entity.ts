import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../entities/base.entity';
import { FunnelStage } from './funnel-stage.entity';

@Entity({ name: 'strategies' })
export class Strategy extends AbstractBaseEntity {
  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  product_name: string;

  @Column({ type: 'varchar', length: 300, nullable: false })
  target_audience: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  primary_goal: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  tone: string;

  @Column({ type: 'text', nullable: true })
  additional_context: string | null;

  // 'claude' on the happy path, 'fallback' if the LLM call failed and the
  // fallback path produced this strategy. Exposed in API responses so the
  // frontend can render a "demo mode" badge. See RFC section 2 and Change Log.
  @Column({ type: 'varchar', length: 20, nullable: false, default: 'claude' })
  generated_via: string;

  @Column({ type: 'integer', nullable: true })
  input_tokens: number | null;

  @Column({ type: 'integer', nullable: true })
  output_tokens: number | null;

  @OneToMany(() => FunnelStage, (stage) => stage.strategy, { cascade: false })
  funnel_stages: FunnelStage[];
}
