import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../llm/llm.module';
import { FunnelStage } from './entities/funnel-stage.entity';
import { FunnelTask } from './entities/funnel-task.entity';
import { Strategy } from './entities/strategy.entity';
import { StrategyGenerationLog } from './entities/strategy-generation-log.entity';
import { StrategiesController } from './strategies.controller';
import { StrategiesService } from './strategies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Strategy, FunnelStage, FunnelTask, StrategyGenerationLog]),
    LlmModule,
  ],
  controllers: [StrategiesController],
  providers: [StrategiesService],
})
export class StrategiesModule {}
