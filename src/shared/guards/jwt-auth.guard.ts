import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { CustomHttpException } from '../exceptions/custom-http.exception';
import { IS_PUBLIC } from '../decorators/public.decorator';

// Validates JWTs signed with JWT_SECRET. The secret is intentionally shared
// with the main FlowBrand backend so tokens minted there are accepted here.
// Payload must contain a `sub` (user id) or `id` field.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const auth = request.headers['authorization'] as string | undefined;

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new CustomHttpException('Authorization header missing or malformed', HttpStatus.UNAUTHORIZED);
    }

    const token = auth.slice(7);
    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub ?? payload.id;
      if (!userId) {
        throw new CustomHttpException('Token missing user id', HttpStatus.UNAUTHORIZED);
      }
      request.user = { id: userId, email: payload.email };
      return true;
    } catch (err) {
      if (err instanceof CustomHttpException) throw err;
      throw new CustomHttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
    }
  }
}
