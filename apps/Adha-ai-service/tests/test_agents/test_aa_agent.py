import unittest
from unittest.mock import MagicMock
from agents.logic.aa_agent import AAgent

class TestAAgent(unittest.TestCase):
    def setUp(self):
        self.aa_agent = AAgent()
        self.aa_agent.retriever = MagicMock()
        self.aa_agent.generator = MagicMock()

    def test_process_achat_produit(self):
        self.aa_agent._load_comptable_rules = MagicMock(return_value={
            "achat": {"produit": {"debit": "Stock", "credit": "Fournisseur", "need_amount": True}}
        })
        result = self.aa_agent.process("achat", {"produit": "cahiers"}, {"amount": 10.00})
        self.assertEqual(result["proposal"]["debit_account"], "Stock")
        self.assertEqual(result["proposal"]["credit_account"], "Fournisseur")
        self.assertEqual(result["proposal"]["amount"], 10.00)
        self.assertIn("cahiers", result["proposal"]["description"])
        self.assertGreater(result["confidence"], 0.7)

    def test_process_facture_extraction(self):
        extracted_data = {"document_type": "facture", "total_amount": 100.00}
        result = self.aa_agent.process(None, {}, extracted_data)
        self.assertEqual(result["proposal"]["amount"], 100.00)
        self.assertIn("facture", result["proposal"]["description"])
        self.assertEqual(result["proposal"]["debit_account"], "Compte de Charges") # Exemple par défaut
        self.assertEqual(result["proposal"]["credit_account"], "Compte Fournisseur") # Exemple par défaut
        self.assertGreater(result["confidence"], 0.6)

    # Ajoutez d'autres tests pour différents scénarios