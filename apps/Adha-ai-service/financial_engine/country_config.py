"""
Gestionnaire de Configuration Pays pour les Calculs Financiers
Système dynamique qui charge les configurations selon le pays de l'utilisateur
"""

from typing import Dict, Any, Optional, List
from decimal import Decimal
import json
import logging
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)

class CountryConfigManager:
    """
    Gestionnaire centralisé des configurations financières par pays
    """
    
    def __init__(self):
        self.cache_timeout = 3600  # 1 heure
        self.default_country = 'CD'  # RDC par défaut
        
    def get_country_config(self, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Récupère la configuration financière du pays de l'utilisateur
        
        Args:
            user_context: Contexte utilisateur avec informations de pays
            
        Returns:
            Dict: Configuration financière du pays
        """
        # Déterminer le pays depuis le contexte utilisateur
        country_code = self._extract_country_code(user_context)
        
        # Cache key
        cache_key = f"country_config_{country_code}"
        config = cache.get(cache_key)
        
        if config is None:
            config = self._load_country_config(country_code, user_context)
            cache.set(cache_key, config, self.cache_timeout)
            
        return config
    
    def _extract_country_code(self, user_context: Optional[Dict[str, Any]] = None) -> str:
        """
        Extrait le code pays depuis le contexte utilisateur
        """
        if not user_context:
            return self.default_country
            
        # Priorité: paramètre explicite > profil utilisateur > entreprise > défaut
        country_sources = [
            user_context.get('country_override'),           # Surcharge explicite
            user_context.get('user_profile', {}).get('country_code'),  # Profil utilisateur
            user_context.get('company_info', {}).get('country_code'),  # Info entreprise
            user_context.get('session_country'),            # Session
            self.default_country                            # Défaut
        ]
        
        for source in country_sources:
            if source and isinstance(source, str) and len(source) == 2:
                return source.upper()
                
        return self.default_country
    
    def _load_country_config(self, country_code: str, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Charge la configuration complète d'un pays
        """
        base_configs = {
            'CD': self._get_rdc_config(),
            'CM': self._get_cameroon_config(),
            'CI': self._get_cotedivoire_config(),
            'SN': self._get_senegal_config(),
            'FR': self._get_france_config(),  # Pour comparaison
        }
        
        config = base_configs.get(country_code, base_configs[self.default_country])
        
        # Appliquer les surcharges utilisateur/entreprise si disponibles
        config = self._apply_user_overrides(config, user_context)
        
        # Ajouter métadonnées
        config['metadata'] = {
            'country_code': country_code,
            'loaded_at': f"{logger}",
            'source': 'system_default',
            'version': '1.0'
        }
        
        return config
    
    def _get_rdc_config(self) -> Dict[str, Any]:
        """Configuration financière pour la RDC"""
        return {
            'country_name': 'République Démocratique du Congo',
            'currency': 'CDF',
            'fiscal': {
                'tva_standard': Decimal('16'),
                'impot_professionnel': {
                    'seuil_exoneration': Decimal('80000'),
                    'taux_standard': Decimal('3'),
                    'taux_reduit': Decimal('1')
                },
                'impot_cedulaire': {
                    'tranches': [
                        {'max': Decimal('524160'), 'taux': Decimal('0')},
                        {'max': Decimal('1310400'), 'taux': Decimal('15')},
                        {'max': float('inf'), 'taux': Decimal('30')}
                    ]
                },
                'charges_sociales': {
                    'cnss_employe': Decimal('3.5'),
                    'cnss_employeur': Decimal('6.5'),
                    'inpp_employe': Decimal('5'),
                    'inpp_employeur': Decimal('5')
                }
            },
            'accounting': {
                'standards': 'OHADA',
                'depreciation_methods': ['linear', 'declining_balance'],
                'fiscal_year_end': '12-31'
            },
            'financial': {
                'benchmark_rates': {
                    'risk_free_rate': Decimal('8'),  # Taux BCC
                    'inflation_rate': Decimal('12'),
                    'market_risk_premium': Decimal('15')
                }
            }
        }
    
    def _get_cameroon_config(self) -> Dict[str, Any]:
        """Configuration pour le Cameroun (exemple OHADA)"""
        return {
            'country_name': 'Cameroun',
            'currency': 'XAF',
            'fiscal': {
                'tva_standard': Decimal('19.25'),
                'impot_societes': Decimal('33'),
                'charges_sociales': {
                    'cnps_employe': Decimal('2.8'),
                    'cnps_employeur': Decimal('7.2')
                }
            },
            'accounting': {
                'standards': 'OHADA',
                'depreciation_methods': ['linear', 'declining_balance']
            }
        }
    
    def _get_france_config(self) -> Dict[str, Any]:
        """Configuration France (pour comparaison/entreprises françaises)"""
        return {
            'country_name': 'France',
            'currency': 'EUR',
            'fiscal': {
                'tva_standard': Decimal('20'),
                'tva_intermediaire': Decimal('10'),
                'tva_reduite': Decimal('5.5'),
                'impot_societes': Decimal('25'),
                'charges_sociales': {
                    'total_employe': Decimal('22'),
                    'total_employeur': Decimal('42')
                }
            },
            'accounting': {
                'standards': 'PCG',
                'depreciation_methods': ['linear', 'declining_balance', 'units_of_production']
            }
        }
    
    def _get_cotedivoire_config(self) -> Dict[str, Any]:
        """Configuration Côte d'Ivoire"""
        return {
            'country_name': 'Côte d\'Ivoire',
            'currency': 'XOF',
            'fiscal': {
                'tva_standard': Decimal('18'),
                'impot_societes': Decimal('25')
            },
            'accounting': {
                'standards': 'OHADA'
            }
        }
    
    def _get_senegal_config(self) -> Dict[str, Any]:
        """Configuration Sénégal"""
        return {
            'country_name': 'Sénégal',
            'currency': 'XOF',
            'fiscal': {
                'tva_standard': Decimal('18'),
                'impot_societes': Decimal('30')
            },
            'accounting': {
                'standards': 'OHADA'
            }
        }
    
    def _apply_user_overrides(self, config: Dict[str, Any], user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Applique les surcharges spécifiques à l'utilisateur/entreprise
        """
        if not user_context or 'fiscal_overrides' not in user_context:
            return config
            
        overrides = user_context['fiscal_overrides']
        
        # Fusion profonde des configurations
        def deep_merge(base_dict: Dict, override_dict: Dict) -> Dict:
            result = base_dict.copy()
            for key, value in override_dict.items():
                if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                    result[key] = deep_merge(result[key], value)
                else:
                    result[key] = value
            return result
        
        return deep_merge(config, overrides)
    
    def list_available_countries(self) -> List[Dict[str, str]]:
        """
        Liste tous les pays supportés
        """
        return [
            {'code': 'CD', 'name': 'République Démocratique du Congo', 'standards': 'OHADA'},
            {'code': 'CM', 'name': 'Cameroun', 'standards': 'OHADA'},
            {'code': 'CI', 'name': 'Côte d\'Ivoire', 'standards': 'OHADA'},
            {'code': 'SN', 'name': 'Sénégal', 'standards': 'OHADA'},
            {'code': 'FR', 'name': 'France', 'standards': 'PCG'},
        ]
    
    def validate_country_code(self, country_code: str) -> bool:
        """
        Valide qu'un code pays est supporté
        """
        supported_codes = [country['code'] for country in self.list_available_countries()]
        return country_code.upper() in supported_codes

# Instance globale
country_config_manager = CountryConfigManager()
