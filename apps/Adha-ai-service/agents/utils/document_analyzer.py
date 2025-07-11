import re
from typing import Dict, Any, List

class DocumentAnalyzer:
    """Analyse et catégorise les documents comptables."""
    
    DOCUMENT_PATTERNS = {
        "bank_statement": [
            r"relev[ée]\s+(?:de\s+)?(?:compte|bancaire)",
            r"solde\s+(?:créditeur|débiteur)",
            r"(?:date\s+)?valeur",
            r"(?:débit|crédit)\s+(?:euros?|USD|\$|€)",
        ],
        "invoice": [
            r"facture\s+(?:n[o°])?[:.]?\s*\d+",
            r"client\s*[:.]",
            r"total\s+(?:ttc|ht)",
            r"tva",
        ],
        "receipt": [
            r"re[çc]u\s+(?:n[o°])?[:.]?\s*\d+",
            r"pay[ée]",
            r"montant\s+(?:reçu|payé)",
        ],
        "purchase_order": [
            r"bon\s+de\s+commande",
            r"quantit[ée]",
            r"prix\s+unitaire",
        ],
        "expense_note": [
            r"note\s+de\s+frais",
            r"d[ée]penses?",
            r"remboursement",
        ]
    }

    def detect_document_type(self, text: str) -> str:
        """Détecte le type de document basé sur son contenu."""
        text = text.lower()
        scores = {doc_type: 0 for doc_type in self.DOCUMENT_PATTERNS}
        
        for doc_type, patterns in self.DOCUMENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    scores[doc_type] += 1
        
        if not any(scores.values()):
            return "unknown"
        
        return max(scores.items(), key=lambda x: x[1])[0]

    def extract_document_info(self, text: str, doc_type: str) -> Dict[str, Any]:
        """Extrait les informations pertinentes selon le type de document."""
        if doc_type == "bank_statement":
            return self._extract_bank_statement_info(text)
        elif doc_type == "invoice":
            return self._extract_invoice_info(text)
        elif doc_type == "receipt":
            return self._extract_receipt_info(text)
        elif doc_type == "purchase_order":
            return self._extract_purchase_order_info(text)
        elif doc_type == "expense_note":
            return self._extract_expense_note_info(text)
        else:
            return self._extract_generic_info(text)

    def _extract_bank_statement_info(self, text: str) -> Dict[str, Any]:
        # Extraction spécifique pour relevé bancaire
        entries = []
        current_entry = {}
        
        lines = text.split('\n')
        for line in lines:
            # Identifier les lignes d'opérations
            if re.search(r'\d{2}/\d{2}/\d{4}', line):
                if current_entry:
                    entries.append(current_entry)
                current_entry = self._parse_bank_statement_line(line)
        
        if current_entry:
            entries.append(current_entry)
            
        return {
            "type": "bank_statement",
            "entries": entries
        }

    def _parse_bank_statement_line(self, line: str) -> Dict[str, Any]:
        # Parse une ligne de relevé bancaire
        date_match = re.search(r'(\d{2}/\d{2}/\d{4})', line)
        amount_match = re.search(r'(-?\d+[.,]\d{2})', line)
        
        return {
            "date": date_match.group(1) if date_match else None,
            "description": self._clean_description(line),
            "amount": float(amount_match.group(1).replace(',', '.')) if amount_match else 0.0,
            "type": "debit" if amount_match and amount_match.group(1).startswith('-') else "credit"
        }

    def _clean_description(self, text: str) -> str:
        # Nettoie et normalise la description
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'^\d{2}/\d{2}/\d{4}\s*', '', text)
        text = re.sub(r'-?\d+[.,]\d{2}\s*$', '', text)
        return text.strip()

    # ... Ajoutez les autres méthodes d'extraction pour chaque type de document
