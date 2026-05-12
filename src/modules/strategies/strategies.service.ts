import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Between, DataSource, Repository } from 'typeorm';
import { CustomHttpException } from '../../shared/exceptions/custom-http.exception';
import { LlmService } from '../llm/llm.service';
import { GenerateStrategyDto } from './dto/generate-strategy.dto';
import { FunnelStage } from './entities/funnel-stage.entity';
import { FunnelTask } from './entities/funnel-task.entity';
import { Strategy } from './entities/strategy.entity';
import { StrategyGenerationLog } from './entities/strategy-generation-log.entity';

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly llmService: LlmService,
    private readonly config: ConfigService,
    @InjectRepository(Strategy) private readonly strategyRepo: Repository<Strategy>,
    @InjectRepository(StrategyGenerationLog)
    private readonly logRepo: Repository<StrategyGenerationLog>,
  ) {}

  async generate(userId: string, brief: GenerateStrategyDto) {
    await this.assertUnderDailyLimit(userId);

    const llmResult = await this.llmService.generate(brief);

    // Single transaction: parent strategy → stages → tasks. If anything
    // fails partway, the whole tree rolls back. See RFC section 7.
    const persisted = await this.dataSource.transaction(async (em) => {
      const strategy = em.create(Strategy, {
        user_id: userId,
        title: llmResult.strategy.title,
        product_name: brief.product_name,
        target_audience: brief.target_audience,
        primary_goal: brief.primary_goal,
        tone: brief.tone,
        additional_context: brief.additional_context ?? null,
        generated_via: llmResult.via,
        input_tokens: llmResult.input_tokens,
        output_tokens: llmResult.output_tokens,
      });
      const savedStrategy = await em.save(strategy);

      const stages: FunnelStage[] = [];
      for (const parsedStage of llmResult.strategy.funnel_stages) {
        const stage = em.create(FunnelStage, {
          strategy_id: savedStrategy.id,
          stage_order: parsedStage.stage_order,
          title: parsedStage.title,
          description: parsedStage.description,
        });
        const savedStage = await em.save(stage);
        const tasks = parsedStage.tasks.map((t) =>
          em.create(FunnelTask, {
            funnel_stage_id: savedStage.id,
            task_order: t.task_order,
            title: t.title,
          }),
        );
        savedStage.tasks = await em.save(tasks);
        stages.push(savedStage);
      }
      savedStrategy.funnel_stages = stages;

      // Log success. Only counted against the rate limit on commit.
      await em.save(
        em.create(StrategyGenerationLog, {
          user_id: userId,
          strategy_id: savedStrategy.id,
        }),
      );

      return savedStrategy;
    });

    return this.toFullResponse(persisted, llmResult.via, {
      input: llmResult.input_tokens,
      output: llmResult.output_tokens,
    });
  }

  async listForUser(userId: string) {
    const strategies = await this.strategyRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 50,
    });
    return strategies.map((s) => ({
      id: s.id,
      title: s.title,
      product_name: s.product_name,
      generated_via: s.generated_via,
      created_at: s.created_at,
    }));
  }

  async getOne(userId: string, id: string) {
    const strategy = await this.strategyRepo.findOne({
      where: { id, user_id: userId },
      relations: ['funnel_stages'],
      order: { funnel_stages: { stage_order: 'ASC' } as never },
    });
    if (!strategy) {
      throw new CustomHttpException('Strategy not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: strategy.id,
      title: strategy.title,
      product_name: strategy.product_name,
      target_audience: strategy.target_audience,
      primary_goal: strategy.primary_goal,
      tone: strategy.tone,
      generated_via: strategy.generated_via,
      created_at: strategy.created_at,
      funnel_stages: (strategy.funnel_stages ?? [])
        .sort((a, b) => a.stage_order - b.stage_order)
        .map((s) => ({
          id: s.id,
          stage_order: s.stage_order,
          title: s.title,
          description: s.description,
        })),
    };
  }

  async getFunnel(userId: string, id: string) {
    const strategy = await this.strategyRepo.findOne({
      where: { id, user_id: userId },
      relations: ['funnel_stages', 'funnel_stages.tasks'],
    });
    if (!strategy) {
      throw new CustomHttpException('Strategy not found', HttpStatus.NOT_FOUND);
    }
    return this.toFullResponse(strategy, strategy.generated_via as 'claude' | 'fallback', {
      input: strategy.input_tokens ?? 0,
      output: strategy.output_tokens ?? 0,
    });
  }

  private async assertUnderDailyLimit(userId: string) {
    const limit = +(this.config.get<string>('STRATEGY_DAILY_LIMIT') ?? 5);
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfNext = new Date(startOfDay);
    startOfNext.setUTCDate(startOfNext.getUTCDate() + 1);
    const count = await this.logRepo.count({
      where: {
        user_id: userId,
        created_at: Between(startOfDay, startOfNext),
      },
    });
    if (count >= limit) {
      throw new CustomHttpException(
        `Daily generation limit of ${limit} reached. Try again after 00:00 UTC.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private toFullResponse(
    strategy: Strategy,
    via: 'claude' | 'fallback',
    tokens: { input: number; output: number },
  ) {
    return {
      strategy: {
        id: strategy.id,
        title: strategy.title,
        created_at: strategy.created_at,
      },
      funnel_stages: (strategy.funnel_stages ?? [])
        .sort((a, b) => a.stage_order - b.stage_order)
        .map((s) => ({
          id: s.id,
          stage_order: s.stage_order,
          title: s.title,
          description: s.description,
          tasks: (s.tasks ?? [])
            .sort((a, b) => a.task_order - b.task_order)
            .map((t) => ({ id: t.id, task_order: t.task_order, title: t.title })),
        })),
      generated_via: via,
      token_usage: tokens,
    };
  }
}
