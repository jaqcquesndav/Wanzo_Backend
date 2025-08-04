# Guide d'interface utilisateur pour les abonnements et tokens

Ce document fournit des directives pour la conception des interfaces utilisateur liées aux abonnements, aux plans tarifaires et aux tokens.

## Affichage des plans d'abonnement

### Grille de comparaison des plans

L'interface de comparaison des plans doit présenter les différents plans sous forme de grille avec:

#### Plans PME

```
┌────────────────┬─────────────────┬────────────────────┐
│                │  PME FREEMIUM   │   PME STANDARD     │
├────────────────┼─────────────────┼────────────────────┤
│ Prix mensuel   │    Gratuit      │      20,00 $       │
├────────────────┼─────────────────┼────────────────────┤
│ Prix annuel    │    Gratuit      │     200,00 $       │
│                │                 │ (16,67% économie)  │
├────────────────┼─────────────────┼────────────────────┤
│ Tokens/mois    │    100K         │       2M           │
├────────────────┼─────────────────┼────────────────────┤
│ Report tokens  │     Non         │   Oui (3 mois)     │
├────────────────┼─────────────────┼────────────────────┤
│ Clients max    │     50          │     Illimité       │
├────────────────┼─────────────────┼────────────────────┤
│ Compta avancée │     Non         │       Oui          │
├────────────────┼─────────────────┼────────────────────┤
│ Analyse IA     │   Limitée       │     Complète       │
└────────────────┴─────────────────┴────────────────────┘
```

#### Plans Institution Financière

```
┌────────────────┬─────────────────────┬─────────────────────┐
│                │  INST. FREEMIUM     │  INST. PROFESSIONAL │
├────────────────┼─────────────────────┼─────────────────────┤
│ Prix mensuel   │      Gratuit        │      100,00 $       │
├────────────────┼─────────────────────┼─────────────────────┤
│ Prix annuel    │      Gratuit        │     1 000,00 $      │
│                │                     │  (16,67% économie)  │
├────────────────┼─────────────────────┼─────────────────────┤
│ Tokens/mois    │      500K           │        10M          │
├────────────────┼─────────────────────┼─────────────────────┤
│ Report tokens  │       Non           │    Oui (6 mois)     │
├────────────────┼─────────────────────┼─────────────────────┤
│ Prospection    │  10 entreprises     │      Illimitée      │
├────────────────┼─────────────────────┼─────────────────────┤
│ Utilisateurs   │       Non           │    Oui (20 max)     │
├────────────────┼─────────────────────┼─────────────────────┤
│ Support dédié  │       Non           │        Oui          │
└────────────────┴─────────────────────┴─────────────────────┘
```

### Sélecteur de plan tarifaire

Les plans doivent être présentés avec:

1. **Cards/Tuiles visuelles** - Une carte par plan avec:
   - Nom du plan
   - Prix (mensuel/annuel avec toggle)
   - Allocation de tokens mensuelle
   - Principales fonctionnalités (3-5 points)
   - Bouton CTA "Choisir ce plan" ou "Plan actuel"

2. **Toggle mensuel/annuel** avec affichage des économies:
   ```
   ┌─────────────┐  ┌─────────────┐
   │  Mensuel    │  │   Annuel    │
   └─────────────┘  └─────────────┘
                    Économisez 20%
   ```

### Badges et étiquettes spécifiques

- Badge "Plan actuel" sur le plan souscrit
- Badge "Plus populaire" sur le plan recommandé
- Badge "Économisez X%" sur les plans annuels

## Gestion des tokens

### Tableau de bord des tokens

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Solde actuel de tokens: 4,880,000                          │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Allocation  │ │  Achetés    │ │   Bonus     │           │
│  │  1,000,000  │ │ 4,000,000   │ │     0       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  [Acheter plus de tokens]                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Historique d'utilisation

```
┌─────────────────────────────────────────────────────────────┐
│  Historique d'utilisation des tokens                        │
│                                                             │
│  Date       │ Fonctionnalité      │ Tokens    │ Solde       │
│  04/08/2025 │ Analyse document    │ -5,000    │ 4,880,000   │
│  03/08/2025 │ Achat package       │ +1,000,000│ 4,885,000   │
│  02/08/2025 │ Chat AI             │ -2,500    │ 3,885,000   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Achat de tokens

L'interface d'achat de tokens doit présenter:

1. **Packages de tokens disponibles**:
   ```
   ┌───────────────────────────┐ ┌───────────────────────────┐
   │  Pack Starter             │ │  Pack Business            │
   │                           │ │                           │
   │  500 000 tokens           │ │  2 000 000 tokens         │
   │  5,00 $ (10,00 $/million) │ │  18,00 $ (9,00 $/million) │
   │                           │ │  + 10% tokens bonus       │
   │  [Acheter]                │ │  [Acheter]                │
   └───────────────────────────┘ └───────────────────────────┘
   ```
   ```
   ┌───────────────────────────┐ ┌───────────────────────────┐
   │  Pack Enterprise          │ │  Pack Institutional       │
   │                           │ │                           │
   │  10 000 000 tokens        │ │  50 000 000 tokens        │
   │  80,00 $ (8,00 $/million) │ │  350,00 $ (7,00 $/million)│
   │  + 25% tokens bonus       │ │  + 30% tokens bonus       │
   │  [Acheter]                │ │  [Acheter]                │
   └───────────────────────────┘ └───────────────────────────┘
   ```

2. **Estimation de consommation**:
   ```
   Avec ce package, vous pourrez:
   - Analyser environ 200 documents
   - Générer environ 500 rapports
   - Utiliser le chat AI pendant environ 1000 sessions
   ```

## Informations sur la consommation

### Jauge d'utilisation

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Utilisation mensuelle: 120,000 / 1,000,000 tokens          │
│                                                             │
│  [███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 12%              │
│                                                             │
│  Il vous reste 880,000 tokens pour ce mois                  │
│  Renouvellement le 01/09/2025                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Détail par fonctionnalité

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Utilisation par fonctionnalité                             │
│                                                             │
│  Chat AI                  │ 50,000 tokens    │ 42%          │
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░]                     │
│                                                             │
│  Analyse de documents     │ 40,000 tokens    │ 33%          │
│  [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]                     │
│                                                             │
│  Génération de rapports   │ 30,000 tokens    │ 25%          │
│  [████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Pages recommandées

1. **Page de comparaison des plans** - Vue d'ensemble de tous les plans disponibles
2. **Page d'abonnement actuel** - Détails du plan souscrit et options de mise à niveau
3. **Page de gestion des tokens** - Dashboard de suivi de l'utilisation des tokens
4. **Page d'achat de tokens** - Interface pour acheter des packages supplémentaires
5. **Page d'historique des transactions** - Suivi des achats et de la consommation

## Composants réutilisables

1. **Carte de plan** - Affichage standardisé d'un plan d'abonnement
2. **Jauge de tokens** - Indicateur visuel du solde restant
3. **Tableau d'utilisation** - Suivi détaillé de la consommation
4. **Calculateur d'économie** - Pour comparer les prix mensuels et annuels
5. **Carte de package de tokens** - Affichage des options d'achat de tokens

## Notifications et alertes

1. **Seuil bas de tokens** - "Vous n'avez plus que 10% de vos tokens pour ce mois"
2. **Renouvellement mensuel** - "Votre allocation de tokens a été renouvelée"
3. **Limite de fonctionnalité** - "Vous avez atteint 80% de votre limite pour cette fonctionnalité"
4. **Confirmation d'achat** - "Votre achat de tokens a été confirmé"

Ces interfaces permettront aux utilisateurs de comprendre clairement leur abonnement, suivre leur consommation de tokens et effectuer des achats supplémentaires si nécessaire.
