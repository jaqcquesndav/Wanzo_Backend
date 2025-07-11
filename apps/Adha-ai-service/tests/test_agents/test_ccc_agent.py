import unittest
from agents.logic.ccc_agent import CCCAgent

class TestCCCAgent(unittest.TestCase):
    def setUp(self):
        self.ccc_agent = CCCAgent()

    def test_verify_coherent(self):
        proposal = {"amount": 100.00, "debit_account": "X", "credit_account": "Y"}
        result = self.ccc_agent.verify(proposal)
        self.assertTrue(result["is_coherent"])
        self.assertTrue(result["is_compliant"])
        self.assertEqual(result["errors"], [])

    def test_verify_incoherent(self):
        proposal = {"amount": 100.00, "debit_account": "X", "credit_account": "Y", "amount_credit": 50.00}
        result = self.ccc_agent.verify(proposal)
        self.assertFalse(result["is_coherent"])
        self.assertIn("Incohérence", result["errors"][0])

    # Ajoutez des tests pour la conformité si vous implémentez des règles spécifiques

if __name__ == '__main__':
    unittest.main()