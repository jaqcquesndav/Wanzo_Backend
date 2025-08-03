import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InstitutionModule } from '../../../src/modules/institution/institution.module';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { Institution, InstitutionType, RegulatoryStatus, LicenseType } from '../../../src/modules/institution/entities/institution.entity';
import { CreateInstitutionDto, UpdateInstitutionDto } from '../../../src/modules/institution/dtos/institution.dto';

describe('Institutions Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;

  const testInstitutionData: CreateInstitutionDto = {
    name: 'Test Financial Institution',
    type: InstitutionType.BANK,
    licenseNumber: 'BNK-2025-001',
    licenseType: LicenseType.COMMERCIAL_BANKING,
    address: '123 Financial District, Dakar, Senegal',
    phone: '+221771234567',
    email: 'contact@testbank.sn',
    website: 'https://www.testbank.sn',
    legalRepresentative: 'John Doe',
    taxId: 'TAX-123456789',
    regulatoryStatus: RegulatoryStatus.REGULATED,
    documents: [],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../../../src/**/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true,
        }),
        InstitutionModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();

    // Mock authentication token for tests
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up institutions before each test
    await dataSource.getRepository(Institution).clear();
  });

  describe('/institution (POST)', () => {
    it('should create a new institution', async () => {
      const response = await request(app.getHttpServer())
        .post('/institution')
        .set('Authorization', authToken)
        .send(testInstitutionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: testInstitutionData.name,
        type: testInstitutionData.type,
        licenseNumber: testInstitutionData.licenseNumber,
        licenseType: testInstitutionData.licenseType,
        address: testInstitutionData.address,
        phone: testInstitutionData.phone,
        email: testInstitutionData.email,
        website: testInstitutionData.website,
        legalRepresentative: testInstitutionData.legalRepresentative,
        taxId: testInstitutionData.taxId,
        regulatoryStatus: testInstitutionData.regulatoryStatus,
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 400 for invalid institution data', async () => {
      const invalidData = {
        name: '',
        type: 'INVALID_TYPE',
        email: 'invalid-email',
        phone: '123',
      };

      await request(app.getHttpServer())
        .post('/institution')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('/institution (GET)', () => {
    beforeEach(async () => {
      const institutionRepo = dataSource.getRepository(Institution);
      
      await institutionRepo.save({
        kiotaId: 'test-kiota-1',
        name: 'First Test Bank',
        type: InstitutionType.BANK,
        license_number: 'BNK-2025-001',
        license_type: LicenseType.COMMERCIAL_BANKING,
        email: 'first@testbank.sn',
        address: '123 Test Street',
        phone: '+221771234567',
        website: 'https://first.test.sn',
        legal_representative: 'John First',
        tax_id: 'TAX-001',
        regulatory_status: RegulatoryStatus.REGULATED,
        metadata: {},
        active: true,
      });

      await institutionRepo.save({
        kiotaId: 'test-kiota-2',
        name: 'Second Test Bank',
        type: InstitutionType.MICROFINANCE,
        license_number: 'MFI-2025-002',
        license_type: LicenseType.MICROFINANCE,
        email: 'second@testbank.sn',
        address: '456 Test Street',
        phone: '+221771234568',
        website: 'https://second.test.sn',
        legal_representative: 'Jane Second',
        tax_id: 'TAX-002',
        regulatory_status: RegulatoryStatus.PENDING,
        metadata: {},
        active: true,
      });

      await institutionRepo.save({
        kiotaId: 'test-kiota-3',
        name: 'Third Test Bank',
        type: InstitutionType.FINTECH,
        license_number: 'FINTECH-2025-003',
        license_type: LicenseType.FINANCIAL_SERVICES,
        email: 'third@testbank.sn',
        address: '789 Test Street',
        phone: '+221771234569',
        website: 'https://third.test.sn',
        legal_representative: 'Bob Third',
        tax_id: 'TAX-003',
        regulatory_status: RegulatoryStatus.APPROVED,
        metadata: {},
        active: true,
      });
    });

    it('should return all institutions', async () => {
      const response = await request(app.getHttpServer())
        .get('/institution')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    it('should filter institutions by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/institution')
        .query({ type: InstitutionType.MICROFINANCE })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe(InstitutionType.MICROFINANCE);
    });

    it('should filter institutions by regulatory status', async () => {
      const response = await request(app.getHttpServer())
        .get('/institution')
        .query({ regulatory_status: RegulatoryStatus.PENDING })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].regulatory_status).toBe(RegulatoryStatus.PENDING);
    });
  });

  describe('/institution/:id (GET)', () => {
    let institutionId: string;

    beforeEach(async () => {
      const institutionRepo = dataSource.getRepository(Institution);
      const institution = await institutionRepo.save({
        kiotaId: 'test-kiota-specific',
        name: 'Specific Test Institution',
        type: InstitutionType.BANK,
        license_number: 'SPEC-2025-001',
        license_type: LicenseType.COMMERCIAL_BANKING,
        email: 'specific@testbank.sn',
        address: '123 Specific Street',
        phone: '+221771234570',
        website: 'https://specific.test.sn',
        legal_representative: 'John Specific',
        tax_id: 'TAX-SPEC',
        regulatory_status: RegulatoryStatus.REGULATED,
        metadata: {},
        active: true,
      });
      institutionId = institution.id;
    });

    it('should return a specific institution', async () => {
      const response = await request(app.getHttpServer())
        .get(`/institution/${institutionId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: institutionId,
        name: 'Specific Test Institution',
        type: InstitutionType.BANK,
      });
    });

    it('should return 404 for non-existent institution', async () => {
      await request(app.getHttpServer())
        .get('/institution/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('/institution/:id (PUT)', () => {
    let institutionId: string;

    beforeEach(async () => {
      const institutionRepo = dataSource.getRepository(Institution);
      const institution = await institutionRepo.save({
        kiotaId: 'test-kiota-update',
        name: 'Institution to Update',
        type: InstitutionType.BANK,
        license_number: 'UPDATE-2025-001',
        license_type: LicenseType.COMMERCIAL_BANKING,
        email: 'update@testbank.sn',
        address: '123 Update Street',
        phone: '+221771234571',
        website: 'https://update.test.sn',
        legal_representative: 'John Update',
        tax_id: 'TAX-UPDATE',
        regulatory_status: RegulatoryStatus.REGULATED,
        metadata: {},
        active: true,
      });
      institutionId = institution.id;
    });

    it('should update an institution', async () => {
      const updateData: UpdateInstitutionDto = {
        name: 'Updated Institution Name',
        address: '456 New Financial District, Dakar, Senegal',
        phone: '+221779876543',
        regulatoryStatus: RegulatoryStatus.PENDING,
      };

      const response = await request(app.getHttpServer())
        .put(`/institution/${institutionId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: institutionId,
        name: updateData.name,
        address: updateData.address,
        phone: updateData.phone,
      });
    });

    it('should return 404 for non-existent institution', async () => {
      const updateData = { name: 'Updated Name' };

      await request(app.getHttpServer())
        .put('/institution/non-existent-id')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(404);
    });
  });

  describe('/institution/:id/regulatory-status (PUT)', () => {
    let institutionId: string;

    beforeEach(async () => {
      const institutionRepo = dataSource.getRepository(Institution);
      const institution = await institutionRepo.save({
        kiotaId: 'test-kiota-status',
        name: 'Institution for Status Update',
        type: InstitutionType.BANK,
        license_number: 'STATUS-2025-001',
        license_type: LicenseType.COMMERCIAL_BANKING,
        email: 'status@testbank.sn',
        address: '123 Status Street',
        phone: '+221771234572',
        website: 'https://status.test.sn',
        legal_representative: 'John Status',
        tax_id: 'TAX-STATUS',
        regulatory_status: RegulatoryStatus.REGULATED,
        metadata: {},
        active: true,
      });
      institutionId = institution.id;
    });

    it('should update regulatory status', async () => {
      const statusData = {
        regulatoryStatus: RegulatoryStatus.PENDING,
        reason: 'Compliance violations detected',
        notes: 'Temporary suspension pending investigation',
      };

      const response = await request(app.getHttpServer())
        .put(`/institution/${institutionId}/regulatory-status`)
        .set('Authorization', authToken)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.regulatoryStatus).toBe(RegulatoryStatus.PENDING);
    });

    it('should return 404 for non-existent institution', async () => {
      const statusData = {
        regulatoryStatus: RegulatoryStatus.PENDING,
      };

      await request(app.getHttpServer())
        .put('/institution/non-existent-id/regulatory-status')
        .set('Authorization', authToken)
        .send(statusData)
        .expect(404);
    });
  });

  describe('/institution/:id (DELETE)', () => {
    let institutionId: string;

    beforeEach(async () => {
      const institutionRepo = dataSource.getRepository(Institution);
      const institution = await institutionRepo.save({
        kiotaId: 'test-kiota-delete',
        name: 'Institution to Delete',
        type: InstitutionType.BANK,
        license_number: 'DELETE-2025-001',
        license_type: LicenseType.COMMERCIAL_BANKING,
        email: 'delete@testbank.sn',
        address: '123 Delete Street',
        phone: '+221771234573',
        website: 'https://delete.test.sn',
        legal_representative: 'John Delete',
        tax_id: 'TAX-DELETE',
        regulatory_status: RegulatoryStatus.REJECTED,
        metadata: {},
        active: false,
      });
      institutionId = institution.id;
    });

    it('should delete an inactive institution', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/institution/${institutionId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Institution deleted successfully');

      // Verify institution is deleted
      const institutionRepo = dataSource.getRepository(Institution);
      const institution = await institutionRepo.findOne({ where: { id: institutionId } });
      expect(institution).toBeNull();
    });

    it('should return 404 for non-existent institution', async () => {
      await request(app.getHttpServer())
        .delete('/institution/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);
    });
  });
});
