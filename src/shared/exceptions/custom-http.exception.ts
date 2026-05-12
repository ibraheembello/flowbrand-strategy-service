import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomHttpException extends HttpException {
  constructor(message: string, statusCode: HttpStatus, extra?: Record<string, unknown>) {
    super(
      {
        status_code: statusCode,
        message,
        error: HttpStatus[statusCode] ?? 'Error',
        ...(extra ?? {}),
      },
      statusCode,
    );
  }
}
