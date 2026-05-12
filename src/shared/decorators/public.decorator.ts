import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/**
 * Marks a route handler or controller as bypassing the global JwtAuthGuard.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);
