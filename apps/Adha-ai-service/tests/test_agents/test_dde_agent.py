import unittest
from unittest.mock import MagicMock, mock_open
from agents.logic.dde_agent import DDEAgent

class TestDDEAgent(unittest.TestCase):
    def setUp(self):
        self.dde_agent = DDEAgent()

    def test_process_unsupported_file_type(self):
        mock_file = MagicMock(name='mock_file', spec=['name'])
        mock_file.name = 'document.odt'
        extracted_data = self.dde_agent.process(mock_file)
        self.assertEqual(extracted_data, {"error": "Format de fichier non supporté"})

    def test_extract_from_pdf_success(self):
        mock_file = MagicMock(name='mock_file', spec=['name'])
        mock_file.name = 'document.pdf'
        mock_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /MediaBox [ 0 0 612 792 ] /Contents 4 0 R /Parent 2 0 R >>\nendobj\n4 0 obj\n<< /Length 5 >>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Total TTC : 123.45) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000102 00000 n \n0000000179 00000 n \ntrailer\n<< /Root 1 0 R >>\n>>\nstartxref\n302\n%%EOF"
        with unittest.mock.patch("pdfplumber.open", unittest.mock.mock_open(read_data=mock_pdf_content)) as mock_pdf_open:
            extracted_data = self.dde_agent._extract_from_pdf(mock_file)
            self.assertIn("pdf_data", extracted_data)
            self.assertEqual(extracted_data.get("total_amount"), 123.45)

    # Ajoutez des tests pour _extract_from_image et _extract_from_excel