export interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  userType?: string;
  organizationId: string;
  permissions?: string[];
  status: 'active' | 'inactive' | 'pending';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAuthData {
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
}

export interface ApiGatewayUser extends ExtendedUser {
  accessLevel: 'admin' | 'user' | 'viewer';
  allowedServices: string[];
}
