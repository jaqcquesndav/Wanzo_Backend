from agents.logic.generator_agent import GeneratorAgent

class NLUAgent:
    def __init__(self):
        # Initialisation du modèle NLU (par exemple, chargement d'un modèle pré-entraîné)
        print("NLU Agent initialized")
        self.generator = GeneratorAgent()  # Utilisation du GeneratorAgent pour interagir avec le LLM

    def process(self, text):
        """
        Interprète le texte en langage naturel et extrait l'intention et les entités.
        """
        debug_info = {"step": "start", "input_text": text}
        print(f"NLU Agent processing: {text}")
        intent = "unknown"
        entities = {}

        try:
            # Appel au LLM pour analyser le texte
            prompt = f"Analyse ce texte pour identifier l'intention et les entités : {text}"
            response, llm_debug_info = self.generator.generate(prompt)
            debug_info["llm_response"] = response
            debug_info["llm_debug_info"] = llm_debug_info

            if response and isinstance(response, list) and response[0]:
                # Exemple de réponse attendue : {"intent": "achat", "entities": {"produit": "moto", "montant": 100.0, "source": "caisse"}}
                llm_output = eval(response[0])  # Convertir la réponse JSON en dictionnaire
                intent = llm_output.get("intent", "unknown")
                entities = llm_output.get("entities", {})
                print(f"Extracted intent: {intent}, entities: {entities}")
                print(f"Transmitting extracted intent and entities to LLM: intent={intent}, entities={entities}")
            debug_info["step"] = "completed"
        except Exception as e:
            debug_info["step"] = "error"
            debug_info["error"] = str(e)
            print(f"Erreur lors de l'analyse du texte: {e}")

        return intent, entities, debug_info

    def _extract_amount(self, text):
        """
        Extrait le montant d'un texte.
        """
        import re
        match = re.search(r"(\d+[,.]?\d*)\s*(USD|EUR|FCFA|DZD)?", text, re.IGNORECASE)
        if match:
            amount = float(match.group(1).replace(',', '.'))
            print(f"Extracted amount: {amount}")
            return amount
        print("No amount found in text.")
        return None