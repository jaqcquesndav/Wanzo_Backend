"""
Base de connaissances comptables pour la RDC basée sur SYSCOHADA
Intègre les règles comptables officielles et mappings des comptes
"""

from typing import Dict, List, Any, Optional
from decimal import Decimal
import json


class AccountingKnowledgeRDC:
    """
    Base de connaissances comptables conforme SYSCOHADA/RDC
    Contient les mappings de comptes, règles de validation et templates d'écritures
    """
    
    def __init__(self):
        self.syscohada_accounts = self._load_syscohada_chart()
        self.journal_templates = self._load_journal_templates()
        self.validation_rules = self._load_validation_rules()
        self.tax_rates = self._load_tax_rates()
        
    def _load_syscohada_chart(self) -> Dict[str, Dict[str, Any]]:
        """
        Charge le plan comptable SYSCOHADA complet
        """
        return {
            # CLASSE 1 - Comptes de ressources durables
            '101000': {'name': 'Capital social', 'type': 'equity', 'normal_balance': 'credit'},
            '106000': {'name': 'Réserves légales', 'type': 'equity', 'normal_balance': 'credit'},
            '110000': {'name': 'Report à nouveau', 'type': 'equity', 'normal_balance': 'credit'},
            '120000': {'name': 'Résultat net de l\'exercice', 'type': 'equity', 'normal_balance': 'credit'},
            '164000': {'name': 'Emprunts et dettes assimilées', 'type': 'liability', 'normal_balance': 'credit'},
            
            # CLASSE 2 - Comptes d'actif immobilisé
            '211000': {'name': 'Frais de développement', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '212000': {'name': 'Brevets, licences, logiciels', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '213000': {'name': 'Fonds commercial', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '221000': {'name': 'Terrains agricoles et forestiers', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '222000': {'name': 'Terrains nus', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '223000': {'name': 'Terrains bâtis', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '231000': {'name': 'Bâtiments industriels, commerciaux', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '232000': {'name': 'Installations techniques', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '241000': {'name': 'Matériel et outillage industriel', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '244000': {'name': 'Matériel et mobilier de bureau', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '245000': {'name': 'Matériel de transport', 'type': 'fixed_asset', 'normal_balance': 'debit'},
            '281000': {'name': 'Amortissements des immobilisations incorporelles', 'type': 'accumulated_depreciation', 'normal_balance': 'credit'},
            '283000': {'name': 'Amortissements des bâtiments', 'type': 'accumulated_depreciation', 'normal_balance': 'credit'},
            '284000': {'name': 'Amortissements du matériel', 'type': 'accumulated_depreciation', 'normal_balance': 'credit'},
            
            # CLASSE 3 - Comptes de stocks
            '310000': {'name': 'Stocks de marchandises', 'type': 'inventory', 'normal_balance': 'debit'},
            '311000': {'name': 'Marchandises A', 'type': 'inventory', 'normal_balance': 'debit'},
            '312000': {'name': 'Marchandises B', 'type': 'inventory', 'normal_balance': 'debit'},
            '320000': {'name': 'Matières premières', 'type': 'inventory', 'normal_balance': 'debit'},
            '330000': {'name': 'Autres approvisionnements', 'type': 'inventory', 'normal_balance': 'debit'},
            '360000': {'name': 'Produits finis', 'type': 'inventory', 'normal_balance': 'debit'},
            
            # CLASSE 4 - Comptes de tiers
            '401000': {'name': 'Fournisseurs', 'type': 'liability', 'normal_balance': 'credit'},
            '408000': {'name': 'Fournisseurs, factures non parvenues', 'type': 'liability', 'normal_balance': 'credit'},
            '411000': {'name': 'Clients', 'type': 'asset', 'normal_balance': 'debit'},
            '418000': {'name': 'Clients, produits à recevoir', 'type': 'asset', 'normal_balance': 'debit'},
            '421000': {'name': 'Personnel, avances et acomptes', 'type': 'asset', 'normal_balance': 'debit'},
            '422000': {'name': 'Personnel, rémunérations dues', 'type': 'liability', 'normal_balance': 'credit'},
            '431000': {'name': 'Sécurité sociale', 'type': 'liability', 'normal_balance': 'credit'},
            '441000': {'name': 'État, impôt sur les bénéfices', 'type': 'liability', 'normal_balance': 'credit'},
            '443000': {'name': 'État, TVA facturée', 'type': 'liability', 'normal_balance': 'credit'},
            '445000': {'name': 'État, TVA récupérable', 'type': 'asset', 'normal_balance': 'debit'},
            '471000': {'name': 'Comptes d\'attente débiteurs', 'type': 'asset', 'normal_balance': 'debit'},
            '471100': {'name': 'Comptes d\'attente créditeurs', 'type': 'liability', 'normal_balance': 'credit'},
            
            # CLASSE 5 - Comptes de trésorerie
            '512000': {'name': 'Banque', 'type': 'asset', 'normal_balance': 'debit'},
            '521000': {'name': 'Banque locale', 'type': 'asset', 'normal_balance': 'debit'},
            '531000': {'name': 'Caisse siège social', 'type': 'asset', 'normal_balance': 'debit'},
            '571000': {'name': 'Caisse', 'type': 'asset', 'normal_balance': 'debit'},
            
            # CLASSE 6 - Comptes de charges
            '601000': {'name': 'Achats de marchandises', 'type': 'expense', 'normal_balance': 'debit'},
            '602000': {'name': 'Achats de matières premières', 'type': 'expense', 'normal_balance': 'debit'},
            '603000': {'name': 'Variations des stocks', 'type': 'expense', 'normal_balance': 'debit'},
            '605000': {'name': 'Autres achats', 'type': 'expense', 'normal_balance': 'debit'},
            '607000': {'name': 'Achats de marchandises', 'type': 'expense', 'normal_balance': 'debit'},
            '611000': {'name': 'Transports sur achats', 'type': 'expense', 'normal_balance': 'debit'},
            '621000': {'name': 'Sous-traitance générale', 'type': 'expense', 'normal_balance': 'debit'},
            '622000': {'name': 'Locations et charges locatives', 'type': 'expense', 'normal_balance': 'debit'},
            '624000': {'name': 'Entretien, réparations', 'type': 'expense', 'normal_balance': 'debit'},
            '625000': {'name': 'Primes d\'assurance', 'type': 'expense', 'normal_balance': 'debit'},
            '631000': {'name': 'Frais bancaires', 'type': 'expense', 'normal_balance': 'debit'},
            '661000': {'name': 'Rémunérations du personnel', 'type': 'expense', 'normal_balance': 'debit'},
            '664000': {'name': 'Charges sociales', 'type': 'expense', 'normal_balance': 'debit'},
            '681000': {'name': 'Dotations aux amortissements', 'type': 'expense', 'normal_balance': 'debit'},
            
            # CLASSE 7 - Comptes de produits
            '701000': {'name': 'Ventes de marchandises', 'type': 'revenue', 'normal_balance': 'credit'},
            '702000': {'name': 'Ventes de produits finis', 'type': 'revenue', 'normal_balance': 'credit'},
            '706000': {'name': 'Services vendus', 'type': 'revenue', 'normal_balance': 'credit'},
            '707000': {'name': 'Produits accessoires', 'type': 'revenue', 'normal_balance': 'credit'},
            '758000': {'name': 'Produits divers de gestion courante', 'type': 'revenue', 'normal_balance': 'credit'},
            '781000': {'name': 'Reprises d\'amortissements', 'type': 'revenue', 'normal_balance': 'credit'},
        }
    
    def _load_journal_templates(self) -> Dict[str, Dict[str, Any]]:
        """
        Templates d'écritures comptables selon SYSCOHADA
        """
        return {
            'SALE': {
                'description': 'Vente de marchandises - {description}',
                'lines': [
                    {
                        'account_code': '411000',
                        'side': 'debit',
                        'description': 'Client - {client_name}'
                    },
                    {
                        'account_code': '701000', 
                        'side': 'credit',
                        'description': 'Vente - {description}'
                    }
                ]
            },
            'EXPENSE': {
                'description': 'Achat de marchandises - {description}',
                'lines': [
                    {
                        'account_code': '607000',
                        'side': 'debit',
                        'description': 'Achat - {description}'
                    },
                    {
                        'account_code': '401000',
                        'side': 'credit', 
                        'description': 'Fournisseur - {supplier_name}'
                    }
                ]
            },
            'FINANCING': {
                'description': 'Opération de financement - {description}',
                'lines': [
                    {
                        'account_code': '512000',
                        'side': 'debit',
                        'description': 'Banque - {description}'
                    },
                    {
                        'account_code': '164000',
                        'side': 'credit',
                        'description': 'Emprunt - {description}'
                    }
                ]
            },
            'INVENTORY': {
                'description': 'Ajustement de stock - {description}',
                'lines': [
                    {
                        'account_code': '310000',
                        'side': 'debit',
                        'description': 'Stock - {description}'
                    },
                    {
                        'account_code': '603000',
                        'side': 'credit',
                        'description': 'Variation de stock - {description}'
                    }
                ]
            },
            'PAYMENT': {
                'description': 'Règlement fournisseur - {description}',
                'lines': [
                    {
                        'account_code': '401000',
                        'side': 'debit',
                        'description': 'Fournisseur - {supplier_name}'
                    },
                    {
                        'account_code': '512000',
                        'side': 'credit',
                        'description': 'Banque - Paiement'
                    }
                ]
            },
            'RECEIPT': {
                'description': 'Encaissement client - {description}',
                'lines': [
                    {
                        'account_code': '512000',
                        'side': 'debit',
                        'description': 'Banque - Encaissement'
                    },
                    {
                        'account_code': '411000',
                        'side': 'credit',
                        'description': 'Client - {client_name}'
                    }
                ]
            },
            'DEPRECIATION': {
                'description': 'Dotation aux amortissements - {description}',
                'lines': [
                    {
                        'account_code': '681000',
                        'side': 'debit',
                        'description': 'Dotation amortissement - {asset_name}'
                    },
                    {
                        'account_code': '284000',  # Ajusté selon le type d'actif
                        'side': 'credit',
                        'description': 'Amortissement - {asset_name}'
                    }
                ]
            }
        }
    
    def _load_validation_rules(self) -> Dict[str, Any]:
        """
        Règles de validation comptable SYSCOHADA
        """
        return {
            'balance_required': True,
            'min_lines': 2,
            'account_code_length': 6,
            'date_format': 'YYYY-MM-DD',
            'amount_precision': 2,
            'mandatory_fields': ['date', 'description', 'lines'],
            'account_validation': {
                'asset_accounts': ['2', '3', '4', '5'],  # Classes qui peuvent être débitées
                'liability_accounts': ['1', '4'],        # Classes qui peuvent être créditées
                'equity_accounts': ['1'],                # Classe 1 pour capitaux propres
                'expense_accounts': ['6'],               # Classe 6 pour charges
                'revenue_accounts': ['7']                # Classe 7 pour produits
            }
        }
    
    def _load_tax_rates(self) -> Dict[str, Decimal]:
        """
        Taux d'imposition RDC
        """
        return {
            'tva_standard': Decimal('16.0'),      # TVA standard RDC
            'tva_reduced': Decimal('8.0'),        # TVA réduite
            'tva_exempt': Decimal('0.0'),         # Exonération
            'corporate_tax': Decimal('30.0'),     # Impôt sur les sociétés
            'withholding_tax': Decimal('20.0'),   # Retenue à la source
            'professional_tax': Decimal('1.0'),   # Taxe professionnelle
            'payroll_tax': Decimal('3.0'),        # Taxe sur la masse salariale
            'social_security': Decimal('6.5')     # Cotisations sociales patronales
        }
    
    def get_account_info(self, account_code: str) -> Optional[Dict[str, Any]]:
        """
        Récupère les informations d'un compte
        """
        return self.syscohada_accounts.get(account_code)
    
    def get_account_name(self, account_code: str) -> str:
        """
        Récupère le nom d'un compte
        """
        account_info = self.get_account_info(account_code)
        return account_info['name'] if account_info else f"Compte {account_code}"
    
    def get_journal_entry_template(self, transaction_type: str) -> Optional[Dict[str, Any]]:
        """
        Récupère le template d'écriture pour un type de transaction
        """
        return self.journal_templates.get(transaction_type.upper())
    
    def get_account_mapping_for_operation(self, operation_type: str) -> Optional[Dict[str, str]]:
        """
        Récupère le mapping de comptes pour un type d'opération commerciale
        Basé sur les règles SYSCOHADA
        """
        mappings = {
            'SALE': {
                'debit_account': '411000',      # Clients
                'credit_account': '701000',     # Ventes de marchandises
                'journal_type': 'sales',
                'description': 'Vente de marchandises'
            },
            'EXPENSE': {
                'debit_account': '607000',      # Achats de marchandises
                'credit_account': '401000',     # Fournisseurs
                'journal_type': 'purchases',
                'description': 'Achat de marchandises'
            },
            'FINANCING': {
                'debit_account': '512000',      # Banque
                'credit_account': '164000',     # Emprunts et dettes assimilées
                'journal_type': 'financial',
                'description': 'Opération de financement'
            },
            'INVENTORY': {
                'debit_account': '310000',      # Stocks de marchandises
                'credit_account': '603000',     # Variation des stocks
                'journal_type': 'inventory',
                'description': 'Ajustement de stock'
            },
            'TRANSACTION': {
                'debit_account': '471000',      # Comptes d'attente débiteurs
                'credit_account': '471100',     # Comptes d'attente créditeurs
                'journal_type': 'miscellaneous',
                'description': 'Transaction à classifier'
            },
            'PAYMENT': {
                'debit_account': '401000',      # Fournisseurs (diminution de dette)
                'credit_account': '512000',     # Banque (sortie de trésorerie)
                'journal_type': 'financial',
                'description': 'Règlement fournisseur'
            },
            'RECEIPT': {
                'debit_account': '512000',      # Banque (entrée de trésorerie)
                'credit_account': '411000',     # Clients (diminution de créance)
                'journal_type': 'financial',
                'description': 'Encaissement client'
            },
            'TRANSFER': {
                'debit_account': '512000',      # Banque destination
                'credit_account': '531000',     # Caisse source
                'journal_type': 'financial',
                'description': 'Virement interne'
            }
        }
        
        return mappings.get(operation_type.upper())
    
    def validate_journal_entry(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valide une écriture comptable selon les règles SYSCOHADA
        """
        errors = []
        warnings = []
        
        # Validation des champs obligatoires
        for field in self.validation_rules['mandatory_fields']:
            if field not in entry or not entry[field]:
                errors.append(f"Champ obligatoire manquant: {field}")
        
        # Validation des lignes
        lines = entry.get('lines', [])
        if len(lines) < self.validation_rules['min_lines']:
            errors.append(f"Minimum {self.validation_rules['min_lines']} lignes requis")
        
        # Validation de l'équilibre
        total_debit = sum(line.get('debit', 0) for line in lines)
        total_credit = sum(line.get('credit', 0) for line in lines)
        difference = abs(total_debit - total_credit)
        
        if difference > 0.01:  # Tolérance de 1 centime
            errors.append(f"Écriture déséquilibrée: Débit {total_debit}, Crédit {total_credit}")
        
        # Validation des comptes
        for i, line in enumerate(lines):
            account_code = line.get('account_code', '')
            
            # Validation du format du compte
            if len(account_code) != self.validation_rules['account_code_length']:
                errors.append(f"Ligne {i+1}: Code compte doit avoir {self.validation_rules['account_code_length']} caractères")
            
            # Validation de l'existence du compte
            if not self.get_account_info(account_code):
                warnings.append(f"Ligne {i+1}: Compte {account_code} non trouvé dans le plan comptable")
            
            # Validation des montants
            debit = line.get('debit', 0)
            credit = line.get('credit', 0)
            
            if debit < 0 or credit < 0:
                errors.append(f"Ligne {i+1}: Montants négatifs non autorisés")
            
            if debit > 0 and credit > 0:
                warnings.append(f"Ligne {i+1}: Débit et crédit simultanés")
            
            if debit == 0 and credit == 0:
                errors.append(f"Ligne {i+1}: Montant débit ou crédit requis")
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'total_debit': total_debit,
            'total_credit': total_credit,
            'difference': difference,
            'is_balanced': difference <= 0.01
        }
    
    def get_depreciation_rates(self) -> Dict[str, Dict[str, Any]]:
        """
        Taux d'amortissement selon les normes SYSCOHADA
        """
        return {
            'buildings': {
                'linear_rate': Decimal('4.0'),      # 25 ans
                'declining_rate': Decimal('8.0'),    # Coefficient 2
                'min_years': 20,
                'max_years': 30
            },
            'equipment': {
                'linear_rate': Decimal('10.0'),     # 10 ans
                'declining_rate': Decimal('20.0'),   # Coefficient 2
                'min_years': 5,
                'max_years': 15
            },
            'vehicles': {
                'linear_rate': Decimal('20.0'),     # 5 ans
                'declining_rate': Decimal('40.0'),   # Coefficient 2
                'min_years': 4,
                'max_years': 5
            },
            'furniture': {
                'linear_rate': Decimal('10.0'),     # 10 ans
                'declining_rate': Decimal('20.0'),   # Coefficient 2
                'min_years': 8,
                'max_years': 12
            },
            'software': {
                'linear_rate': Decimal('33.33'),    # 3 ans
                'declining_rate': Decimal('50.0'),   # Coefficient 1.5
                'min_years': 1,
                'max_years': 5
            }
        }
    
    def get_declining_balance_rate(self, useful_life: int) -> Decimal:
        """
        Calcule le taux dégressif selon la durée d'utilité
        """
        if useful_life >= 6:
            return Decimal('100') / Decimal(str(useful_life)) * Decimal('2.5')
        elif useful_life >= 4:
            return Decimal('100') / Decimal(str(useful_life)) * Decimal('2.0')
        else:
            return Decimal('100') / Decimal(str(useful_life)) * Decimal('1.5')
    
    def get_standard_provision_rate(self, provision_type: str) -> float:
        """
        Taux standard de provisionnement selon SYSCOHADA
        """
        standard_rates = {
            'doubtful_debts': 50.0,        # Créances douteuses
            'inventory_obsolescence': 30.0, # Obsolescence stocks
            'litigation': 100.0,           # Litiges
            'warranty': 5.0,               # Garanties
            'bad_debts': 100.0,            # Créances irrécouvrables
            'price_fluctuation': 10.0       # Fluctuation de prix
        }
        
        return standard_rates.get(provision_type, 10.0)
    
    def get_tax_rate(self, tax_type: str) -> Decimal:
        """
        Récupère un taux d'imposition
        """
        return self.tax_rates.get(tax_type, Decimal('0.0'))
    
    def generate_balanced_entry(self, operation_type: str, amount: Decimal, 
                              description: str, additional_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Génère une écriture équilibrée selon le type d'opération
        """
        mapping = self.get_account_mapping_for_operation(operation_type)
        if not mapping:
            return {'error': f'Type d\'opération non supporté: {operation_type}'}
        
        additional_info = additional_info or {}
        
        entry = {
            'date': additional_info.get('date', ''),
            'description': description,
            'reference': additional_info.get('reference', ''),
            'journal_type': mapping['journal_type'],
            'lines': [
                {
                    'account_code': mapping['debit_account'],
                    'account_name': self.get_account_name(mapping['debit_account']),
                    'description': f"{description} - Débit",
                    'debit': float(amount),
                    'credit': 0.0
                },
                {
                    'account_code': mapping['credit_account'],
                    'account_name': self.get_account_name(mapping['credit_account']),
                    'description': f"{description} - Crédit",
                    'debit': 0.0,
                    'credit': float(amount)
                }
            ]
        }
        
        # Validation automatique
        validation = self.validate_journal_entry(entry)
        entry['validation'] = validation
        
        return entry