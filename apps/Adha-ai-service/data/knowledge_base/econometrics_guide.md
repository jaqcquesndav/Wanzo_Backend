# Base de Connaissances - Économétrie Financière

## Statistiques Descriptives

### Mesures de Tendance Centrale

#### Moyenne Arithmétique
```
μ = Σxi / n
```
- Sensible aux valeurs extrêmes
- Utilisée pour rendements normalement distribués

#### Médiane
- Valeur centrale de la distribution
- Robuste aux outliers
- Préférable pour distributions asymétriques

#### Mode
- Valeur la plus fréquente
- Utile pour données catégorielles
- Peut être multimodal

### Mesures de Dispersion

#### Variance et Écart-Type
```
σ² = Σ(xi - μ)² / n
σ = √σ²
```

#### Coefficient de Variation
```
CV = σ / μ
```
- Mesure relative de risque
- Permet comparaison entre actifs

#### Étendue Interquartile (IQR)
```
IQR = Q3 - Q1
```
- Mesure robuste de dispersion
- Utilisée pour détecter outliers

### Mesures de Forme

#### Asymétrie (Skewness)
```
Skewness = E[(X - μ)³] / σ³
```
- > 0 : Distribution étalée à droite
- < 0 : Distribution étalée à gauche
- = 0 : Distribution symétrique

#### Aplatissement (Kurtosis)
```
Kurtosis = E[(X - μ)⁴] / σ⁴
```
- > 3 : Distribution leptokurtique (queues épaisses)
- < 3 : Distribution platykurtique
- = 3 : Distribution normale

## Corrélation et Régression

### Coefficient de Corrélation de Pearson

#### Formule
```
r = Σ[(xi - x̄)(yi - ȳ)] / √[Σ(xi - x̄)² × Σ(yi - ȳ)²]
```

#### Interprétation
- **|r| > 0,8** : Corrélation forte
- **0,5 < |r| < 0,8** : Corrélation modérée
- **0,3 < |r| < 0,5** : Corrélation faible
- **|r| < 0,3** : Corrélation très faible

### Régression Linéaire Simple

#### Modèle
```
Y = α + βX + ε
```

#### Méthode des Moindres Carrés Ordinaires (MCO)
```
β = Σ[(xi - x̄)(yi - ȳ)] / Σ(xi - x̄)²
α = ȳ - β × x̄
```

#### Coefficient de Détermination (R²)
```
R² = 1 - SSR/SST
```
- **SSR** : Somme des carrés des résidus
- **SST** : Somme totale des carrés
- Proportion de variance expliquée par le modèle

### Tests Statistiques

#### Test de Significativité de β
```
t = β / SE(β)
```
- **H₀** : β = 0 (pas de relation)
- **H₁** : β ≠ 0 (relation significative)

#### Test de Fisher (F-test)
```
F = R² / (1 - R²) × (n - 2)
```
- Test de significativité globale du modèle

## Séries Temporelles Financières

### Composantes des Séries

#### Décomposition
```
Yt = Trendt + Saisonnalitét + Cyclique_t + Irrégulier_t
```

#### Stationnarité
Série stationnaire si :
- Moyenne constante
- Variance constante  
- Covariance dépendant uniquement du décalage

### Test de Stationnarité

#### Test de Dickey-Fuller Augmenté (ADF)
```
ΔYt = α + βt + δYt-1 + Σφi×ΔYt-i + εt
```
- **H₀** : δ = 0 (racine unitaire, non-stationnaire)
- **H₁** : δ < 0 (stationnaire)

#### Test de Phillips-Perron (PP)
Alternative robuste au test ADF

### Modèles de Prévision

#### Moyennes Mobiles
```
Prévision_t+1 = (Yt + Yt-1 + ... + Yt-n+1) / n
```

#### Lissage Exponentiel Simple
```
Prévision_t+1 = α × Yt + (1-α) × Prévision_t
```
- **α** : Constante de lissage (0 < α < 1)

#### Modèle Linéaire de Tendance
```
Yt = α + β × t + εt
```

## Modèles ARIMA

### Processus AutoRegressif AR(p)
```
Yt = φ₁Yt-1 + φ₂Yt-2 + ... + φpYt-p + εt
```

### Processus Moyennes Mobiles MA(q)
```
Yt = μ + εt + θ₁εt-1 + θ₂εt-2 + ... + θqεt-q
```

### Modèle ARIMA(p,d,q)
```
(1 - φ₁L - ... - φpLᵖ)(1-L)ᵈYt = (1 + θ₁L + ... + θqLᵠ)εt
```

#### Identification du Modèle
1. **Stationnarisation** : Différenciation si nécessaire
2. **Identification p,q** : ACF et PACF
3. **Estimation** : Maximum de vraisemblance
4. **Validation** : Analyse des résidus

## Applications en Finance

### Modèle d'Évaluation des Actifs Financiers (MEDAF)

#### Modèle
```
Ri = Rf + βi(Rm - Rf) + εi
```
- **Ri** : Rendement de l'actif i
- **Rf** : Taux sans risque
- **Rm** : Rendement du marché
- **βi** : Beta de l'actif

#### Calcul du Beta
```
βi = Cov(Ri, Rm) / Var(Rm)
```

### Modèle Multi-facteurs

#### Modèle de Fama-French 3 facteurs
```
Ri - Rf = αi + βi(Rm - Rf) + siSMB + hiHML + εi
```
- **SMB** : Small Minus Big (effet taille)
- **HML** : High Minus Low (effet valeur)

### Value at Risk (VaR)

#### Méthode Paramétrique
```
VaR = μ + σ × zα
```
- **zα** : Quantile de la distribution normale

#### Méthode Historique
- Utilise distribution empirique des rendements
- VaR = Quantile α de l'historique

#### Méthode Monte Carlo
- Simulation de scénarios
- Estimation de la distribution des pertes

## Analyse de Volatilité

### Modèles GARCH

#### GARCH(1,1)
```
σt² = ω + αεt-1² + βσt-1²
```
- Modélise volatilité conditionnelle
- Capture clustering de volatilité

#### EGARCH
Modèle asymétrique pour effet de levier

### Corrélations Conditionnelles

#### DCC-GARCH
```
Ht = DtRtDt
```
- **Dt** : Matrice des volatilités
- **Rt** : Matrice de corrélations

## Tests Économétriques Avancés

### Test de Causalité de Granger
```
Yt = α + Σβi×Yt-i + Σγj×Xt-j + εt
```
- **H₀** : γj = 0 ∀j (X ne cause pas Y)

### Cointégration (Engle-Granger)
1. Test de stationnarité des séries
2. Régression de cointégration
3. Test de stationnarité des résidus

### Modèles à Correction d'Erreur (ECM)
```
ΔYt = α + βΔXt + λ(Yt-1 - γXt-1) + εt
```

## Applications Sectorielles RDC

### Analyse Macroéconomique

#### Relations Prix-Exchange Rate
```
Inflation_t = α + β×ΔExchange_Rate_t + εt
```

#### Modèle de Demande de Monnaie
```
ln(M/P) = α + β×ln(Y) + γ×r + εt
```

### Secteur Minier

#### Modèle Prix Commodités
```
ΔPrix_t = α + β×ΔDemande_mondiale_t + γ×ΔOffre_t + εt
```

#### Volatilité Prix Cuivre
Modèle GARCH pour prévision risque

### Secteur Bancaire

#### Modèle de Risque de Crédit
```
PD_t = Φ(α + β×Macro_t + γ×Secteur_t)
```
- **PD** : Probabilité de défaut
- **Φ** : Fonction de répartition normale

## Outils et Logiciels

### R - Packages Essentiels
- **forecast** : Modèles de prévision
- **tseries** : Tests de séries temporelles
- **rugarch** : Modèles GARCH
- **vars** : Modèles VAR

### Python - Bibliothèques
- **statsmodels** : Économétrie
- **scikit-learn** : Machine learning
- **pandas** : Manipulation données
- **numpy/scipy** : Calculs numériques

### Fonctions Excel
- **CORREL** : Coefficient de corrélation
- **SLOPE/INTERCEPT** : Régression linéaire
- **RSQ** : R-carré
- **FORECAST** : Prévision linéaire

## Interprétation des Résultats

### Diagnostic de Régression

#### Hypothèses MCO
1. **Linéarité** : Relation linéaire
2. **Indépendance** : Erreurs indépendantes
3. **Homoscédasticité** : Variance constante
4. **Normalité** : Erreurs normalement distribuées

#### Tests de Validation
- **Test de Durbin-Watson** : Autocorrélation
- **Test de White** : Hétéroscédasticité
- **Test de Jarque-Bera** : Normalité

### Qualité des Prévisions

#### Mesures d'Erreur
```
MAE = Σ|et| / n
MSE = Σet² / n
MAPE = Σ|et/yt| / n × 100
```

#### Critères d'Information
```
AIC = -2ln(L) + 2k
BIC = -2ln(L) + k×ln(n)
```
- Comparaison de modèles
- Plus faible = meilleur

## Recommandations Pratiques

### Données Financières RDC
- **Fréquence** : Mensuelle minimum
- **Période** : 5-10 ans si disponible
- **Sources** : BCC, INS, FMI
- **Qualité** : Vérifier cohérence et outliers

### Modélisation
1. **Explorer** données graphiquement
2. **Tester** stationnarité
3. **Estimer** plusieurs modèles
4. **Valider** sur échantillon test
5. **Interpréter** économiquement

### Limites et Précautions
- Corrélation ≠ Causalité
- Structural breaks dans pays émergents
- Données limitées/peu fiables
- Régimes multiples possibles

---
*Source : Méthodologies économétriques adaptées aux marchés émergents*
*Mise à jour : Janvier 2025*
