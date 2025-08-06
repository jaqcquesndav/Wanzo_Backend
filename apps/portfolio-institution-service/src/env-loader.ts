import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Charger les variables d'environnement depuis .env
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const envConfig = dotenv.parse(fs.readFileSync(filePath));
    for (const key in envConfig) {
      if (!process.env[key]) {
        process.env[key] = envConfig[key];
      }
    }
    console.log(`Environment variables loaded from: ${filePath}`);
  }
}

// Charger d'abord le fichier .env de base
const envPath = path.resolve(__dirname, '../.env');
loadEnvFile(envPath);

// Charger ensuite le fichier .env.security global qui contient ENCRYPTION_SECRET_KEY
const securityEnvPath = path.resolve(__dirname, '../../../../../.env.security');
loadEnvFile(securityEnvPath);

// Vérification
if (!process.env.ENCRYPTION_SECRET_KEY) {
  console.error('ENCRYPTION_SECRET_KEY environment variable is still not set!');
  console.error('Files checked:', envPath, securityEnvPath);
} else {
  console.log('ENCRYPTION_SECRET_KEY is loaded successfully.');
}
