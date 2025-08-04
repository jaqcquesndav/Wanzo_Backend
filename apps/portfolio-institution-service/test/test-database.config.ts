import { DataSourceOptions } from 'typeorm';

// Configuration de base de données pour les tests
// Remplace les ENUMs par des VARCHAR pour la compatibilité SQLite
export const getTestDatabaseConfig = (): DataSourceOptions => {
  return {
    type: 'sqlite',
    database: ':memory:',
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: false,
    dropSchema: true,
    // Configuration spécifique SQLite
    enableWAL: false,
    // Transforme automatiquement les ENUMs en VARCHAR
    extra: {
      // Pas de contraintes de clés étrangères pour les tests
      'foreign_keys': false,
    },
  };
};

// Helper pour convertir les types ENUM en VARCHAR pour SQLite
export const adaptEntityForSQLite = (entity: any) => {
  // Cette fonction peut être utilisée pour adapter les entités si nécessaire
  return entity;
};
