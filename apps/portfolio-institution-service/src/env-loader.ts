import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// This module needs to be imported before any other module that uses environment variables
console.log('Loading environment variables...');

// Function to load environment variables from a file
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    try {
      const envConfig = dotenv.parse(fs.readFileSync(filePath));
      for (const key in envConfig) {
        if (!process.env[key]) {
          process.env[key] = envConfig[key];
        }
      }
      console.log(`Environment variables loaded from: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error loading environment file ${filePath}:`, error);
      return false;
    }
  } else {
    console.log(`Environment file not found: ${filePath}`);
    return false;
  }
}

// Set default encryption key in case it's not in any env file
// This is a fallback for TypeORM entity initialization
if (!process.env.ENCRYPTION_SECRET_KEY) {
  process.env.ENCRYPTION_SECRET_KEY = 'wanzo-backend-2025-ultra-secure-encryption-key-256-bits-change-this-in-production';
}

// Load local .env file first
const envPath = path.resolve(__dirname, '../.env');
loadEnvFile(envPath);

// Then try to load the global security environment file
const securityEnvPath = path.resolve(__dirname, '../../../../../.env.security');
loadEnvFile(securityEnvPath);

// Verification
console.log('ENCRYPTION_SECRET_KEY is set:', !!process.env.ENCRYPTION_SECRET_KEY);
