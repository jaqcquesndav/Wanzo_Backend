# agents/logic/generator_agent.py
from agents.llm_connectors.openai_connector import OpenAIConnector  # Exemple
from typing import List, Optional

class GeneratorAgent:
    def __init__(self, llm_connector=None):
        print("Generator Agent initialized")
        # Utiliser OpenAIConnector avec gpt-4 par défaut
        self.llm_connector = llm_connector or OpenAIConnector(model_name="gpt-4")

    def generate(self, query: str, context: List[str] = None, max_tokens: int = 200, temperature: float = 0.7) -> Optional[List[str]]:
        """
        Génère une réponse (proposition d'écriture) en fonction de la requête et du contexte fourni.
        """
        debug_info = {"step": "start", "query": query, "context": context}
        print(f"Generator Agent generating for query: {query} with context: {context}")

        prompt = f"Question basée sur la comptabilité : {query}\n\n"

        if context:
            prompt += "Informations contextuelles pertinentes :\n"
            for i, doc in enumerate(context):
                prompt += f"[{i+1}] {doc}\n"
            prompt += "\n"
            prompt += "En utilisant les informations contextuelles ci-dessus, propose une écriture comptable détaillée (comptes de débit et de crédit, montant si applicable) et une description concise pour répondre à la question. Si les informations contextuelles ne sont pas pertinentes ou insuffisantes, base ta réponse sur tes connaissances générales en comptabilité."
        else:
            prompt += "Propose une écriture comptable détaillée (comptes de débit et de crédit, montant si applicable) et une description concise pour répondre à la question, en te basant sur tes connaissances générales en comptabilité."

        try:
            print(f"Prompt sent to LLM: {prompt}")
            response = self.llm_connector.generate_text(prompt, max_tokens=max_tokens, temperature=temperature)
            debug_info["step"] = "completed"
            debug_info["response"] = response
            print(f"Raw response received from LLM: {response}")
            return response, debug_info
        except Exception as e:
            debug_info["step"] = "error"
            debug_info["error"] = str(e)
            print(f"Erreur lors de la génération: {e}")
            return None, debug_info

    def generate_code(self, prompt: str, context: List[str] = None, max_tokens: int = 300, temperature: float = 0.2) -> Optional[List[str]]:
        """
        Génère du code en utilisant le modèle de langage (avec un contexte optionnel).
        """
        full_prompt = f"Contexte :\n{' '.join(context) if context else 'Aucun contexte fourni.'}\n\nInstruction de codage : {prompt}"
        print(f"Prompt sent to LLM for code generation: {full_prompt}")
        try:
            response = self.llm_connector.generate_code(full_prompt, max_tokens=max_tokens, temperature=temperature)
            print(f"Response received from LLM for code generation: {response}")
            return response
        except Exception as e:
            print(f"Erreur lors de la génération de code: {e}")
            return None

# Exemple d'utilisation (dans l'Agent AA)
if __name__ == '__main__':
    generator = GeneratorAgent()
    query = "Comment comptabiliser l'achat de fournitures de bureau ?"
    context = ["Les fournitures de bureau sont généralement considérées comme des charges.", "L'achat à crédit augmente les dettes envers les fournisseurs."]
    response = generator.generate(query, context)
    if response:
        print(response[0])