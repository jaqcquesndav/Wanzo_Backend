import unittest
from agents.logic.nlu_agent import NLUAgent

class TestNLUAgent(unittest.TestCase):
    def setUp(self):
        self.nlu_agent = NLUAgent()

    def test_process_achat_produit(self):
        intent, entities = self.nlu_agent.process("J'ai acheté des stylos.")
        self.assertEqual(intent, "achat")
        self.assertEqual(entities, {"produit": "stylos"})

    def test_process_vente_service(self):
        intent, entities = self.nlu_agent.process("Vente de services de conseil.")
        self.assertEqual(intent, "vente")
        self.assertEqual(entities, {"produit": "services de conseil"})

    def test_process_paiement_fournisseur(self):
        intent, entities = self.nlu_agent.process("Paiement de la facture à Orange.")
        self.assertEqual(intent, "paiement")
        self.assertEqual(entities, {"beneficiaire": "la facture à Orange"})

    def test_process_unknown_intent(self):
        intent, entities = self.nlu_agent.process("Bonjour, comment ça va?")
        self.assertEqual(intent, "unknown")
        self.assertEqual(entities, {})

if __name__ == '__main__':
    unittest.main()