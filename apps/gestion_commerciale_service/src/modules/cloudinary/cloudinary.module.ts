import { Module } from '@nestjs/common';
import { CloudinaryModule as BaseCloudinaryModule } from 'nestjs-cloudinary';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BaseCloudinaryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Get Cloudinary configuration from environment variables
        const cloudName = configService.get<string>('CLOUDINARY_CLOUD_NAME');
        const apiKey = configService.get<string>('CLOUDINARY_API_KEY');
        const apiSecret = configService.get<string>('CLOUDINARY_API_SECRET');
        
        // Check if all required config values are present
        if (!cloudName || !apiKey || !apiSecret) {
          console.warn('Cloudinary configuration is incomplete. Document upload functionality will not work properly.');
          // Return empty config - the module will not be initialized correctly
          // but will not throw an error during startup
          return {};
        }
        
        return {
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [BaseCloudinaryModule],
})
export class CloudinaryModule {}
