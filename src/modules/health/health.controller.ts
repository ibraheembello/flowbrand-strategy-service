import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class HealthController {
  @Public()
  @Get('probe')
  @ApiOperation({ summary: 'Liveness probe' })
  probe() {
    return {
      status_code: HttpStatus.OK,
      message: 'flowbrand-strategy-service is alive',
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health endpoint' })
  health() {
    return {
      status_code: HttpStatus.OK,
      message: 'healthy',
      uptime_seconds: Math.floor(process.uptime()),
    };
  }
}
