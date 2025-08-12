/**
 * Données de mock pour le gestion_commerciale_service
 * Ces données sont conformes au modèle de données du microservice
 * et peuvent être utilisées pour initialiser la base de données
 */

const { v4: uuidv4 } = require('uuid');

// Enum constants from the entities
const ProductCategory = {
  FOOD: 'food',
  DRINK: 'drink',
  ELECTRONICS: 'electronics',
  CLOTHING: 'clothing',
  HOUSEHOLD: 'household',
  HYGIENE: 'hygiene',
  OFFICE: 'office',
  COSMETICS: 'cosmetics',
  PHARMACEUTICALS: 'pharmaceuticals',
  BAKERY: 'bakery',
  DAIRY: 'dairy',
  MEAT: 'meat',
  VEGETABLES: 'vegetables',
  FRUITS: 'fruits',
  OTHER: 'other'
};

const MeasurementUnit = {
  PIECE: 'piece',
  KG: 'kg',
  G: 'g',
  L: 'l',
  ML: 'ml',
  PACKAGE: 'package',
  BOX: 'box',
  OTHER: 'other'
};

const SupplierCategory = {
  STRATEGIC: 'strategic',
  REGULAR: 'regular',
  NEW_SUPPLIER: 'newSupplier',
  OCCASIONAL: 'occasional',
  INTERNATIONAL: 'international',
};

// Generate timestamps within the last year
function randomPastTimestamp(maxDaysAgo = 365) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.floor(Math.random() * maxDaysAgo * 24 * 60 * 60 * 1000));
  return pastDate.toISOString();
}

// Generate a mock company
function generateMockCompany(id) {
  const companyId = id || uuidv4();
  const createdAt = randomPastTimestamp(180);
  
  return {
    id: companyId,
    name: `Entreprise ${companyId.substring(0, 8)}`,
    registrationNumber: `RC/KIN/2025/${Math.floor(10000 + Math.random() * 90000)}`,
    address: `${Math.floor(100 + Math.random() * 900)} Avenue du Commerce, Gombe, Kinshasa`,
    phone: `+243${Math.floor(800000000 + Math.random() * 199999999)}`,
    email: `contact@entreprise-${companyId.substring(0, 8)}.cd`,
    website: `https://www.entreprise-${companyId.substring(0, 8)}.cd`,
    isActive: true,
    createdAt: createdAt,
    updatedAt: randomPastTimestamp(30)
  };
}

// Generate mock suppliers
function generateMockSuppliers(numberOfSuppliers = 5) {
  const suppliers = [];
  
  const supplierCategories = Object.values(SupplierCategory);
  
  for (let i = 0; i < numberOfSuppliers; i++) {
    const supplierId = uuidv4();
    const createdAt = randomPastTimestamp(150);
    const lastPurchaseDate = Math.random() > 0.2 ? randomPastTimestamp(30) : null;
    
    suppliers.push({
      id: supplierId,
      name: `Fournisseur ${supplierId.substring(0, 8)}`,
      contactPerson: `Contact ${Math.floor(Math.random() * 100)}`,
      email: `contact@fournisseur-${supplierId.substring(0, 8)}.com`,
      phoneNumber: `+243${Math.floor(800000000 + Math.random() * 199999999)}`,
      address: `${Math.floor(100 + Math.random() * 900)} Avenue des Fournisseurs, ${['Gombe', 'Limete', 'Ngaliema'][Math.floor(Math.random() * 3)]}, Kinshasa`,
      category: supplierCategories[Math.floor(Math.random() * supplierCategories.length)],
      totalPurchases: (Math.random() * 10000).toFixed(2),
      lastPurchaseDate: lastPurchaseDate,
      createdAt: createdAt,
      updatedAt: randomPastTimestamp(20)
    });
  }
  
  return suppliers;
}

// Generate mock products
function generateMockProducts(suppliers, numberOfProducts = 20) {
  const products = [];
  
  const productCategories = Object.values(ProductCategory);
  const measurementUnits = Object.values(MeasurementUnit);
  
  for (let i = 0; i < numberOfProducts; i++) {
    const productId = uuidv4();
    const createdAt = randomPastTimestamp(120);
    
    const costPrice = Math.floor(Math.random() * 50000) + 1000;
    const sellingPrice = Math.floor(costPrice * (1 + Math.random() * 0.5)); // marge entre 0 et 50%
    
    const category = productCategories[Math.floor(Math.random() * productCategories.length)];
    let unit;
    
    // Définir une unité cohérente avec la catégorie
    if (category === ProductCategory.FOOD || category === ProductCategory.VEGETABLES || category === ProductCategory.FRUITS) {
      unit = [MeasurementUnit.KG, MeasurementUnit.G][Math.floor(Math.random() * 2)];
    } else if (category === ProductCategory.DRINK) {
      unit = [MeasurementUnit.L, MeasurementUnit.ML][Math.floor(Math.random() * 2)];
    } else if (category === ProductCategory.ELECTRONICS) {
      unit = MeasurementUnit.PIECE;
    } else {
      unit = measurementUnits[Math.floor(Math.random() * measurementUnits.length)];
    }
    
    // Générer des noms selon la catégorie
    let name;
    switch (category) {
      case ProductCategory.FOOD:
        name = ['Pâtes', 'Riz', 'Haricots', 'Farine', 'Sucre'][Math.floor(Math.random() * 5)] + ` ${productId.substring(0, 4)}`;
        break;
      case ProductCategory.DRINK:
        name = ['Jus', 'Eau', 'Soda', 'Lait', 'Café'][Math.floor(Math.random() * 5)] + ` ${productId.substring(0, 4)}`;
        break;
      case ProductCategory.ELECTRONICS:
        name = ['Téléphone', 'Ordinateur', 'Écouteurs', 'Chargeur', 'Adaptateur'][Math.floor(Math.random() * 5)] + ` ${productId.substring(0, 4)}`;
        break;
      default:
        name = `Produit ${productId.substring(0, 8)}`;
    }
    
    // Attribuer aléatoirement 1 à 3 fournisseurs
    const productSuppliers = [];
    const numSuppliers = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numSuppliers; j++) {
      const supplierIndex = Math.floor(Math.random() * suppliers.length);
      if (!productSuppliers.includes(suppliers[supplierIndex].id)) {
        productSuppliers.push(suppliers[supplierIndex].id);
      }
    }
    
    products.push({
      id: productId,
      name: name,
      description: `Description détaillée du produit ${name}. Ce produit est de qualité supérieure.`,
      sku: `PROD-${Math.floor(10000 + Math.random() * 90000)}`,
      barcode: Math.random() > 0.3 ? `${Math.floor(1000000000000 + Math.random() * 9000000000000)}` : null,
      category: category,
      unit: unit,
      costPriceInCdf: costPrice.toFixed(2),
      sellingPriceInCdf: sellingPrice.toFixed(2),
      stockQuantity: (Math.random() * 1000).toFixed(2),
      minStockLevel: Math.floor(Math.random() * 50),
      reorderPoint: Math.floor(Math.random() * 100) + 50,
      location: Math.random() > 0.3 ? `Étagère ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(Math.random() * 10) + 1}` : null,
      imageUrl: Math.random() > 0.7 ? `https://example.com/products/${productId}.jpg` : null,
      isActive: Math.random() > 0.1,
      supplierId: productSuppliers[0], // Fournisseur principal
      createdAt: createdAt,
      updatedAt: randomPastTimestamp(15)
    });
  }
  
  return products;
}

// Generate product-supplier relations
function generateProductSupplierRelations(products, suppliers) {
  const relations = [];
  
  products.forEach(product => {
    // Choisir 1-3 fournisseurs aléatoirement
    const numSuppliers = Math.floor(Math.random() * 3) + 1;
    const productSuppliers = [];
    
    for (let i = 0; i < numSuppliers; i++) {
      const supplierIndex = Math.floor(Math.random() * suppliers.length);
      const supplierId = suppliers[supplierIndex].id;
      
      if (!productSuppliers.includes(supplierId)) {
        productSuppliers.push(supplierId);
        
        relations.push({
          productId: product.id,
          supplierId: supplierId
        });
      }
    }
  });
  
  return relations;
}

// Generate mock data
const mockCompanies = [
  generateMockCompany(),
  generateMockCompany()
];

const mockSuppliers = generateMockSuppliers(8);
const mockProducts = generateMockProducts(mockSuppliers, 30);
const mockProductSupplierRelations = generateProductSupplierRelations(mockProducts, mockSuppliers);

module.exports = {
  companies: mockCompanies,
  suppliers: mockSuppliers,
  products: mockProducts,
  productSupplierRelations: mockProductSupplierRelations,
  // Export helper functions for use in other mock files if needed
  helpers: {
    generateMockCompany,
    generateMockSuppliers,
    generateMockProducts,
    randomPastTimestamp
  }
};
