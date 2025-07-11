from decimal import Decimal
import json
from datetime import date, datetime

class DecimalEncoder(json.JSONEncoder):
    """
    Custom JSON encoder that handles Decimal types properly.
    Also handles date and datetime objects.
    """
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super(DecimalEncoder, self).default(obj)

def json_response(data):
    """
    Convertit les données en JSON en gérant correctement les valeurs Decimal.
    """
    return json.dumps(data, cls=DecimalEncoder)

def format_date(date_str):
    """Format date string to a common format."""
    try:
        # Handle different date formats
        formats = [
            '%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d.%m.%Y',
            '%d/%m/%y', '%Y/%m/%d'
        ]
        
        for fmt in formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                return parsed_date.strftime('%d/%m/%Y')
            except ValueError:
                continue
                
        return date_str  # Return original if no format matches
    except:
        return date_str

def standardize_account_number(account):
    """
    Standardize account number format.
    Ensures the account number is properly formatted according to SYSCOHADA standards.
    """
    # Remove non-numeric characters except dots
    clean_account = ''.join(c for c in str(account) if c.isdigit() or c == '.')
    
    # Ensure proper length
    if '.' in clean_account:
        # Account with sub-account
        main, sub = clean_account.split('.')
        main = main.zfill(4)
        return f"{main}.{sub}"
    else:
        # Main account only
        return clean_account.zfill(5)
