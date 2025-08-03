-- Migration pour initialiser les données géographiques de base de la RDC
-- Ce script crée les données de référence pour l'analyse géographique des risques

-- Insertion des provinces de la RDC avec leurs caractéristiques de base
INSERT INTO geographic_entity (id, province, city, business_sector, entity_count, avg_risk_score, last_update) VALUES
  -- Kinshasa - Capital économique
  ('geo-kinshasa-01', 'Kinshasa', 'Kinshasa', 'COMMERCIAL', 0, 5.2, NOW()),
  ('geo-kinshasa-02', 'Kinshasa', 'Gombe', 'FINANCIAL_SERVICES', 0, 4.8, NOW()),
  ('geo-kinshasa-03', 'Kinshasa', 'Kalamu', 'MANUFACTURING', 0, 5.5, NOW()),
  
  -- Katanga - Province minière
  ('geo-katanga-01', 'Katanga', 'Lubumbashi', 'MINING', 0, 6.1, NOW()),
  ('geo-katanga-02', 'Katanga', 'Kolwezi', 'MINING', 0, 6.3, NOW()),
  ('geo-katanga-03', 'Katanga', 'Likasi', 'MANUFACTURING', 0, 5.8, NOW()),
  
  -- Kasaï - Province agricole
  ('geo-kasai-01', 'Kasaï', 'Kananga', 'AGRICULTURE', 0, 5.9, NOW()),
  ('geo-kasai-02', 'Kasaï', 'Mbuji-Mayi', 'MINING', 0, 6.5, NOW()),
  ('geo-kasai-03', 'Kasaï', 'Tshikapa', 'AGRICULTURE', 0, 6.2, NOW()),
  
  -- Nord-Kivu - Zone de conflit
  ('geo-nordkivu-01', 'Nord-Kivu', 'Goma', 'COMMERCIAL', 0, 7.2, NOW()),
  ('geo-nordkivu-02', 'Nord-Kivu', 'Butembo', 'AGRICULTURE', 0, 7.0, NOW()),
  ('geo-nordkivu-03', 'Nord-Kivu', 'Beni', 'AGRICULTURE', 0, 7.5, NOW()),
  
  -- Sud-Kivu
  ('geo-sudkivu-01', 'Sud-Kivu', 'Bukavu', 'COMMERCIAL', 0, 6.8, NOW()),
  ('geo-sudkivu-02', 'Sud-Kivu', 'Uvira', 'AGRICULTURE', 0, 6.9, NOW()),
  
  -- Bas-Congo (Kongo Central)
  ('geo-kongocent-01', 'Kongo Central', 'Matadi', 'TRANSPORT', 0, 5.4, NOW()),
  ('geo-kongocent-02', 'Kongo Central', 'Boma', 'TRANSPORT', 0, 5.6, NOW()),
  
  -- Bandundu (Kwilu, Kwango, Mai-Ndombe)
  ('geo-kwilu-01', 'Kwilu', 'Kikwit', 'AGRICULTURE', 0, 6.0, NOW()),
  ('geo-kwango-01', 'Kwango', 'Kenge', 'AGRICULTURE', 0, 6.3, NOW()),
  
  -- Équateur
  ('geo-equateur-01', 'Équateur', 'Mbandaka', 'AGRICULTURE', 0, 6.4, NOW()),
  ('geo-equateur-02', 'Équateur', 'Gemena', 'AGRICULTURE', 0, 6.1, NOW()),
  
  -- Province Orientale (Tshopo, Bas-Uele, Haut-Uele, Ituri)
  ('geo-tshopo-01', 'Tshopo', 'Kisangani', 'COMMERCIAL', 0, 6.6, NOW()),
  ('geo-ituri-01', 'Ituri', 'Bunia', 'MINING', 0, 7.1, NOW()),
  
  -- Maniema
  ('geo-maniema-01', 'Maniema', 'Kindu', 'AGRICULTURE', 0, 6.7, NOW()),
  
  -- Lomami
  ('geo-lomami-01', 'Lomami', 'Kabinda', 'AGRICULTURE', 0, 6.0, NOW()),
  
  -- Sankuru
  ('geo-sankuru-01', 'Sankuru', 'Lusambo', 'AGRICULTURE', 0, 6.2, NOW()),
  
  -- Tanganyika
  ('geo-tanganyika-01', 'Tanganyika', 'Kalemie', 'COMMERCIAL', 0, 6.4, NOW())
ON CONFLICT (id) DO NOTHING;

-- Création d'index pour optimiser les requêtes géographiques
CREATE INDEX IF NOT EXISTS idx_geographic_province ON geographic_entity(province);
CREATE INDEX IF NOT EXISTS idx_geographic_city ON geographic_entity(city);
CREATE INDEX IF NOT EXISTS idx_geographic_sector ON geographic_entity(business_sector);
CREATE INDEX IF NOT EXISTS idx_geographic_risk ON geographic_entity(avg_risk_score);

-- Insertion de données de référence pour les secteurs économiques
-- (Ces données pourront être utilisées pour la classification)
INSERT INTO geographic_entity (id, province, city, business_sector, entity_count, avg_risk_score, last_update) VALUES
  -- Secteurs spécialisés par région
  ('geo-ref-financial', 'Kinshasa', 'Gombe', 'FINANCIAL_SERVICES', 0, 4.5, NOW()),
  ('geo-ref-telecom', 'Kinshasa', 'Kinshasa', 'TELECOMMUNICATIONS', 0, 4.2, NOW()),
  ('geo-ref-energy', 'Katanga', 'Lubumbashi', 'ENERGY', 0, 5.8, NOW()),
  ('geo-ref-transport', 'Kongo Central', 'Matadi', 'TRANSPORT', 0, 5.5, NOW()),
  ('geo-ref-healthcare', 'Kinshasa', 'Lingwala', 'HEALTHCARE', 0, 4.8, NOW()),
  ('geo-ref-education', 'Kinshasa', 'Lemba', 'EDUCATION', 0, 4.6, NOW()),
  ('geo-ref-construction', 'Kinshasa', 'Masina', 'CONSTRUCTION', 0, 5.9, NOW()),
  ('geo-ref-textile', 'Kasaï', 'Kananga', 'TEXTILE', 0, 6.1, NOW()),
  ('geo-ref-food', 'Équateur', 'Mbandaka', 'FOOD_PROCESSING', 0, 5.7, NOW()),
  ('geo-ref-tourism', 'Sud-Kivu', 'Bukavu', 'TOURISM', 0, 6.5, NOW())
ON CONFLICT (id) DO NOTHING;

-- Commentaires sur les caractéristiques des provinces
-- Ces informations peuvent être utilisées par les algorithmes de risque

-- Kinshasa: Centre économique, densité élevée, infrastructure développée
-- Risque modéré mais concentration importante

-- Katanga: Économie basée sur l'extraction minière
-- Risques: volatilité des cours, dépendance externe

-- Kasaï: Agriculture et diamants
-- Risques: saisonnalité, informalité élevée

-- Nord-Kivu/Sud-Kivu: Zones de conflit
-- Risques: instabilité, difficultés d'accès

-- Kongo Central: Port et transit
-- Risques: dépendance au commerce international

-- Autres provinces: Économies rurales
-- Risques: accès limité aux services financiers, infrastructure

COMMIT;
