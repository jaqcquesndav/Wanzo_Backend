"""
LLM Tool System for Adha AI Service - Version Dynamique
Provides calculation tools that the LLM can call during conversation flow
Système adaptatif selon le pays de l'utilisateur (RDC par défaut)
"""
import json
from typing import Dict, List, Any, Optional
from agents.utils.calculation_detector import CalculationDetector
from agents.utils.calculation_helper import CalculationHelper

class LLMToolSystem:
    """
    Système d'outils intégrés que le LLM peut appeler pendant le traitement.
    Les calculs sont effectués par des outils spécialisés mais restent dans le flux LLM.
    Système adaptatif selon le pays de l'utilisateur.
    """
    
    def __init__(self, user_context: Optional[Dict[str, Any]] = None):
        self.calculation_detector = CalculationDetector()
        self.calculation_helper = CalculationHelper(precision=2)
        self.user_context = user_context or {}
        
        # Charger la configuration pays
        self._load_country_config()
        
        # Définition des outils disponibles pour le LLM
        self.available_tools = self._build_available_tools()
    
    def _load_country_config(self):
        """
        Charge la configuration du pays de l'utilisateur
        """
        try:
            from financial_engine.country_config import country_config_manager
            self.country_config = country_config_manager.get_country_config(self.user_context)
            self.country_code = self.country_config.get('metadata', {}).get('country_code', 'CD')
        except ImportError:
            # Configuration par défaut si le module n'est pas disponible
            self.country_config = {'country_code': 'CD', 'currency': 'CDF'}
            self.country_code = 'CD'
    
    def _build_available_tools(self) -> List[Dict[str, Any]]:
        """
        Construit la liste des outils disponibles selon le pays
        """
        # Outils de base (disponibles pour tous les pays)
        base_tools = [
            {
                "name": "calculate_tva",
                "description": f"Calcule la TVA selon les taux du pays ({self.country_code}). Utilisez cet outil pour tous les calculs de TVA.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "montant": {
                            "type": "number",
                            "description": "Le montant à traiter"
                        },
                        "taux_tva": {
                            "type": "number", 
                            "description": f"Le taux de TVA en pourcentage (défaut: taux standard du pays)"
                        },
                        "type_montant": {
                            "type": "string",
                            "enum": ["HT", "TTC"],
                            "description": "Si le montant fourni est HT ou TTC"
                        }
                    },
                    "required": ["montant", "type_montant"]
                }
            },
            {
                "name": "calculate_fiscal_rdc",
                "description": f"Calcule les impôts et taxes selon la législation du pays ({self.country_code})",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "type_impot": {
                            "type": "string",
                            "enum": ["impot_professionnel", "impot_cedulaire", "charges_sociales", "tva_applicable"],
                            "description": "Type d'impôt à calculer"
                        },
                        "montant": {
                            "type": "number",
                            "description": "Montant de base pour le calcul"
                        },
                        "params": {
                            "type": "object",
                            "description": "Paramètres spécifiques selon le type d'impôt"
                        }
                    },
                    "required": ["type_impot", "montant"]
                }
            },
            {
                "name": "calculate_valuation",
                "description": "Effectue une valorisation d'entreprise (DCF, multiples, valeur patrimoniale)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "method": {
                            "type": "string",
                            "enum": ["dcf", "multiples", "asset_based"],
                            "description": "Méthode de valorisation"
                        },
                        "data": {
                            "type": "object",
                            "description": "Données financières nécessaires à la valorisation"
                        }
                    },
                    "required": ["method", "data"]
                }
            },
            {
                "name": "calculate_financial_math",
                "description": "Effectue des calculs mathématiques financiers (VAN, TIR, annuités, capitalisation)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "calculation_type": {
                            "type": "string",
                            "enum": ["npv", "irr", "future_value", "present_value", "annuity"],
                            "description": "Type de calcul financier"
                        },
                        "parameters": {
                            "type": "object",
                            "description": "Paramètres du calcul (flux, taux, périodes, etc.)"
                        }
                    },
                    "required": ["calculation_type", "parameters"]
                }
            },
            {
                "name": "calculate_due_diligence",
                "description": "Effectue des analyses de due diligence financière (ratios, cash flow, BFR)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "analysis_type": {
                            "type": "string",
                            "enum": ["financial_ratios", "cash_flow_quality", "working_capital"],
                            "description": "Type d'analyse de due diligence"
                        },
                        "financial_data": {
                            "type": "object",
                            "description": "Données financières pour l'analyse"
                        }
                    },
                    "required": ["analysis_type", "financial_data"]
                }
            },
            {
                "name": "calculate_econometrics",
                "description": "Effectue des analyses économétriques (régression, corrélation, prévisions)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "analysis_type": {
                            "type": "string",
                            "enum": ["linear_regression", "correlation", "trend_forecast", "descriptive_stats"],
                            "description": "Type d'analyse économétrique"
                        },
                        "data": {
                            "type": "object",
                            "description": "Données pour l'analyse"
                        }
                    },
                    "required": ["analysis_type", "data"]
                }
            },
            {
                "name": "calculate_arithmetic",
                "description": "Effectue des calculs arithmétiques (addition, soustraction, multiplication, division)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": ["add", "subtract", "multiply", "divide"],
                            "description": "Type d'opération arithmétique"
                        },
                        "operands": {
                            "type": "array",
                            "items": {"type": "number"},
                            "description": "Liste des nombres pour l'opération"
                        }
                    },
                    "required": ["operation", "operands"]
                }
            },
            {
                "name": "calculate_accounting_balance",
                "description": "Calcule et équilibre les écritures comptables (débits/crédits)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "entries": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "account": {"type": "string"},
                                    "debit": {"type": "number"},
                                    "credit": {"type": "number"}
                                }
                            },
                            "description": "Liste des écritures comptables"
                        }
                    },
                    "required": ["entries"]
                }
            },
            {
                "name": "calculate_percentage",
                "description": "Calcule un pourcentage d'un montant de base",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "pourcentage": {
                            "type": "number",
                            "description": "Le pourcentage à calculer"
                        },
                        "montant_base": {
                            "type": "number",
                            "description": "Le montant de base"
                        }
                    },
                    "required": ["pourcentage", "montant_base"]
                }
            },
            {
                "name": "calculate_sum",
                "description": "Calcule la somme d'une liste de nombres",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "nombres": {
                            "type": "array",
                            "items": {"type": "number"},
                            "description": "Liste des nombres à additionner"
                        }
                    },
                    "required": ["nombres"]
                }
            },
            {
                "name": "calculate_average",
                "description": "Calcule la moyenne d'une liste de nombres",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "nombres": {
                            "type": "array",
                            "items": {"type": "number"},
                            "description": "Liste des nombres pour calculer la moyenne"
                        }
                    },
                    "required": ["nombres"]
                }
            }
        ]
        
        # Outils avancés (selon le pays et les standards comptables)
        advanced_tools = []
        
        # Ajouter les outils fiscaux spécifiques au pays
        if self.country_code in ['CD', 'CM', 'CI', 'SN']:  # Pays OHADA
            advanced_tools.extend([
                {
                    "name": "fiscal_calculation",
                    "description": f"Calculs fiscaux pour {self.country_code} (impôts, taxes, charges sociales selon la législation locale)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "type_calcul": {
                                "type": "string",
                                "enum": ["impot_professionnel", "impot_cedulaire", "charges_sociales", "tva_locale", "retenue_source"],
                                "description": "Type de calcul fiscal"
                            },
                            "donnees": {
                                "type": "object",
                                "description": "Données nécessaires pour le calcul fiscal"
                            }
                        },
                        "required": ["type_calcul", "donnees"]
                    }
                },
                {
                    "name": "financial_analysis_ohada",
                    "description": "Analyses financières selon les normes OHADA (ratios, amortissements, provisions)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "type_analyse": {
                                "type": "string",
                                "enum": ["ratio_liquidite", "ratio_rentabilite", "working_capital", "break_even", "depreciation_ohada", "provision"],
                                "description": "Type d'analyse financière OHADA"
                            },
                            "donnees": {
                                "type": "object",
                                "description": "Données financières nécessaires"
                            }
                        },
                        "required": ["type_analyse", "donnees"]
                    }
                }
            ])
        
        # Outils universels de finance avancée
        advanced_tools.extend([
            {
                "name": "valuation_calculation",
                "description": "Calculs de valorisation d'entreprise (DCF, multiples, actifs nets)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "methode": {
                            "type": "string",
                            "enum": ["dcf", "multiples", "actif_net", "eva"],
                            "description": "Méthode de valorisation"
                        },
                        "donnees": {
                            "type": "object",
                            "description": "Données financières pour la valorisation"
                        }
                    },
                    "required": ["methode", "donnees"]
                }
            },
            {
                "name": "financial_math",
                "description": "Mathématiques financières (VAN, TIR, annuités, capitalisation, actualisation)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "calcul": {
                            "type": "string",
                            "enum": ["van", "tir", "annuite", "capitalisation", "actualisation", "duree_recuperation"],
                            "description": "Type de calcul mathématique financier"
                        },
                        "parametres": {
                            "type": "object",
                            "description": "Paramètres nécessaires pour le calcul"
                        }
                    },
                    "required": ["calcul", "parametres"]
                }
            }
        ])
        
        return base_tools + advanced_tools
    
    def get_openai_function_definitions(self) -> List[Dict[str, Any]]:
        """
        Retourne les définitions des fonctions au format OpenAI Function Calling.
        """
        return [
            {
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool["description"],
                    "parameters": tool["parameters"]
                }
            }
            for tool in self.available_tools
        ]
    
    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Exécute un outil spécifique avec les arguments fournis.
        Vérifie les données requises et demande les informations manquantes à l'utilisateur.
        
        Args:
            tool_name: Nom de l'outil à exécuter
            arguments: Arguments pour l'outil
            
        Returns:
            Dict contenant le résultat du calcul ou les questions pour données manquantes
        """
        try:
            # Vérifier les données requises avant exécution
            missing_data = self._check_required_data(tool_name, arguments)
            
            if missing_data['has_missing']:
                # Récupérer les connaissances et générer les questions
                from agents.utils.knowledge_retrieval import KnowledgeRetriever
                retriever = KnowledgeRetriever()
                
                knowledge_result = retriever.retrieve_for_calculation(
                    tool_name.replace('calculate_', ''),
                    list(arguments.keys())
                )
                
                return {
                    "success": False,
                    "requires_user_input": True,
                    "missing_data": missing_data['missing_fields'],
                    "questions": knowledge_result['questions_for_user'],
                    "knowledge_available": knowledge_result['knowledge'].get('found', False),
                    "message": f"Données manquantes pour {tool_name}. Veuillez fournir les informations suivantes:",
                    "calculation_type": tool_name
                }
            
            # Exécuter l'outil si toutes les données sont présentes
            # Outils de base
            if tool_name == "calculate_tva":
                return self._calculate_tva_tool(arguments)
            elif tool_name == "calculate_arithmetic":
                return self._calculate_arithmetic_tool(arguments)
            elif tool_name == "calculate_accounting_balance":
                return self._calculate_accounting_balance_tool(arguments)
            elif tool_name == "calculate_percentage":
                return self._calculate_percentage_tool(arguments)
            elif tool_name == "calculate_sum":
                return self._calculate_sum_tool(arguments)
            elif tool_name == "calculate_average":
                return self._calculate_average_tool(arguments)
            
            # Outils avancés
            elif tool_name == "fiscal_calculation":
                return self._fiscal_calculation_tool(arguments)
            elif tool_name == "financial_analysis_ohada":
                return self._financial_analysis_ohada_tool(arguments)
            elif tool_name == "calculate_fiscal_rdc":
                return self._fiscal_calculation_tool(arguments)
            elif tool_name == "calculate_valuation":
                return self._valuation_calculation_tool(arguments)
            elif tool_name == "calculate_financial_math":
                return self._financial_math_tool(arguments)
            elif tool_name == "calculate_due_diligence":
                return self._due_diligence_tool(arguments)
            elif tool_name == "calculate_econometrics":
                return self._econometrics_tool(arguments)
            
            else:
                return {
                    "success": False,
                    "error": f"Outil {tool_name} non reconnu pour le pays {self.country_code}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Erreur lors de l'exécution de {tool_name}: {str(e)}"
            }
    
    def _check_required_data(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Vérifie si toutes les données requises sont présentes pour un outil
        """
        required_data_map = {
            'calculate_tva': ['montant', 'type_montant'],
            'calculate_fiscal_rdc': ['type_impot', 'montant'],
            'calculate_valuation': ['method', 'data'],
            'calculate_financial_math': ['calculation_type', 'parameters'],
            'calculate_due_diligence': ['analysis_type', 'financial_data'],
            'calculate_econometrics': ['analysis_type', 'data'],
            'calculate_arithmetic': ['operation', 'operands'],
            'calculate_percentage': ['pourcentage', 'montant_base'],
            'calculate_sum': ['nombres'],
            'calculate_average': ['nombres'],
            'calculate_accounting_balance': ['entries']
        }
        
        required_fields = required_data_map.get(tool_name, [])
        provided_fields = list(arguments.keys())
        missing_fields = [field for field in required_fields if field not in provided_fields]
        
        return {
            'has_missing': len(missing_fields) > 0,
            'missing_fields': missing_fields,
            'required_fields': required_fields,
            'provided_fields': provided_fields
        }
    
    # Implémentations des outils de base (conservées de l'existant)
    def _calculate_tva_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil de calcul TVA selon le pays."""
        try:
            montant = args["montant"]
            type_montant = args["type_montant"]
            
            # Récupérer le taux TVA par défaut du pays ou celui spécifié
            if "taux_tva" in args:
                taux_tva = args["taux_tva"]
            else:
                # Utiliser le taux standard du pays
                taux_tva = float(self.country_config.get('fiscal', {}).get('tva_standard', 16))
            
            if type_montant == "HT":
                montant_ht = self.calculation_helper.parse_number(montant)
                tva = self.calculation_helper.multiply(montant_ht, taux_tva / 100)
                montant_ttc = self.calculation_helper.add(montant_ht, tva)
                
                return {
                    "success": True,
                    "montant_ht": float(montant_ht),
                    "tva": float(tva),
                    "montant_ttc": float(montant_ttc),
                    "taux_tva": taux_tva,
                    "pays": self.country_code,
                    "formatted_result": f"Montant HT: {montant_ht}, TVA ({taux_tva}%): {tva}, Montant TTC: {montant_ttc}"
                }
            else:  # TTC
                montant_ttc = self.calculation_helper.parse_number(montant)
                diviseur = self.calculation_helper.add(1, taux_tva / 100)
                montant_ht = self.calculation_helper.divide(montant_ttc, diviseur)
                tva = self.calculation_helper.subtract(montant_ttc, montant_ht)
                
                return {
                    "success": True,
                    "montant_ttc": float(montant_ttc),
                    "tva": float(tva),
                    "montant_ht": float(montant_ht),
                    "taux_tva": taux_tva,
                    "pays": self.country_code,
                    "formatted_result": f"Montant TTC: {montant_ttc}, TVA ({taux_tva}%): {tva}, Montant HT: {montant_ht}"
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _calculate_arithmetic_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil de calcul arithmétique."""
        try:
            operation = args["operation"]
            operands = [self.calculation_helper.parse_number(op) for op in args["operands"]]
            
            if operation == "add":
                result = self.calculation_helper.add(*operands)
            elif operation == "subtract":
                result = self.calculation_helper.subtract(operands[0], operands[1])
            elif operation == "multiply":
                result = self.calculation_helper.multiply(operands[0], operands[1])
            elif operation == "divide":
                result = self.calculation_helper.divide(operands[0], operands[1])
            else:
                return {"success": False, "error": f"Opération {operation} non supportée"}
            
            return {
                "success": True,
                "result": float(result),
                "operation": operation,
                "operands": [float(op) for op in operands],
                "formatted_result": f"{operation}: {result}"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _calculate_accounting_balance_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil de calcul d'équilibre comptable."""
        try:
            entries = args["entries"]
            
            total_debit = self.calculation_helper.add(*[
                self.calculation_helper.parse_number(entry.get("debit", 0)) 
                for entry in entries
            ])
            
            total_credit = self.calculation_helper.add(*[
                self.calculation_helper.parse_number(entry.get("credit", 0)) 
                for entry in entries
            ])
            
            solde = self.calculation_helper.subtract(total_debit, total_credit)
            
            return {
                "success": True,
                "total_debit": float(total_debit),
                "total_credit": float(total_credit),
                "solde": float(solde),
                "equilibre": abs(float(solde)) < 0.01,
                "pays": self.country_code,
                "formatted_result": f"Total Débit: {total_debit}, Total Crédit: {total_credit}, Solde: {solde} ({'équilibré' if abs(float(solde)) < 0.01 else 'déséquilibré'})"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _calculate_percentage_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil de calcul de pourcentage."""
        try:
            pourcentage = args["pourcentage"]
            montant_base = self.calculation_helper.parse_number(args["montant_base"])
            
            result = self.calculation_helper.multiply(montant_base, pourcentage / 100)
            
            return {
                "success": True,
                "result": float(result),
                "pourcentage": pourcentage,
                "montant_base": float(montant_base),
                "formatted_result": f"{pourcentage}% de {montant_base} = {result}"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _calculate_sum_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil de calcul de somme."""
        try:
            nombres = [self.calculation_helper.parse_number(n) for n in args["nombres"]]
            result = self.calculation_helper.add(*nombres)
            
            return {
                "success": True,
                "result": float(result),
                "count": len(nombres),
                "formatted_result": f"Somme de {len(nombres)} nombres = {result}"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _calculate_average_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil de calcul de moyenne."""
        try:
            nombres = [self.calculation_helper.parse_number(n) for n in args["nombres"]]
            if not nombres:
                return {"success": False, "error": "Aucun nombre fourni"}
                
            total = self.calculation_helper.add(*nombres)
            average = self.calculation_helper.divide(total, len(nombres))
            
            return {
                "success": True,
                "result": float(average),
                "count": len(nombres),
                "total": float(total),
                "formatted_result": f"Moyenne de {len(nombres)} nombres = {average}"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # Nouveaux outils avancés avec gestion dynamique du pays
    def _fiscal_calculation_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil de calcul fiscal selon le pays."""
        try:
            from financial_engine.calculators.fiscal import FiscalCalculator
            
            calculator = FiscalCalculator(user_context=self.user_context)
            type_impot = args.get("type_impot", args.get("type_calcul"))
            montant = args.get("montant", 0)
            params = args.get("params", args.get("donnees", {}))
            
            if type_impot == "impot_professionnel":
                ca_annuel = params.get("chiffre_affaires", montant)
                result = calculator.calculate_impot_professionnel(ca_annuel)
                
            elif type_impot == "impot_cedulaire":
                salaire_mensuel = params.get("salaire_mensuel", montant)
                result = calculator.calculate_impot_cedulaire(salaire_mensuel)
                
            elif type_impot == "charges_sociales":
                salaire_brut = params.get("salaire_brut", montant)
                result = calculator.calculate_charges_sociales(salaire_brut)
                
            elif type_impot in ["tva_applicable", "tva_locale"]:
                montant_ht = params.get("montant_ht", montant)
                result = calculator.calculate_tva_rdc(montant_ht)
                
            else:
                return {"success": False, "error": f"Type d'impôt {type_impot} non supporté"}
            
            return {
                "success": True,
                "type": type_impot,
                "result": result,
                "pays": self.country_code
            }
            
        except ImportError:
            return {"success": False, "error": "Module de calcul fiscal non disponible"}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
            return {
                "success": True,
                "type": type_calcul,
                "result": result,
                "pays": self.country_code
            }
            
        except ImportError:
            return {"success": False, "error": "Module de calcul fiscal non disponible"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _financial_analysis_ohada_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil d'analyse financière OHADA."""
        try:
            from financial_engine.calculators.accounting import AccountingCalculator
            
            calculator = AccountingCalculator()
            type_analyse = args["type_analyse"]
            donnees = args["donnees"]
            
            if type_analyse == "working_capital":
                current_assets = donnees.get("actif_circulant", 0)
                current_liabilities = donnees.get("passif_circulant", 0)
                result = calculator.calculate_working_capital(current_assets, current_liabilities)
                
            elif type_analyse == "depreciation_ohada":
                asset_value = donnees.get("valeur_actif", 0)
                useful_life = donnees.get("duree_utilite", 5)
                method = donnees.get("methode", "linear")
                result = calculator.calculate_depreciation(asset_value, useful_life, method)
                
            else:
                return {"success": False, "error": f"Type d'analyse {type_analyse} non supporté"}
            
            return {
                "success": True,
                "type": type_analyse,
                "result": result,
                "standards": "OHADA",
                "pays": self.country_code
            }
            
        except ImportError:
            return {"success": False, "error": "Module d'analyse financière non disponible"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _valuation_calculation_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil de valorisation d'entreprise."""
        try:
            from financial_engine.calculators.valuation import ValuationCalculator
            
            calculator = ValuationCalculator()
            method = args.get("method", args.get("methode"))
            data = args.get("data", args.get("donnees", {}))
            
            if method == "dcf":
                result = calculator.calculate_dcf(**data)
            elif method == "multiples":
                result = calculator.calculate_multiples_valuation(**data)
            elif method in ["asset_based", "actif_net"]:
                result = calculator.calculate_asset_based_valuation(**data)
            else:
                return {"success": False, "error": f"Méthode {method} non supportée"}
            
            return {
                "success": True,
                "method": method,
                "result": result,
                "pays": self.country_code
            }
            
        except ImportError:
            # Fallback vers implémentation basique
            methode = args.get("method", args.get("methode"))
            donnees = args.get("data", args.get("donnees", {}))
            
            if methode in ["actif_net", "asset_based"]:
                total_assets = donnees.get("total_actif", 0)
                total_liabilities = donnees.get("total_passif", 0)
                valeur = self.calculation_helper.subtract(total_assets, total_liabilities)
                
                result = {
                    "methode": "Actif Net",
                    "total_actif": total_assets,
                    "total_passif": total_liabilities,
                    "valeur_entreprise": float(valeur),
                    "monnaie": self.country_config.get('currency', 'CDF')
                }
                
            elif methode == "multiples":
                ebitda = donnees.get("ebitda", 0)
                multiple = donnees.get("multiple", 8)
                valeur = self.calculation_helper.multiply(ebitda, multiple)
                
                result = {
                    "methode": "Multiples EBITDA",
                    "ebitda": ebitda,
                    "multiple": multiple,
                    "valeur_entreprise": float(valeur),
                    "monnaie": self.country_config.get('currency', 'CDF')
                }
                
            else:
                return {"success": False, "error": f"Méthode {methode} non implémentée"}
            
            return {
                "success": True,
                "methode": methode,
                "result": result,
                "pays": self.country_code
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _financial_math_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil de mathématiques financières."""
        try:
            from financial_engine.calculators.financial_math import FinancialMathCalculator
            
            calculator = FinancialMathCalculator()
            calculation_type = args.get("calculation_type", args.get("calcul"))
            parameters = args.get("parameters", args.get("parametres", {}))
            
            if calculation_type == "npv":
                result = calculator.calculate_npv(**parameters)
            elif calculation_type == "irr":
                result = calculator.calculate_irr(**parameters)
            elif calculation_type in ["future_value", "capitalisation"]:
                result = calculator.calculate_future_value(**parameters)
            elif calculation_type in ["present_value", "actualisation"]:
                result = calculator.calculate_present_value(**parameters)
            elif calculation_type == "annuity":
                result = calculator.calculate_annuity(**parameters)
            else:
                return {"success": False, "error": f"Type de calcul {calculation_type} non supporté"}
            
            return {
                "success": True,
                "calculation_type": calculation_type,
                "result": result,
                "pays": self.country_code
            }
            
        except ImportError:
            # Fallback vers implémentation basique
            calcul = args.get("calculation_type", args.get("calcul"))
            parametres = args.get("parameters", args.get("parametres", {}))
            
            if calcul in ["capitalisation", "future_value"]:
                valeur_actuelle = parametres.get("valeur_actuelle", parametres.get("present_value", 0))
                taux = parametres.get("taux", parametres.get("rate", 0.05))
                periodes = parametres.get("periodes", parametres.get("periods", 1))
                
                # VF = VA * (1 + r)^n
                facteur = self.calculation_helper.add(1, taux)
                valeur_future = self.calculation_helper.multiply(
                    valeur_actuelle, 
                    facteur ** periodes
                )
                
                result = {
                    "valeur_actuelle": valeur_actuelle,
                    "taux": taux,
                    "periodes": periodes,
                    "valeur_future": float(valeur_future)
                }
                
            elif calcul in ["actualisation", "present_value"]:
                valeur_future = parametres.get("valeur_future", parametres.get("future_value", 0))
                taux = parametres.get("taux", parametres.get("rate", 0.05))
                periodes = parametres.get("periodes", parametres.get("periods", 1))
                
                # VA = VF / (1 + r)^n
                facteur = self.calculation_helper.add(1, taux)
                valeur_actuelle = self.calculation_helper.divide(
                    valeur_future,
                    facteur ** periodes
                )
                
                result = {
                    "valeur_future": valeur_future,
                    "taux": taux,
                    "periodes": periodes,
                    "valeur_actuelle": float(valeur_actuelle)
                }
                
            else:
                return {"success": False, "error": f"Calcul {calcul} non implémenté"}
            
            return {
                "success": True,
                "calcul": calcul,
                "result": result,
                "pays": self.country_code
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _due_diligence_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil d'analyse de due diligence."""
        try:
            from financial_engine.calculators.due_diligence import DueDiligenceCalculator
            
            calculator = DueDiligenceCalculator()
            analysis_type = args["analysis_type"]
            financial_data = args["financial_data"]
            
            if analysis_type == "financial_ratios":
                result = calculator.analyze_financial_ratios(financial_data)
            elif analysis_type == "cash_flow_quality":
                result = calculator.analyze_cash_flow_quality(financial_data)
            elif analysis_type == "working_capital":
                result = calculator.assess_working_capital(financial_data)
            else:
                return {"success": False, "error": f"Type d'analyse {analysis_type} non supporté"}
            
            return {
                "success": True,
                "analysis_type": analysis_type,
                "result": result,
                "pays": self.country_code
            }
            
        except ImportError:
            return {"success": False, "error": "Module de due diligence non disponible"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _econometrics_tool(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Outil d'analyse économétrique."""
        try:
            from financial_engine.calculators.econometrics import EconometricsCalculator
            
            calculator = EconometricsCalculator()
            analysis_type = args["analysis_type"]
            data = args["data"]
            
            if analysis_type == "linear_regression":
                result = calculator.calculate_linear_regression(data.get('x_data', []), data.get('y_data', []))
            elif analysis_type == "correlation":
                result = calculator.calculate_correlation(data.get('x_data', []), data.get('y_data', []))
            elif analysis_type == "trend_forecast":
                result = calculator.calculate_trend_forecast(data.get('time_series', []), data.get('periods_ahead', 3))
            elif analysis_type == "descriptive_stats":
                result = calculator.calculate_descriptive_stats(data.get('dataset', []))
            else:
                return {"success": False, "error": f"Type d'analyse {analysis_type} non supporté"}
            
            return {
                "success": True,
                "analysis_type": analysis_type,
                "result": result,
                "pays": self.country_code
            }
            
        except ImportError:
            return {"success": False, "error": "Module d'économétrie non disponible"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_country_info(self) -> Dict[str, Any]:
        """
        Retourne les informations sur le pays configuré
        """
        return {
            "country_code": self.country_code,
            "country_config": self.country_config,
            "available_tools": [tool["name"] for tool in self.available_tools],
            "fiscal_info": self.country_config.get('fiscal', {}),
            "accounting_standards": self.country_config.get('accounting', {}).get('standards', 'Unknown')
        }
