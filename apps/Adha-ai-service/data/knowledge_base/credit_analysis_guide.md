# Guide d'Analyse des Dossiers de Crédit

## Introduction

L'analyse de crédit est un processus systématique d'évaluation de la capacité et de la volonté d'un emprunteur à rembourser ses obligations financières. Cette analyse doit être adaptée selon la taille de l'entreprise et la classe d'actifs.

## Classification des Entreprises

### Micro-Entreprises
- **Critères RDC**: CA < 50 millions CDF, Effectif < 5 personnes
- **Caractéristiques**: Gestion informelle, comptabilité simplifiée
- **Documents requis**: États financiers simplifiés, relevés bancaires 6 mois

### Petites Entreprises (PE)
- **Critères RDC**: CA 50M-500M CDF, Effectif 5-19 personnes
- **Caractéristiques**: Début de formalisation, comptabilité semi-structurée
- **Documents requis**: États financiers détaillés, business plan

### Moyennes Entreprises (ME)
- **Critères RDC**: CA 500M-5Mrd CDF, Effectif 20-99 personnes
- **Caractéristiques**: Gestion professionnelle, audit externe
- **Documents requis**: États audités, projections 3 ans, analyse sectorielle

## Méthodologie d'Analyse - Les 5C

### 1. Caractère (Character)
**Micro-Entreprises:**
- Réputation du dirigeant dans la communauté
- Historique des remboursements informels
- Références commerciales locales

**PME:**
- Antécédents de crédit formels
- Gouvernance d'entreprise
- Transparence financière

### 2. Capacité (Capacity)
**Ratios d'endettement par taille:**

**Micro-Entreprises:**
```
Ratio d'endettement = Dette totale / CA ≤ 30%
Couverture des charges = EBITDA / Charges financières ≥ 2x
```

**Petites Entreprises:**
```
Ratio d'endettement = Dette totale / Fonds propres ≤ 2:1
DSCR = Flux de trésorerie / Service de la dette ≥ 1.25x
```

**Moyennes Entreprises:**
```
Ratio d'endettement = Dette nette / EBITDA ≤ 3x
DSCR = EBITDA - CapEx - Impôts / Service dette ≥ 1.35x
```

### 3. Capital (Capital)
**Structure financière optimale:**

**Micro-Entreprises:**
- Fonds propres minimum 20% du financement
- Apport personnel du dirigeant
- Garanties personnelles

**PME:**
- Fonds propres 25-30% du financement
- Réserves constituées
- Capitaux permanents > Actifs immobilisés

### 4. Collatéral (Collateral)
**Garanties par segment:**

**Micro-Entreprises:**
- Garanties personnelles: 120% du crédit
- Nantissement stocks/créances: 150%
- Caution solidaire des associés

**PME:**
- Hypothèque immobilière: 80% de la valeur d'expertise
- Nantissement équipements: 70% valeur nette
- Garanties bancaires: 110%

### 5. Conditions (Conditions)
**Analyse sectorielle RDC:**

**Secteurs privilégiés:**
- Agriculture: Café, cacao, palmier à huile
- Mining: Support services, équipements
- Commerce: Distribution, import-export
- Services: Télécoms, banque, transport

**Risques sectoriels:**
- Dépendance aux matières premières
- Volatilité des changes (USD/CDF)
- Infrastructures défaillantes
- Réglementation en évolution

## Scoring de Crédit par Segment

### Micro-Entreprises (Score /100)

**Critères financiers (40%):**
- Rentabilité opérationnelle: 15 points
- Liquidité: 10 points
- Endettement: 10 points
- Croissance CA: 5 points

**Critères qualitatifs (60%):**
- Expérience dirigeant: 20 points
- Marché local: 15 points
- Concurrence: 10 points
- Relations bancaires: 15 points

### PME (Score /100)

**Critères financiers (60%):**
- Ratios de rentabilité: 20 points
- Ratios de liquidité: 15 points
- Ratios d'endettement: 15 points
- Qualité des actifs: 10 points

**Critères qualitatifs (40%):**
- Management: 15 points
- Position concurrentielle: 10 points
- Perspectives secteur: 10 points
- Gouvernance: 5 points

## Classes d'Actifs de Crédit

### Crédits de Fonctionnement

**Micro-Entreprises:**
- **Durée**: 3-12 mois
- **Montant**: 500K - 10M CDF
- **Taux**: 15-25% annuel
- **Garanties**: 120% en garanties personnelles

**PME:**
- **Durée**: 6-18 mois
- **Montant**: 10M - 500M CDF
- **Taux**: 12-20% annuel
- **Garanties**: Nantissement créances/stocks

### Crédits d'Investissement

**Équipements:**
```
Micro: 80% financement, 3 ans max
PME: 70% financement, 5 ans max
ME: 65% financement, 7 ans max
```

**Immobilier:**
```
PME: 70% financement, 10 ans max
ME: 80% financement, 15 ans max
```

### Crédits Commerce Extérieur

**Crédit Documentaire:**
- Commission: 0.5-1.5% du montant
- Durée: 30-180 jours
- Garantie: 100% marchandises

**Crédit Fournisseur:**
- Financement: 80% de la facture
- Durée: 90-360 jours
- Garantie: Assurance-crédit

## Analyse des Flux de Trésorerie

### Micro-Entreprises
```python
# Analyse simplifiée mensuelle
recettes_moyennes = sum(recettes_6_derniers_mois) / 6
charges_moyennes = sum(charges_6_derniers_mois) / 6
flux_net_moyen = recettes_moyennes - charges_moyennes
capacite_remboursement = flux_net_moyen * 0.7
```

### PME
```python
# Analyse trimestrielle détaillée
ebitda = resultat_exploitation + amortissements
capex_moyen = sum(investissements_3_ans) / 3
variation_bfr = bfr_fin - bfr_debut
flux_libre = ebitda - capex_moyen - variation_bfr - impots
ratio_couverture = flux_libre / service_dette
```

## Surveillance et Suivi

### Indicateurs d'Alerte Précoce

**Micro-Entreprises:**
- Retard paiement > 7 jours
- Baisse CA > 20% sur 2 mois
- Comptes bancaires débiteurs
- Conflits familiaux/associés

**PME:**
- Dépassement autorisé > 48h
- Ratios hors normes contractuelles
- Retard transmission documents
- Changements management clés

### Fréquence de Reporting

**Micro-Entreprises:**
- Relevés bancaires: Mensuel
- Situation financière: Trimestriel
- Visite terrain: Semestriel

**PME:**
- États financiers: Mensuel
- Tableaux de bord: Mensuel
- Audit annuel obligatoire

## Provisionnement et Classification

### Classification des Créances

**Saines (0% provision):**
- Respect échéancier
- Ratios dans les normes
- Documentation à jour

**Sous Surveillance (2% provision):**
- Retards occasionnels < 30 jours
- Détérioration légère ratios
- Secteur en difficulté

**Douteuses (15% provision):**
- Retards 30-90 jours
- Ratios significativement dégradés
- Restructuration nécessaire

**Compromises (50% provision):**
- Retards 90-180 jours
- Procédures judiciaires
- Garanties insuffisantes

**Irrécouvrables (100% provision):**
- Retards > 180 jours
- Liquidation judiciaire
- Perte totale prévisible

## Modèles de Décision Automatisée

### Score Automatique Micro-Entreprises
```python
def score_micro_entreprise(donnees):
    score = 0
    
    # Ancienneté activité (20 points max)
    if donnees['anciennete'] >= 2:
        score += 20
    elif donnees['anciennete'] >= 1:
        score += 15
    else:
        score += 5
    
    # Stabilité revenus (25 points max)
    cv_revenus = std(revenus_6_mois) / mean(revenus_6_mois)
    if cv_revenus < 0.2:
        score += 25
    elif cv_revenus < 0.4:
        score += 15
    else:
        score += 5
    
    # Capacité remboursement (30 points max)
    taux_effort = mensualite_demandee / revenu_moyen
    if taux_effort < 0.3:
        score += 30
    elif taux_effort < 0.4:
        score += 20
    else:
        score += 5
    
    # Garanties (25 points max)
    taux_couverture = valeur_garanties / montant_credit
    if taux_couverture >= 1.5:
        score += 25
    elif taux_couverture >= 1.2:
        score += 20
    else:
        score += 10
    
    return score

def decision_automatique(score):
    if score >= 80:
        return "ACCORD AUTOMATIQUE"
    elif score >= 60:
        return "ANALYSE APPROFONDIE"
    else:
        return "REFUS AUTOMATIQUE"
```

## Spécificités Réglementaires RDC

### Ratio Prudentiels BCC
- Ratio de solvabilité minimum: 10%
- Concentration risques: 25% fonds propres par client
- Provision minimum: Selon classification BCC

### Documentation Légale Obligatoire
- Contrat de crédit conforme Code Civil
- Garanties enregistrées (hypothèques, nantissements)
- Assurance-vie emprunteur
- Déclarations fiscales à jour

Cette méthodologie garantit une analyse rigoureuse adaptée au contexte économique de la RDC et aux spécificités de chaque segment d'entreprise.
