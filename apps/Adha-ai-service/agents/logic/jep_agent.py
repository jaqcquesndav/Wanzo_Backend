# agents/logic/jep_agent.py

class JEPAgent:
    def __init__(self):
        print("JEPAgent initialized")
        # Charger les formats de présentation préférés (peut-être spécifiques à l'utilisateur)
        self.presentation_formats = self._load_presentation_formats()

    def _load_presentation_formats(self):
        """
        Charge les formats de présentation (par exemple, texte simple, JSON).
        """
        # À implémenter: Charger les formats depuis une configuration
        return {
            "default": "{description} - Débit: {debit_account}, Crédit: {credit_account}, Montant: {amount}",
            "json": {"description": "{description}", "debit": "{debit_account}", "credit": "{credit_account}", "amount": "{amount}"}
        }

    def present(self, analysis_result: dict, verification_result: dict, format="default") -> dict:
        """
        Présente la proposition d'écriture de journal dans un format structuré.

        Cette méthode prend les résultats d'analyse et de vérification, et les présente dans un format structuré
        avec des champs clairs pour la description, les comptes de débit et de crédit, le montant, et le niveau de confiance.
        """
        debug_info = {"step": "start_presentation", "analysis_result": analysis_result, "verification_result": verification_result}
        print(f"JEPAgent presenting: {analysis_result}, verification: {verification_result}, format: {format}")
        proposal = analysis_result.get("proposal", {})
        errors = verification_result.get("errors", [])
        confidence = analysis_result.get("confidence", 0)

        try:
            # Construire une réponse structurée
            structured_response = {
                "description": proposal.get("description", "Description non spécifiée"),
                "debit_account": proposal.get("debit_account", "Compte non spécifié"),
                "credit_account": proposal.get("credit_account", "Compte non spécifié"),
                "amount": proposal.get("amount", 0.0),
                "confidence": confidence,
                "errors": errors
            }

            debug_info["structured_response"] = structured_response
            debug_info["step"] = "completed_presentation"
            print(f"Structured response: {structured_response}")
            return structured_response
        except KeyError as e:
            debug_info["step"] = "error_missing_field"
            debug_info["error"] = str(e)
            print(f"Erreur lors de la présentation: champ manquant {e}")
            return {
                "description": "Erreur dans la proposition d'écriture comptable.",
                "debit_account": "Compte non spécifié",
                "credit_account": "Compte non spécifié",
                "amount": 0.0,
                "confidence": 0.0,
                "errors": ["Erreur lors de la présentation des résultats."]
            }

# Exemple d'utilisation (dans les vues API)
if __name__ == '__main__':
    presenter = JEPAgent()
    analysis = {"proposal": {"description": "Achat de fournitures", "debit_account": "6061", "credit_account": "401", "amount": 50.00}, "confidence": 0.85}
    verification = {"is_coherent": True, "is_compliant": True, "errors": []}
    presentation = presenter.present(analysis, verification)
    print(presentation)