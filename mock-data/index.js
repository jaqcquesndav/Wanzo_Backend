/**
 * Module d'exportation centralisé pour toutes les données de mock
 * Ce fichier permet d'accéder facilement aux données mockées pour chaque microservice
 */

const customerServiceMock = require('./customer-service.mock');
const gestionCommercialeServiceMock = require('./gestion_commerciale_service.mock');
const accountingServiceMock = require('./accounting-service.mock');

/**
 * Export des données de mock pour tous les microservices
 */
module.exports = {
  // Export des données de mock par service
  customerService: customerServiceMock,
  gestionCommercialeService: gestionCommercialeServiceMock,
  accountingService: accountingServiceMock,
  
  // Export de toutes les données de mock groupées par type
  // Utile pour initialiser une base de données complète
  mockData: {
    // Customer service data
    customers: customerServiceMock.customers,
    users: customerServiceMock.users,
    tokenUsages: customerServiceMock.tokenUsages,
    
    // Gestion commerciale service data
    companies: gestionCommercialeServiceMock.companies,
    suppliers: gestionCommercialeServiceMock.suppliers,
    products: gestionCommercialeServiceMock.products,
    productSupplierRelations: gestionCommercialeServiceMock.productSupplierRelations,
    
    // Accounting service data
    organizations: accountingServiceMock.organizations,
    fiscalYears: accountingServiceMock.fiscalYears,
    journals: accountingServiceMock.journals,
    journalLines: accountingServiceMock.journalLines,
    journalAttachments: accountingServiceMock.journalAttachments,
  },
  
  // Export des helpers pour faciliter la génération de données supplémentaires
  helpers: {
    ...customerServiceMock.helpers,
    ...gestionCommercialeServiceMock.helpers,
    ...accountingServiceMock.helpers,
  }
};
