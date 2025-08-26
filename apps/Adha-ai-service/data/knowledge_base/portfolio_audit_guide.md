# Guide d'Audit des Portefeuilles de Crédit

## Introduction à l'Audit de Portefeuille

L'audit des portefeuilles de crédit est un processus systématique d'évaluation de la qualité, de la performance et des risques d'un ensemble de crédits. Il doit être adapté aux spécificités des micro-entreprises et PME.

## Méthodologie d'Audit par Segment

### Échantillonnage Statistique

**Micro-Entreprises:**
```python
# Échantillonnage par strates
def echantillonnage_micro(portefeuille):
    strates = {
        'montant_faible': [c for c in portefeuille if c.montant < 5_000_000],
        'montant_moyen': [c for c in portefeuille if 5_000_000 <= c.montant < 20_000_000],
        'montant_eleve': [c for c in portefeuille if c.montant >= 20_000_000]
    }
    
    echantillon = []
    for strate, credits in strates.items():
        taille_echantillon = min(30, max(5, len(credits) * 0.1))
        echantillon.extend(random.sample(credits, int(taille_echantillon)))
    
    return echantillon
```

**PME:**
```python
# Échantillonnage par risque et secteur
def echantillonnage_pme(portefeuille):
    # Classification par niveau de risque
    risque_faible = [c for c in portefeuille if c.score_interne >= 80]
    risque_moyen = [c for c in portefeuille if 60 <= c.score_interne < 80]
    risque_eleve = [c for c in portefeuille if c.score_interne < 60]
    
    # Échantillonnage proportionnel au risque
    echantillon = (
        random.sample(risque_faible, min(20, len(risque_faible))) +
        random.sample(risque_moyen, min(25, len(risque_moyen))) +
        random.sample(risque_eleve, min(len(risque_eleve), 35))  # 100% si < 35
    )
    
    return echantillon
```

## Analyse de la Qualité du Portefeuille

### Indicateurs Clés de Performance (KPI)

**Taux de Défaut par Segment:**
```python
def calcul_taux_defaut(portefeuille, segment):
    if segment == "micro":
        seuil_defaut = 30  # jours de retard
    elif segment == "pme":
        seuil_defaut = 90  # jours de retard
    
    credits_defaut = [c for c in portefeuille if c.jours_retard > seuil_defaut]
    
    taux_defaut_nombre = len(credits_defaut) / len(portefeuille)
    taux_defaut_montant = sum(c.solde for c in credits_defaut) / sum(c.solde for c in portefeuille)
    
    return {
        'taux_nombre': taux_defaut_nombre,
        'taux_montant': taux_defaut_montant,
        'benchmarks': {
            'micro_acceptable': 0.05,  # 5%
            'pme_acceptable': 0.03     # 3%
        }
    }
```

**Portfolio at Risk (PAR):**
```python
def calcul_par(portefeuille, jours_retard=30):
    """
    PAR 30: Portion du portefeuille avec retards > 30 jours
    """
    solde_total = sum(c.solde_restant for c in portefeuille)
    solde_retard = sum(c.solde_restant for c in portefeuille 
                      if c.jours_retard > jours_retard)
    
    par = solde_retard / solde_total if solde_total > 0 else 0
    
    # Benchmarks sectoriels RDC
    benchmarks = {
        'excellent': 0.02,    # < 2%
        'bon': 0.05,          # 2-5%
        'acceptable': 0.10,   # 5-10%
        'problematique': 0.15 # > 15%
    }
    
    return {
        'par_30': par,
        'classification': get_classification(par, benchmarks),
        'evolution_tendance': calcul_tendance_par(portefeuille)
    }
```

### Analyse de Concentration

**Concentration par Secteur:**
```python
def analyse_concentration_sectorielle(portefeuille):
    concentration = {}
    montant_total = sum(c.montant for c in portefeuille)
    
    for credit in portefeuille:
        secteur = credit.secteur_activite
        if secteur not in concentration:
            concentration[secteur] = 0
        concentration[secteur] += credit.montant
    
    # Calcul de l'indice de Herfindahl-Hirschman
    hhi = sum((montant/montant_total)**2 for montant in concentration.values())
    
    risques = []
    for secteur, montant in concentration.items():
        poids = montant / montant_total
        if poids > 0.25:  # Limite prudentielle 25%
            risques.append(f"Surconcentration {secteur}: {poids:.1%}")
    
    return {
        'concentration_par_secteur': {s: m/montant_total for s, m in concentration.items()},
        'hhi': hhi,
        'niveau_concentration': 'Elevé' if hhi > 0.25 else 'Modéré' if hhi > 0.15 else 'Faible',
        'alertes': risques
    }
```

**Concentration Géographique:**
```python
def analyse_concentration_geographique(portefeuille):
    """Analyse spécifique RDC par province"""
    repartition_provinces = {}
    
    for credit in portefeuille:
        province = credit.localisation.province
        if province not in repartition_provinces:
            repartition_provinces[province] = {'nombre': 0, 'montant': 0}
        
        repartition_provinces[province]['nombre'] += 1
        repartition_provinces[province]['montant'] += credit.montant
    
    # Facteurs de risque géographique RDC
    facteurs_risque = {
        'Kinshasa': 0.8,      # Faible risque (centre économique)
        'Haut-Katanga': 0.9,  # Mining, infrastructure
        'Kongo-Central': 0.85, # Port de Matadi
        'Sud-Kivu': 1.3,     # Instabilité sécuritaire
        'Nord-Kivu': 1.4,    # Risque élevé
        'Ituri': 1.5         # Très haut risque
    }
    
    return {
        'repartition': repartition_provinces,
        'risque_pondere': sum(
            data['montant'] * facteurs_risque.get(prov, 1.2) 
            for prov, data in repartition_provinces.items()
        ),
        'recommandations': generer_recommandations_geo(repartition_provinces)
    }
```

## Tests de Conformité et Contrôles

### Vérification Documentation

**Check-list Micro-Entreprises:**
```python
def audit_documentation_micro(dossier_credit):
    checks = {
        'identite_complete': verifier_identite(dossier_credit),
        'justificatifs_revenus': verifier_revenus_micro(dossier_credit),
        'garanties_formalisees': verifier_garanties(dossier_credit),
        'autorisation_conjointe': verifier_autorisation_conjoint(dossier_credit),
        'assurance_vie': verifier_assurance(dossier_credit)
    }
    
    score_conformite = sum(checks.values()) / len(checks)
    
    anomalies = [test for test, resultat in checks.items() if not resultat]
    
    return {
        'score_conformite': score_conformite,
        'anomalies_detectees': anomalies,
        'actions_correctives': generer_actions_correctives(anomalies)
    }
```

**Check-list PME:**
```python
def audit_documentation_pme(dossier_credit):
    checks_obligatoires = {
        'etats_financiers_audites': verifier_audit_externe(dossier_credit),
        'business_plan_detaille': verifier_business_plan(dossier_credit),
        'autorisation_cnss': verifier_conformite_sociale(dossier_credit),
        'autorisation_dgi': verifier_conformite_fiscale(dossier_credit),
        'rccm_valide': verifier_registre_commerce(dossier_credit),
        'proces_verbaux_ca': verifier_gouvernance(dossier_credit)
    }
    
    checks_complementaires = {
        'analyse_sectorielle': verifier_etude_marche(dossier_credit),
        'projections_financieres': verifier_previsions(dossier_credit),
        'plan_remboursement': verifier_echeancier(dossier_credit)
    }
    
    return evaluer_conformite_complete(checks_obligatoires, checks_complementaires)
```

### Tests de Calculs et Ratios

**Vérification Scoring Interne:**
```python
def audit_scoring_interne(portefeuille):
    erreurs_calcul = []
    
    for credit in portefeuille:
        # Recalcul du score avec paramètres actuels
        score_recalcule = calculer_score_credit(credit)
        ecart = abs(score_recalcule - credit.score_enregistre)
        
        if ecart > 5:  # Tolérance 5 points
            erreurs_calcul.append({
                'credit_id': credit.id,
                'score_enregistre': credit.score_enregistre,
                'score_recalcule': score_recalcule,
                'ecart': ecart,
                'impact_decision': analyser_impact_decision(credit, score_recalcule)
            })
    
    return {
        'erreurs_detectees': len(erreurs_calcul),
        'taux_erreur': len(erreurs_calcul) / len(portefeuille),
        'details_erreurs': erreurs_calcul,
        'impact_financier': calculer_impact_financier(erreurs_calcul)
    }
```

## Analyse des Performances Financières

### Rendement du Portefeuille

**Calcul ROA/ROE par Segment:**
```python
def calcul_rentabilite_portefeuille(portefeuille, segment):
    """Return on Assets et Return on Equity par segment"""
    
    revenus_nets = 0
    couts_provisions = 0
    couts_operationnels = 0
    
    for credit in portefeuille:
        # Revenus d'intérêts
        revenus_nets += credit.interets_percus_ytd
        
        # Coûts de provision
        if credit.jours_retard > 0:
            taux_provision = determiner_taux_provision(credit.jours_retard, segment)
            couts_provisions += credit.solde * taux_provision
        
        # Coûts opérationnels (attribution par segment)
        if segment == "micro":
            cout_unitaire = 150_000  # CDF par crédit
        else:
            cout_unitaire = 500_000  # CDF par crédit PME
        
        couts_operationnels += cout_unitaire
    
    resultat_net = revenus_nets - couts_provisions - couts_operationnels
    actifs_moyens = sum(c.solde_moyen_annuel for c in portefeuille)
    
    roa = resultat_net / actifs_moyens if actifs_moyens > 0 else 0
    
    return {
        'revenus_nets': revenus_nets,
        'couts_provisions': couts_provisions,
        'couts_operationnels': couts_operationnels,
        'resultat_net': resultat_net,
        'roa': roa,
        'benchmark_sectoriel': get_benchmark_roa(segment)
    }
```

### Analyse de Marge

**Décomposition des Marges:**
```python
def analyse_marge_portefeuille(portefeuille):
    """Analyse détaillée des composantes de marge"""
    
    analyses = {}
    
    for segment in ['micro', 'pme']:
        credits_segment = [c for c in portefeuille if c.segment == segment]
        
        # Marge brute (avant provisions)
        taux_moyen = moyenne_ponderee([c.taux_interet for c in credits_segment],
                                    [c.solde for c in credits_segment])
        cout_fonds = get_cout_refinancement(segment)
        marge_brute = taux_moyen - cout_fonds
        
        # Marge nette (après provisions)
        taux_perte = calcul_taux_defaut(credits_segment, segment)['taux_montant']
        marge_nette = marge_brute - taux_perte
        
        # Marge opérationnelle (après coûts)
        cout_operationnel_relatif = calcul_cout_operationnel_relatif(segment)
        marge_operationnelle = marge_nette - cout_operationnel_relatif
        
        analyses[segment] = {
            'marge_brute': marge_brute,
            'marge_nette': marge_nette,
            'marge_operationnelle': marge_operationnelle,
            'decomposition': {
                'taux_client': taux_moyen,
                'cout_fonds': cout_fonds,
                'cout_risque': taux_perte,
                'cout_operationnel': cout_operationnel_relatif
            }
        }
    
    return analyses
```

## Tests de Stress et Sensibilité

### Scénarios de Stress Macro-économiques

**Scénario RDC - Choc des Matières Premières:**
```python
def scenario_stress_commodities(portefeuille):
    """Simulation baisse 30% cours cuivre/cobalt"""
    
    impacts_sectoriels = {
        'mining': {'prob_defaut': 2.5, 'perte_ldd': 0.4},
        'transport_mining': {'prob_defaut': 2.0, 'perte_ldd': 0.3},
        'commerce_general': {'prob_defaut': 1.5, 'perte_ldd': 0.25},
        'agriculture': {'prob_defaut': 1.2, 'perte_ldd': 0.2},
        'services_financiers': {'prob_defaut': 1.3, 'perte_ldd': 0.2}
    }
    
    perte_estimee = 0
    credits_impactes = 0
    
    for credit in portefeuille:
        secteur = credit.secteur_activite
        if secteur in impacts_sectoriels:
            # Probabilité de défaut ajustée
            prob_base = credit.probabilite_defaut
            multiplicateur = impacts_sectoriels[secteur]['prob_defaut']
            prob_stress = min(prob_base * multiplicateur, 0.95)
            
            # Perte en cas de défaut ajustée
            lgd_stress = impacts_sectoriels[secteur]['perte_ldd']
            
            # Perte attendue sous stress
            perte_stress = credit.solde * prob_stress * lgd_stress
            perte_estimee += perte_stress
            
            if prob_stress > 0.15:  # Seuil d'alerte
                credits_impactes += 1
    
    return {
        'perte_totale_estimee': perte_estimee,
        'pourcentage_portefeuille': perte_estimee / sum(c.solde for c in portefeuille),
        'credits_impactes': credits_impactes,
        'recommandations': generer_recommandations_stress(perte_estimee, credits_impactes)
    }
```

**Scénario Dévaluation CDF:**
```python
def scenario_stress_devaluation(portefeuille):
    """Simulation dévaluation 25% CDF vs USD"""
    
    for credit in portefeuille:
        # Impact selon exposition change
        if credit.devise == 'USD':
            impact = 0  # Crédits USD protégés
        elif credit.client.revenus_usd_pct > 0.5:
            impact = 0.15  # Clients avec revenus USD partiellement protégés
        else:
            impact = 0.25  # Impact plein pour clients CDF
        
        # Ajustement capacité de remboursement
        nouvelle_capacite = credit.capacite_remboursement * (1 - impact)
        ratio_couverture_ajuste = nouvelle_capacite / credit.mensualite
        
        if ratio_couverture_ajuste < 1.2:
            credit.classification_stress = 'A_SURVEILLER'
        elif ratio_couverture_ajuste < 1.0:
            credit.classification_stress = 'PROBLEMATIQUE'
```

## Recommandations et Plans d'Action

### Matrice de Risques et Actions

**Actions Correctives par Niveau de Risque:**
```python
def generer_plan_action(resultats_audit):
    actions = {
        'immediates': [],  # 0-30 jours
        'court_terme': [], # 1-3 mois
        'moyen_terme': []  # 3-12 mois
    }
    
    # Analyse PAR élevé
    if resultats_audit['par_30'] > 0.10:
        actions['immediates'].append({
            'action': 'Mise en place cellule de recouvrement renforcée',
            'responsable': 'Directeur Crédit',
            'delai': '15 jours',
            'budget': 25_000_000  # CDF
        })
    
    # Concentration sectorielle
    if resultats_audit['concentration']['hhi'] > 0.25:
        actions['court_terme'].append({
            'action': 'Diversification portefeuille - objectif HHI < 0.20',
            'responsable': 'Comité de Crédit',
            'delai': '3 mois',
            'impact_attendu': 'Réduction risque systémique 30%'
        })
    
    # Conformité documentation
    if resultats_audit['score_conformite'] < 0.85:
        actions['immediates'].append({
            'action': 'Formation équipe crédit + audit 100% nouveaux dossiers',
            'responsable': 'Direction Risques',
            'delai': '30 jours',
            'budget': 15_000_000  # CDF
        })
    
    return actions
```

Ce guide d'audit permet une évaluation complète et systématique des portefeuilles de crédit, adaptée aux spécificités du marché congolais et aux différents segments d'entreprises.
