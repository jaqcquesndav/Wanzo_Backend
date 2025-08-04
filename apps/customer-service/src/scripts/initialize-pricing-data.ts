#!/usr/bin/env ts-node

/**
 * Script d'initialisation des données de tarification
 * Ce script synchronise la configuration centralisée avec la base de données
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PricingDataSyncService } from '../modules/subscriptions/services/pricing-data-sync.service';

async function bootstrap() {
  console.log('🚀 Starting pricing data initialization...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const pricingDataSyncService = app.get(PricingDataSyncService);

  try {
    // 1. Valider la configuration actuelle
    console.log('📋 Validating current pricing configuration...');
    const validation = await pricingDataSyncService.validatePricingData();
    
    if (!validation.isValid) {
      console.log('⚠️  Configuration issues found:');
      console.log('Missing plans:', validation.missingPlans);
      console.log('Missing packages:', validation.missingPackages);
      console.log('Inconsistencies:', validation.inconsistencies);
      console.log('');
    }

    // 2. Générer un rapport de synchronisation
    console.log('📊 Generating synchronization report...');
    const report = await pricingDataSyncService.generateSyncReport();
    
    console.log('Plans to create:', report.plansToCreate.length);
    console.log('Plans to update:', report.plansToUpdate.length);
    console.log('Plans to deactivate:', report.plansToDeactivate.length);
    console.log('Packages to create:', report.packagesToCreate.length);
    console.log('Packages to update:', report.packagesToUpdate.length);
    console.log('Packages to deactivate:', report.packagesToDeactivate.length);
    console.log('');

    // 3. Synchroniser les données
    console.log('🔄 Synchronizing subscription plans...');
    await pricingDataSyncService.syncSubscriptionPlans();
    console.log('✅ Subscription plans synchronized');

    console.log('🔄 Synchronizing token packages...');
    await pricingDataSyncService.syncTokenPackages();
    console.log('✅ Token packages synchronized');

    // 4. Validation finale
    console.log('🔍 Final validation...');
    const finalValidation = await pricingDataSyncService.validatePricingData();
    
    if (finalValidation.isValid) {
      console.log('✅ All pricing data is now synchronized and valid!');
    } else {
      console.log('❌ Some issues remain:');
      console.log('Missing plans:', finalValidation.missingPlans);
      console.log('Missing packages:', finalValidation.missingPackages);
      console.log('Inconsistencies:', finalValidation.inconsistencies);
    }

    console.log('\n🎉 Pricing data initialization completed!');
    
  } catch (error) {
    console.error('❌ Error during pricing data initialization:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  bootstrap().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { bootstrap as initializePricingData };
