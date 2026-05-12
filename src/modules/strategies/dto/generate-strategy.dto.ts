import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum StrategyTone {
  Professional = 'professional',
  Casual = 'casual',
  Playful = 'playful',
  Authoritative = 'authoritative',
}

export class GenerateStrategyDto {
  @ApiProperty({ example: 'NimbusNotes', minLength: 1, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  product_name: string;

  @ApiProperty({
    example: 'Remote-first product managers at 50-500 person SaaS companies',
    maxLength: 300,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  target_audience: string;

  @ApiProperty({
    example: 'Acquire 500 trial signups in the next 60 days',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  primary_goal: string;

  @ApiProperty({ enum: StrategyTone, example: StrategyTone.Professional })
  @IsEnum(StrategyTone)
  tone: StrategyTone;

  @ApiPropertyOptional({
    example: 'We just shipped a Slack integration we want to highlight.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  additional_context?: string;
}
