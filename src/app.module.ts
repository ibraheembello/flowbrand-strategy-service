import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import dataSource, { dataSourceOptions } from './database/data-source';
import { HealthController } from './modules/health/health.controller';
import { LlmModule } from './modules/llm/llm.module';
import { StrategiesModule } from './modules/strategies/strategies.module';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV ?? 'development'}.local`],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3009),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().allow('').required(),
        DB_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRY_TIMEFRAME: Joi.number().default(3600),
        ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
        ANTHROPIC_MODEL: Joi.string().default('claude-sonnet-4-6'),
        ANTHROPIC_MAX_OUTPUT_TOKENS: Joi.number().default(4096),
        ANTHROPIC_TIMEOUT_MS: Joi.number().default(30000),
        STRATEGY_DAILY_LIMIT: Joi.number().default(5),
        STRATEGY_FALLBACK_ENABLED: Joi.string().valid('true', 'false').default('false'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...dataSourceOptions }),
      dataSourceFactory: async () => dataSource,
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: +(config.get<number>('JWT_EXPIRY_TIMEFRAME') ?? 3600) },
      }),
      inject: [ConfigService],
    }),
    LlmModule,
    StrategiesModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
