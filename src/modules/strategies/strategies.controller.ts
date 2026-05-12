import { Body, Controller, Get, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { AuthUser } from '../../shared/decorators/current-user.decorator';
import { GenerateStrategyDto } from './dto/generate-strategy.dto';
import { StrategiesService } from './strategies.service';

@ApiTags('strategies')
@ApiBearerAuth()
@Controller('strategies')
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate a marketing strategy from a brief',
    description:
      'Sends the brief to Claude, parses the response, and persists Strategy + FunnelStages + FunnelTasks in a single transaction. Sync call, may take 5-25s.',
  })
  @ApiResponse({ status: 201, description: 'Strategy generated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'No or invalid JWT' })
  @ApiResponse({ status: 429, description: 'Daily generation limit reached' })
  @ApiResponse({ status: 502, description: 'Upstream LLM error' })
  @ApiResponse({ status: 504, description: 'LLM call timed out' })
  async generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateStrategyDto) {
    const data = await this.strategiesService.generate(user.id, dto);
    return {
      status_code: HttpStatus.CREATED,
      message: 'Strategy generated',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: "List the current user's strategies" })
  async list(@CurrentUser() user: AuthUser) {
    const data = await this.strategiesService.listForUser(user.id);
    return {
      status_code: HttpStatus.OK,
      message: 'Strategies retrieved',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one strategy with stages (no tasks)' })
  async getOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    const data = await this.strategiesService.getOne(user.id, id);
    return {
      status_code: HttpStatus.OK,
      message: 'Strategy retrieved',
      data,
    };
  }

  @Get(':id/funnel')
  @ApiOperation({ summary: 'Get the full strategy tree (strategy + stages + tasks)' })
  async getFunnel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    const data = await this.strategiesService.getFunnel(user.id, id);
    return {
      status_code: HttpStatus.OK,
      message: 'Funnel retrieved',
      data,
    };
  }
}
