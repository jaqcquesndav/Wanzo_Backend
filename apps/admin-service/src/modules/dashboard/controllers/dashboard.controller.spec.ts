import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../modules/auth/guards/roles.guard';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getMainDashboardData: jest.fn(),
    getKpis: jest.fn(),
    getFinancialSummary: jest.fn(),
    getRecentActivities: jest.fn(),
    getUserStatistics: jest.fn(),
    getSystemHealth: jest.fn(),
    getNotifications: jest.fn(),
    getWidgetData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
