# Base de Connaissances - Calculs Fiscaux RDC

## Impôt Professionnel sur les Bénéfices et Profits (IPP)

### Taux d'Imposition IPP 2024
- **0% à 3 000 000 CDF** : Exonération totale
- **1% de 3 000 001 à 6 000 000 CDF** : Taux réduit
- **2% de 6 000 001 à 12 000 000 CDF** : Taux progressif
- **3% au-delà de 12 000 000 CDF** : Taux normal

### Calcul Progressif IPP
```
Si CA <= 3 000 000 : IPP = 0
Si 3 000 000 < CA <= 6 000 000 : IPP = (CA - 3 000 000) × 1%
Si 6 000 000 < CA <= 12 000 000 : IPP = 30 000 + (CA - 6 000 000) × 2%
Si CA > 12 000 000 : IPP = 30 000 + 120 000 + (CA - 12 000 000) × 3%
```

### Exonérations et Réductions IPP
- Nouvelles entreprises : Exonération 2 ans (conditions spécifiques)
- Zones économiques spéciales : Taux préférentiels
- Secteurs prioritaires : Réductions selon politique gouvernementale
- PME artisanales : Seuils d'exonération majorés

## Impôt Cédulaire sur les Rémunérations (ICR)

### Barème ICR 2024 (Mensuel)
- **0% de 0 à 30 000 CDF** : Exonération
- **3% de 30 001 à 100 000 CDF** : Tranche 1
- **15% de 100 001 à 200 000 CDF** : Tranche 2  
- **20% de 200 001 à 300 000 CDF** : Tranche 3
- **25% de 300 001 à 500 000 CDF** : Tranche 4
- **30% au-delà de 500 000 CDF** : Tranche maximale

### Calcul Progressif ICR
```
Si Salaire <= 30 000 : ICR = 0
Si 30 000 < Salaire <= 100 000 : ICR = (Salaire - 30 000) × 3%
Si 100 000 < Salaire <= 200 000 : ICR = 2 100 + (Salaire - 100 000) × 15%
Si 200 000 < Salaire <= 300 000 : ICR = 17 100 + (Salaire - 200 000) × 20%
Si 300 000 < Salaire <= 500 000 : ICR = 37 100 + (Salaire - 300 000) × 25%
Si Salaire > 500 000 : ICR = 87 100 + (Salaire - 500 000) × 30%
```

### Déductions ICR Autorisées
- Frais professionnels : 20% max du salaire brut
- Cotisations sociales obligatoires (CNSS, INPP, ONEM)
- Assurance vie et retraite complémentaire
- Frais de transport domicile-travail

## Charges Sociales Obligatoires

### CNSS (Caisse Nationale de Sécurité Sociale)
- **Taux employeur** : 3,5% du salaire brut
- **Taux employé** : 3,5% du salaire brut
- **Plafond mensuel** : 500 000 CDF
- **Base de calcul** : Salaire brut plafonné

### INPP (Institut National de Préparation Professionnelle)
- **Taux employeur** : 5% du salaire brut
- **Taux employé** : 0% (charge employeur uniquement)
- **Plafond mensuel** : 500 000 CDF
- **Objectif** : Formation professionnelle continue

### ONEM (Office National de l'Emploi)
- **Taux employeur** : 1% du salaire brut
- **Taux employé** : 0% (charge employeur uniquement)
- **Plafond mensuel** : 500 000 CDF
- **Objectif** : Politique emploi et chômage

### Calcul Total Charges Sociales
```
Salaire plafonné = min(Salaire_brut, 500_000)
CNSS_employeur = Salaire_plafonné × 3,5%
CNSS_employé = Salaire_plafonné × 3,5%
INPP = Salaire_plafonné × 5%
ONEM = Salaire_plafonné × 1%

Total_charges_employeur = CNSS_employeur + INPP + ONEM
Total_charges_employé = CNSS_employé
```

## TVA (Taxe sur la Valeur Ajoutée)

### Taux TVA RDC 2024
- **Taux standard** : 16%
- **Taux réduit** : 8% (produits de première nécessité)
- **Taux zéro** : 0% (exportations, certains services)
- **Exonérations** : Santé, éducation, transport public

### Calcul TVA
```
TVA = Montant_HT × Taux_TVA
Montant_TTC = Montant_HT + TVA
Montant_HT = Montant_TTC / (1 + Taux_TVA)
```

### Régimes TVA
- **Régime réel** : CA > 80 000 000 CDF/an
- **Régime simplifié** : 20 000 000 < CA <= 80 000 000 CDF/an
- **Exonération** : CA <= 20 000 000 CDF/an

## Autres Taxes et Impôts

### Impôt Mobilier (IM)
- **Taux** : 20% sur revenus mobiliers
- **Base** : Dividendes, intérêts, plus-values mobilières
- **Retenue à la source** : Obligatoire

### Impôt Foncier
- **Taux** : 0,5% à 1% de la valeur vénale
- **Base** : Propriétés bâties et non bâties
- **Exonérations** : Résidence principale (conditions)

### Droits d'Enregistrement
- **Actes de vente** : 3% à 5% selon nature
- **Contrats de bail** : 1% du loyer annuel
- **Actes de société** : Taux forfaitaires

## Conformité et Obligations

### Déclarations Fiscales
- **IPP** : Déclaration annuelle avant 31 mars
- **ICR** : Retenue mensuelle, déclaration avant 15
- **TVA** : Déclaration mensuelle avant 15
- **Charges sociales** : Déclaration mensuelle avant 15

### Pénalités et Sanctions
- **Retard de déclaration** : 10% du montant dû
- **Défaut de paiement** : 2% par mois de retard
- **Omissions** : 25% du montant omis
- **Fraude** : Sanctions pénales + majorations

### Documents Obligatoires
- Registre de paie
- Journal des ventes et achats
- Déclarations fiscales mensuelles/annuelles
- Justificatifs des retenues opérées

## Notes Importantes

### Évolutions Récentes
- Réforme fiscale 2023 : Nouveaux seuils IPP
- Digitalisation : Télédéclarations obligatoires
- Contrôles renforcés : Audit fiscal systématique

### Spécificités Sectorielles
- Mines : Régime fiscal spécial
- Télécommunications : Taxes sectorielles
- Banques : Impôts spécifiques
- Assurances : Contributions particulières

---
*Source : Direction Générale des Impôts (DGI) - RDC 2024*
*Mise à jour : Janvier 2025*
