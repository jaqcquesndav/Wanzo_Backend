import unittest
from unittest.mock import MagicMock
from agents.logic.cla_agent import CLAAgent

class TestCLAAgent(unittest.TestCase):
    def setUp(self):
        self.cla_agent = CLAAgent()
        self.cla_agent._initialize_feedback_store = MagicMock(return_value={})
        self.cla_agent.feedback_store = {}
        self.cla_agent._process_feedback = MagicMock()

    def test_receive_feedback(self):
        user_input = "test input"
        proposal = {"description": "test proposal"}
        feedback = "correct"
        self.cla_agent.receive_feedback(user_input, proposal, feedback)
        self.assertIn((user_input, str(proposal)), self.cla_agent.feedback_store)
        self.assertEqual(self.cla_agent.feedback_store[(user_input, str(proposal))], feedback)
        self.cla_agent._process_feedback.assert_called_once()

if __name__ == '__main__':
    unittest.main()