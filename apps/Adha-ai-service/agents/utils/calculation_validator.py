"""
Utilitaire pour la validation précise des calculs comptables
"""
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from typing import Dict, List, Any

class CalculationValidator:
    """
    Cette classe fournit des méthodes pour valider les calculs
    comptables avec une précision accrue
    """
    
    def __init__(self, precision: int = 2):
        """
        Initialise le validateur de calculs
        
        Args:
            precision: Nombre de décimales pour les arrondis
        """
        self.precision = precision
        self.decimal_context = Decimal('0.' + '0' * (precision - 1) + '1')
    
    def validate_invoice_totals(self, line_items, subtotal, tax_total, total, default_tax_rate=None):
        """
        Valide les totaux d'une facture
        
        Args:
            line_items: Liste des lignes de facture
            subtotal: Total HT déclaré
            tax_total: Total TVA déclaré
            total: Total TTC déclaré
            default_tax_rate: Taux de TVA par défaut (si non spécifié dans les lignes)
            
        Returns:
            dict: Résultats de la validation
        """
        try:
            # Utiliser les paramètres décimaux pour des calculs plus précis
            results = {
                "calculations_correct": True,
                "details": {}
            }
            
            # Convertir tout en Decimal pour une précision maximale
            if subtotal is not None:
                subtotal_dec = Decimal(str(subtotal))
            else:
                subtotal_dec = None
                
            if tax_total is not None:
                tax_total_dec = Decimal(str(tax_total))
            else:
                tax_total_dec = None
                
            if total is not None:
                total_dec = Decimal(str(total))
            else:
                total_dec = None
            
            # Calculer les totaux à partir des lignes
            calculated_subtotal = Decimal('0')
            calculated_tax = Decimal('0')
            
            # Si nous avons des lignes, calculer les totaux à partir d'elles
            if line_items:
                for item in line_items:
                    if "amount" in item and item["amount"] is not None:
                        item_amount = Decimal(str(item["amount"]))
                        calculated_subtotal += item_amount
                    
                    # Si des informations de TVA sont disponibles
                    if "tax_rate" in item and "amount" in item and \
                       item["tax_rate"] is not None and item["amount"] is not None:
                        tax_rate = Decimal(str(item["tax_rate"])) / Decimal('100')
                        item_amount = Decimal(str(item["amount"]))
                        item_tax = item_amount * tax_rate
                        calculated_tax += item_tax
            
            # Arrondir les résultats calculés
            calculated_subtotal = calculated_subtotal.quantize(self.decimal_context, rounding=ROUND_HALF_UP)
            calculated_tax = calculated_tax.quantize(self.decimal_context, rounding=ROUND_HALF_UP)
            calculated_total = (calculated_subtotal + calculated_tax).quantize(self.decimal_context, rounding=ROUND_HALF_UP)
            
            # Vérifier les totaux
            discrepancies = {}
            if subtotal_dec is not None and calculated_subtotal != Decimal('0'):
                subtotal_diff = abs(subtotal_dec - calculated_subtotal)
                if subtotal_diff > Decimal('0.02'):  # Tolérance pour les erreurs d'arrondi
                    discrepancies["subtotal"] = {
                        "declared": float(subtotal_dec),
                        "calculated": float(calculated_subtotal),
                        "difference": float(subtotal_diff)
                    }
                    results["calculations_correct"] = False
            
            if tax_total_dec is not None and calculated_tax != Decimal('0'):
                tax_diff = abs(tax_total_dec - calculated_tax)
                if tax_diff > Decimal('0.02'):  # Tolérance pour les erreurs d'arrondi
                    discrepancies["tax_total"] = {
                        "declared": float(tax_total_dec),
                        "calculated": float(calculated_tax),
                        "difference": float(tax_diff)
                    }
                    results["calculations_correct"] = False
            
            if total_dec is not None and calculated_total != Decimal('0'):
                # Vérifier si total = subtotal + tax
                if subtotal_dec is not None and tax_total_dec is not None:
                    expected_total = (subtotal_dec + tax_total_dec).quantize(self.decimal_context, rounding=ROUND_HALF_UP)
                    total_diff = abs(total_dec - expected_total)
                    
                    if total_diff > Decimal('0.02'):  # Tolérance pour les erreurs d'arrondi
                        discrepancies["total"] = {
                            "declared": float(total_dec),
                            "expected": float(expected_total),
                            "difference": float(total_diff)
                        }
                        results["calculations_correct"] = False
            
            # Ajouter les discrepancies aux résultats
            if discrepancies:
                results["discrepancies"] = discrepancies
                
                # Suggérer des corrections
                corrected_values = {}
                if "subtotal" in discrepancies:
                    corrected_values["subtotal"] = float(calculated_subtotal)
                if "tax_total" in discrepancies:
                    corrected_values["tax_total"] = float(calculated_tax)
                if "total" in discrepancies:
                    if subtotal_dec is not None and tax_total_dec is not None:
                        corrected_values["total"] = float(subtotal_dec + tax_total_dec)
                
                results["corrected_values"] = corrected_values
                
                # Message d'explication en français
                msg_parts = []
                if "subtotal" in discrepancies:
                    msg_parts.append(f"Le montant HT déclaré ({float(subtotal_dec)}) diffère du montant calculé ({float(calculated_subtotal)})")
                if "tax_total" in discrepancies:
                    msg_parts.append(f"La TVA déclarée ({float(tax_total_dec)}) diffère de la TVA calculée ({float(calculated_tax)})")
                if "total" in discrepancies:
                    msg_parts.append(f"Le total TTC déclaré ({float(total_dec)}) ne correspond pas à HT + TVA ({float(subtotal_dec + tax_total_dec)})")
                
                results["message"] = ". ".join(msg_parts) + "."
            else:
                results["message"] = "Tous les calculs sont corrects."
            
            return results
            
        except Exception as e:
            return {
                "calculations_correct": False,
                "error": str(e),
                "message": f"Erreur lors de la validation des calculs: {str(e)}"
            }

    def validate_bank_statement(self, opening_balance, transactions, closing_balance):
        """
        Valide les calculs d'un relevé bancaire
        
        Args:
            opening_balance: Solde d'ouverture
            transactions: Liste des transactions avec montants
            closing_balance: Solde de clôture
            
        Returns:
            dict: Résultats de la validation
        """
        try:
            results = {
                "calculations_correct": True,
                "details": {}
            }
            
            # Convertir les soldes en Decimal
            opening_dec = Decimal(str(opening_balance))
            closing_dec = Decimal(str(closing_balance))
            
            # Calculer le solde attendu après toutes les transactions
            expected_closing = opening_dec
            for transaction in transactions:
                amount = Decimal(str(transaction.get("amount", 0)))
                expected_closing += amount
            
            # Arrondir le résultat calculé
            expected_closing = expected_closing.quantize(self.decimal_context, rounding=ROUND_HALF_UP)
            
            # Vérifier si le solde de clôture correspond au solde calculé
            diff = abs(expected_closing - closing_dec)
            if diff > Decimal('0.02'):  # Tolérance pour les erreurs d'arrondi
                results["calculations_correct"] = False
                results["discrepancy"] = {
                    "declared_closing": float(closing_dec),
                    "calculated_closing": float(expected_closing),
                    "difference": float(diff)
                }
                results["message"] = f"Le solde de clôture déclaré ({float(closing_dec)}) ne correspond pas au solde calculé ({float(expected_closing)})"
                results["corrected_values"] = {"closing_balance": float(expected_closing)}
            else:
                results["message"] = "Les calculs du relevé bancaire sont corrects."
            
            return results
            
        except Exception as e:
            return {
                "calculations_correct": False,
                "error": str(e),
                "message": f"Erreur lors de la validation du relevé bancaire: {str(e)}"
            }
