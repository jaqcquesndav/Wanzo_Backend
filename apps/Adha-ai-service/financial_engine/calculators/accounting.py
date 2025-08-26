"""
Calculateur Comptable pour Adha AI Service
Gère tous les calculs comptables conformes aux normes RDC (OHADA)
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
import pandas as pd
import logging

from ..knowledge_bases.accounting_rdc import AccountingKnowledgeRDC
from .. import FinancialEngineCore

logger = logging.getLogger(__name__)

class AccountingCalculator:
    """
    Calculateur spécialisé pour la comptabilité selon OHADA/RDC
    """
    
    def __init__(self):
        self.engine = FinancialEngineCore()
        self.knowledge = AccountingKnowledgeRDC()
        
    def calculate_depreciation(self, asset_value: Union[float, Decimal], 
                             useful_life: int, method: str = 'linear',
                             salvage_value: Union[float, Decimal] = 0) -> Dict[str, Any]:
        """
        Calcule l'amortissement selon les méthodes OHADA
        
        Args:
            asset_value: Valeur de l'actif
            useful_life: Durée d'utilité en années
            method: 'linear', 'declining_balance', 'units_of_production'
            salvage_value: Valeur résiduelle
            
        Returns:
            Dict avec détails de l'amortissement
        """
        asset_value = Decimal(str(asset_value))
        salvage_value = Decimal(str(salvage_value))
        depreciable_amount = asset_value - salvage_value
        
        result = {
            'method': method,
            'asset_value': asset_value,
            'salvage_value': salvage_value,
            'depreciable_amount': depreciable_amount,
            'useful_life': useful_life,
            'schedule': []
        }
        
        if method == 'linear':
            annual_depreciation = depreciable_amount / useful_life
            accumulated_depreciation = Decimal('0')
            
            for year in range(1, useful_life + 1):
                book_value = asset_value - accumulated_depreciation - annual_depreciation
                accumulated_depreciation += annual_depreciation
                
                result['schedule'].append({
                    'year': year,
                    'annual_depreciation': self.engine.calculate_precision(annual_depreciation),
                    'accumulated_depreciation': self.engine.calculate_precision(accumulated_depreciation),
                    'book_value': self.engine.calculate_precision(book_value)
                })
                
        elif method == 'declining_balance':
            # Méthode dégressive selon OHADA
            declining_rate = self.knowledge.get_declining_balance_rate(useful_life)
            book_value = asset_value
            accumulated_depreciation = Decimal('0')
            
            for year in range(1, useful_life + 1):
                annual_depreciation = book_value * declining_rate / 100
                # Vérifier que la valeur comptable ne descend pas en dessous de la valeur résiduelle
                if book_value - annual_depreciation < salvage_value:
                    annual_depreciation = book_value - salvage_value
                
                book_value -= annual_depreciation
                accumulated_depreciation += annual_depreciation
                
                result['schedule'].append({
                    'year': year,
                    'annual_depreciation': self.engine.calculate_precision(annual_depreciation),
                    'accumulated_depreciation': self.engine.calculate_precision(accumulated_depreciation),
                    'book_value': self.engine.calculate_precision(book_value)
                })
                
                if book_value <= salvage_value:
                    break
        
        return result
    
    def calculate_provision(self, provision_type: str, base_amount: Union[float, Decimal], 
                          risk_percentage: Optional[float] = None) -> Dict[str, Any]:
        """
        Calcule les provisions selon les normes OHADA
        
        Args:
            provision_type: 'doubtful_debts', 'inventory_obsolescence', 'litigation', 'warranty'
            base_amount: Montant de base pour le calcul
            risk_percentage: Pourcentage de risque (optionnel, utilise les standards si non fourni)
        """
        base_amount = Decimal(str(base_amount))
        
        if risk_percentage is None:
            risk_percentage = self.knowledge.get_standard_provision_rate(provision_type)
        
        provision_amount = base_amount * Decimal(str(risk_percentage)) / 100
        
        return {
            'provision_type': provision_type,
            'base_amount': base_amount,
            'risk_percentage': risk_percentage,
            'provision_amount': self.engine.calculate_precision(provision_amount),
            'remaining_value': self.engine.calculate_precision(base_amount - provision_amount)
        }
    
    def calculate_working_capital(self, current_assets: Union[float, Decimal],
                                 current_liabilities: Union[float, Decimal]) -> Dict[str, Any]:
        """
        Calcule le fonds de roulement
        """
        current_assets = Decimal(str(current_assets))
        current_liabilities = Decimal(str(current_liabilities))
        working_capital = current_assets - current_liabilities
        
        return {
            'current_assets': current_assets,
            'current_liabilities': current_liabilities,
            'working_capital': self.engine.calculate_precision(working_capital),
            'working_capital_ratio': self.engine.calculate_precision(
                current_assets / current_liabilities if current_liabilities != 0 else Decimal('0')
            )
        }
    
    def calculate_inventory_turnover(self, cost_of_goods_sold: Union[float, Decimal],
                                   average_inventory: Union[float, Decimal]) -> Dict[str, Any]:
        """
        Calcule la rotation des stocks
        """
        cogs = Decimal(str(cost_of_goods_sold))
        avg_inventory = Decimal(str(average_inventory))
        
        if avg_inventory == 0:
            return {
                'error': 'Stock moyen ne peut pas être zéro'
            }
        
        turnover_ratio = cogs / avg_inventory
        days_in_inventory = Decimal('365') / turnover_ratio
        
        return {
            'cost_of_goods_sold': cogs,
            'average_inventory': avg_inventory,
            'inventory_turnover_ratio': self.engine.calculate_precision(turnover_ratio),
            'days_in_inventory': self.engine.calculate_precision(days_in_inventory)
        }
    
    def calculate_accounts_receivable_turnover(self, net_credit_sales: Union[float, Decimal],
                                             average_accounts_receivable: Union[float, Decimal]) -> Dict[str, Any]:
        """
        Calcule la rotation des créances clients
        """
        sales = Decimal(str(net_credit_sales))
        avg_ar = Decimal(str(average_accounts_receivable))
        
        if avg_ar == 0:
            return {
                'error': 'Créances moyennes ne peuvent pas être zéro'
            }
        
        turnover_ratio = sales / avg_ar
        collection_period = Decimal('365') / turnover_ratio
        
        return {
            'net_credit_sales': sales,
            'average_accounts_receivable': avg_ar,
            'receivables_turnover_ratio': self.engine.calculate_precision(turnover_ratio),
            'average_collection_period': self.engine.calculate_precision(collection_period)
        }
    
    def calculate_break_even_analysis(self, fixed_costs: Union[float, Decimal],
                                    variable_cost_per_unit: Union[float, Decimal],
                                    selling_price_per_unit: Union[float, Decimal]) -> Dict[str, Any]:
        """
        Calcule le seuil de rentabilité
        """
        fixed_costs = Decimal(str(fixed_costs))
        variable_cost = Decimal(str(variable_cost_per_unit))
        selling_price = Decimal(str(selling_price_per_unit))
        
        contribution_margin = selling_price - variable_cost
        
        if contribution_margin <= 0:
            return {
                'error': 'La marge de contribution doit être positive'
            }
        
        break_even_units = fixed_costs / contribution_margin
        break_even_revenue = break_even_units * selling_price
        
        return {
            'fixed_costs': fixed_costs,
            'variable_cost_per_unit': variable_cost,
            'selling_price_per_unit': selling_price,
            'contribution_margin': self.engine.calculate_precision(contribution_margin),
            'contribution_margin_ratio': self.engine.calculate_precision(
                contribution_margin / selling_price * 100
            ),
            'break_even_units': self.engine.calculate_precision(break_even_units),
            'break_even_revenue': self.engine.calculate_precision(break_even_revenue)
        }
    
    def generate_journal_entry(self, transaction_type: str, amount: Union[float, Decimal],
                             details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Génère une écriture comptable selon le plan comptable OHADA
        """
        amount = Decimal(str(amount))
        
        # Récupérer le template d'écriture selon le type
        entry_template = self.knowledge.get_journal_entry_template(transaction_type)
        
        if not entry_template:
            return {
                'error': f'Type de transaction non reconnu: {transaction_type}'
            }
        
        journal_entry = {
            'date': datetime.now().isoformat(),
            'reference': f"{transaction_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'description': entry_template['description'].format(**details),
            'total_debit': amount,
            'total_credit': amount,
            'lines': []
        }
        
        # Générer les lignes d'écriture
        for line_template in entry_template['lines']:
            line = {
                'account_code': line_template['account_code'],
                'account_name': self.knowledge.get_account_name(line_template['account_code']),
                'debit': amount if line_template['side'] == 'debit' else Decimal('0'),
                'credit': amount if line_template['side'] == 'credit' else Decimal('0'),
                'description': line_template['description'].format(**details)
            }
            journal_entry['lines'].append(line)
        
        return journal_entry
