"""
Calculateur de Valorisation d'Entreprises
Implémentation des méthodes principales de valorisation
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any, Optional, Union
import logging

logger = logging.getLogger(__name__)

class ValuationCalculator:
    """
    Calculateur pour les différentes méthodes de valorisation d'entreprise
    """
    
    def __init__(self):
        self.precision = Decimal('0.01')
    
    def calculate_dcf(self, cash_flows: List[Union[float, Decimal]], 
                     discount_rate: Union[float, Decimal],
                     terminal_value: Union[float, Decimal] = 0) -> Dict[str, Any]:
        """
        Calcule la valeur par la méthode des flux de trésorerie actualisés (DCF)
        """
        try:
            cash_flows = [Decimal(str(cf)) for cf in cash_flows]
            discount_rate = Decimal(str(discount_rate))
            terminal_value = Decimal(str(terminal_value))
            
            present_values = []
            total_pv = Decimal('0')
            
            for i, cf in enumerate(cash_flows):
                period = i + 1
                pv = cf / ((1 + discount_rate) ** period)
                present_values.append({
                    'period': period,
                    'cash_flow': self._round(cf),
                    'present_value': self._round(pv)
                })
                total_pv += pv
            
            # Valeur terminale actualisée
            if terminal_value > 0:
                terminal_pv = terminal_value / ((1 + discount_rate) ** len(cash_flows))
                total_pv += terminal_pv
            else:
                terminal_pv = Decimal('0')
            
            return {
                'method': 'DCF',
                'cash_flows': present_values,
                'terminal_value': self._round(terminal_value),
                'terminal_present_value': self._round(terminal_pv),
                'discount_rate': float(discount_rate),
                'enterprise_value': self._round(total_pv)
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul DCF: {str(e)}"}
    
    def calculate_multiples_valuation(self, ebitda: Union[float, Decimal], 
                                    multiple: Union[float, Decimal]) -> Dict[str, Any]:
        """
        Valorisation par multiples d'EBITDA
        """
        try:
            ebitda = Decimal(str(ebitda))
            multiple = Decimal(str(multiple))
            
            enterprise_value = ebitda * multiple
            
            return {
                'method': 'Multiples EBITDA',
                'ebitda': self._round(ebitda),
                'multiple': float(multiple),
                'enterprise_value': self._round(enterprise_value)
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul multiples: {str(e)}"}
    
    def calculate_asset_based_valuation(self, total_assets: Union[float, Decimal],
                                      total_liabilities: Union[float, Decimal]) -> Dict[str, Any]:
        """
        Valorisation par l'actif net
        """
        try:
            assets = Decimal(str(total_assets))
            liabilities = Decimal(str(total_liabilities))
            
            net_asset_value = assets - liabilities
            
            return {
                'method': 'Actif Net',
                'total_assets': self._round(assets),
                'total_liabilities': self._round(liabilities),
                'net_asset_value': self._round(net_asset_value)
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul actif net: {str(e)}"}
    
    def _round(self, value: Decimal) -> Decimal:
        """Arrondit une valeur à la précision définie"""
        return value.quantize(self.precision, rounding=ROUND_HALF_UP)
