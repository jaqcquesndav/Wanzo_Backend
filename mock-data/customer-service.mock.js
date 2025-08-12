/**
 * Données de mock pour le customer-service
 * Ces données sont conformes au modèle de données du microservice
 * et peuvent être utilisées pour initialiser la base de données
 */

const { v4: uuidv4 } = require('uuid');

// Enum constants from the entities
const UserRole = {
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  ANALYST: 'analyst',
  CUSTOMER_ADMIN: 'customer_admin',
  CUSTOMER_USER: 'customer_user',
  VIEWER: 'viewer',
  USER: 'user'
};

const UserStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive'
};

const UserType = {
  SYSTEM: 'system',
  CUSTOMER: 'customer',
  SME: 'sme',
  FINANCIAL_INSTITUTION: 'financial_institution'
};

const AccountType = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  CONSULTANT: 'CONSULTANT',
  OTHER: 'OTHER',
  // Customer Account Types
  FREEMIUM: 'freemium',
  STANDARD: 'standard',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
  BUSINESS: 'business'
};

const CustomerType = {
  SME: 'sme',
  FINANCIAL: 'financial'
};

const CustomerStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
  NEEDS_VALIDATION: 'needs_validation',
  VALIDATION_IN_PROGRESS: 'validation_in_progress'
};

const IdType = {
  NATIONAL_ID: 'national_id',
  PASSPORT: 'passport',
  DRIVERS_LICENSE: 'drivers_license',
  OTHER: 'other'
};

const IdStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

// Generate timestamps within the last year
function randomPastTimestamp(maxDaysAgo = 365) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.floor(Math.random() * maxDaysAgo * 24 * 60 * 60 * 1000));
  return pastDate.toISOString();
}

// Generate a mock customer of SME type
function generateSmeMockCustomer(id) {
  const customerId = id || uuidv4();
  const createdAt = randomPastTimestamp(200);
  
  return {
    id: customerId,
    name: `SME Company ${customerId.substring(0, 8)}`,
    logo: `https://example.com/logos/sme_${customerId.substring(0, 8)}.png`,
    description: `Description de la PME ${customerId.substring(0, 8)}. Entreprise spécialisée dans les services aux entreprises.`,
    type: CustomerType.SME,
    email: `contact@sme-${customerId.substring(0, 8)}.com`,
    phone: '+243976543210',
    address: {
      street: '123 Avenue des Entreprises',
      commune: 'Gombe',
      city: 'Kinshasa',
      province: 'Kinshasa',
      country: 'République Démocratique du Congo'
    },
    locations: [
      {
        id: uuidv4(),
        name: 'Siège Social',
        type: 'headquarters',
        address: '123 Avenue des Entreprises, Gombe, Kinshasa',
        coordinates: {
          lat: -4.325,
          lng: 15.322
        }
      }
    ],
    contacts: {
      email: `contact@sme-${customerId.substring(0, 8)}.com`,
      phone: '+243976543210',
      altPhone: '+243976543211'
    },
    status: CustomerStatus.ACTIVE,
    website: `https://www.sme-${customerId.substring(0, 8)}.com`,
    facebookPage: `https://facebook.com/sme-${customerId.substring(0, 8)}`,
    linkedinPage: `https://linkedin.com/company/sme-${customerId.substring(0, 8)}`,
    billingContactName: 'Jean Responsable',
    billingContactEmail: `billing@sme-${customerId.substring(0, 8)}.com`,
    tokenAllocation: 500,
    accountType: AccountType.STANDARD,
    ownerId: uuidv4(),
    ownerEmail: `owner@sme-${customerId.substring(0, 8)}.com`,
    owner: {
      id: uuidv4(),
      name: 'Pierre Propriétaire',
      gender: 'M',
      email: `owner@sme-${customerId.substring(0, 8)}.com`,
      phone: '+243976543212',
      hasOtherJob: false,
      linkedin: `https://linkedin.com/in/pierre-${customerId.substring(0, 8)}`
    },
    associates: [
      {
        id: uuidv4(),
        name: 'Marie Associée',
        gender: 'F',
        role: 'Directeur Commercial',
        shares: 30,
        email: `associate1@sme-${customerId.substring(0, 8)}.com`,
        phone: '+243976543213'
      },
      {
        id: uuidv4(),
        name: 'Paul Partenaire',
        gender: 'M',
        role: 'Directeur Technique',
        shares: 20,
        email: `associate2@sme-${customerId.substring(0, 8)}.com`,
        phone: '+243976543214'
      }
    ],
    validatedAt: randomPastTimestamp(180),
    validatedBy: uuidv4(),
    subscription: {
      plan: {
        name: 'Standard'
      },
      status: 'active',
      currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
    },
    preferences: {
      language: 'fr',
      notifications: {
        email: true,
        sms: false
      }
    },
    createdBy: uuidv4(),
    createdAt: createdAt,
    updatedAt: randomPastTimestamp(50)
  };
}

// Generate a mock customer of Financial Institution type
function generateFinancialMockCustomer(id) {
  const customerId = id || uuidv4();
  const createdAt = randomPastTimestamp(250);
  
  return {
    id: customerId,
    name: `Institution Financière ${customerId.substring(0, 8)}`,
    logo: `https://example.com/logos/financial_${customerId.substring(0, 8)}.png`,
    description: `Description de l'institution financière ${customerId.substring(0, 8)}. Banque offrant des services financiers aux particuliers et entreprises.`,
    type: CustomerType.FINANCIAL,
    email: `contact@finance-${customerId.substring(0, 8)}.com`,
    phone: '+243987654321',
    address: {
      street: '456 Boulevard des Finances',
      commune: 'Gombe',
      city: 'Kinshasa',
      province: 'Kinshasa',
      country: 'République Démocratique du Congo'
    },
    locations: [
      {
        id: uuidv4(),
        name: 'Siège Principal',
        type: 'headquarters',
        address: '456 Boulevard des Finances, Gombe, Kinshasa',
        coordinates: {
          lat: -4.324,
          lng: 15.324
        }
      },
      {
        id: uuidv4(),
        name: 'Agence Limete',
        type: 'branch',
        address: '78 Avenue du Commerce, Limete, Kinshasa',
        coordinates: {
          lat: -4.335,
          lng: 15.345
        }
      }
    ],
    contacts: {
      email: `contact@finance-${customerId.substring(0, 8)}.com`,
      phone: '+243987654321',
      altPhone: '+243987654322'
    },
    status: CustomerStatus.ACTIVE,
    website: `https://www.finance-${customerId.substring(0, 8)}.com`,
    facebookPage: `https://facebook.com/finance-${customerId.substring(0, 8)}`,
    linkedinPage: `https://linkedin.com/company/finance-${customerId.substring(0, 8)}`,
    billingContactName: 'Robert Comptable',
    billingContactEmail: `billing@finance-${customerId.substring(0, 8)}.com`,
    tokenAllocation: 2000,
    accountType: AccountType.PREMIUM,
    ownerId: uuidv4(),
    ownerEmail: `director@finance-${customerId.substring(0, 8)}.com`,
    owner: {
      id: uuidv4(),
      name: 'Jacques Directeur',
      gender: 'M',
      email: `director@finance-${customerId.substring(0, 8)}.com`,
      phone: '+243987654323',
      hasOtherJob: false,
      linkedin: `https://linkedin.com/in/jacques-${customerId.substring(0, 8)}`
    },
    associates: [
      {
        id: uuidv4(),
        name: 'Céline Vice-Directrice',
        gender: 'F',
        role: 'Vice-Directrice',
        shares: 25,
        email: `vp@finance-${customerId.substring(0, 8)}.com`,
        phone: '+243987654324'
      }
    ],
    validatedAt: randomPastTimestamp(200),
    validatedBy: uuidv4(),
    subscription: {
      plan: {
        name: 'Premium'
      },
      status: 'active',
      currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString()
    },
    preferences: {
      language: 'fr',
      notifications: {
        email: true,
        sms: true
      }
    },
    createdBy: uuidv4(),
    createdAt: createdAt,
    updatedAt: randomPastTimestamp(30)
  };
}

// Generate mock users associated with a customer
function generateMockUsers(customerId, customerType, numberOfUsers = 3) {
  const users = [];
  const ownerCreatedAt = randomPastTimestamp(190);
  
  // Add owner/admin user
  users.push({
    id: uuidv4(),
    name: `Admin ${customerId.substring(0, 8)}`,
    email: `admin@customer-${customerId.substring(0, 8)}.com`,
    emailVerified: true,
    role: UserRole.CUSTOMER_ADMIN,
    userType: customerType === CustomerType.SME ? UserType.SME : UserType.FINANCIAL_INSTITUTION,
    customerId: customerId,
    isCompanyOwner: true,
    accountType: AccountType.OWNER,
    status: UserStatus.ACTIVE,
    picture: `https://example.com/avatars/admin_${customerId.substring(0, 8)}.jpg`,
    permissions: ['read:all', 'write:all', 'delete:all'],
    department: 'Direction',
    phone: '+243976543220',
    phoneVerified: true,
    position: 'Directeur Général',
    tokenBalance: 100,
    tokenTotal: 250,
    settings: {
      notifications: {
        email: true,
        sms: true,
        push: true
      },
      security: {
        twoFactorEnabled: true,
        twoFactorMethod: 'app',
        lastPasswordChange: randomPastTimestamp(60)
      },
      preferences: {
        theme: 'light',
        language: 'fr',
        currency: 'CDF'
      }
    },
    lastLogin: randomPastTimestamp(1),
    createdAt: ownerCreatedAt,
    updatedAt: randomPastTimestamp(5)
  });
  
  // Generate regular users
  for (let i = 0; i < numberOfUsers - 1; i++) {
    const userCreatedAt = randomPastTimestamp(180);
    
    users.push({
      id: uuidv4(),
      name: `Utilisateur ${i + 1} ${customerId.substring(0, 8)}`,
      email: `user${i + 1}@customer-${customerId.substring(0, 8)}.com`,
      emailVerified: i === 0 ? true : Math.random() > 0.3,
      role: UserRole.CUSTOMER_USER,
      userType: customerType === CustomerType.SME ? UserType.SME : UserType.FINANCIAL_INSTITUTION,
      customerId: customerId,
      isCompanyOwner: false,
      accountType: i === 0 ? AccountType.MANAGER : AccountType.EMPLOYEE,
      status: Math.random() > 0.1 ? UserStatus.ACTIVE : UserStatus.PENDING,
      picture: Math.random() > 0.5 ? `https://example.com/avatars/user${i + 1}_${customerId.substring(0, 8)}.jpg` : null,
      permissions: ['read:basic', 'write:basic'],
      department: i === 0 ? 'Finance' : 'Operations',
      phone: `+2439765432${30 + i}`,
      phoneVerified: Math.random() > 0.5,
      position: i === 0 ? 'Responsable Finance' : 'Agent',
      tokenBalance: Math.floor(Math.random() * 50),
      tokenTotal: Math.floor(Math.random() * 100) + 50,
      settings: {
        notifications: {
          email: true,
          sms: Math.random() > 0.5,
          push: Math.random() > 0.5
        },
        security: {
          twoFactorEnabled: Math.random() > 0.7,
          twoFactorMethod: 'sms',
          lastPasswordChange: randomPastTimestamp(90)
        },
        preferences: {
          theme: Math.random() > 0.5 ? 'light' : 'dark',
          language: 'fr',
          currency: 'CDF'
        }
      },
      lastLogin: Math.random() > 0.2 ? randomPastTimestamp(5) : null,
      createdAt: userCreatedAt,
      updatedAt: randomPastTimestamp(10)
    });
  }
  
  return users;
}

// Generate token usages for a customer
function generateTokenUsages(customerId, userId, numberOfUsages = 10) {
  const usages = [];
  
  for (let i = 0; i < numberOfUsages; i++) {
    const usedAt = randomPastTimestamp(30);
    
    usages.push({
      id: uuidv4(),
      customerId: customerId,
      userId: userId,
      amount: Math.floor(Math.random() * 10) + 1,
      service: ['adha-ai', 'analytics', 'document-processing'][Math.floor(Math.random() * 3)],
      feature: ['sentiment-analysis', 'risk-assessment', 'document-summary', 'language-detection'][Math.floor(Math.random() * 4)],
      usedAt: usedAt,
      createdAt: usedAt,
      updatedAt: usedAt
    });
  }
  
  return usages;
}

// Generate mock data
const mockCustomers = [
  generateSmeMockCustomer(),
  generateSmeMockCustomer(),
  generateFinancialMockCustomer(),
  generateFinancialMockCustomer()
];

// Generate users for each customer
const mockUsers = [];
mockCustomers.forEach(customer => {
  const customerUsers = generateMockUsers(customer.id, customer.type, Math.floor(Math.random() * 3) + 2);
  mockUsers.push(...customerUsers);
});

// Generate token usages for some users
const mockTokenUsages = [];
mockUsers.filter(user => user.lastLogin).forEach(user => {
  const usages = generateTokenUsages(user.customerId, user.id, Math.floor(Math.random() * 15) + 5);
  mockTokenUsages.push(...usages);
});

module.exports = {
  customers: mockCustomers,
  users: mockUsers,
  tokenUsages: mockTokenUsages,
  // Export helper functions for use in other mock files if needed
  helpers: {
    generateSmeMockCustomer,
    generateFinancialMockCustomer,
    generateMockUsers,
    generateTokenUsages,
    randomPastTimestamp
  }
};
