import { Request } from 'express';
import { User } from '../../modules/auth/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user: User;
}
