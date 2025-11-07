"""
Validation finale du service Adha AI après nettoyage
"""

def main():
    print("=== Validation du Service Adha AI ===")
    
    try:
        # Test 1: Import de la base de connaissances
        from financial_engine.knowledge_bases.accounting_rdc import AccountingKnowledgeRDC
        kb = AccountingKnowledgeRDC()
        print("✅ Base de connaissances SYSCOHADA : OK")
        
        # Test 2: Import du calculateur comptable
        from financial_engine.calculators.accounting import AccountingCalculator, calculate_precision
        calc = AccountingCalculator()
        print("✅ Calculateur comptable : OK")
        
        # Test 3: Import des processeurs
        from api.services.accounting_processor import generate_journal_entry, validate_journal_entry
        print("✅ Processeur comptable v1 : OK")
        
        from api.services.accounting_processor_v2_fixed import AccountingProcessor
        print("✅ Processeur comptable v2 : OK")
        
        # Test 4: Test de calcul simple
        result = calculate_precision(123.456)
        assert str(result) == "123.46"
        print("✅ Fonction de précision : OK")
        
        # Test 5: Test mapping
        mapping = kb.get_account_mapping_for_operation('SALE')
        assert mapping is not None
        assert 'debit_account' in mapping
        assert 'credit_account' in mapping
        print("✅ Mappings SYSCOHADA : OK")
        
        print("\n🎉 Tous les tests de validation ont réussi!")
        print("✅ Service Adha AI nettoyé et fonctionnel")
        print("✅ Base de connaissances SYSCOHADA intégrée")
        print("✅ Processeurs comptables opérationnels")
        print("✅ Calculateurs financiers disponibles")
        
        return True
        
    except ImportError as e:
        print(f"❌ Erreur d'import: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    if not success:
        exit(1)