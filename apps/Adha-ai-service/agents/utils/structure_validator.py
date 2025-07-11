"""
Utilitaire pour valider la structure des données échangées entre agents.
Assure que les données suivent le format attendu.
"""
import json
from decimal import Decimal
from typing import Tuple, List, Dict, Any

class StructureValidator:
    @staticmethod
    def validate_entry_proposal(proposal: Dict) -> Tuple[bool, List[str]]:
        """
        Vérifie qu'une proposition d'écriture comptable a la structure attendue.
        
        Structure attendue:
        {
            "description": str,
            "date": str,
            "piece_reference": str,
            "journal": str,
            "debit": [{"compte": str, "montant": float, "libelle": str}, ...],
            "credit": [{"compte": str, "montant": float, "libelle": str}, ...]
        }
        
        Args:
            proposal (dict): La proposition à valider
            
        Returns:
            tuple: (is_valid, errors) où is_valid est un booléen et errors est une liste d'erreurs
        """
        errors = []
        
        # Vérifier les champs obligatoires
        if not isinstance(proposal, dict):
            return False, ["La proposition doit être un dictionnaire"]
        
        # Vérifier les champs de base
        for field in ["description"]:
            if field not in proposal:
                errors.append(f"Champ obligatoire manquant: {field}")
        
        # Vérifier la structure des listes débit/crédit
        if "debit" in proposal:
            if not isinstance(proposal["debit"], list):
                errors.append("Le champ 'debit' doit être une liste")
            else:
                for i, debit_entry in enumerate(proposal["debit"]):
                    if not isinstance(debit_entry, dict):
                        errors.append(f"L'élément débit {i} doit être un dictionnaire")
                        continue
                    
                    if "compte" not in debit_entry:
                        errors.append(f"Compte manquant dans l'élément débit {i}")
                    
                    if "montant" not in debit_entry:
                        errors.append(f"Montant manquant dans l'élément débit {i}")
                    elif not isinstance(debit_entry["montant"], (int, float, Decimal, str)):
                        errors.append(f"Montant invalide dans l'élément débit {i}: {debit_entry['montant']}")
        else:
            errors.append("Champ obligatoire manquant: debit")
            
        if "credit" in proposal:
            if not isinstance(proposal["credit"], list):
                errors.append("Le champ 'credit' doit être une liste")
            else:
                for i, credit_entry in enumerate(proposal["credit"]):
                    if not isinstance(credit_entry, dict):
                        errors.append(f"L'élément crédit {i} doit être un dictionnaire")
                        continue
                    
                    if "compte" not in credit_entry:
                        errors.append(f"Compte manquant dans l'élément crédit {i}")
                    
                    if "montant" not in credit_entry:
                        errors.append(f"Montant manquant dans l'élément crédit {i}")
                    elif not isinstance(credit_entry["montant"], (int, float, Decimal, str)):
                        errors.append(f"Montant invalide dans l'élément crédit {i}: {credit_entry['montant']}")
        else:
            errors.append("Champ obligatoire manquant: credit")
        
        is_valid = len(errors) == 0
        return is_valid, errors
    
    @staticmethod
    def normalize_proposal(proposal: Dict) -> Dict:
        """
        Normalise une proposition d'écriture pour assurer sa conformité au format attendu.
        
        Args:
            proposal (dict): La proposition à normaliser
            
        Returns:
            dict: La proposition normalisée
        """
        if not isinstance(proposal, dict):
            # Renvoyer une structure de base si l'entrée n'est pas un dictionnaire
            return {
                "description": "N/A",
                "date": "N/A",
                "piece_reference": "N/A",
                "journal": "N/A",
                "debit": [],
                "credit": []
            }
        
        normalized = {
            "description": str(proposal.get("description", "N/A")),
            "date": str(proposal.get("date", "N/A")),
            "piece_reference": str(proposal.get("piece_reference", "N/A")),
            "journal": str(proposal.get("journal", "N/A")),
            "debit": [],
            "credit": []
        }
        
        # Normaliser les entrées débit
        if "debit" in proposal and isinstance(proposal["debit"], list):
            for entry in proposal["debit"]:
                if isinstance(entry, dict):
                    try:
                        # Normaliser les montants en float
                        montant = entry.get("montant", 0)
                        if isinstance(montant, str):
                            montant = float(montant.replace(',', '.'))
                        else:
                            montant = float(montant)
                            
                        normalized_entry = {
                            "compte": str(entry.get("compte", "N/A")),
                            "montant": montant,
                            "libelle": str(entry.get("libelle", "N/A"))
                        }
                        normalized["debit"].append(normalized_entry)
                    except (ValueError, TypeError):
                        # Ajouter une entrée avec valeurs par défaut en cas d'erreur
                        normalized["debit"].append({
                            "compte": str(entry.get("compte", "N/A")),
                            "montant": 0.0,
                            "libelle": str(entry.get("libelle", "N/A"))
                        })
        
        # S'assurer qu'il y a au moins une entrée de débit
        if not normalized["debit"]:
            normalized["debit"].append({
                "compte": "N/A",
                "montant": 0.0,
                "libelle": "N/A"
            })
        
        # Normaliser les entrées crédit
        if "credit" in proposal and isinstance(proposal["credit"], list):
            for entry in proposal["credit"]:
                if isinstance(entry, dict):
                    try:
                        # Normaliser les montants en float
                        montant = entry.get("montant", 0)
                        if isinstance(montant, str):
                            montant = float(montant.replace(',', '.'))
                        else:
                            montant = float(montant)
                            
                        normalized_entry = {
                            "compte": str(entry.get("compte", "N/A")),
                            "montant": montant,
                            "libelle": str(entry.get("libelle", "N/A"))
                        }
                        normalized["credit"].append(normalized_entry)
                    except (ValueError, TypeError):
                        # Ajouter une entrée avec valeurs par défaut en cas d'erreur
                        normalized["credit"].append({
                            "compte": str(entry.get("compte", "N/A")),
                            "montant": 0.0,
                            "libelle": str(entry.get("libelle", "N/A"))
                        })
        
        # S'assurer qu'il y a au moins une entrée de crédit
        if not normalized["credit"]:
            normalized["credit"].append({
                "compte": "N/A",
                "montant": 0.0,
                "libelle": "N/A"
            })
        
        return normalized
    
    @staticmethod
    def standardize_journal_entry(entry: Dict) -> Dict:
        """
        Standardise une écriture comptable pour l'enregistrement en base de données.
        S'assure que tous les champs requis existent et sont du bon type.
        
        Args:
            entry: L'écriture comptable à standardiser
            
        Returns:
            Dict: L'écriture standardisée
        """
        standard_entry = {
            "description": "N/A",
            "date": "N/A", 
            "journal": "N/A",
            "piece_reference": "N/A",
            "debit_account": "N/A",
            "credit_account": "N/A",
            "amount": 0.0,
            "debit": [], # Champ obligatoire pour la serialization
            "credit": [], # Champ obligatoire pour la serialization
            "debit_entries": [],
            "credit_entries": [],
            "confidence": 0.0
        }
        
        # Copier les champs disponibles
        if isinstance(entry, dict):
            # Champs textuels simples
            for field in ["description", "date", "journal", "piece_reference"]:
                if field in entry and entry[field]:
                    standard_entry[field] = str(entry[field])
            
            # Comptes principaux
            if "debit_account" in entry and entry["debit_account"]:
                standard_entry["debit_account"] = str(entry["debit_account"])
                
            if "credit_account" in entry and entry["credit_account"]:
                standard_entry["credit_account"] = str(entry["credit_account"])
            
            # Montant
            if "amount" in entry:
                try:
                    standard_entry["amount"] = float(entry["amount"])
                except (ValueError, TypeError):
                    pass  # Garde la valeur par défaut
            
            # Confiance
            if "confidence" in entry:
                try:
                    standard_entry["confidence"] = float(entry["confidence"])
                except (ValueError, TypeError):
                    pass  # Garde la valeur par défaut
            
            # Entrées de débit
            if "debit_entries" in entry and isinstance(entry["debit_entries"], list):
                for item in entry["debit_entries"]:
                    if isinstance(item, dict):
                        try:
                            # Normaliser les champs
                            normalized_item = {
                                "compte": str(item.get("compte", "N/A")),
                                "montant": float(item.get("montant", 0)),
                                "libelle": str(item.get("libelle", "N/A"))
                            }
                            standard_entry["debit_entries"].append(normalized_item)
                        except (ValueError, TypeError):
                            # En cas d'erreur, ajouter une entrée par défaut
                            standard_entry["debit_entries"].append({
                                "compte": "N/A", 
                                "montant": 0.0,
                                "libelle": "N/A"
                            })
            
            # Entrées de crédit
            if "credit_entries" in entry and isinstance(entry["credit_entries"], list):
                for item in entry["credit_entries"]:
                    if isinstance(item, dict):
                        try:
                            # Normaliser les champs
                            normalized_item = {
                                "compte": str(item.get("compte", "N/A")),
                                "montant": float(item.get("montant", 0)),
                                "libelle": str(item.get("libelle", "N/A"))
                            }
                            standard_entry["credit_entries"].append(normalized_item)
                        except (ValueError, TypeError):
                            # En cas d'erreur, ajouter une entrée par défaut
                            standard_entry["credit_entries"].append({
                                "compte": "N/A", 
                                "montant": 0.0,
                                "libelle": "N/A"
                            })
            
            # Traitement direct des champs debit et credit (s'ils existent)
            if "debit" in entry and isinstance(entry["debit"], list):
                standard_entry["debit"] = entry["debit"]
            
            if "credit" in entry and isinstance(entry["credit"], list):
                standard_entry["credit"] = entry["credit"]
        
        # S'assurer qu'il y a au moins une entrée au débit et au crédit
        # et que les champs debit et credit sont remplis (obligatoires pour la serialization)
        if not standard_entry["debit_entries"]:
            standard_entry["debit_entries"].append({
                "compte": standard_entry["debit_account"],
                "montant": standard_entry["amount"],
                "libelle": "N/A"
            })
            
        if not standard_entry["credit_entries"]:
            standard_entry["credit_entries"].append({
                "compte": standard_entry["credit_account"],
                "montant": standard_entry["amount"],
                "libelle": "N/A"
            })
            
        # S'assurer que les comptes principaux sont renseignés s'ils sont vides
        if standard_entry["debit_account"] == "N/A" and standard_entry["debit_entries"]:
            standard_entry["debit_account"] = standard_entry["debit_entries"][0]["compte"]
            
        if standard_entry["credit_account"] == "N/A" and standard_entry["credit_entries"]:
            standard_entry["credit_account"] = standard_entry["credit_entries"][0]["compte"]
        
        # Assurer que debit et credit sont correctement remplis quoi qu'il arrive
        if not standard_entry["debit"]:
            standard_entry["debit"] = standard_entry["debit_entries"]
            
        if not standard_entry["credit"]:
            standard_entry["credit"] = standard_entry["credit_entries"]
            
        return standard_entry
