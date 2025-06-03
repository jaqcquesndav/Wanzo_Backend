import { User } from '../entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user?: User;
  auth0User?: any; // Auth0 user profile information
  token?: string;  // Raw JWT token
}
