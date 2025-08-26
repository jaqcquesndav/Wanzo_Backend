"""
Calculateur de Due Diligence Financière
Implémentation des analyses pour due diligence d'entreprises
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any, Optional, Union
import logging

logger = logging.getLogger(__name__)

class DueDiligenceCalculator:
    """
    Calculateur pour les analyses de due diligence financière
    """
    
    def __init__(self):
        self.precision = Decimal('0.01')
    
    def analyze_financial_ratios(self, financial_data: Dict[str, Union[float, Decimal]]) -> Dict[str, Any]:
        """
        Analyse complète des ratios financiers pour due diligence
        """
        try:
            # Convertir en Decimal pour la précision
            data = {k: Decimal(str(v)) for k, v in financial_data.items()}
            
            ratios = {}
            warnings = []
            
            # Ratios de liquidité
            if 'actif_circulant' in data and 'passif_circulant' in data:
                liquidite_generale = data['actif_circulant'] / data['passif_circulant'] if data['passif_circulant'] != 0 else 0
                ratios['liquidite_generale'] = float(liquidite_generale.quantize(self.precision))
                
                if liquidite_generale < Decimal('1.0'):
                    warnings.append("Liquidité générale insuffisante (< 1.0)")
                elif liquidite_generale > Decimal('3.0'):
                    warnings.append("Liquidité générale excessive (> 3.0) - fonds dormants?")
            
            # Ratios de solvabilité
            if 'dettes_totales' in data and 'capitaux_propres' in data:
                if data['capitaux_propres'] != 0:
                    endettement = data['dettes_totales'] / data['capitaux_propres']
                    ratios['ratio_endettement'] = float(endettement.quantize(self.precision))
                    
                    if endettement > Decimal('2.0'):
                        warnings.append("Endettement élevé (> 200% des capitaux propres)")
            
            # Ratios de rentabilité
            if 'resultat_net' in data and 'chiffre_affaires' in data:
                if data['chiffre_affaires'] != 0:
                    marge_nette = (data['resultat_net'] / data['chiffre_affaires']) * 100
                    ratios['marge_nette_pct'] = float(marge_nette.quantize(self.precision))
                    
                    if marge_nette < 0:
                        warnings.append("Marge nette négative - entreprise en perte")
                    elif marge_nette < Decimal('5'):
                        warnings.append("Marge nette faible (< 5%)")
            
            if 'resultat_net' in data and 'capitaux_propres' in data:
                if data['capitaux_propres'] != 0:
                    roe = (data['resultat_net'] / data['capitaux_propres']) * 100
                    ratios['roe_pct'] = float(roe.quantize(self.precision))
                    
                    if roe < Decimal('10'):
                        warnings.append("ROE faible (< 10%)")
            
            # Ratios d'activité
            if 'chiffre_affaires' in data and 'actif_total' in data:
                if data['actif_total'] != 0:
                    rotation_actifs = data['chiffre_affaires'] / data['actif_total']
                    ratios['rotation_actifs'] = float(rotation_actifs.quantize(self.precision))
                    
                    if rotation_actifs < Decimal('0.5'):
                        warnings.append("Rotation des actifs faible (< 0.5)")
            
            return {
                'ratios_financiers': ratios,
                'warnings': warnings,
                'score_global': self._calculate_global_score(ratios)
            }
            
        except Exception as e:
            return {'error': f"Erreur analyse ratios: {str(e)}"}
    
    def analyze_cash_flow_quality(self, cash_flow_data: Dict[str, Union[float, Decimal]], 
                                 years: int = 3) -> Dict[str, Any]:
        """
        Analyse de la qualité des flux de trésorerie
        """
        try:
            data = {k: Decimal(str(v)) for k, v in cash_flow_data.items()}
            
            analysis = {}
            flags = []
            
            # Cash flow opérationnel vs résultat net
            if 'cash_flow_operationnel' in data and 'resultat_net' in data:
                if data['resultat_net'] != 0:
                    ratio_cf_resultat = data['cash_flow_operationnel'] / data['resultat_net']
                    analysis['ratio_cf_resultat'] = float(ratio_cf_resultat.quantize(self.precision))
                    
                    if ratio_cf_resultat < Decimal('0.8'):
                        flags.append("Cash flow opérationnel faible vs résultat (< 80%)")
                    elif ratio_cf_resultat > Decimal('1.5'):
                        flags.append("Excellente conversion résultat/cash flow")
            
            # Stabilité des cash flows
            if 'cash_flows_historiques' in cash_flow_data:
                cf_list = [Decimal(str(cf)) for cf in cash_flow_data['cash_flows_historiques']]
                if len(cf_list) >= 3:
                    # Coefficient de variation
                    mean_cf = sum(cf_list) / len(cf_list)
                    if mean_cf != 0:
                        variance = sum((cf - mean_cf) ** 2 for cf in cf_list) / len(cf_list)
                        std_dev = variance ** Decimal('0.5')
                        cv = std_dev / abs(mean_cf)
                        analysis['coefficient_variation'] = float(cv.quantize(self.precision))
                        
                        if cv > Decimal('0.3'):
                            flags.append("Cash flows très volatils (CV > 30%)")
                        elif cv < Decimal('0.1'):
                            flags.append("Cash flows très stables (CV < 10%)")
            
            # Free cash flow
            if all(k in data for k in ['cash_flow_operationnel', 'capex']):
                free_cash_flow = data['cash_flow_operationnel'] - data['capex']
                analysis['free_cash_flow'] = float(free_cash_flow.quantize(self.precision))
                
                if free_cash_flow < 0:
                    flags.append("Free cash flow négatif - attention aux besoins de financement")
            
            return {
                'analysis': analysis,
                'quality_flags': flags,
                'recommendation': self._get_cf_recommendation(analysis, flags)
            }
            
        except Exception as e:
            return {'error': f"Erreur analyse cash flow: {str(e)}"}
    
    def assess_working_capital(self, wc_data: Dict[str, Union[float, Decimal]]) -> Dict[str, Any]:
        """
        Évaluation du besoin en fonds de roulement
        """
        try:
            data = {k: Decimal(str(v)) for k, v in wc_data.items()}
            
            assessment = {}
            observations = []
            
            # BFR de base
            if all(k in data for k in ['stocks', 'creances_clients', 'dettes_fournisseurs']):
                bfr = data['stocks'] + data['creances_clients'] - data['dettes_fournisseurs']
                assessment['bfr'] = float(bfr.quantize(self.precision))
                
                # BFR en jours de CA
                if 'chiffre_affaires' in data and data['chiffre_affaires'] != 0:
                    bfr_jours = (bfr / data['chiffre_affaires']) * 365
                    assessment['bfr_jours_ca'] = float(bfr_jours.quantize(self.precision))
                    
                    if bfr_jours > 60:
                        observations.append("BFR élevé (> 60 jours de CA)")
                    elif bfr_jours < 0:
                        observations.append("BFR négatif - financement par le cycle d'exploitation")
            
            # Délais de rotation
            if 'stocks' in data and 'cout_ventes' in data and data['cout_ventes'] != 0:
                rotation_stocks = (data['stocks'] / data['cout_ventes']) * 365
                assessment['rotation_stocks_jours'] = float(rotation_stocks.quantize(self.precision))
                
                if rotation_stocks > 90:
                    observations.append("Rotation stocks lente (> 90 jours)")
            
            if 'creances_clients' in data and 'chiffre_affaires' in data and data['chiffre_affaires'] != 0:
                delai_clients = (data['creances_clients'] / data['chiffre_affaires']) * 365
                assessment['delai_recouvrement_jours'] = float(delai_clients.quantize(self.precision))
                
                if delai_clients > 60:
                    observations.append("Délai de recouvrement long (> 60 jours)")
            
            if 'dettes_fournisseurs' in data and 'achats' in data and data['achats'] != 0:
                delai_paiement = (data['dettes_fournisseurs'] / data['achats']) * 365
                assessment['delai_paiement_jours'] = float(delai_paiement.quantize(self.precision))
                
                if delai_paiement > 90:
                    observations.append("Délai de paiement fournisseurs très long (> 90 jours)")
            
            return {
                'assessment': assessment,
                'observations': observations,
                'optimization_potential': self._assess_wc_optimization(assessment)
            }
            
        except Exception as e:
            return {'error': f"Erreur évaluation BFR: {str(e)}"}
    
    def _calculate_global_score(self, ratios: Dict[str, float]) -> str:
        """Calcule un score global basé sur les ratios"""
        score = 0
        total_checks = 0
        
        if 'liquidite_generale' in ratios:
            if 1.0 <= ratios['liquidite_generale'] <= 2.5:
                score += 1
            total_checks += 1
        
        if 'ratio_endettement' in ratios:
            if ratios['ratio_endettement'] <= 1.5:
                score += 1
            total_checks += 1
        
        if 'marge_nette_pct' in ratios:
            if ratios['marge_nette_pct'] >= 5:
                score += 1
            total_checks += 1
        
        if 'roe_pct' in ratios:
            if ratios['roe_pct'] >= 10:
                score += 1
            total_checks += 1
        
        if total_checks == 0:
            return "Données insuffisantes"
        
        percentage = (score / total_checks) * 100
        
        if percentage >= 75:
            return "Excellente santé financière"
        elif percentage >= 50:
            return "Santé financière correcte"
        elif percentage >= 25:
            return "Santé financière préoccupante"
        else:
            return "Santé financière critique"
    
    def _get_cf_recommendation(self, analysis: Dict, flags: List[str]) -> str:
        """Génère une recommandation basée sur l'analyse cash flow"""
        if len(flags) == 0:
            return "Qualité des cash flows satisfaisante"
        elif len(flags) <= 2:
            return "Surveiller l'évolution des cash flows"
        else:
            return "Attention - qualité des cash flows préoccupante"
    
    def _assess_wc_optimization(self, assessment: Dict) -> List[str]:
        """Identifie les potentiels d'optimisation du BFR"""
        optimizations = []
        
        if assessment.get('rotation_stocks_jours', 0) > 90:
            optimizations.append("Optimiser la gestion des stocks")
        
        if assessment.get('delai_recouvrement_jours', 0) > 60:
            optimizations.append("Améliorer le recouvrement clients")
        
        if assessment.get('delai_paiement_jours', 0) < 30:
            optimizations.append("Négocier des délais fournisseurs plus longs")
        
        return optimizations
