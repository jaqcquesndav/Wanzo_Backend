"""
Utility for extracting structured data from accounting documents with precise field extraction.
"""
import re
import numpy as np
import pandas as pd
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Try to import optional dependencies with fallbacks
try:
    import cv2
except ImportError:
    logger.warning("OpenCV (cv2) not installed. Some document image processing features will be unavailable.")
    cv2 = None

@dataclass
class DocumentItem:
    """A class representing a line item in an invoice or document."""
    description: str = ""
    quantity: Decimal = Decimal('0')
    unit_price: Decimal = Decimal('0')
    tax_rate: Decimal = Decimal('0')
    tax_amount: Decimal = Decimal('0')
    amount: Decimal = Decimal('0')
    
    def calculate_amount(self) -> Decimal:
        """Calculate the amount based on quantity and unit price."""
        return (self.quantity * self.unit_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    def calculate_tax(self) -> Decimal:
        """Calculate tax amount based on amount and tax rate."""
        return (self.amount * self.tax_rate / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    def validate(self) -> bool:
        """Validate that the item's calculated values match its stated values."""
        calculated_amount = self.calculate_amount()
        calculated_tax = self.calculate_tax()
        
        amount_difference = abs(calculated_amount - self.amount)
        tax_difference = abs(calculated_tax - self.tax_amount)
        
        # Allow for small rounding differences (0.01)
        return amount_difference <= Decimal('0.01') and tax_difference <= Decimal('0.01')


@dataclass
class DocumentData:
    """Structured data extracted from a document."""
    document_type: str = ""
    reference: str = ""
    date: str = ""
    due_date: str = ""
    supplier_name: str = ""
    supplier_id: str = ""
    client_name: str = ""
    client_id: str = ""
    currency: str = "FCFA"
    items: List[DocumentItem] = field(default_factory=list)
    subtotal: Decimal = Decimal('0')
    tax_total: Decimal = Decimal('0')
    total: Decimal = Decimal('0')
    payment_method: str = ""
    payment_details: Dict[str, str] = field(default_factory=dict)
    
    def validate_totals(self) -> Tuple[bool, str]:
        """Validate that the sum of items matches the stated totals."""
        calculated_subtotal = sum(item.amount for item in self.items)
        calculated_tax_total = sum(item.tax_amount for item in self.items)
        calculated_total = calculated_subtotal + calculated_tax_total
        
        subtotal_diff = abs(calculated_subtotal - self.subtotal)
        tax_diff = abs(calculated_tax_total - self.tax_total)
        total_diff = abs(calculated_total - self.total)
        
        # Allow for small rounding differences (0.02)
        if subtotal_diff > Decimal('0.02'):
            return False, f"Subtotal mismatch: stated {self.subtotal} vs calculated {calculated_subtotal}"
        
        if tax_diff > Decimal('0.02'):
            return False, f"Tax total mismatch: stated {self.tax_total} vs calculated {calculated_tax_total}"
            
        if total_diff > Decimal('0.02'):
            return False, f"Total mismatch: stated {self.total} vs calculated {calculated_total}"
            
        return True, "All totals match"


class DocumentExtractor:
    """Class to extract structured data from documents."""
    
    def __init__(self):
        self.tax_rates = {
            "TVA": Decimal('18.0'),  # Default OHADA TVA rate
            "TVA 18%": Decimal('18.0'),
            "TVA 5%": Decimal('5.0'),
            "TVA 0%": Decimal('0.0'),
            "EXEMPT": Decimal('0.0')
        }
        
        # Check if OpenCV is available
        self.has_cv2 = cv2 is not None
        
        if not self.has_cv2:
            logger.warning(
                "Document extraction capabilities might be limited due to missing OpenCV. "
                "Install required package with: pip install opencv-python"
            )
        
    def extract_data(self, text: str) -> DocumentData:
        """Extract structured data from document text."""
        document_data = DocumentData()
        
        # Determine document type
        document_data.document_type = self._detect_document_type(text)
        
        # Extract metadata based on document type
        if document_data.document_type == "invoice":
            self._extract_invoice_data(text, document_data)
        elif document_data.document_type == "receipt":
            self._extract_receipt_data(text, document_data)
        elif document_data.document_type == "bank_statement":
            self._extract_bank_statement_data(text, document_data)
        else:
            self._extract_generic_data(text, document_data)
            
        return document_data
    
    def _detect_document_type(self, text: str) -> str:
        """Detect the type of document based on keywords."""
        text_lower = text.lower()
        
        # Check for invoice indicators
        if re.search(r'facture|invoice', text_lower):
            return "invoice"
        
        # Check for receipt indicators
        if re.search(r'reçu|receipt|ticket de caisse', text_lower):
            return "receipt"
        
        # Check for bank statement indicators
        if re.search(r'relevé|statement|bancaire|bank|compte', text_lower):
            return "bank_statement"
            
        return "unknown"
    
    def _extract_invoice_data(self, text: str, data: DocumentData) -> None:
        """Extract data from an invoice."""
        # Extract references and dates
        data.reference = self._extract_reference(text)
        data.date = self._extract_date(text)
        data.due_date = self._extract_due_date(text)
        
        # Extract parties
        data.supplier_name = self._extract_supplier(text)
        data.supplier_id = self._extract_supplier_id(text)
        data.client_name = self._extract_client(text)
        data.client_id = self._extract_client_id(text)
        
        # Extract monetary information
        currency = self._extract_currency(text)
        if (currency):
            data.currency = currency
            
        # Extract line items (critical for calculation validation)
        data.items = self._extract_items(text)
        
        # Extract totals
        data.subtotal = self._extract_subtotal(text)
        data.tax_total = self._extract_tax_total(text)
        data.total = self._extract_total(text)
        
        # Extract payment information
        data.payment_method = self._extract_payment_method(text)
        data.payment_details = self._extract_payment_details(text)
    
    def _extract_receipt_data(self, text: str, data: DocumentData) -> None:
        """Extract data from a receipt."""
        # Similar to invoice but with receipt-specific patterns
        data.reference = self._extract_reference(text)
        data.date = self._extract_date(text)
        data.supplier_name = self._extract_supplier(text)
        
        # Extract monetary information
        currency = self._extract_currency(text)
        if currency:
            data.currency = currency
            
        # Extract line items
        data.items = self._extract_items(text)
        
        # Extract totals
        data.subtotal = self._extract_subtotal(text)
        data.tax_total = self._extract_tax_total(text)
        data.total = self._extract_total(text)
        
        # Extract payment information
        data.payment_method = self._extract_payment_method(text)
    
    def _extract_bank_statement_data(self, text: str, data: DocumentData) -> None:
        """Extract data from a bank statement."""
        # Bank statement specific extraction
        data.reference = self._extract_statement_reference(text)
        data.date = self._extract_statement_period(text)
        data.client_name = self._extract_account_holder(text)
        data.client_id = self._extract_account_number(text)
        
        # Extract transactions as items
        data.items = self._extract_transactions(text)
        
        # Extract totals
        data.subtotal = self._extract_opening_balance(text)
        data.total = self._extract_closing_balance(text)
        
    def _extract_generic_data(self, text: str, data: DocumentData) -> None:
        """Extract data from an unknown document type."""
        # Generic extraction for any document type
        data.reference = self._extract_reference(text)
        data.date = self._extract_date(text)
        
        # Try to extract monetary information
        currency = self._extract_currency(text)
        if currency:
            data.currency = currency
            
        # Extract potential monetary amounts
        amounts = self._extract_all_amounts(text)
        if amounts and len(amounts) > 0:
            data.total = max(amounts)  # Assume largest amount is the total
    
    def _extract_reference(self, text: str) -> str:
        """Extract document reference number."""
        patterns = [
            r'facture\s+(?:no|n[°o])?\s*[:#]?\s*([A-Z0-9][-A-Z0-9/]*)',
            r'(?:référence|ref)[\s:]*([A-Z0-9][-A-Z0-9/]*)',
            r'(?:invoice|document)\s+(?:no|number)[:\s]*([A-Z0-9][-A-Z0-9/]*)',
            r'(?:no|n°)[:\s]*([A-Z0-9][-A-Z0-9/]*)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return ""
    
    def _extract_date(self, text: str) -> str:
        """Extract document date."""
        patterns = [
            r'(?:date|émis\s+le|émission)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(?:date|émis\s+le|émission)[\s:]*(\d{1,2}\s+[a-zA-Zéû]+\s+\d{2,4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1).strip()
                # Try to standardize date format to DD/MM/YYYY
                try:
                    # Handle various formats
                    if re.match(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', date_str):
                        parts = re.split(r'[/-]', date_str)
                        if len(parts[2]) == 2:
                            parts[2] = '20' + parts[2]
                        return f"{parts[0].zfill(2)}/{parts[1].zfill(2)}/{parts[2]}"
                    else:
                        # Month names format
                        month_names = {
                            'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
                            'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
                            'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
                        }
                        parts = date_str.split()
                        day = parts[0].zfill(2)
                        month = month_names.get(parts[1].lower(), '01')
                        year = parts[2] if len(parts[2]) == 4 else '20' + parts[2]
                        return f"{day}/{month}/{year}"
                except Exception as e:
                    logger.warning(f"Failed to parse date {date_str}: {e}")
                    return date_str
                
        return ""
    
    def _extract_due_date(self, text: str) -> str:
        """Extract payment due date."""
        patterns = [
            r'(?:échéance|due date|date limite|à payer avant le)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(?:échéance|due date|date limite|à payer avant le)[\s:]*(\d{1,2}\s+[a-zA-Zéû]+\s+\d{2,4})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return ""
    
    def _extract_supplier(self, text: str) -> str:
        """Extract supplier name."""
        patterns = [
            r'(?:fournisseur|vendeur|émetteur|from)[\s:]*([A-Z][^\n\r:]*?)(?=\d|\n|tél|\r|tel|fax|email|e-mail)',
            r'(?:supplier|seller|from)[\s:]*([A-Z][^\n\r:]*?)(?=\d|\n|tel|\r|téléphone|fax|email|e-mail)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return ""
    
    def _extract_supplier_id(self, text: str) -> str:
        """Extract supplier identification (tax ID, registration number)."""
        patterns = [
            r'(?:RCCM|RC|REGISTRE DE COMMERCE|REGISTRE DU COMMERCE)[\s:]*([A-Z0-9][-A-Z0-9/]*)',
            r'(?:NINEA|SIRET|SIREN|ID TVA|VAT)[\s:]*([A-Z0-9][-A-Z0-9/]*)',
            r'(?:tax id|id fiscal)[\s:]*([A-Z0-9][-A-Z0-9/]*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return ""
    
    def _extract_client(self, text: str) -> str:
        """Extract client name."""
        patterns = [
            r'(?:client|acheteur|destinataire|adressé à|customer|bill to)[\s:]*([A-Z][^\n\r:]*?)(?=\d|\n|tél|\r|tel|fax|email|e-mail)',
            r'(?:livré à|ship to|deliver to)[\s:]*([A-Z][^\n\r:]*?)(?=\d|\n|tel|\r|téléphone|fax|email|e-mail)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return ""
    
    def _extract_client_id(self, text: str) -> str:
        """Extract client identification."""
        patterns = [
            r'(?:client)[\s:]*(?:no|n[°o])?[\s:]*([A-Z0-9][-A-Z0-9/]*)',
            r'(?:customer)[\s:]*(?:no|number)?[\s:]*([A-Z0-9][-A-Z0-9/]*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return ""
    
    def _extract_currency(self, text: str) -> str:
        """Extract currency used in the document."""
        patterns = [
            r'(?:currency|devise|monnaie)[\s:]*([A-Z]{3}|[€$£])',
            r'(?:montant|amount)[\s:]*[\d\s,.]+\s*([A-Z]{3}|[€$£])',
            r'(\d+(?:[\s,.]\d+)*)\s*(FCFA|EUR|USD)'
        ]
        
        currencies_map = {
            '€': 'EUR',
            '$': 'USD',
            '£': 'GBP'
        }
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                currency = match.group(1).strip()
                return currencies_map.get(currency, currency)
        
        # Look for currency symbols with amounts
        if re.search(r'\d+\s*FCFA', text, re.IGNORECASE):
            return 'FCFA'
        if re.search(r'€\s*\d+', text) or re.search(r'\d+\s*€', text):
            return 'EUR'
        if re.search(r'\$\s*\d+', text) or re.search(r'\d+\s*\$', text):
            return 'USD'
            
        return "FCFA"  # Default currency for SYSCOHADA
    
    def _extract_items(self, text: str) -> List[DocumentItem]:
        """Extract line items from the document."""
        items = []
        
        # First approach: Try to locate a table structure
        table_patterns = [
            # Look for a standard layout with description, quantity, unit price, tax, amount
            r'(?P<description>[^\n\r]+?)\s+(?P<quantity>\d+(?:,\d+)?)\s+(?P<unit_price>\d+(?:[\s,.]\d+)*)\s+(?P<tax_rate>\d+(?:,\d+)?%?)?\s+(?P<amount>\d+(?:[\s,.]\d+)*)',
            # Simpler pattern without tax
            r'(?P<quantity>\d+(?:,\d+)?)\s+(?P<description>[^\n\r]+?)\s+(?P<unit_price>\d+(?:[\s,.]\d+)*)\s+(?P<amount>\d+(?:[\s,.]\d+)*)',
            # Description followed by numbers
            r'(?P<description>[^\d\n\r:;]{5,}?)[\s:]*(?P<quantity>\d+(?:[,.]\d+)?)\s*(?:x|pcs|unités?|units?)[\s:]*(?P<unit_price>\d+(?:[\s,.]\d+)*)'
        ]
        
        # Try each pattern
        for pattern in table_patterns:
            matches = list(re.finditer(pattern, text, re.MULTILINE))
            if matches:
                for match in matches:
                    item = DocumentItem()
                    d = match.groupdict()
                    
                    # Process description
                    item.description = d.get('description', '').strip()
                    if len(item.description) > 5:  # Ensure reasonable description length
                        
                        # Process quantity
                        if 'quantity' in d and d['quantity']:
                            try:
                                item.quantity = Decimal(d['quantity'].replace(',', '.'))
                            except:
                                item.quantity = Decimal('1')
                        else:
                            item.quantity = Decimal('1')
                        
                        # Process unit price
                        if 'unit_price' in d and d['unit_price']:
                            try:
                                item.unit_price = Decimal(d['unit_price'].replace(' ', '').replace(',', '.'))
                            except:
                                continue  # Skip if can't parse unit price
                        else:
                            continue  # Skip if no unit price
                        
                        # Process tax rate
                        if 'tax_rate' in d and d['tax_rate']:
                            try:
                                tax_str = d['tax_rate'].replace(',', '.').strip()
                                if tax_str.endswith('%'):
                                    tax_str = tax_str[:-1]
                                item.tax_rate = Decimal(tax_str)
                            except:
                                item.tax_rate = Decimal('18.0')  # Default OHADA VAT
                        else:
                            item.tax_rate = Decimal('18.0')  # Default OHADA VAT
                        
                        # Process amount (if available)
                        if 'amount' in d and d['amount']:
                            try:
                                item.amount = Decimal(d['amount'].replace(' ', '').replace(',', '.'))
                            except:
                                item.amount = item.calculate_amount()
                        else:
                            item.amount = item.calculate_amount()
                        
                        # Calculate tax amount
                        item.tax_amount = item.calculate_tax()
                        
                        items.append(item)
        
        # If we couldn't find items, try a different approach: look for common item patterns
        if not items:
            # Look for descriptions followed by prices
            desc_price_pattern = r'([A-Za-z][\w\s\-\'\"]{5,}?)[\s:]*(\d+(?:[\s,.]\d+)*)'
            matches = list(re.finditer(desc_price_pattern, text))
            
            for i, match in enumerate(matches):
                if i < len(matches) - 1:  # Not the last match
                    description = match.group(1).strip()
                    price_str = match.group(2).replace(' ', '').replace(',', '.')
                    
                    try:
                        price = Decimal(price_str)
                        # If price seems reasonable (not a date or page number)
                        if price > 0 and price < 1000000:
                            item = DocumentItem(
                                description=description,
                                quantity=Decimal('1'),
                                unit_price=price,
                                amount=price,
                                tax_rate=Decimal('18.0'),
                                tax_amount=(price * Decimal('0.18')).quantize(Decimal('0.01'))
                            )
                            items.append(item)
                    except:
                        continue
        
        return items
    
    def _extract_subtotal(self, text: str) -> Decimal:
        """Extract subtotal (before tax) amount."""
        patterns = [
            r'(?:sous[\s-]?total|total\s+h\.?t\.?|montant\s+h\.?t\.?|total\s+hors\s+taxe)[\s:]*(\d+(?:[\s,.]\d+)*)',
            r'(?:sub[\s-]?total|amount\s+before\s+tax)[\s:]*(\d+(?:[\s,.]\d+)*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(' ', '').replace(',', '.')
                try:
                    return Decimal(amount_str)
                except:
                    continue
                
        return Decimal('0')
    
    def _extract_tax_total(self, text: str) -> Decimal:
        """Extract total tax amount."""
        patterns = [
            r'(?:total\s+tva|montant\s+tva|tva)[\s:]*(\d+(?:[\s,.]\d+)*)',
            r'(?:total\s+tax|vat\s+amount|vat)[\s:]*(\d+(?:[\s,.]\d+)*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(' ', '').replace(',', '.')
                try:
                    return Decimal(amount_str)
                except:
                    continue
                
        return Decimal('0')
    
    def _extract_total(self, text: str) -> Decimal:
        """Extract total amount (including tax)."""
        patterns = [
            r'(?:total\s+ttc|montant\s+ttc|montant\s+total|total\s+général|total\s+à\s+payer)[\s:]*(\d+(?:[\s,.]\d+)*)',
            r'(?:total\s+amount|grand\s+total|amount\s+due|total\s+due)[\s:]*(\d+(?:[\s,.]\d+)*)',
            r'(?:total)[\s:]*(\d+(?:[\s,.]\d+)*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(' ', '').replace(',', '.')
                try:
                    return Decimal(amount_str)
                except:
                    continue
                
        return Decimal('0')
    
    def _extract_payment_method(self, text: str) -> str:
        """Extract payment method."""
        patterns = [
            r'(?:mode\s+de\s+(?:paiement|règlement)|payment\s+method)[\s:]*([^\n\r]*)',
            r'(?:payé\s+par|règlement\s+par|paid\s+by|payment\s+by)[\s:]*([^\n\r]*)'
        ]
        
        payment_methods = [
            'virement', 'chèque', 'espèces', 'carte bancaire', 'carte de crédit', 
            'transfer', 'check', 'cash', 'credit card', 'bank card', 'mobile money'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                method = match.group(1).strip().lower()
                for payment_method in payment_methods:
                    if payment_method in method:
                        return payment_method
                return method
                
        # Look for payment method keywords directly
        for payment_method in payment_methods:
            if re.search(r'\b' + payment_method + r'\b', text, re.IGNORECASE):
                return payment_method
                
        return ""
    
    def _extract_payment_details(self, text: str) -> Dict[str, str]:
        """Extract payment details like bank account, check number, etc."""
        details = {}
        
        # Extract IBAN
        iban_match = re.search(r'(?:iban)[\s:]*([A-Z0-9\s]+)', text, re.IGNORECASE)
        if iban_match:
            details['iban'] = iban_match.group(1).strip().replace(' ', '')
            
        # Extract BIC/SWIFT
        bic_match = re.search(r'(?:bic|swift)[\s:]*([A-Z0-9\s]+)', text, re.IGNORECASE)
        if bic_match:
            details['bic'] = bic_match.group(1).strip().replace(' ', '')
            
        # Extract bank account number
        account_match = re.search(r'(?:compte|account|n°\s+compte)[\s:]*(\d+)', text, re.IGNORECASE)
        if account_match:
            details['account_number'] = account_match.group(1).strip()
            
        # Extract check number
        check_match = re.search(r'(?:chèque|cheque|check)[\s:]*(?:n°|num|number)?[\s:]*(\d+)', text, re.IGNORECASE)
        if check_match:
            details['check_number'] = check_match.group(1).strip()
            
        return details
    
    def _extract_statement_reference(self, text: str) -> str:
        """Extract bank statement reference number."""
        patterns = [
            r'(?:relevé|statement|extrait)[\s:]*(?:n°|no|num|number)?[\s:]*([A-Z0-9][-A-Z0-9/]*)',
            r'(?:réf|ref|reference)[\s:]*([A-Z0-9][-A-Z0-9/]*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return ""
    
    def _extract_statement_period(self, text: str) -> str:
        """Extract bank statement period."""
        patterns = [
            r'(?:période|period|du)[\s:]*([\d/]+)[\s-]*(?:au|to)[\s:]*([\d/]+)',
            r'(?:relevé|statement)[\s:]*(?:du|from)[\s:]*([\d/]+)[\s-]*(?:au|to)[\s:]*([\d/]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return f"{match.group(1).strip()} - {match.group(2).strip()}"
                
        return self._extract_date(text)  # Fallback to regular date
    
    def _extract_account_holder(self, text: str) -> str:
        """Extract account holder name."""
        patterns = [
            r'(?:titulaire|account holder|compte de)[\s:]*([^\n\r]*)',
            r'(?:client|customer)[\s:]*([^\n\r]*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return ""
    
    def _extract_account_number(self, text: str) -> str:
        """Extract bank account number."""
        patterns = [
            r'(?:compte n°|account number|n° de compte|numéro de compte)[\s:]*([A-Z0-9\s]+)',
            r'(?:iban)[\s:]*([A-Z0-9\s]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip().replace(' ', '')
                
        return ""
    
    def _extract_transactions(self, text: str) -> List[DocumentItem]:
        """Extract transactions from bank statement as items."""
        transactions = []
        
        # Look for date-description-amount patterns commonly found in bank statements
        transaction_pattern = r'(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)[\s]*([^\n\r\d]*)[\s]*([+-]?\d+(?:[\s,.]\d+)*)'
        
        matches = re.finditer(transaction_pattern, text, re.MULTILINE)
        for match in matches:
            date = match.group(1).strip()
            description = match.group(2).strip()
            amount_str = match.group(3).replace(' ', '').replace(',', '.')
            
            try:
                amount = Decimal(amount_str)
                
                # Skip if this doesn't look like a transaction (too small amount or suspicious description)
                if abs(amount) < 1 or len(description) < 3:
                    continue
                    
                transaction = DocumentItem()
                transaction.description = f"{date} - {description}"
                
                if amount >= 0:
                    transaction.quantity = Decimal('1')
                    transaction.unit_price = amount
                    transaction.amount = amount
                else:
                    transaction.quantity = Decimal('1')
                    transaction.unit_price = abs(amount)
                    transaction.amount = abs(amount)
                    
                transactions.append(transaction)
            except:
                continue
                
        return transactions
    
    def _extract_opening_balance(self, text: str) -> Decimal:
        """Extract opening balance from bank statement."""
        patterns = [
            r'(?:solde\s+(?:initial|précédent|ancien)|balance\s+brought\s+forward|opening\s+balance)[\s:]*([+-]?\d+(?:[\s,.]\d+)*)',
            r'(?:solde\s+au|balance\s+at)[\s:]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}[\s:]*([+-]?\d+(?:[\s,.]\d+)*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(' ', '').replace(',', '.')
                try:
                    return Decimal(amount_str)
                except:
                    continue
                
        return Decimal('0')
    
    def _extract_closing_balance(self, text: str) -> Decimal:
        """Extract closing balance from bank statement."""
        patterns = [
            r'(?:solde\s+(?:final|nouveau|actuel)|balance\s+carried\s+forward|closing\s+balance)[\s:]*([+-]?\d+(?:[\s,.]\d+)*)',
            r'(?:nouveau\s+solde|new\s+balance)[\s:]*([+-]?\d+(?:[\s,.]\d+)*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(' ', '').replace(',', '.')
                try:
                    return Decimal(amount_str)
                except:
                    continue
                
        return Decimal('0')
    
    def _extract_all_amounts(self, text: str) -> List[Decimal]:
        """Extract all monetary amounts from text."""
        amounts = []
        
        # Look for amounts with currency symbols
        amount_patterns = [
            r'(\d+(?:[\s,.]\d+)*)\s*(?:FCFA|EUR|USD|€|\$)',
            r'(?:€|\$)\s*(\d+(?:[\s,.]\d+)*)',
            r'(\d+(?:[\s,.]\d+)*)\s*(?:F|XOF|XAF)'  # Common for FCFA currencies
        ]
        
        for pattern in amount_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                amount_str = match.group(1).replace(' ', '').replace(',', '.')
                try:
                    amount = Decimal(amount_str)
                    amounts.append(amount)
                except:
                    continue
        
        # If no amounts found with currency, try numbers that look like monetary values
        if not amounts:
            number_matches = re.finditer(r'(\d+(?:[,.]\d{2}))', text)
            for match in number_matches:
                amount_str = match.group(1).replace(',', '.')
                try:
                    amount = Decimal(amount_str)
                    # Only include if it looks like a monetary amount (has 2 decimal places)
                    if str(amount).endswith('.00') or len(str(amount).split('.')[-1]) == 2:
                        amounts.append(amount)
                except:
                    continue
                    
        return amounts
