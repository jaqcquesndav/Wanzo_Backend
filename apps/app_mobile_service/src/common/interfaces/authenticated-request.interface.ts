import { Request } from 'express';
import { User } from '../../auth/entities/user.entity'; // Adjust path as necessary

export interface AuthenticatedRequest extends Request {
  user: User;
}
