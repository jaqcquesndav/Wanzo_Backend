/**
 * Script pour charger les données de mock dans les bases de données PostgreSQL
 * Ce script va générer des fichiers SQL et les exécuter dans les bases de données correspondantes
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { Pool } = require('pg');
const mockData = require('./index');

// Configuration des connexions aux bases de données par service
const dbConfigs = {
  customerService: {
    host: process.env.CUSTOMER_DB_HOST || 'localhost',
    port: process.env.CUSTOMER_DB_PORT || 5432,
    database: process.env.CUSTOMER_DB_NAME || 'customer_service_db',
    user: process.env.CUSTOMER_DB_USER || 'postgres',
    password: process.env.CUSTOMER_DB_PASSWORD || 'postgres'
  },
  accountingService: {
    host: process.env.ACCOUNTING_DB_HOST || 'localhost',
    port: process.env.ACCOUNTING_DB_PORT || 5432,
    database: process.env.ACCOUNTING_DB_NAME || 'accounting_service_db',
    user: process.env.ACCOUNTING_DB_USER || 'postgres',
    password: process.env.ACCOUNTING_DB_PASSWORD || 'postgres'
  },
  gestionCommercialeService: {
    host: process.env.GESTION_COMMERCIALE_DB_HOST || 'localhost',
    port: process.env.GESTION_COMMERCIALE_DB_PORT || 5432,
    database: process.env.GESTION_COMMERCIALE_DB_NAME || 'gestion_commerciale_db',
    user: process.env.GESTION_COMMERCIALE_DB_USER || 'postgres',
    password: process.env.GESTION_COMMERCIALE_DB_PASSWORD || 'postgres'
  }
};

// Mapping des services aux tables dans leurs bases respectives
const serviceToTables = {
  customerService: ['customers', 'users', 'token_usages'],
  accountingService: ['organizations', 'fiscal_years', 'journals', 'journal_lines', 'journal_attachments'],
  gestionCommercialeService: ['companies', 'suppliers', 'products', 'product_supplier'],
};

// Mapping des données mock aux tables
const dataToTableMapping = {
  customers: 'customers',
  users: 'users',
  tokenUsages: 'token_usages',
  
  organizations: 'organizations',
  fiscalYears: 'fiscal_years',
  journals: 'journals',
  journalLines: 'journal_lines',
  journalAttachments: 'journal_attachments',
  
  companies: 'companies',
  suppliers: 'suppliers',
  products: 'products',
  productSupplierRelations: 'product_supplier'
};

/**
 * Fonction pour générer un fichier SQL pour un service
 * @param {string} serviceName - Nom du service (customerService, accountingService, etc.)
 * @returns {string} - Chemin vers le fichier SQL généré
 */
function generateSQLFile(serviceName) {
  console.log(`Génération du fichier SQL pour ${serviceName}...`);
  const serviceData = mockData[serviceName];
  
  const sqlStatements = [];
  
  // Ajouter BEGIN TRANSACTION
  sqlStatements.push('BEGIN;');
  
  // Ajouter des commentaires pour identifier le service
  sqlStatements.push(`\n-- Données de mock pour ${serviceName}`);
  sqlStatements.push(`-- Générées automatiquement le ${new Date().toISOString()}\n`);
  
  // Pour chaque type de données dans le service
  Object.keys(serviceData).forEach(dataType => {
    // Ne pas traiter les fonctions helpers
    if (typeof serviceData[dataType] !== 'function' && Array.isArray(serviceData[dataType])) {
      const tableName = dataToTableMapping[dataType] || dataType;
      
      // Ajouter un commentaire pour la section
      sqlStatements.push(`\n-- Insertion des données ${dataType} dans la table ${tableName}`);
      
      // Générer les instructions INSERT pour chaque enregistrement
      serviceData[dataType].forEach(record => {
        const columns = Object.keys(record);
        const values = Object.values(record).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`; // Échapper les apostrophes
          if (typeof val === 'object' && val !== null) return `'${JSON.stringify(val).replace(/'/g, "''")}'`; // Convertir les objets en JSON
          return val;
        });
        
        // Construire l'instruction INSERT avec ON CONFLICT DO NOTHING
        sqlStatements.push(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`);
      });
    }
  });
  
  // Ajouter COMMIT
  sqlStatements.push('\nCOMMIT;');
  
  // Écrire le fichier SQL
  const sqlContent = sqlStatements.join('\n');
  const sqlFilePath = path.join(__dirname, `${serviceName}.sql`);
  fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
  
  console.log(`Fichier SQL généré: ${sqlFilePath}`);
  return sqlFilePath;
}

/**
 * Fonction pour exécuter un fichier SQL dans une base de données PostgreSQL
 * @param {string} serviceName - Nom du service
 * @param {string} sqlFilePath - Chemin vers le fichier SQL à exécuter
 * @returns {Promise<void>}
 */
async function executeSQLFile(serviceName, sqlFilePath) {
  console.log(`Exécution du fichier SQL pour ${serviceName}...`);
  
  const dbConfig = dbConfigs[serviceName];
  if (!dbConfig) {
    throw new Error(`Configuration de base de données non trouvée pour ${serviceName}`);
  }
  
  // Construire la commande psql
  const psqlCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${sqlFilePath}"`;
  
  return new Promise((resolve, reject) => {
    // Exécuter la commande
    exec(psqlCommand, { env: { ...process.env, PGPASSWORD: dbConfig.password } }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur lors de l'exécution de la commande psql:`, error);
        console.error(stderr);
        reject(error);
        return;
      }
      
      console.log(`Exécution SQL réussie pour ${serviceName}:`);
      console.log(stdout);
      resolve();
    });
  });
}

/**
 * Fonction pour insérer directement les données dans PostgreSQL sans passer par un fichier SQL
 * @param {string} serviceName - Nom du service
 * @returns {Promise<void>}
 */
async function insertDataDirectly(serviceName) {
  console.log(`Insertion directe des données pour ${serviceName}...`);
  
  const dbConfig = dbConfigs[serviceName];
  if (!dbConfig) {
    throw new Error(`Configuration de base de données non trouvée pour ${serviceName}`);
  }
  
  const serviceData = mockData[serviceName];
  const pool = new Pool(dbConfig);
  
  try {
    // Commencer une transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log(`Transaction commencée pour ${serviceName}`);
      
      // Pour chaque type de données dans le service
      for (const dataType of Object.keys(serviceData)) {
        // Ne pas traiter les fonctions helpers
        if (typeof serviceData[dataType] !== 'function' && Array.isArray(serviceData[dataType])) {
          const tableName = dataToTableMapping[dataType] || dataType;
          const data = serviceData[dataType];
          
          console.log(`Insertion de ${data.length} enregistrements dans ${tableName}`);
          
          // Insérer chaque enregistrement
          for (const record of data) {
            const columns = Object.keys(record);
            const values = Object.values(record);
            const placeholders = columns.map((_, i) => `$${i + 1}`);
            
            const query = {
              text: `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT DO NOTHING`,
              values: values
            };
            
            await client.query(query);
          }
          
          console.log(`Données insérées avec succès dans ${tableName}`);
        }
      }
      
      // Valider la transaction
      await client.query('COMMIT');
      console.log(`Transaction validée pour ${serviceName}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Erreur lors de l'insertion des données pour ${serviceName}:`, err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Erreur de connexion à la base de données pour ${serviceName}:`, err);
    throw err;
  } finally {
    await pool.end();
  }
}

/**
 * Fonction principale pour charger les données dans toutes les bases de données
 * @param {boolean} useSQLFiles - Si true, utilise des fichiers SQL, sinon insère directement
 * @returns {Promise<void>}
 */
async function loadAllData(useSQLFiles = true) {
  const services = Object.keys(dbConfigs);
  
  for (const service of services) {
    try {
      if (useSQLFiles) {
        // Méthode avec fichiers SQL
        const sqlFilePath = generateSQLFile(service);
        await executeSQLFile(service, sqlFilePath);
      } else {
        // Méthode d'insertion directe
        await insertDataDirectly(service);
      }
      
      console.log(`Données chargées avec succès pour ${service}`);
    } catch (error) {
      console.error(`Erreur lors du chargement des données pour ${service}:`, error);
    }
  }
}

// Gestion des arguments en ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const serviceName = args[1];
  const useSQLFiles = args.includes('--sql');
  
  if (command === 'generate') {
    // Générer uniquement les fichiers SQL
    if (serviceName && dbConfigs[serviceName]) {
      generateSQLFile(serviceName);
    } else {
      Object.keys(dbConfigs).forEach(service => generateSQLFile(service));
    }
  } else if (command === 'load') {
    // Charger les données dans les bases de données
    if (serviceName && dbConfigs[serviceName]) {
      if (useSQLFiles) {
        const sqlFilePath = generateSQLFile(serviceName);
        executeSQLFile(serviceName, sqlFilePath)
          .catch(err => console.error(`Erreur lors du chargement des données pour ${serviceName}:`, err));
      } else {
        insertDataDirectly(serviceName)
          .catch(err => console.error(`Erreur lors du chargement des données pour ${serviceName}:`, err));
      }
    } else {
      loadAllData(useSQLFiles)
        .catch(err => console.error('Erreur lors du chargement de toutes les données:', err));
    }
  } else {
    console.log('Usage:');
    console.log('  node db-loader.js generate [serviceName]  - Générer les fichiers SQL');
    console.log('  node db-loader.js load [serviceName]      - Charger les données dans les bases de données');
    console.log('Options:');
    console.log('  --sql                                    - Utiliser des fichiers SQL (par défaut)');
  }
}

module.exports = {
  generateSQLFile,
  executeSQLFile,
  insertDataDirectly,
  loadAllData
};
