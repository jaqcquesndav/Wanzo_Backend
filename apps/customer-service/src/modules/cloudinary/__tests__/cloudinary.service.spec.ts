import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService, MulterFile } from '../cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import { jest } from '@jest/globals';

// Define types for mocking
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

interface CloudinaryResponse {
  result: string;
  [key: string]: any;
}

type UploadCallback = (error: Error | null, result: CloudinaryUploadResult | null) => void;

// Mock types for uploadStream
interface MockUploadStream {
  write: any;
  end: any;
  on: any;
  once: any;
  emit: any;
  pipe: any;
}

// Mock Cloudinary
jest.mock('cloudinary', () => {
  const mockUploadStream = jest.fn();
  const mockDestroy = jest.fn();
  
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload_stream: mockUploadStream,
        destroy: mockDestroy,
      },
    },
  };
});

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: any) => {
              if (key === 'CLOUDINARY_CLOUD_NAME') return 'test-cloud';
              if (key === 'CLOUDINARY_API_KEY') return 'test-api-key';
              if (key === 'CLOUDINARY_API_SECRET') return 'test-api-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should configure cloudinary on initialization', () => {
    // Cloudinary.config is called in constructor which is already done when service is created
    // Let's manually call it again to verify
    service['configureCloudinary']();
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
    });
  });

  describe('uploadImage', () => {
    it('should upload an image to cloudinary', async () => {
      const mockFile: MulterFile = {
        buffer: Buffer.from('test image data'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      };

      const mockUploadResult: CloudinaryUploadResult = {
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/test.jpg',
        public_id: 'test-id',
      };

      // Create a mock writableStream
      const mockWritableStream: MockUploadStream = {
        write: jest.fn().mockImplementation(() => true),
        end: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
        pipe: jest.fn()
      };

      // Mock the upload_stream functionality
      (cloudinary.uploader.upload_stream as any).mockImplementation(
        (_options: any, callback: UploadCallback) => {
          // Schedule callback to be called asynchronously
          setTimeout(() => callback(null, mockUploadResult), 0);
          return mockWritableStream;
        }
      );

      const result = await service.uploadImage(mockFile, 'test-folder');

      expect(result).toEqual({
        url: mockUploadResult.secure_url,
        publicId: mockUploadResult.public_id,
      });
    });

    it('should throw an error if upload fails', async () => {
      const mockFile: MulterFile = {
        buffer: Buffer.from('test image data'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      };

      const mockError = new Error('Upload failed');

      // Create a mock writableStream
      const mockWritableStream: MockUploadStream = {
        write: jest.fn().mockImplementation(() => true),
        end: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
        pipe: jest.fn()
      };

      // Mock the upload_stream to fail
      (cloudinary.uploader.upload_stream as any).mockImplementation(
        (_options: any, callback: UploadCallback) => {
          // Schedule callback to be called asynchronously
          setTimeout(() => callback(mockError, null), 0);
          return mockWritableStream;
        }
      );

      await expect(service.uploadImage(mockFile, 'test-folder')).rejects.toThrow('Upload failed');
    });
  });

  describe('deleteImage', () => {
    it('should delete an image from cloudinary', async () => {
      const publicId = 'test-id';
      
      // Setup mock with any return value
      (cloudinary.uploader.destroy as any).mockResolvedValue({ result: 'ok' });

      await service.deleteImage(publicId);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicId);
    });

    it('should throw an error if delete fails', async () => {
      const publicId = 'test-id';
      const mockError = new Error('Delete failed');

      // Setup mock to reject with an error
      (cloudinary.uploader.destroy as any).mockRejectedValue(mockError);

      await expect(service.deleteImage(publicId)).rejects.toThrow('Delete failed');
    });
  });
});
