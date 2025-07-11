import unittest
from unittest.mock import MagicMock
from agents.logic.generator_agent import GeneratorAgent

class TestGeneratorAgent(unittest.TestCase):
    def setUp(self):
        self.mock_llm_connector = MagicMock()
        self.mock_llm_connector.generate_text.return_value = ["Generated proposal"]
        self.generator_agent = GeneratorAgent(llm_connector=self.mock_llm_connector)

    def test_generate_with_context(self):
        response = self.generator_agent.generate("Test query", ["context 1", "context 2"])
        self.assertEqual(response, ["Generated proposal"])
        self.mock_llm_connector.generate_text.assert_called_once()
        prompt = self.mock_llm_connector.generate_text.call_args[0][0]
        self.assertIn("context 1", prompt)
        self.assertIn("context 2", prompt)

    def test_generate_without_context(self):
        response = self.generator_agent.generate("Test query")
        self.assertEqual(response, ["Generated proposal"])
        self.mock_llm_connector.generate_text.assert_called_once()
        prompt = self.mock_llm_connector.generate_text.call_args[0][0]
        self.assertNotIn("Informations contextuelles", prompt)

    def test_generate_code(self):
        self.mock_llm_connector.generate_code.return_value = ["Generated code"]
        response = self.generator_agent.generate_code("Code instruction", ["context"])
        self.assertEqual(response, ["Generated code"])
        self.mock_llm_connector.generate_code.assert_called_once()

if __name__ == '__main__':
    unittest.main()