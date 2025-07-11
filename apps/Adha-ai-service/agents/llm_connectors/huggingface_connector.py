import os
import requests

class HuggingFaceConnector:
    def __init__(self, api_token=None, model_name="google/flan-t5-large"):
        self.api_token = api_token or os.environ.get("HUGGINGFACE_API_TOKEN")
        if not self.api_token:
            raise ValueError("HUGGINGFACE_API_TOKEN environment variable not set.")
        self.model_name = model_name
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_name}"
        self.headers = {"Authorization": f"Bearer {self.api_token}"}

    def generate_text(self, prompt, max_length=200, temperature=0.7):
        """
        Génère du texte en utilisant le modèle Hugging Face Inference API.
        """
        payload = {"inputs": prompt, "parameters": {"max_length": max_length, "temperature": temperature}}
        try:
            response = requests.post(self.api_url, headers=self.headers, json=payload)
            response.raise_for_status()
            output = response.json()
            return [output[0]['generated_text']] if output else None
        except requests.exceptions.RequestException as e:
            print(f"Erreur lors de l'appel à Hugging Face Inference API: {e}")
            return None

# Exemple d'utilisation (à ne pas exécuter ici, mais dans vos agents)
if __name__ == '__main__':
    connector = HuggingFaceConnector()
    prompt = "Explique brièvement le principe de prudence en comptabilité."
    response = connector.generate_text(prompt)
    if response:
        print(response[0])