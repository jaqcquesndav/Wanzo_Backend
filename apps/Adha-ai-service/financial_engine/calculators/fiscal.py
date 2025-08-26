"""
Calculateur Fiscal pour différents pays
Système dynamique qui s'adapte selon le pays de l'utilisateur
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class FiscalCalculatorRDC:
    """
    Calculateur fiscal spécialisé pour la République Démocratique du Congo
    Les taux et règles sont configurables et peuvent être mis à jour
    """
    
    def __init__(self, user_context: Optional[Dict[str, Any]] = None):
        self.user_context = user_context or {}
        self.country_code = self.user_context.get('country_code', 'CD')  # CD = RDC par défaut
        
        # Configuration fiscale RDC (valeurs par défaut)
        self.fiscal_config = self._load_fiscal_config()
        
    def _load_fiscal_config(self) -> Dict[str, Any]:
        """
        Charge la configuration fiscale selon le pays
        Les valeurs peuvent être surchargées par les données utilisateur
        """
        base_config = {
            'CD': {  # République Démocratique du Congo
                'tva_standard': Decimal('16'),  # 16%
                'impot_professionnel': {
                    'seuil_exoneration': Decimal('80000'),  # 80,000 CDF
                    'taux_standard': Decimal('3'),          # 3%
                    'taux_reduit': Decimal('1')             # 1% pour certaines activités
                },
                'impot_cedulaire': {
                    'tranches': [
                        {'max': Decimal('524160'), 'taux': Decimal('0')},    # Tranche exonérée
                        {'max': Decimal('1310400'), 'taux': Decimal('15')},  # 15%
                        {'max': float('inf'), 'taux': Decimal('30')}         # 30%
                    ]
                },
                'charges_sociales': {
                    'cnss_employe': Decimal('3.5'),    # 3.5% employé
                    'cnss_employeur': Decimal('6.5'),  # 6.5% employeur
                    'inpp_employe': Decimal('5'),      # 5% employé
                    'inpp_employeur': Decimal('5')     # 5% employeur
                },
                'retenue_source': {
                    'dividendes': Decimal('20'),     # 20%
                    'interets': Decimal('20'),       # 20%
                    'royalties': Decimal('22'),      # 22%
                    'services': Decimal('15')        # 15%
                }
            }
        }
        
        # Récupérer la config du pays ou RDC par défaut
        country_config = base_config.get(self.country_code, base_config['CD'])
        
        # Permettre la surcharge par les données utilisateur/entreprise
        if 'fiscal_overrides' in self.user_context:
            country_config.update(self.user_context['fiscal_overrides'])
            
        return country_config
    
    def calculate_impot_professionnel(self, chiffre_affaires: Union[float, Decimal]) -> Dict[str, Any]:
        """
        Calcule l'impôt professionnel selon les règles du pays
        """
        ca = Decimal(str(chiffre_affaires))
        config = self.fiscal_config['impot_professionnel']
        
        if ca <= config['seuil_exoneration']:
            impot = Decimal('0')
            taux_applicable = Decimal('0')
            statut = 'exonéré'
        else:
            # Déterminer le taux applicable selon l'activité
            activite = self.user_context.get('type_activite', 'standard')
            if activite in ['agriculture', 'artisanat']:
                taux_applicable = config['taux_reduit']
            else:
                taux_applicable = config['taux_standard']
            
            impot = ca * taux_applicable / 100
            statut = 'imposable'
        
        return {
            'chiffre_affaires': ca,
            'seuil_exoneration': config['seuil_exoneration'],
            'taux_applicable': taux_applicable,
            'impot_professionnel': self._round_amount(impot),
            'statut': statut,
            'pays': self.country_code
        }
    
    def calculate_impot_cedulaire(self, salaire_mensuel: Union[float, Decimal]) -> Dict[str, Any]:
        """
        Calcule l'impôt cédulaire sur salaires
        """
        salaire = Decimal(str(salaire_mensuel))
        salaire_annuel = salaire * 12
        
        tranches = self.fiscal_config['impot_cedulaire']['tranches']
        impot_total = Decimal('0')
        details_tranches = []
        
        montant_restant = salaire_annuel
        
        for i, tranche in enumerate(tranches):
            if montant_restant <= 0:
                break
                
            tranche_max = Decimal(str(tranche['max'])) if tranche['max'] != float('inf') else None
            taux = tranche['taux']
            
            if i == 0:
                # Première tranche (base)
                base_tranche = min(montant_restant, tranche_max) if tranche_max else montant_restant
                tranche_precedente = Decimal('0')
            else:
                tranche_precedente = Decimal(str(tranches[i-1]['max']))
                if tranche_max:
                    base_tranche = min(montant_restant, tranche_max - tranche_precedente)
                else:
                    base_tranche = montant_restant
            
            impot_tranche = base_tranche * taux / 100
            impot_total += impot_tranche
            
            details_tranches.append({
                'tranche': i + 1,
                'base': self._round_amount(base_tranche),
                'taux': taux,
                'impot': self._round_amount(impot_tranche)
            })
            
            montant_restant -= base_tranche
        
        impot_mensuel = impot_total / 12
        
        return {
            'salaire_mensuel': salaire,
            'salaire_annuel': salaire_annuel,
            'impot_annuel': self._round_amount(impot_total),
            'impot_mensuel': self._round_amount(impot_mensuel),
            'details_tranches': details_tranches,
            'pays': self.country_code
        }
    
    def calculate_charges_sociales(self, salaire_brut: Union[float, Decimal]) -> Dict[str, Any]:
        """
        Calcule les charges sociales employé et employeur
        """
        salaire = Decimal(str(salaire_brut))
        config = self.fiscal_config['charges_sociales']
        
        # Charges employé
        cnss_employe = salaire * config['cnss_employe'] / 100
        inpp_employe = salaire * config['inpp_employe'] / 100
        total_employe = cnss_employe + inpp_employe
        
        # Charges employeur
        cnss_employeur = salaire * config['cnss_employeur'] / 100
        inpp_employeur = salaire * config['inpp_employeur'] / 100
        total_employeur = cnss_employeur + inpp_employeur
        
        # Salaire net
        salaire_net = salaire - total_employe
        
        # Coût total employeur
        cout_total = salaire + total_employeur
        
        return {
            'salaire_brut': salaire,
            'charges_employe': {
                'cnss': self._round_amount(cnss_employe),
                'inpp': self._round_amount(inpp_employe),
                'total': self._round_amount(total_employe)
            },
            'charges_employeur': {
                'cnss': self._round_amount(cnss_employeur),
                'inpp': self._round_amount(inpp_employeur),
                'total': self._round_amount(total_employeur)
            },
            'salaire_net': self._round_amount(salaire_net),
            'cout_total_employeur': self._round_amount(cout_total),
            'pays': self.country_code
        }
    
    def calculate_tva_rdc(self, montant_ht: Union[float, Decimal], 
                         taux_tva: Optional[Decimal] = None) -> Dict[str, Any]:
        """
        Calcule la TVA selon les taux du pays
        """
        montant = Decimal(str(montant_ht))
        
        if taux_tva is None:
            taux = self.fiscal_config['tva_standard']
        else:
            taux = Decimal(str(taux_tva))
        
        tva = montant * taux / 100
        montant_ttc = montant + tva
        
        return {
            'montant_ht': montant,
            'taux_tva': taux,
            'montant_tva': self._round_amount(tva),
            'montant_ttc': self._round_amount(montant_ttc),
            'pays': self.country_code
        }
    
    def calculate_retenue_source(self, montant_brut: Union[float, Decimal], 
                               type_revenu: str) -> Dict[str, Any]:
        """
        Calcule la retenue à la source selon le type de revenu
        """
        montant = Decimal(str(montant_brut))
        config = self.fiscal_config['retenue_source']
        
        if type_revenu not in config:
            return {
                'error': f"Type de revenu '{type_revenu}' non reconnu",
                'types_disponibles': list(config.keys())
            }
        
        taux = config[type_revenu]
        retenue = montant * taux / 100
        montant_net = montant - retenue
        
        return {
            'montant_brut': montant,
            'type_revenu': type_revenu,
            'taux_retenue': taux,
            'retenue_source': self._round_amount(retenue),
            'montant_net': self._round_amount(montant_net),
            'pays': self.country_code
        }
    
    def _round_amount(self, amount: Decimal) -> Decimal:
        """
        Arrondit un montant selon les règles du pays
        """
        return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    def get_fiscal_summary(self) -> Dict[str, Any]:
        """
        Retourne un résumé de la configuration fiscale du pays
        """
        return {
            'pays': self.country_code,
            'configuration_fiscale': {
                'tva_standard': str(self.fiscal_config['tva_standard']),
                'impot_professionnel': {
                    'seuil_exoneration': str(self.fiscal_config['impot_professionnel']['seuil_exoneration']),
                    'taux_standard': str(self.fiscal_config['impot_professionnel']['taux_standard'])
                },
                'charges_sociales_totales': {
                    'employe': str(self.fiscal_config['charges_sociales']['cnss_employe'] + 
                                 self.fiscal_config['charges_sociales']['inpp_employe']),
                    'employeur': str(self.fiscal_config['charges_sociales']['cnss_employeur'] + 
                                   self.fiscal_config['charges_sociales']['inpp_employeur'])
                }
            }
        }
