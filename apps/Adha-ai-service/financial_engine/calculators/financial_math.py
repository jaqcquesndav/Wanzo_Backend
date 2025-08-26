"""
Calculateur de Mathématiques Financières
Implémentation des calculs financiers de base
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any, Optional, Union
import math
import logging

logger = logging.getLogger(__name__)

class FinancialMathCalculator:
    """
    Calculateur pour les mathématiques financières
    """
    
    def __init__(self):
        self.precision = Decimal('0.01')
    
    def calculate_npv(self, cash_flows: List[Union[float, Decimal]], 
                     discount_rate: Union[float, Decimal]) -> Dict[str, Any]:
        """
        Calcule la Valeur Actuelle Nette (VAN)
        """
        try:
            cash_flows = [Decimal(str(cf)) for cf in cash_flows]
            discount_rate = Decimal(str(discount_rate))
            
            npv = Decimal('0')
            details = []
            
            for i, cf in enumerate(cash_flows):
                period = i
                if period == 0:
                    pv = cf  # Investissement initial
                else:
                    pv = cf / ((1 + discount_rate) ** period)
                
                npv += pv
                details.append({
                    'period': period,
                    'cash_flow': self._round(cf),
                    'present_value': self._round(pv)
                })
            
            return {
                'method': 'VAN',
                'cash_flows': details,
                'discount_rate': float(discount_rate),
                'npv': self._round(npv),
                'decision': 'Acceptable' if npv > 0 else 'Rejeter'
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul VAN: {str(e)}"}
    
    def calculate_irr(self, cash_flows: List[Union[float, Decimal]]) -> Dict[str, Any]:
        """
        Calcule le Taux de Rentabilité Interne (TIR) - approximation
        """
        try:
            cash_flows = [float(cf) for cf in cash_flows]
            
            # Méthode d'approximation simple
            if len(cash_flows) < 2:
                return {'error': 'Au moins 2 flux nécessaires pour calculer le TIR'}
            
            # Approximation pour projets simples
            initial_investment = abs(cash_flows[0])
            annual_returns = cash_flows[1:]
            avg_return = sum(annual_returns) / len(annual_returns)
            
            # IRR approximatif = rendement moyen / investissement initial
            irr_approx = (avg_return / initial_investment) if initial_investment > 0 else 0
            
            return {
                'method': 'TIR (approximation)',
                'cash_flows': cash_flows,
                'irr_approximate': round(irr_approx * 100, 2),
                'note': 'Approximation simple, utiliser des outils spécialisés pour plus de précision'
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul TIR: {str(e)}"}
    
    def calculate_annuity(self, principal: Union[float, Decimal],
                         rate: Union[float, Decimal],
                         periods: int) -> Dict[str, Any]:
        """
        Calcule l'annuité constante
        """
        try:
            principal = Decimal(str(principal))
            rate = Decimal(str(rate))
            
            if rate == 0:
                annuity = principal / periods
            else:
                # A = P * [r(1+r)^n] / [(1+r)^n - 1]
                factor = (1 + rate) ** periods
                annuity = principal * (rate * factor) / (factor - 1)
            
            total_payment = annuity * periods
            total_interest = total_payment - principal
            
            return {
                'method': 'Annuité constante',
                'principal': self._round(principal),
                'rate': float(rate),
                'periods': periods,
                'annuity': self._round(annuity),
                'total_payment': self._round(total_payment),
                'total_interest': self._round(total_interest)
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul annuité: {str(e)}"}
    
    def calculate_future_value(self, present_value: Union[float, Decimal],
                              rate: Union[float, Decimal],
                              periods: int) -> Dict[str, Any]:
        """
        Calcule la valeur future (capitalisation)
        """
        try:
            pv = Decimal(str(present_value))
            rate = Decimal(str(rate))
            
            # FV = PV * (1 + r)^n
            future_value = pv * ((1 + rate) ** periods)
            interest_earned = future_value - pv
            
            return {
                'method': 'Capitalisation',
                'present_value': self._round(pv),
                'rate': float(rate),
                'periods': periods,
                'future_value': self._round(future_value),
                'interest_earned': self._round(interest_earned)
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul valeur future: {str(e)}"}
    
    def calculate_present_value(self, future_value: Union[float, Decimal],
                               rate: Union[float, Decimal],
                               periods: int) -> Dict[str, Any]:
        """
        Calcule la valeur actuelle (actualisation)
        """
        try:
            fv = Decimal(str(future_value))
            rate = Decimal(str(rate))
            
            # PV = FV / (1 + r)^n
            present_value = fv / ((1 + rate) ** periods)
            discount = fv - present_value
            
            return {
                'method': 'Actualisation',
                'future_value': self._round(fv),
                'rate': float(rate),
                'periods': periods,
                'present_value': self._round(present_value),
                'discount': self._round(discount)
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul valeur actuelle: {str(e)}"}
    
    def _round(self, value: Decimal) -> Decimal:
        """Arrondit une valeur à la précision définie"""
        return value.quantize(self.precision, rounding=ROUND_HALF_UP)
