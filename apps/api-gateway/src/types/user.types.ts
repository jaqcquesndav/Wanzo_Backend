import { Request } from 'express';

// Extended user type with additional properties used in the API Gateway
export interface ExtendedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  // Maps to the 'type' in the shared User interface
  userType: string;
  permissions?: string[];
  // Other properties from User interface
}

// Express request with user property
export interface RequestWithUser extends Request {
  user?: ExtendedUser;
}
