import unittest
from unittest.mock import MagicMock
from agents.logic.retriever_agent import RetrieverAgent

class TestRetrieverAgent(unittest.TestCase):
    def setUp(self):
        self.mock_vector_db_connector = MagicMock()
        self.mock_collection = MagicMock()
        self.mock_vector_db_connector.get_or_create_collection.return_value = self.mock_collection
        self.retriever_agent = RetrieverAgent()
        self.retriever_agent.vector_db_connector = self.mock_vector_db_connector
        self.retriever_agent.collection = self.mock_collection
        self.retriever_agent.embedding_model = MagicMock()
        self.retriever_agent.embedding_model.encode.return_value = [[0.1, 0.2, 0.3]]

    def test_retrieve_success(self):
        self.mock_collection.query.return_value = {"documents": [["Sample document 1", "Sample document 2"]]}
        results = self.retriever_agent.retrieve("test query")
        self.assertEqual(len(results), 2)
        self.assertIn("Sample document 1", results[0])

    def test_retrieve_empty_results(self):
        self.mock_collection.query.return_value = {"documents": [[]]}
        results = self.retriever_agent.retrieve("test query")
        self.assertEqual(len(results), 0)

    def test_retrieve_no_collection(self):
        self.retriever_agent.collection = None
        results = self.retriever_agent.retrieve("test query")
        self.assertEqual(len(results), 0)

if __name__ == '__main__':
    unittest.main()