"""
Système de récupération         self.knowledge_files = {
            'fiscal': 'fiscal_rdc.md',
            'valuation': 'valuation_guide.md',
            'due_diligence': 'due_diligence_guide.md',
            'financial_math': 'financial_math_guide.md',
            'econometrics': 'econometrics_guide.md',
            'accounting': 'syscohada_accounting.md',
            'credit_analysis': 'credit_analysis_guide.md',
            'portfolio_audit': 'portfolio_audit_guide.md',
            'portfolio_performance': 'portfolio_performance_guide.md'
        }issances pour Adha AI Service
Intègre les bases de connaissances fichiers et embeddings vectoriels
"""
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from agents.vector_databases.chromadb_connector import ChromaDBConnector

class KnowledgeRetriever:
    """
    Récupérateur de connaissances hybride :
    - Bases de connaissances en fichiers (markdown/txt)
    - Base vectorielle pour recherche sémantique
    - Logique de demande d'informations supplémentaires
    """
    
    def __init__(self, collection_name="financial_knowledge", persist_directory="chroma_db"):
        """
        Initialise le récupérateur de connaissances hybride.
        """
        # Base vectorielle
        self.vector_db_connector = ChromaDBConnector(persist_directory=persist_directory)
        self.collection = self.vector_db_connector.get_or_create_collection(name=collection_name)
        
        # Chemins vers les bases de connaissances fichiers
        self.knowledge_base_path = Path(__file__).parent.parent / "data" / "knowledge_base"
        
        # Index des fichiers de connaissances par domaine
        self.knowledge_files = {
            'fiscal': 'fiscal_rdc.md',
            'valuation': 'valuation_guide.md',
            'due_diligence': 'due_diligence_guide.md', 
            'financial_math': 'financial_math_guide.md',
            'econometrics': 'econometrics_guide.md',
            'accounting': 'syscohada_accounting.md'  # Renommé pour cohérence
        }
        
    def retrieve_by_domain(self, domain: str, query: str = "") -> Dict[str, Any]:
        """
        Récupère les connaissances par domaine spécifique
        
        Args:
            domain: Domaine de connaissance (fiscal, valuation, etc.)
            query: Requête spécifique optionnelle
            
        Returns:
            Dict contenant les connaissances et métadonnées
        """
        if domain not in self.knowledge_files:
            return {
                'found': False,
                'error': f"Domaine '{domain}' non reconnu. Domaines disponibles: {list(self.knowledge_files.keys())}"
            }
        
        file_path = self.knowledge_base_path / self.knowledge_files[domain]
        
        if not file_path.exists():
            return {
                'found': False,
                'error': f"Fichier de connaissances manquant: {file_path}",
                'action_needed': 'contact_admin'
            }
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Filtrer par section si query spécifique
            relevant_sections = self._extract_relevant_sections(content, query) if query else [content]
            
            return {
                'found': True,
                'domain': domain,
                'content': relevant_sections,
                'file_source': str(file_path),
                'query_used': query
            }
            
        except Exception as e:
            return {
                'found': False,
                'error': f"Erreur lecture fichier {file_path}: {str(e)}",
                'action_needed': 'contact_admin'
            }

    def retrieve_for_calculation(self, calculation_type: str, required_data: List[str]) -> Dict[str, Any]:
        """
        Récupère les connaissances nécessaires pour un calcul spécifique
        et identifie les données manquantes
        
        Args:
            calculation_type: Type de calcul (tva, impot_professionnel, dcf, etc.)
            required_data: Liste des données requises pour le calcul
            
        Returns:
            Dict avec connaissances et données manquantes à demander
        """
        # Mapping calcul -> domaine de connaissance
        calculation_domain_map = {
            'tva': 'fiscal',
            'impot_professionnel': 'fiscal', 
            'impot_cedulaire': 'fiscal',
            'charges_sociales': 'fiscal',
            'dcf': 'valuation',
            'multiples': 'valuation',
            'asset_based': 'valuation',
            'npv': 'financial_math',
            'irr': 'financial_math',
            'financial_ratios': 'due_diligence',
            'cash_flow_quality': 'due_diligence',
            'working_capital': 'due_diligence',
            'regression': 'econometrics',
            'correlation': 'econometrics',
            'credit_scoring': 'credit_analysis',
            'credit_capacity': 'credit_analysis',
            'collateral_analysis': 'credit_analysis',
            'portfolio_audit': 'portfolio_audit',
            'par_analysis': 'portfolio_audit',
            'stress_testing': 'portfolio_audit',
            'performance_analysis': 'portfolio_performance',
            'roa_calculation': 'portfolio_performance',
            'benchmark_analysis': 'portfolio_performance'
        }
        
        domain = calculation_domain_map.get(calculation_type, 'accounting')
        knowledge = self.retrieve_by_domain(domain, calculation_type)
        
        # Analyser les données requises vs disponibles
        missing_data = self._analyze_missing_data(calculation_type, required_data)
        
        return {
            'knowledge': knowledge,
            'missing_data': missing_data,
            'questions_for_user': self._generate_user_questions(calculation_type, missing_data),
            'calculation_type': calculation_type
        }

    def retrieve(self, query_embedding, top_k=5):
        """
        Récupération vectorielle traditionnelle (compatibilité)
        """
        if not self.collection:
            return []

        try:
            results = self.collection.query(query_embeddings=[query_embedding], n_results=top_k)
            return results.get("documents", [[]])[0]
        except Exception as e:
            print(f"Erreur récupération vectorielle: {e}")
            return []
            
    def _extract_relevant_sections(self, content: str, query: str) -> List[str]:
        """
        Extrait les sections pertinentes du contenu selon la requête
        """
        lines = content.split('\n')
        relevant_sections = []
        current_section = []
        
        query_terms = query.lower().split()
        in_relevant_section = False
        
        for line in lines:
            # Nouvelle section (headers markdown)
            if line.startswith('#'):
                # Sauvegarder section précédente si pertinente
                if in_relevant_section and current_section:
                    relevant_sections.append('\n'.join(current_section))
                
                # Vérifier si nouvelle section est pertinente
                current_section = [line]
                in_relevant_section = any(term in line.lower() for term in query_terms)
            
            else:
                current_section.append(line)
                # Vérifier pertinence dans le contenu
                if not in_relevant_section and any(term in line.lower() for term in query_terms):
                    in_relevant_section = True
        
        # Ajouter dernière section si pertinente
        if in_relevant_section and current_section:
            relevant_sections.append('\n'.join(current_section))
        
        # Si rien trouvé, retourner les premières sections importantes
        if not relevant_sections:
            relevant_sections = ['\n'.join(lines[:100])]  # Premiers 100 lignes
            
        return relevant_sections
    
    def _analyze_missing_data(self, calculation_type: str, provided_data: List[str]) -> List[str]:
        """
        Analyse les données manquantes pour un type de calcul
        """
        # Définir les données requises par type de calcul
        required_data_map = {
            'tva': ['montant', 'type_montant'],
            'impot_professionnel': ['chiffre_affaires_annuel'],
            'impot_cedulaire': ['salaire_mensuel_brut'],
            'charges_sociales': ['salaire_brut'],
            'dcf': ['cash_flows', 'discount_rate', 'terminal_growth_rate'],
            'multiples': ['ebitda_or_revenue', 'comparable_multiple'],
            'asset_based': ['total_actif', 'total_passif'],
            'npv': ['cash_flows', 'discount_rate', 'initial_investment'],
            'irr': ['cash_flows'],
            'financial_ratios': ['actif_circulant', 'passif_circulant', 'capitaux_propres', 'dettes_totales'],
            'working_capital': ['stocks', 'creances_clients', 'dettes_fournisseurs', 'chiffre_affaires'],
            'credit_scoring': ['revenus', 'charges', 'garanties', 'historique_credit'],
            'credit_capacity': ['ebitda', 'charges_financieres', 'capex'],
            'collateral_analysis': ['valeur_garantie', 'type_garantie', 'liquidite'],
            'par_analysis': ['soldes_credits', 'jours_retard', 'provisions'],
            'stress_testing': ['portefeuille', 'scenarios_macro', 'correlations'],
            'performance_analysis': ['revenus', 'couts', 'actifs_moyens', 'benchmarks'],
            'roa_calculation': ['resultat_net', 'actifs_totaux', 'ajustements_risque'],
            'benchmark_analysis': ['kpis_portefeuille', 'donnees_marche', 'segment']
        }
        
        required = set(required_data_map.get(calculation_type, []))
        provided = set(provided_data)
        missing = list(required - provided)
        
        return missing
    
    def _generate_user_questions(self, calculation_type: str, missing_data: List[str]) -> List[str]:
        """
        Génère les questions à poser à l'utilisateur pour les données manquantes
        """
        question_templates = {
            'montant': "Quel est le montant à traiter pour le calcul TVA ?",
            'type_montant': "Le montant fourni est-il HT (Hors Taxes) ou TTC (Toutes Taxes Comprises) ?",
            'chiffre_affaires_annuel': "Quel est le chiffre d'affaires annuel de l'entreprise en CDF ?",
            'salaire_mensuel_brut': "Quel est le salaire mensuel brut en CDF ?",
            'salaire_brut': "Quel est le salaire brut pour le calcul des charges sociales ?",
            'cash_flows': "Quels sont les flux de trésorerie prévisionnels (liste des montants par année) ?",
            'discount_rate': "Quel taux d'actualisation souhaitez-vous utiliser (ex: 12% = 0.12) ?",
            'terminal_growth_rate': "Quel taux de croissance perpétuelle pour la valeur terminale (ex: 3% = 0.03) ?",
            'ebitda_or_revenue': "Quel est l'EBITDA ou le chiffre d'affaires pour la valorisation ?",
            'comparable_multiple': "Quel multiple voulez-vous appliquer (ex: 8 pour 8x EBITDA) ?",
            'total_actif': "Quel est le total de l'actif au bilan ?",
            'total_passif': "Quel est le total du passif (dettes) au bilan ?",
            'initial_investment': "Quel est l'investissement initial du projet ?",
            'actif_circulant': "Quel est le montant de l'actif circulant ?",
            'passif_circulant': "Quel est le montant du passif circulant ?",
            'capitaux_propres': "Quel est le montant des capitaux propres ?",
            'dettes_totales': "Quel est le montant total des dettes ?",
            'stocks': "Quel est la valeur des stocks ?",
            'creances_clients': "Quel est le montant des créances clients ?",
            'dettes_fournisseurs': "Quel est le montant des dettes fournisseurs ?",
            'chiffre_affaires': "Quel est le chiffre d'affaires annuel ?"
        }
        
        questions = []
        for data in missing_data:
            question = question_templates.get(data, f"Veuillez fournir la valeur pour : {data}")
            questions.append(question)
            
        return questions
    
    def get_available_domains(self) -> List[str]:
        """Retourne la liste des domaines de connaissances disponibles"""
        return list(self.knowledge_files.keys())
    
    def search_knowledge(self, query: str, domains: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Recherche dans les connaissances avec requête en langage naturel
        """
        if domains is None:
            domains = self.get_available_domains()
        
        results = {}
        for domain in domains:
            if domain in self.knowledge_files:
                result = self.retrieve_by_domain(domain, query)
                if result.get('found', False):
                    results[domain] = result
        
        return {
            'query': query,
            'domains_searched': domains,
            'results': results,
            'found_in_domains': list(results.keys())
        }
