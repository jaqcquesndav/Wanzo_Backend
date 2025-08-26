# Guide d'Analyse de Performance des Portefeuilles

## Introduction à l'Analyse de Performance

L'analyse de performance des portefeuilles de crédit évalue l'efficacité et la rentabilité des stratégies de crédit selon les segments d'entreprises et classes d'actifs. Cette analyse est cruciale pour l'optimisation des allocations et la gestion des risques.

## Métriques de Performance Fondamentales

### Indicateurs de Rentabilité

**Return on Assets (ROA) Ajusté par Segment:**
```python
def calcul_roa_ajuste(portefeuille, segment, periode='annuel'):
    """
    ROA ajusté pour les risques et coûts opérationnels spécifiques
    """
    
    # Paramètres par segment (RDC)
    parametres = {
        'micro': {
            'cout_operationnel_unitaire': 150_000,  # CDF par crédit
            'taux_perte_attendu': 0.08,
            'cout_fonds_base': 0.12
        },
        'pme': {
            'cout_operationnel_unitaire': 500_000,  # CDF par crédit
            'taux_perte_attendu': 0.04,
            'cout_fonds_base': 0.10
        },
        'me': {
            'cout_operationnel_unitaire': 1_200_000,  # CDF par crédit
            'taux_perte_attendu': 0.02,
            'cout_fonds_base': 0.09
        }
    }
    
    param = parametres[segment]
    
    # Calculs revenus
    revenus_interets = sum(c.interets_pergus_periode for c in portefeuille)
    revenus_commissions = sum(c.commissions_periode for c in portefeuille)
    revenus_totaux = revenus_interets + revenus_commissions
    
    # Calculs coûts
    cout_fonds = sum(c.solde_moyen * param['cout_fonds_base'] for c in portefeuille)
    cout_operationnel = len(portefeuille) * param['cout_operationnel_unitaire']
    cout_risque = sum(c.solde_moyen * param['taux_perte_attendu'] for c in portefeuille)
    couts_totaux = cout_fonds + cout_operationnel + cout_risque
    
    # ROA ajusté
    resultat_net = revenus_totaux - couts_totaux
    actifs_moyens = sum(c.solde_moyen for c in portefeuille)
    
    roa_ajuste = resultat_net / actifs_moyens if actifs_moyens > 0 else 0
    
    return {
        'roa_ajuste': roa_ajuste,
        'decomposition': {
            'revenus_totaux': revenus_totaux,
            'cout_fonds': cout_fonds,
            'cout_operationnel': cout_operationnel,
            'cout_risque': cout_risque,
            'resultat_net': resultat_net
        },
        'benchmark_sectoriel': get_benchmark_roa(segment, 'rdc'),
        'performance_relative': roa_ajuste / get_benchmark_roa(segment, 'rdc') - 1
    }
```

**Return on Risk-Weighted Assets (RORWA):**
```python
def calcul_rorwa(portefeuille, segment):
    """
    Rendement ajusté par les actifs pondérés du risque (Bâle)
    """
    
    # Pondérations risque par type de garantie et client
    ponderations_risque = {
        'micro': {
            'garanti_depot': 0.20,
            'garanti_hypotheque': 0.50,
            'garanti_nantissement': 0.75,
            'non_garanti': 1.50
        },
        'pme': {
            'garanti_depot': 0.20,
            'garanti_hypotheque': 0.35,
            'garanti_nantissement': 0.50,
            'rating_a': 0.75,
            'rating_b': 1.00,
            'rating_c': 1.25
        }
    }
    
    actifs_ponderes = 0
    for credit in portefeuille:
        type_garantie = determiner_type_garantie(credit)
        ponderation = ponderations_risque[segment].get(type_garantie, 1.0)
        actifs_ponderes += credit.solde * ponderation
    
    roa_standard = calcul_roa_ajuste(portefeuille, segment)['roa_ajuste']
    actifs_totaux = sum(c.solde for c in portefeuille)
    
    rorwa = roa_standard * (actifs_totaux / actifs_ponderes) if actifs_ponderes > 0 else 0
    
    return {
        'rorwa': rorwa,
        'ratio_ponderation': actifs_ponderes / actifs_totaux,
        'adequation_fonds_propres': rorwa > 0.15  # Seuil réglementaire
    }
```

### Indicateurs de Qualité

**Evolution du Portfolio at Risk (PAR):**
```python
def analyse_evolution_par(historique_portefeuille, segments=['micro', 'pme']):
    """
    Analyse tendancielle de la qualité du portefeuille
    """
    
    evolution = {}
    
    for segment in segments:
        evolution[segment] = {
            'par_30': [],
            'par_90': [],
            'par_180': [],
            'dates': []
        }
        
        for date, portefeuille in historique_portefeuille.items():
            credits_segment = [c for c in portefeuille if c.segment == segment]
            
            # Calcul PAR pour différents seuils
            for seuil in [30, 90, 180]:
                par = calcul_par(credits_segment, seuil)
                evolution[segment][f'par_{seuil}'].append(par)
            
            evolution[segment]['dates'].append(date)
        
        # Analyse de tendance
        evolution[segment]['tendance'] = analyser_tendance(evolution[segment]['par_30'])
        evolution[segment]['volatilite'] = calculer_volatilite(evolution[segment]['par_30'])
        evolution[segment]['correlation_macro'] = correlation_indicateurs_macro(evolution[segment])
    
    return evolution

def analyser_tendance(serie_par):
    """Régression linéaire pour identifier la tendance"""
    x = list(range(len(serie_par)))
    y = serie_par
    
    # Régression simple y = ax + b
    n = len(x)
    a = (n * sum(x[i] * y[i] for i in range(n)) - sum(x) * sum(y)) / (n * sum(x[i]**2 for i in range(n)) - sum(x)**2)
    
    return {
        'pente': a,
        'direction': 'hausse' if a > 0.001 else 'baisse' if a < -0.001 else 'stable',
        'significance': abs(a) > 0.002  # Seuil de significativité
    }
```

**Analyse de Vintage (Cohortes):**
```python
def analyse_vintage(credits_par_cohorte):
    """
    Analyse de performance par cohorte d'origination
    """
    
    resultats_vintage = {}
    
    for periode_origination, credits in credits_par_cohorte.items():
        # Performance à différents moments (3, 6, 12, 24 mois)
        performance_temporelle = {}
        
        for mois_observation in [3, 6, 12, 24]:
            credits_observables = [c for c in credits 
                                 if c.anciennete_mois >= mois_observation]
            
            if credits_observables:
                par_30 = calcul_par(credits_observables, 30)
                taux_defaut = calcul_taux_defaut_realise(credits_observables, mois_observation)
                
                performance_temporelle[f'mois_{mois_observation}'] = {
                    'par_30': par_30,
                    'taux_defaut_realise': taux_defaut,
                    'nombre_credits': len(credits_observables)
                }
        
        # Analyse des facteurs d'influence
        facteurs_influence = analyser_facteurs_cohorte(credits, periode_origination)
        
        resultats_vintage[periode_origination] = {
            'performance_temporelle': performance_temporelle,
            'facteurs_influence': facteurs_influence,
            'benchmark_vs_autres_cohortes': comparer_avec_autres_cohortes(
                performance_temporelle, credits_par_cohorte
            )
        }
    
    return resultats_vintage

def analyser_facteurs_cohorte(credits, periode):
    """Facteurs explicatifs performance cohorte"""
    return {
        'contexte_macro': get_contexte_macro_rdc(periode),
        'politique_credit': get_politique_credit_periode(periode),
        'composition_portefeuille': analyser_composition(credits),
        'qualite_origination': evaluer_qualite_origination(credits)
    }
```

## Performance par Classe d'Actifs

### Crédits de Fonctionnement

**Analyse de Rotation et Utilisation:**
```python
def analyse_credits_fonctionnement(portefeuille_ct):
    """
    Analyse spécifique aux crédits court terme / fonctionnement
    """
    
    metriques = {}
    
    for segment in ['micro', 'pme']:
        credits_segment = [c for c in portefeuille_ct if c.segment == segment]
        
        # Taux d'utilisation des lignes
        utilisation_moyenne = moyenne([
            c.solde_utilise / c.ligne_autorisee 
            for c in credits_segment if c.ligne_autorisee > 0
        ])
        
        # Rotation du crédit (nombre de cycles par an)
        rotation_moyenne = moyenne([
            c.chiffre_affaires_annuel / c.ligne_autorisee
            for c in credits_segment if c.ligne_autorisee > 0
        ])
        
        # Efficacité du BFR
        efficacite_bfr = moyenne([
            c.chiffre_affaires_annuel / c.besoin_fonds_roulement
            for c in credits_segment if c.besoin_fonds_roulement > 0
        ])
        
        # Marge sur coût du risque
        marge_nette = calcul_marge_nette_segment(credits_segment)
        
        metriques[segment] = {
            'utilisation_ligne': utilisation_moyenne,
            'rotation_credit': rotation_moyenne,
            'efficacite_bfr': efficacite_bfr,
            'marge_nette': marge_nette,
            'performance_vs_benchmark': comparer_benchmark_ct(segment, {
                'utilisation': utilisation_moyenne,
                'rotation': rotation_moyenne,
                'marge': marge_nette
            })
        }
    
    return metriques
```

### Crédits d'Investissement

**Analyse de Performance Long Terme:**
```python
def analyse_credits_investissement(portefeuille_lt):
    """
    Analyse spécifique aux crédits d'investissement
    """
    
    for segment in ['pme', 'me']:
        credits_segment = [c for c in portefeuille_lt if c.segment == segment]
        
        # Analyse de la capacité de remboursement projetée vs réalisée
        performance_projections = []
        
        for credit in credits_segment:
            if credit.anciennete_mois >= 12:  # Au moins 1 an de recul
                # Comparaison flux projetés vs réalisés
                flux_projetes = credit.business_plan.flux_tresorerie_projetes
                flux_realises = credit.flux_tresorerie_realises
                
                precision_projections = calculer_precision_projections(
                    flux_projetes, flux_realises
                )
                
                performance_projections.append({
                    'credit_id': credit.id,
                    'precision_ca': precision_projections['chiffre_affaires'],
                    'precision_ebitda': precision_projections['ebitda'],
                    'precision_flux_libre': precision_projections['flux_libre'],
                    'impact_sur_remboursement': precision_projections['impact_remboursement']
                })
        
        # Analyse ROI des investissements financés
        roi_investissements = analyser_roi_investissements(credits_segment)
        
        # Performance vs objectifs sectoriels
        performance_sectorielle = analyser_performance_sectorielle(credits_segment)
        
        resultats[segment] = {
            'precision_projections': performance_projections,
            'roi_moyen_investissements': roi_investissements,
            'performance_sectorielle': performance_sectorielle,
            'facteurs_reussite': identifier_facteurs_reussite(credits_segment)
        }
    
    return resultats
```

## Benchmarking et Analyse Comparative

### Benchmarks Marché RDC

**Indicateurs de Référence par Segment:**
```python
def etablir_benchmarks_rdc():
    """
    Benchmarks spécifiques au marché congolais
    """
    
    benchmarks = {
        'micro_entreprises': {
            'par_30_excellent': 0.03,      # < 3%
            'par_30_bon': 0.06,           # 3-6%
            'par_30_acceptable': 0.12,     # 6-12%
            'roa_minimum': 0.15,           # 15%
            'marge_nette_cible': 0.18,     # 18%
            'cout_operationnel_max': 0.08, # 8% de l'encours
            'taux_croissance_cible': 0.25  # 25% annuel
        },
        'pme': {
            'par_30_excellent': 0.02,      # < 2%
            'par_30_bon': 0.04,           # 2-4%
            'par_30_acceptable': 0.08,     # 4-8%
            'roa_minimum': 0.12,           # 12%
            'marge_nette_cible': 0.15,     # 15%
            'cout_operationnel_max': 0.05, # 5% de l'encours
            'taux_croissance_cible': 0.20  # 20% annuel
        },
        'moyennes_entreprises': {
            'par_30_excellent': 0.01,      # < 1%
            'par_30_bon': 0.025,          # 1-2.5%
            'par_30_acceptable': 0.05,     # 2.5-5%
            'roa_minimum': 0.10,           # 10%
            'marge_nette_cible': 0.12,     # 12%
            'cout_operationnel_max': 0.03, # 3% de l'encours
            'taux_croissance_cible': 0.15  # 15% annuel
        }
    }
    
    # Ajustements contextuels RDC
    facteurs_ajustement = {
        'instabilite_monetaire': 1.15,    # +15% marge sécurité
        'infrastructure_limitee': 1.10,   # +10% coûts opérationnels
        'risque_politique': 1.20          # +20% prime de risque
    }
    
    return appliquer_ajustements_contextuels(benchmarks, facteurs_ajustement)
```

### Analyse Concurrentielle

**Positionnement vs Concurrents:**
```python
def analyse_concurrentielle(notre_portefeuille, donnees_marche):
    """
    Positionnement concurrentiel sur le marché RDC
    """
    
    concurrents = ['Rawbank', 'BCDC', 'TMB', 'Equity Bank', 'Access Bank']
    
    comparaison = {}
    
    for segment in ['micro', 'pme']:
        notre_performance = calculer_kpis_segment(notre_portefeuille, segment)
        
        positionnement = {}
        
        for kpi in ['par_30', 'roa', 'marge_nette', 'croissance']:
            notre_valeur = notre_performance[kpi]
            
            # Ranking vs concurrents (données estimées/publiques)
            valeurs_marche = [donnees_marche[concurrent][segment][kpi] 
                            for concurrent in concurrents 
                            if concurrent in donnees_marche]
            
            percentile = calculer_percentile(notre_valeur, valeurs_marche)
            
            positionnement[kpi] = {
                'notre_valeur': notre_valeur,
                'mediane_marche': np.median(valeurs_marche),
                'percentile': percentile,
                'ecart_mediane': (notre_valeur / np.median(valeurs_marche) - 1) * 100,
                'rang_estime': calculer_rang(notre_valeur, valeurs_marche, kpi)
            }
        
        # Avantages concurrentiels identifiés
        avantages = identifier_avantages_concurrentiels(positionnement)
        
        # Axes d'amélioration prioritaires
        ameliorations = identifier_axes_amelioration(positionnement)
        
        comparaison[segment] = {
            'positionnement_kpis': positionnement,
            'avantages_concurrentiels': avantages,
            'axes_amelioration': ameliorations,
            'strategie_recommandee': formuler_strategie_segment(
                positionnement, avantages, ameliorations
            )
        }
    
    return comparaison
```

## Tableaux de Bord et Reporting

### Dashboard Exécutif

**KPIs de Pilotage Stratégique:**
```python
def generer_dashboard_executif(portefeuille, periode='mensuel'):
    """
    Tableau de bord de pilotage pour la direction
    """
    
    dashboard = {
        'resume_executif': {
            'encours_total': sum(c.solde for c in portefeuille),
            'nombre_clients': len(set(c.client_id for c in portefeuille)),
            'par_30_global': calcul_par(portefeuille, 30),
            'roa_global': calcul_roa_ajuste(portefeuille, 'global')['roa_ajuste'],
            'croissance_encours': calcul_croissance_encours(portefeuille, periode)
        },
        
        'performance_par_segment': {
            segment: {
                'encours': sum(c.solde for c in portefeuille if c.segment == segment),
                'par_30': calcul_par([c for c in portefeuille if c.segment == segment], 30),
                'roa': calcul_roa_ajuste([c for c in portefeuille if c.segment == segment], segment)['roa_ajuste'],
                'nb_clients': len([c for c in portefeuille if c.segment == segment]),
                'ticket_moyen': moyenne([c.solde for c in portefeuille if c.segment == segment])
            }
            for segment in ['micro', 'pme', 'me']
        },
        
        'alertes_et_risques': generer_alertes_automatiques(portefeuille),
        
        'objectifs_vs_realise': comparer_objectifs_realisation(portefeuille, periode),
        
        'tendances_cles': analyser_tendances_cles(portefeuille),
        
        'actions_recommandees': generer_actions_prioritaires(portefeuille)
    }
    
    return dashboard
```

Cette approche structurée de l'analyse de performance permet un pilotage efficace et une optimisation continue des portefeuilles de crédit, adaptée aux spécificités du marché congolais et aux différents segments d'entreprises.
