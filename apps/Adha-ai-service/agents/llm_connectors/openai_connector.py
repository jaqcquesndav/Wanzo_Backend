# agents/llm_connectors/openai_connector.py
import os
from openai import OpenAI
from typing import Optional # Garder Optional pour model_name

class OpenAIConnector:
    # Version simplifiée utilisant os.environ (chargé par load_dotenv dans settings.py)
    def __init__(self, model_name: Optional[str] = None): # Plus besoin de config_data ici
        """
        Initialise le connecteur OpenAI en lisant la clé depuis l'environnement.

        Args:
            model_name (Optional[str]): Nom du modèle à utiliser (par défaut : gpt-4).
        """
        print("Initializing OpenAIConnector...")
        env_var_name = "OPENAI_API_KEY" # Nom standard en MAJUSCULES
        self.api_key = os.environ.get(env_var_name)

        if not self.api_key:
            # L'erreur indique clairement où chercher
            raise ValueError(f"La variable d'environnement '{env_var_name}' n'est pas définie. Assurez-vous qu'elle est dans votre fichier .env ou dans l'environnement système.")

        try:
            self.client = OpenAI(api_key=self.api_key)
            print("OpenAI client initialized successfully.")
        except Exception as client_e:
            print(f"Erreur lors de l'initialisation du client OpenAI: {client_e}")
            raise RuntimeError(f"Échec de l'initialisation du client OpenAI: {client_e}")

        # Utiliser le modèle configuré comme défaut
        self.model_name = model_name if model_name is not None else os.environ.get("OPENAI_DEFAULT_MODEL", "gpt-4o-2024-08-06")
        print(f"Using OpenAI model: {self.model_name}")

    def generate_text(self, prompt, max_tokens=200, temperature=0.7, n=1, stop=None):
        """Génère du texte en utilisant le modèle OpenAI."""
        print(f"Generating text with model {self.model_name}...")
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature,
                n=n,
                stop=stop,
            )
            print("OpenAI API call successful.")
            return [choice.message.content.strip() for choice in response.choices if choice.message and choice.message.content]
        except Exception as e:
            print(f"Erreur lors de l'appel à OpenAI generate_text: {type(e).__name__} - {e}")
            print(f"Prompt: {prompt}, Max Tokens: {max_tokens}, Temperature: {temperature}, n: {n}, Stop: {stop}")
            raise RuntimeError(f"Failed to generate text: {e}")

    def generate_code(self, prompt, max_tokens=300, temperature=0.2, n=1, stop=None):
        """Génère du code en utilisant le modèle OpenAI."""
        print(f"Generating code (using generate_text) with model {self.model_name}...")
        try:
            return self.generate_text(prompt, max_tokens, temperature, n, stop)
        except Exception as e:
            print(f"Erreur lors de l'appel à OpenAI generate_code: {type(e).__name__} - {e}")
            print(f"Prompt: {prompt}, Max Tokens: {max_tokens}, Temperature: {temperature}, n: {n}, Stop: {stop}")
            raise RuntimeError(f"Failed to generate code: {e}")