import unittest
from unittest.mock import MagicMock, patch
from agents.logic.dde_agent import DDEAgent
import json
import os

class TestPromptProcessing(unittest.TestCase):
    """Tests pour la fonctionnalité de traitement des prompts de l'agent DDE."""

    @patch('agents.logic.dde_agent.OpenAI')
    def setUp(self, mock_openai):
        """Configuration des tests avec un mock pour OpenAI."""
        # Configurer le mock pour OpenAI
        self.mock_client = MagicMock()
        mock_openai.return_value = self.mock_client
        
        # Créer une instance de l'agent DDE
        self.dde_agent = DDEAgent()
        
        # Remplacer le client OpenAI réel par notre mock
        self.dde_agent.client = self.mock_client

    def mock_completion_response(self, content):
        """Crée un mock de réponse OpenAI."""
        mock_response = MagicMock()
        mock_choice = MagicMock()
        mock_message = MagicMock()
        mock_message.content = content
        mock_choice.message = mock_message
        mock_response.choices = [mock_choice]
        return mock_response

    def test_basic_prompt_processing(self):
        """Test basique de traitement d'un prompt."""
        # Configurer le mock pour simuler une réponse d'interprétation
        interpretation_text = """
        Analyse: Ce prompt mentionne une facture d'électricité de 120 000 FCFA payée par chèque.
        
        Il s'agit d'une opération de règlement de facture de service.
        """
        structured_json = """
        {
            "type_document": "facture",
            "émetteur": {"nom": "Fournisseur d'électricité", "identifiant_fiscal": null},
            "destinataire": {"nom": null},
            "dates": {"émission": null, "échéance": null},
            "montants": {"ht": 101694.92, "tva": 18305.08, "ttc": 120000.0},
            "comptes_applicables": {
                "débit": [{"compte": "6061", "libellé": "Fournitures d'électricité", "justification": "Charge correspondant à la consommation d'électricité"}],
                "crédit": [{"compte": "5111", "libellé": "Chèques à encaisser", "justification": "Règlement par chèque"}]
            },
            "fiabilité": 85,
            "anomalies": []
        }
        """
        
        # Configurer les mocks pour les deux appels API
        self.mock_client.chat.completions.create.side_effect = [
            self.mock_completion_response(interpretation_text),
            self.mock_completion_response(structured_json)
        ]
        
        # Exécuter la méthode à tester
        prompt = "J'ai reçu une facture d'électricité de 120 000 FCFA payée par chèque"
        result = self.dde_agent.process_prompt(prompt)
        
        # Vérifications
        self.assertIn('document_type', result)
        self.assertEqual(result['document_type'], 'prompt')  # Le type initial devrait être 'prompt'
        self.assertIn('full_text', result)
        self.assertEqual(result['full_text'], prompt)
        self.assertIn('interpretation', result)
        self.assertIn('structured_elements', result)
        
        # Vérifier que les appels d'API ont été effectués
        self.assertEqual(self.mock_client.chat.completions.create.call_count, 2)

    def test_prompt_with_amounts(self):
        """Test de traitement d'un prompt avec des montants."""
        # Configurer le mock pour simuler une réponse d'interprétation
        interpretation_text = """
        Analyse: Ce prompt mentionne un achat de fournitures pour 50 000 FCFA.
        """
        structured_json = """
        {
            "type_document": "achat",
            "émetteur": {"nom": null, "identifiant_fiscal": null},
            "destinataire": {"nom": null},
            "dates": {"émission": null, "échéance": null},
            "montants": {"ht": 42372.88, "tva": 7627.12, "ttc": 50000.0},
            "comptes_applicables": {
                "débit": [{"compte": "6025", "libellé": "Fournitures de bureau", "justification": "Achat de fournitures"}],
                "crédit": [{"compte": "401", "libellé": "Fournisseurs", "justification": "Dette envers le fournisseur"}]
            },
            "fiabilité": 80,
            "anomalies": []
        }
        """
        
        # Configurer les mocks pour les deux appels API
        self.mock_client.chat.completions.create.side_effect = [
            self.mock_completion_response(interpretation_text),
            self.mock_completion_response(structured_json)
        ]
        
        # Exécuter la méthode à tester
        prompt = "J'ai acheté des fournitures de bureau pour 50 000 FCFA"
        result = self.dde_agent.process_prompt(prompt)
        
        # Vérifications spécifiques aux montants
        self.assertIn('interpretation', result)
        self.assertIn('elements_structures', result['interpretation'])
        struct_data = result['interpretation']['elements_structures']
        
        self.assertEqual(struct_data['montants']['ttc'], 50000.0)
        
        # Vérifier l'extraction des montants par regex
        self.assertIn('structured_elements', result)
        self.assertIn('elements_extraits', result['structured_elements'])
        
        # Au moins un élément de type 'montants' devrait être présent
        montants_exists = any(elem['type'] == 'montants' for elem in result['structured_elements']['elements_extraits'])
        self.assertTrue(montants_exists, "Les montants n'ont pas été extraits du prompt")

if __name__ == '__main__':
    unittest.main()
