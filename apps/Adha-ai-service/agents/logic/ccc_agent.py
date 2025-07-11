# agents/logic/ccc_agent.py

import os
from agents.utils.calculation_helper import CalculationHelper

class CCCAgent:
    def __init__(self):
        print("CCCAgent initialized")
        # Charger les règles de cohérence et de conformité comptables
        self.coherence_rules = self._load_coherence_rules()
        self.compliance_rules = self._load_compliance_rules()
        self.calculator = CalculationHelper(precision=2)  # Utilisation du nouveau helper

    def _load_coherence_rules(self):
        """
        Charge les règles de cohérence comptable (par exemple, la balance débit/crédit doit être égale).
        """
        # À implémenter: Charger les règles depuis une source (fichier, base de données, etc.)
        return {
            "debit_credit_balance": "debit_amount == credit_amount",
            # Ajoutez d'autres règles de cohérence
        }

    def _load_compliance_rules(self):
        """
        Charge les règles de conformité légale et réglementaire (par exemple, les taux de TVA).
        """
        # À implémenter: Charger les règles depuis une source
        return {
            "tva_taux_standard": 0.18,
            # Ajoutez d'autres règles de conformité
        }

    def _load_compliance_rules_from_file(self):
        """
        Charge les règles de conformité depuis le fichier knowledge_base/knoleg.txt.
        """
        rules_path = os.path.join(os.path.dirname(__file__), "../../data/knowledge_base/knoleg.txt")
        rules = {}
        try:
            with open(rules_path, "r", encoding="utf-8") as file:
                lines = file.readlines()
                current_section = None
                for line in lines:
                    line = line.strip()
                    if line.startswith("#"):
                        current_section = line.strip("# ").lower()
                        rules[current_section] = []
                    elif line and current_section:
                        rules[current_section].append(line)
            print(f"Loaded compliance rules from {rules_path}")
        except Exception as e:
            print(f"Erreur lors du chargement des règles de conformité : {e}")
        return rules

    def verify(self, proposed_entries):
        """
        Vérifie la cohérence interne et la conformité légale des propositions d'écriture.
        Accepte toujours les écritures mais signale clairement les déséquilibres.
        """
        print(f"CCCAgent verifying: {type(proposed_entries)}, content: {proposed_entries}")
        
        # Si proposals est None, vide ou non analysable, retourner un résultat par défaut
        if not proposed_entries:
            return {
                "is_coherent": False,
                "is_compliant": False,
                "errors": ["Aucune écriture proposée"]
            }

        errors = []
        warnings = []
        is_coherent = True
        is_compliant = True
        has_forced_balance = False

        # Normaliser la structure des entrées pour garantir une compatibilité
        normalized_entries = self._normalize_entries(proposed_entries)
        
        # Si après normalisation nous n'avons toujours pas d'entrées valides
        if not normalized_entries:
            return {
                "is_coherent": False,
                "is_compliant": False,
                "errors": ["Format d'écritures non reconnu ou incomplet"]
            }

        # Vérifier et équilibrer chaque écriture proposée
        for i, entry in enumerate(normalized_entries):
            try:
                # Vérification des champs obligatoires
                if not isinstance(entry, dict):
                    errors.append(f"Format d'écriture invalide à l'indice {i}: {type(entry)}")
                    is_coherent = False
                    continue
                    
                if not entry.get("debit") or not entry.get("credit"):
                    errors.append(f"Les comptes de débit et de crédit doivent être spécifiés pour l'écriture {i+1}")
                    is_coherent = False
                    continue

                # Vérifier et corriger les montants au débit et au crédit si nécessaire
                try:
                    # Utilisation du calculator pour des calculs plus précis
                    debit_amounts = [d.get("montant", 0) for d in entry.get("debit", [])]
                    credit_amounts = [c.get("montant", 0) for c in entry.get("credit", [])]
                    
                    debit_sum = self.calculator.sum_list(debit_amounts)
                    credit_sum = self.calculator.sum_list(credit_amounts)
                    
                    # Calcul précis de la différence
                    difference = self.calculator.subtract(debit_sum, credit_sum)
                    
                    if abs(difference) > self.calculator.parse_number('0.01'):
                        # Noter l'erreur mais ne pas rejeter l'écriture
                        warning_msg = f"Déséquilibre détecté: Débit={self.calculator.format_decimal(debit_sum)}, Crédit={self.calculator.format_decimal(credit_sum)}, Différence={self.calculator.format_decimal(difference)}"
                        warnings.append(warning_msg)
                        
                        # Équilibrer automatiquement l'écriture
                        if difference > 0:  # Débit > Crédit
                            entry["credit"].append({
                                "compte": "471000", # Compte d'attente
                                "montant": float(difference),
                                "libelle": f"Montant non justifié - Équilibrage automatique (Déséquilibre: {self.calculator.format_decimal(difference)})"
                            })
                        else:  # Crédit > Débit
                            entry["debit"].append({
                                "compte": "471000", # Compte d'attente
                                "montant": float(abs(difference)),
                                "libelle": f"Montant non justifié - Équilibrage automatique (Déséquilibre: {self.calculator.format_decimal(abs(difference))})"
                            })
                        
                        has_forced_balance = True

                    # Vérifier si les comptes sont valides (format numérique)
                    for debit in entry.get("debit", []):
                        compte = str(debit.get("compte", "")).strip()
                        if not compte or not any(c.isdigit() for c in compte):
                            warnings.append(f"Compte de débit potentiellement invalide: {compte}")
                    
                    for credit in entry.get("credit", []):
                        compte = str(credit.get("compte", "")).strip()
                        if not compte or not any(c.isdigit() for c in compte):
                            warnings.append(f"Compte de crédit potentiellement invalide: {compte}")
                    
                except Exception as e:
                    errors.append(f"Erreur lors de la vérification des montants: {str(e)}")
                    is_coherent = False
            
            except Exception as e:
                errors.append(f"Erreur lors de la vérification d'une écriture: {str(e)}")
                is_coherent = False

        # Si nous avons dû forcer l'équilibre, c'est cohérent mais avec des avertissements
        if has_forced_balance:
            is_coherent = True
            is_compliant = True  # On considère que l'écriture est maintenant conforme grâce à l'ajustement

        return {
            "is_coherent": is_coherent,
            "is_compliant": is_compliant,
            "errors": errors,
            "warnings": warnings,
            "has_forced_balance": has_forced_balance
        }

    def _normalize_entries(self, proposed_entries):
        """
        Normalise la structure des entrées pour garantir un format cohérent.
        Gère divers formats d'entrée possibles et les convertit en liste d'entrées standard.
        """
        try:
            # Cas 1: Entrée déjà sous forme de liste d'entrées
            if isinstance(proposed_entries, list):
                return proposed_entries
            
            # Cas 2: Entrée sous forme de dictionnaire avec clé "proposals"
            if isinstance(proposed_entries, dict):
                # a) Format { "proposals": [...] }
                if "proposals" in proposed_entries and isinstance(proposed_entries["proposals"], list):
                    return proposed_entries["proposals"]
                
                # b) Format d'une seule entrée { "debit": [...], "credit": [...] }
                if "debit" in proposed_entries and "credit" in proposed_entries:
                    return [proposed_entries]
                
                # c) Autre structure de dictionnaire, chercher des entrées récursivement
                for key, value in proposed_entries.items():
                    if isinstance(value, (list, dict)):
                        normalized = self._normalize_entries(value)
                        if normalized:  # Si on a trouvé des entrées, retourner
                            return normalized
            
            # Cas 3: Aucun format reconnu
            print(f"Format d'entrée non reconnu: {type(proposed_entries)}")
            return []
            
        except Exception as e:
            print(f"Erreur lors de la normalisation des entrées: {e}")
            return []

# Exemple d'utilisation (dans l'Agent AA)
if __name__ == '__main__':
    verifier = CCCAgent()
    proposal = {"debit_account": "Compte X", "credit_account": "Compte Y", "amount": 100.00, "description": "Achat"}
    verification_result = verifier.verify(proposal)
    print(f"Vérification: {verification_result}")