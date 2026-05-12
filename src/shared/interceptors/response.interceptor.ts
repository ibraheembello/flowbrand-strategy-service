import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

// Wraps controller return values in a consistent envelope unless the
// controller has already produced one (detected by the presence of
// status_code on the body). Mirrors flowbrand-be's convention so frontend
// consumers only need one response shape.
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'status_code' in data) {
          return data;
        }
        return {
          status_code: response.statusCode,
          message: 'Success',
          data,
        };
      }),
    );
  }
}
