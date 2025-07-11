from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch, MagicMock
import json

class TestAPIViews(TestCase):
    def setUp(self):
        self.client = Client()

    @patch('api.views.NLUAgent')
    @patch('api.views.AAgent')
    @patch('api.views.CCCAgent')
    @patch('api.views.JEPAgent')
    def test_text_input_view_success(self, MockJEPAgent, MockCCCAgent, MockAAgent, MockNLUAgent):
        mock_nlu_instance = MockNLUAgent.return_value
        mock_nlu_instance.process.return_value = ("achat", {"produit": "stylo"})

        mock_aa_instance = MockAAgent.return_value
        mock_aa_instance.process.return_value = {"proposal": {"description": "Achat de stylo", "debit_account": "6061", "credit_account": "401", "amount": 1.50}, "confidence": 0.8}

        mock_ccc_instance = MockCCCAgent.return_value
        mock_ccc_instance.verify.return_value = {"is_coherent": True, "is_compliant": True, "errors": []}

        mock_jep_instance = MockJEPAgent.return_value
        mock_jep_instance.present.return_value = "Proposition: Achat de stylo - Débit: 6061, Crédit: 401, Montant: 1.50"

        response = self.client.post(
            reverse('text_input'),
            json.dumps({'text': 'J\'ai acheté un stylo'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('description', response.json())
        self.assertEqual(response.json()['description'], "Proposition: Achat de stylo - Débit: 6061, Crédit: 401, Montant: 1.50")

    def test_text_input_view_no_text(self):
        response = self.client.post(reverse('text_input'), {}, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())

    # Ajoutez des tests pour FileInputView, JournalEntryView, ModifyEntryView