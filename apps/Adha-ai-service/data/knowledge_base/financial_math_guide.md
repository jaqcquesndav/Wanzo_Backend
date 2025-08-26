# Base de Connaissances - Mathématiques Financières

## Valeur Temporelle de l'Argent

### Concepts Fondamentaux

#### Valeur Actuelle (Present Value)
```
VA = VF / (1 + r)^n
```
- **VA** : Valeur actuelle
- **VF** : Valeur future
- **r** : Taux d'actualisation
- **n** : Nombre de périodes

#### Valeur Future (Future Value)
```
VF = VA × (1 + r)^n
```

#### Règle des 72
```
Années pour doubler = 72 / Taux (en %)
```
Exemple : À 8%, capital double en 72/8 = 9 ans

### Annuités et Rentes

#### Valeur Actuelle d'Annuité
```
VA_annuité = PMT × [1 - (1 + r)^(-n)] / r
```
- **PMT** : Paiement périodique
- Utilisé pour : Emprunts, leasing, retraites

#### Valeur Future d'Annuité
```
VF_annuité = PMT × [(1 + r)^n - 1] / r
```

#### Annuité Perpétuelle
```
VA_perpétuelle = PMT / r
```
- Utilisé pour : Obligations perpétuelles, dividendes constants

#### Annuité Croissante
```
VA = PMT / (r - g) × [1 - ((1 + g)/(1 + r))^n]
```
- **g** : Taux de croissance des paiements

## Évaluation d'Investissements

### Valeur Actuelle Nette (VAN/NPV)

#### Formule de Base
```
VAN = Σ[CFt / (1 + r)^t] - Investissement_initial
```

#### Critères de Décision
- **VAN > 0** : Projet créateur de valeur
- **VAN = 0** : Projet neutre
- **VAN < 0** : Projet destructeur de valeur

#### Exemple Pratique
Projet avec :
- Investissement initial : 1 000 000 CDF
- Cash flows : 300 000, 400 000, 500 000 CDF/an
- Taux d'actualisation : 12%

```
VAN = -1 000 000 + 300 000/(1,12)^1 + 400 000/(1,12)^2 + 500 000/(1,12)^3
VAN = -1 000 000 + 267 857 + 318 878 + 355 890
VAN = -57 375 CDF (Projet à rejeter)
```

### Taux de Rendement Interne (TRI/IRR)

#### Définition
Taux pour lequel VAN = 0
```
Σ[CFt / (1 + TRI)^t] = Investissement_initial
```

#### Méthode de Calcul (Approximation)
1. **Interpolation linéaire** entre deux taux
2. **Méthode Newton-Raphson** pour précision
3. **Calculatrices financières** ou Excel

#### Critères de Décision
- **TRI > Coût du capital** : Projet acceptable
- **TRI < Coût du capital** : Projet à rejeter

#### Limites du TRI
- Projets avec cash flows non conventionnels
- Comparaison de projets de tailles différentes
- Hypothèse de réinvestissement au TRI

### Délai de Récupération (Payback)

#### Délai Simple
```
Payback = Investissement / Cash Flow Annuel Moyen
```

#### Délai Actualisé (DPA)
Cumul des cash flows actualisés jusqu'à récupération

#### Avantages et Limites
- **Avantage** : Simplicité, mesure de liquidité
- **Limite** : Ignore la valeur temporelle et cash flows ultérieurs

### Indice de Rentabilité (IR)

#### Formule
```
IR = VA des Cash Flows / Investissement Initial
```

#### Interprétation
- **IR > 1** : Projet rentable
- **IR = 1** : Projet neutre  
- **IR < 1** : Projet non rentable

## Calculs d'Emprunts et Crédits

### Emprunts à Remboursement Constant

#### Annuité Constante
```
Annuité = Capital × [r × (1 + r)^n] / [(1 + r)^n - 1]
```

#### Tableau d'Amortissement
Pour chaque période t :
```
Intérêts_t = Capital_restant × r
Amortissement_t = Annuité - Intérêts_t
Capital_restant_t = Capital_restant_(t-1) - Amortissement_t
```

### Emprunts in Fine

#### Caractéristiques
- Remboursement du capital à l'échéance
- Paiement d'intérêts périodiques uniquement
```
Intérêts_périodiques = Capital × r
```

### Emprunts à Amortissement Constant

#### Amortissement Périodique
```
Amortissement = Capital_initial / n
```

#### Annuité Variable
```
Annuité_t = Amortissement + (Capital_restant × r)
```

## Taux d'Intérêt et Conversions

### Taux Effectif vs Taux Nominal

#### Taux Effectif Annuel (TEA)
```
TEA = (1 + r/m)^m - 1
```
- **r** : Taux nominal
- **m** : Nombre de capitalisations/an

#### Conversion de Taux
```
Taux_périodique = (1 + TEA)^(1/périodes) - 1
```

### Taux Équivalents

#### Taux Mensuel ↔ Taux Annuel
```
(1 + r_mensuel)^12 = 1 + r_annuel
r_mensuel = (1 + r_annuel)^(1/12) - 1
```

#### Taux Continu
```
r_continu = ln(1 + r_discret)
r_discret = e^(r_continu) - 1
```

## Applications Spécifiques

### Évaluation d'Obligations

#### Prix d'Obligation
```
Prix = Σ[Coupon/(1+r)^t] + Valeur_nominale/(1+r)^n
```

#### Rendement à l'Échéance (YTM)
Taux qui égalise prix et valeur actualisée des cash flows

#### Duration et Sensibilité
```
Duration_modifiée = Duration_Macaulay / (1 + YTM)
Δ_Prix = -Duration_modifiée × Δ_YTM × Prix
```

### Leasing et Location-Financement

#### Valeur Actuelle des Loyers
```
VA_loyers = Σ[Loyer_t / (1 + r)^t]
```

#### Comparaison Achat vs Leasing
- VAN achat vs VAN leasing
- Considérer avantages fiscaux
- Flexibilité et obsolescence

### Planification de Retraite

#### Capital Nécessaire
```
Capital_retraite = Pension_souhaitée / Taux_retrait
```

#### Épargne Mensuelle Requise
```
Épargne_mensuelle = Capital_cible × r_mensuel / [(1 + r_mensuel)^n - 1]
```

## Contexte RDC/Afrique

### Taux de Référence

#### Taux Directeur BCC (2024)
- **Taux directeur** : 20-25%
- **Inflation cible** : 7-10%
- **Taux réel** : 10-15%

#### Primes de Risque
- **Risque pays** : 3-8%
- **Risque de change** : 5-15%
- **Risque secteur** : 2-10%

### Spécificités Locales

#### Multi-devises
- Projets en USD pour stabilité
- Conversion CDF avec volatilité
- Couverture de change nécessaire

#### Inflation Élevée
- Utiliser taux réels
- Indexation des contrats
- Révision périodique des projections

#### Contraintes de Financement
- Taux d'intérêt élevés (25-40%)
- Durées courtes (1-5 ans)
- Garanties importantes requises

## Outils et Calculatrices

### Fonctions Excel Essentielles
- **VAN** : `=VNA(taux; cash_flows)`
- **TRI** : `=TRI(cash_flows)`
- **VA** : `=VA(taux; nb_périodes; paiement)`
- **VF** : `=VC(taux; nb_périodes; paiement; va)`
- **PMT** : `=VPM(taux; nb_périodes; va; vf)`

### Calculatrices Financières
Configuration typique :
- **N** : Nombre de périodes
- **I/Y** : Taux d'intérêt par période
- **PV** : Valeur présente (négative si sortie)
- **PMT** : Paiement périodique
- **FV** : Valeur future

### Applications Mobiles
- **HP 12C Emulator** : Calculatrice financière
- **Financial Calculator** : Calculs de base
- **Loan Calculator** : Spécialisé emprunts

## Exercices Pratiques

### Cas 1 : Achat d'Équipement
Une entreprise évalue l'achat d'une machine :
- Coût : 50 000 000 CDF
- Économies annuelles : 15 000 000 CDF (5 ans)
- Valeur résiduelle : 5 000 000 CDF
- Coût du capital : 15%

**Solution** :
```
VAN = -50 000 000 + 15 000 000 × PVIFA(15%,5) + 5 000 000 × PVIF(15%,5)
VAN = -50 000 000 + 15 000 000 × 3,3522 + 5 000 000 × 0,4972
VAN = -50 000 000 + 50 283 000 + 2 486 000
VAN = 2 769 000 CDF (Projet acceptable)
```

### Cas 2 : Emprunts Immobilier
Calcul mensualité emprunt :
- Capital : 100 000 000 CDF
- Durée : 15 ans
- Taux annuel : 18%

**Solution** :
```
Taux mensuel = 18%/12 = 1,5%
Nombre paiements = 15 × 12 = 180
PMT = 100 000 000 × [0,015 × (1,015)^180] / [(1,015)^180 - 1]
PMT = 1 684 366 CDF/mois
```

---
*Source : Principes de mathématiques financières adaptés au contexte RDC*
*Mise à jour : Janvier 2025*
