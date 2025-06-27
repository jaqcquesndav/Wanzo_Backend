# fix-analytics-service.ps1

Write-Host "Fixing Analytics Service TypeScript errors..." -ForegroundColor Green

# Install missing dependencies
Write-Host "Installing missing dependencies..." -ForegroundColor Green
Set-Location -Path "apps/analytics-service"
npm install --save @nestjs/axios axios --legacy-peer-deps
Set-Location -Path "../.."

# Create webpack-hmr.config.js for Docker builds
$webpackConfig = @"
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = function(options) {
  return {
    ...options,
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.WatchIgnorePlugin([/\.js$/, /\.d\.ts$/]),
    ],
  };
};
"@

$webpackPath = "apps/analytics-service/webpack-hmr.config.js"
Write-Host "Creating webpack config: $webpackPath" -ForegroundColor Yellow
Set-Content -Path $webpackPath -Value $webpackConfig

# Update package.json to add build:docker script
Write-Host "Updating package.json to add build:docker script..." -ForegroundColor Green
$packageJsonPath = "apps/analytics-service/package.json"
$packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json

# Check if build:docker script already exists
if (-not ($packageJson.scripts.PSObject.Properties.Name -contains "build:docker")) {
    # Add the build:docker script
    $packageJson.scripts | Add-Member -Name "build:docker" -Value "nest build --config ./tsconfig.build.json --webpack --webpackConfigPath webpack-hmr.config.js" -MemberType NoteProperty
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath
}

# Create tsconfig.build.json for skipping type checks
$tsconfigBuild = @"
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
"@

$tsconfigBuildPath = "apps/analytics-service/tsconfig.build.json"
Write-Host "Creating tsconfig.build.json: $tsconfigBuildPath" -ForegroundColor Yellow
Set-Content -Path $tsconfigBuildPath -Value $tsconfigBuild

# Fix the auth.service.ts file to handle unknown type
$authServicePath = "apps/analytics-service/src/modules/auth/services/auth.service.ts"
if (Test-Path $authServicePath) {
    Write-Host "Fixing auth.service.ts to handle unknown type..." -ForegroundColor Yellow
    $authService = Get-Content -Path $authServicePath -Raw
    
    # Fix the response.data usage with proper type assertion
    $fixedAuthService = $authService -replace "const user = response.data;", "const user = (response as any).data;"
    
    Set-Content -Path $authServicePath -Value $fixedAuthService
}

# Create directories for the data collection module
$dataCollectionDir = "apps/analytics-service/src/modules/data-collection"
if (-not (Test-Path $dataCollectionDir)) {
    Write-Host "Creating data collection directory..." -ForegroundColor Yellow
    New-Item -Path $dataCollectionDir -ItemType Directory -Force | Out-Null
}

# Copy template data collection service file
$dataCollectionServiceContent = @"
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Service responsible for collecting data from other microservices
 * to support analytics operations.
 */
@Injectable()
export class DataCollectionService {
  private readonly logger = new Logger(DataCollectionService.name);
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Collects portfolio data from the portfolio-institution-service
   */
  async getInstitutionPortfolioData(institutionId: string, period?: string) {
    try {
      const serviceUrl = this.configService.get('PORTFOLIO_INSTITUTION_SERVICE_URL');
      const response = await firstValueFrom(
        this.httpService.get(`\${serviceUrl}/api/portfolios/\${institutionId}`, {
          params: period ? { period } : {}
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch institution portfolio data: \${error.message}`);
      throw error;
    }
  }

  /**
   * Collects SME data from the portfolio-sme-service
   */
  async getSMEPortfolioData(smeId: string, period?: string) {
    try {
      const serviceUrl = this.configService.get('PORTFOLIO_SME_SERVICE_URL');
      const response = await firstValueFrom(
        this.httpService.get(`\${serviceUrl}/api/portfolios/\${smeId}`, {
          params: period ? { period } : {}
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch SME portfolio data: \${error.message}`);
      throw error;
    }
  }

  /**
   * Collects accounting data from the accounting-service
   */
  async getAccountingData(companyId: string, fiscalYear?: string) {
    try {
      const serviceUrl = this.configService.get('ACCOUNTING_SERVICE_URL');
      const response = await firstValueFrom(
        this.httpService.get(`\${serviceUrl}/api/dashboard`, {
          params: {
            companyId,
            ...(fiscalYear && { fiscalYearId: fiscalYear })
          }
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch accounting data: \${error.message}`);
      throw error;
    }
  }

  /**
   * Aggregates data from multiple services for comprehensive analysis
   */
  async getAggregatedData(institutionId: string, period?: string) {
    try {
      const [portfolioData, accountingData] = await Promise.all([
        this.getInstitutionPortfolioData(institutionId, period),
        this.getAccountingData(institutionId)
      ]);

      return {
        portfolioData,
        accountingData,
        timestamp: new Date().toISOString(),
        source: 'aggregated'
      };
    } catch (error) {
      this.logger.error(`Failed to aggregate data: \${error.message}`);
      throw error;
    }
  }
}
"@

$dataCollectionServicePath = "apps/analytics-service/src/modules/data-collection/data-collection.service.ts"
Write-Host "Creating data collection service: $dataCollectionServicePath" -ForegroundColor Yellow
Set-Content -Path $dataCollectionServicePath -Value $dataCollectionServiceContent

# Create data collection module file
$dataCollectionModuleContent = @"
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DataCollectionService } from './data-collection.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [DataCollectionService],
  exports: [DataCollectionService],
})
export class DataCollectionModule {}
"@

$dataCollectionModulePath = "apps/analytics-service/src/modules/data-collection/data-collection.module.ts"
Write-Host "Creating data collection module: $dataCollectionModulePath" -ForegroundColor Yellow
Set-Content -Path $dataCollectionModulePath -Value $dataCollectionModuleContent

Write-Host "Analytics Service TypeScript error fixes completed!" -ForegroundColor Green
