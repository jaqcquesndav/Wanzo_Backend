// Shared user entity definitions across microservices
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CTO = 'CTO',
  GROWTH_FINANCE = 'GROWTH_FINANCE',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  COMPANY_USER = 'COMPANY_USER',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  ACCOUNTANT = 'ACCOUNTANT',
  CASHIER = 'CASHIER',
  SALES = 'SALES',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  STAFF = 'STAFF',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER'
}

export enum UserType {
  INTERNAL = 'INTERNAL', // Employees/staff of the Kiota platform
  EXTERNAL = 'EXTERNAL'  // Client users (SMEs and institutions)
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE'
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: UserRole[];
  type: UserType;
  status: UserStatus;
  companyId?: string;
  auth0Id?: string;
  createdAt: Date;
  updatedAt: Date;
}
