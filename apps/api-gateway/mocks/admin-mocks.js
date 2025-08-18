// Mock data helpers
const adminMocks = {
  validateToken: (req, res) => {
    console.log('MOCK: Returning validate token response');
    res.json({
      valid: true,
      user: {
        id: 'mock-user-id',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['read:all', 'write:all', 'admin:all']
      }
    });
  },

  userProfile: (req, res) => {
    console.log('MOCK: Returning user profile response');
    res.json({
      id: 'mock-user-id',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-08-01T00:00:00.000Z',
      permissions: ['read:all', 'write:all', 'admin:all']
    });
  },

  customers: (req, res) => {
    console.log('MOCK: Returning customers list response');
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    res.json({
      items: Array.from({ length: limit }).map((_, i) => ({
        id: `customer-${(page-1)*limit + i + 1}`,
        firstName: `FirstName-${(page-1)*limit + i + 1}`,
        lastName: `LastName-${(page-1)*limit + i + 1}`,
        email: `customer${(page-1)*limit + i + 1}@example.com`,
        status: ['active', 'pending', 'inactive'][Math.floor(Math.random() * 3)],
        createdAt: '2025-08-01T00:00:00.000Z'
      })),
      totalCount: 100,
      page,
      totalPages: Math.ceil(100 / limit)
    });
  },

  users: (req, res) => {
    console.log('MOCK: Returning users list response');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    res.json({
      items: [
        {
          id: 'user-1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'user-2',
          firstName: 'Manager',
          lastName: 'User',
          email: 'manager@example.com',
          role: 'manager',
          status: 'active',
          createdAt: '2025-01-02T00:00:00.000Z'
        },
        {
          id: 'user-3',
          firstName: 'Staff',
          lastName: 'User',
          email: 'staff@example.com',
          role: 'staff',
          status: 'active',
          createdAt: '2025-01-03T00:00:00.000Z'
        }
      ],
      totalCount: 3,
      page,
      totalPages: Math.ceil(3 / limit)
    });
  },

  financeSummary: (req, res) => {
    console.log('MOCK: Returning finance summary response');
    res.json({
      totalRevenue: 1250000,
      monthlyRevenue: 125000,
      activeSubscriptions: 500,
      revenueByMonth: Array.from({ length: 12 }).map((_, i) => ({
        month: new Date(2025, i, 1).toISOString().substring(0, 7),
        amount: 100000 + Math.floor(Math.random() * 50000)
      })),
      subscriptionsByPlan: [
        { plan: 'Basic', count: 200, revenue: 400000 },
        { plan: 'Professional', count: 200, revenue: 600000 },
        { plan: 'Enterprise', count: 100, revenue: 250000 }
      ]
    });
  },

  tokenPackages: (req, res) => {
    console.log('MOCK: Returning token packages response');
    res.json([
      {
        id: 'package-1',
        name: 'Starter Pack',
        description: 'Basic token package for new users',
        tokenAmount: 1000,
        price: 99.99,
        active: true
      },
      {
        id: 'package-2',
        name: 'Business Pack',
        description: 'Medium token package for businesses',
        tokenAmount: 5000,
        price: 399.99,
        active: true
      },
      {
        id: 'package-3',
        name: 'Enterprise Pack',
        description: 'Large token package for enterprises',
        tokenAmount: 20000,
        price: 1499.99,
        active: true
      }
    ]);
  },

  dashboard: (req, res) => {
    console.log('MOCK: Returning dashboard data response');
    res.json({
      userStats: {
        total: 1000,
        active: 800,
        newThisMonth: 50
      },
      subscriptionStats: {
        total: 500,
        active: 450,
        newThisMonth: 30
      },
      revenueStats: {
        totalRevenue: 1250000,
        monthlyRevenue: 125000,
        growthRate: 5.2
      },
      tokenStats: {
        totalIssued: 5000000,
        totalUsed: 3200000,
        usageByService: [
          { service: 'Chat', count: 2000000 },
          { service: 'Completion', count: 800000 },
          { service: 'Image', count: 400000 }
        ]
      },
      recentActivity: Array.from({ length: 5 }).map((_, i) => ({
        id: `activity-${i+1}`,
        type: ['login', 'subscription', 'payment', 'token-purchase'][Math.floor(Math.random() * 4)],
        user: `user-${i+1}`,
        details: `Activity details ${i+1}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString()
      }))
    });
  },

  subscriptions: (req, res) => {
    console.log('MOCK: Returning subscriptions list response');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    res.json({
      items: Array.from({ length: limit }).map((_, i) => ({
        id: `subscription-${(page-1)*limit + i + 1}`,
        customerId: `customer-${(page-1)*limit + i + 1}`,
        customerName: `FirstName-${(page-1)*limit + i + 1} LastName-${(page-1)*limit + i + 1}`,
        plan: ['Basic', 'Professional', 'Enterprise'][Math.floor(Math.random() * 3)],
        status: ['active', 'canceled', 'expired', 'pending'][Math.floor(Math.random() * 4)],
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2026-01-01T00:00:00.000Z',
        amount: [99.99, 199.99, 499.99][Math.floor(Math.random() * 3)],
        billingCycle: 'monthly'
      })),
      totalCount: 100,
      page,
      totalPages: Math.ceil(100 / limit)
    });
  },

  payments: (req, res) => {
    console.log('MOCK: Returning payments list response');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    res.json({
      items: Array.from({ length: limit }).map((_, i) => ({
        id: `payment-${(page-1)*limit + i + 1}`,
        customerId: `customer-${(page-1)*limit + i + 1}`,
        customerName: `FirstName-${(page-1)*limit + i + 1} LastName-${(page-1)*limit + i + 1}`,
        amount: [99.99, 199.99, 499.99][Math.floor(Math.random() * 3)],
        status: ['completed', 'pending', 'failed', 'refunded'][Math.floor(Math.random() * 4)],
        method: ['credit_card', 'bank_transfer', 'paypal'][Math.floor(Math.random() * 3)],
        date: new Date(Date.now() - i * 86400000).toISOString(),
        invoiceId: `invoice-${(page-1)*limit + i + 1}`
      })),
      totalCount: 100,
      page,
      totalPages: Math.ceil(100 / limit)
    });
  }
};

module.exports = adminMocks;
