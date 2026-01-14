/**
 * JWT Auth Guard
 *
 * @description Guard for protecting routes with JWT authentication
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
