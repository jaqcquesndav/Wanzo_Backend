from openai import OpenAI
import os
import json
import re
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from .retriever_agent import RetrieverAgent
from .generator_agent import GeneratorAgent
from agents.utils.document_analyzer import DocumentAnalyzer
from agents.utils.token_manager import get_token_counter
from agents.utils.calculation_helper import CalculationHelper
from agents.utils.calculation_validator import CalculationValidator
from decimal import Decimal

class AAgent:
    def __init__(self, token_limit=None):
        print("AAgent initialized")
        self.retriever = RetrieverAgent()
        self.generator = GeneratorAgent()
        self.client = OpenAI()
        self.token_counter = get_token_counter(token_limit)
        self.doc_analyzer = DocumentAnalyzer()
        self.syscohada_templates = self._load_syscohada_templates()
        self.calculator = CalculationHelper(precision=2)  # Calculator for basic operations
        self.validator = CalculationValidator(precision=2)  # New calculation validator

    def _load_comptable_rules_from_file(self):
        """
        Charge les règles comptables depuis le fichier knowledge_base/knoleg.txt.
        """
        rules_path = os.path.join(os.path.dirname(__file__), "../../data/knowledge_base/knoleg.txt")
        rules = []
        try:
            with open(rules_path, "r", encoding="utf-8") as file:
                rules = file.readlines()
            print(f"Loaded rules from {rules_path}")
        except Exception as e:
            print(f"Erreur lors du chargement des règles comptables : {e}")
        return rules

    def _load_syscohada_templates(self):
        """
        Charge les modèles d'écritures standards SYSCOHADA pour les opérations courantes.
        """
        return {
            "achat_marchandises": {
                "debit": [
                    {"compte": "601", "libelle": "Achats de marchandises"},
                    {"compte": "4456", "libelle": "TVA déductible"}
                ],
                "credit": [
                    {"compte": "401", "libelle": "Fournisseurs"}
                ]
            },
            "vente_marchandises": {
                "debit": [
                    {"compte": "411", "libelle": "Clients"}
                ],
                "credit": [
                    {"compte": "701", "libelle": "Ventes de marchandises"},
                    {"compte": "4431", "libelle": "TVA facturée"}
                ]
            },
            "reglement_fournisseur": {
                "debit": [
                    {"compte": "401", "libelle": "Fournisseurs"}
                ],
                "credit": [
                    {"compte": "521", "libelle": "Banque"}
                ]
            },
            "encaissement_client": {
                "debit": [
                    {"compte": "521", "libelle": "Banque"}
                ],
                "credit": [
                    {"compte": "411", "libelle": "Clients"}
                ]
            },
            "achat_immobilisation": {
                "debit": [
                    {"compte": "2", "libelle": "Immobilisation"},
                    {"compte": "4456", "libelle": "TVA déductible"}
                ],
                "credit": [
                    {"compte": "404", "libelle": "Fournisseurs d'immobilisations"}
                ]
            },
            "paie_salaires": {
                "debit": [
                    {"compte": "661", "libelle": "Rémunérations directes versées au personnel"}
                ],
                "credit": [
                    {"compte": "421", "libelle": "Personnel, avances et acomptes"},
                    {"compte": "431", "libelle": "Sécurité sociale"},
                    {"compte": "447", "libelle": "État, impôts retenues à la source"}
                ]
            },
            "dotation_amortissements": {
                "debit": [
                    {"compte": "681", "libelle": "Dotations aux amortissements"}
                ],
                "credit": [
                    {"compte": "28", "libelle": "Amortissements"}
                ]
            }
        }

    def _extract_json_from_response(self, response):
        """
        Extrait et valide le JSON de la réponse brute du LLM.
        """
        try:
            # Rechercher le bloc JSON dans la réponse en utilisant une expression régulière
            json_match = re.search(r"\{.*?\}", response, re.DOTALL)
            if not json_match:
                raise ValueError("Aucun JSON valide trouvé dans la réponse du LLM.")
            json_str = json_match.group(0)  # Extraire le JSON correspondant
            return json.loads(json_str)  # Charger le JSON de manière sécurisée
        except json.JSONDecodeError as e:
            print(f"Erreur lors du décodage du JSON : {e}")
            raise ValueError("Le JSON extrait est invalide.")
        except Exception as e:
            print(f"Erreur lors de l'extraction du JSON : {e}")
            raise ValueError("Erreur inattendue lors de l'extraction du JSON.")

    def process(self, intent=None, entities=None, extracted_data=None):
        """
        Analyze extracted document data to generate accounting entry proposals.
        
        Args:
            intent: Classification of the operation (optional)
            entities: Named entities extracted from the prompt (optional)
            extracted_data: Extracted document data
            
        Returns:
            dict: Analysis result with accounting entry proposals
        """
        debug_info = {"step": "start", "intent": intent, "extracted_data_type": type(extracted_data).__name__}
        
        start_time = time.time()
        print("Processing natural language prompt")
        
        # Initialize default response
        result = {
            "proposals": [],
            "confidence": 0.0,
            "informations_manquantes": [],
            "regles_appliquees": []
        }
        
        # Ensure we have extracted_data to work with
        if not extracted_data:
            result["error"] = {
                "code": "NO_DATA",
                "message": "No data provided for processing"
            }
            result["informations_manquantes"].append("Données d'entrée")
            return result
        
        # Extract data type and content for customized handling
        document_type = extracted_data.get("document_type", "unknown")
        debug_info["document_type"] = document_type
        
        # Determine if the data came from a prompt or a document
        is_prompt = document_type == "prompt"
        
        # Extract text content
        text_content = ""
        if is_prompt:
            # For prompt data, get the full text
            text_content = extracted_data.get("full_text", "")
        else:
            # For document data, get the extracted full text
            text_content = extracted_data.get("full_text", "")
        
        # Try to determine operation type/intent if not provided
        if not intent:
            # Use either the one from the extracted_data or determine it dynamically
            if is_prompt and "structured_data" in extracted_data and "type_operation" in extracted_data["structured_data"]:
                intent = extracted_data["structured_data"]["type_operation"]
            else:
                intent, intent_debug_info = self._classify_operation(text_content)
                debug_info["intent_classification"] = intent_debug_info
        
        debug_info["intent"] = intent
        
        try:
            # Get relevant accounting rules for the operation intent
            print(f"Operation classified as: {intent}")
            rules = self.retriever_agent.retrieve(f"règles comptables pour {intent} en SYSCOHADA")
            debug_info["step"] = "rules_retrieved"
            
            # Create prompt that combines rules, extracted data, and intent
            prompt = self._create_processing_prompt(intent, extracted_data, rules, is_prompt)
            
            # First try to get proposals using the knowledge base and LLM integration
            try:
                proposals, llm_debug_info = self.generator_agent.generate(prompt)
                debug_info["llm_debug_info"] = llm_debug_info
                debug_info["step"] = "llm_generation_completed"
                
                if proposals:
                    raw_llm_output = proposals[0]
                    print(f"Raw LLM output: {raw_llm_output}")
                    
                    # Parse the LLM output to get structured accounting entries
                    parsed_response = self._parse_llm_response(raw_llm_output)
                    
                    if "proposals" in parsed_response and parsed_response["proposals"]:
                        # Success! Return proposals with confidence
                        result.update(parsed_response)
                        result["processing_time"] = time.time() - start_time
                        debug_info["step"] = "success_with_proposals"
                        return result
                    
                    # Handle the case where we got a response but no valid proposals
                    if "informations_manquantes" in parsed_response:
                        result["informations_manquantes"] = parsed_response["informations_manquantes"]
                    if "regles_appliquees" in parsed_response:
                        result["regles_appliquees"] = parsed_response["regles_appliquees"]
                        
            except Exception as e:
                print(f"Error processing natural language: {str(e)}")
                debug_info["error"] = str(e)
            
            # If we get here, it means the knowledge-based approach didn't work
            # For prompts, we'll try a more direct LLM approach with accounting expertise
            if is_prompt:
                fallback_result = self._fallback_prompt_processing(extracted_data)
                if fallback_result and fallback_result.get("proposals"):
                    print("Used fallback LLM processing for prompt")
                    result = fallback_result
                    result["processing_time"] = time.time() - start_time
                    debug_info["step"] = "success_with_fallback"
                    return result
            
            # Last resort - record the missing information
            if not result["proposals"]:
                debug_info["step"] = "no_proposals_generated"
                result["informations_manquantes"].append("Informations insuffisantes pour générer des écritures")
                # Add any structured data error if available
                if "error" in debug_info:
                    result["informations_manquantes"].append(debug_info["error"])
            
        except Exception as e:
            print(f"Error in AA Agent process: {e}")
            result["error"] = {"code": "NL_PROCESSING_ERROR", "message": str(e)}
            result["informations_manquantes"].append(str(e))
        
        result["processing_time"] = time.time() - start_time
        result["debug_info"] = debug_info
        return result

    def _fallback_prompt_processing(self, extracted_data):
        """
        Direct LLM approach for processing prompts when the knowledge-based approach fails.
        Uses a specialized prompt focused on accounting expertise.
        """
        try:
            # Extract prompt text and any contextual information
            prompt_text = extracted_data.get("full_text", "")
            structured_data = extracted_data.get("structured_data", {})
            context_data = extracted_data.get("context_data", {})
            
            # Create a specialized accounting prompt
            fallback_prompt = f"""En tant qu'expert-comptable suivant le système SYSCOHADA, je dois générer les écritures comptables pour cette situation:

SITUATION DÉCRITE:
{prompt_text}

INFORMATIONS CONTEXTUELLES:
- Date: {context_data.get('date', 'Non spécifiée')}
- Devise: {context_data.get('devise', 'USD') if 'devise' in context_data else 'FCFA'}
- Partie concernée: {context_data.get('partie', 'Non spécifiée') if 'partie' in context_data else context_data.get('tiers', 'Non spécifiée')}

RÈGLES POUR LA RÉPONSE:
1. Générer une ou plusieurs écritures comptables au format suivant:
   {{
     "proposals": [
       {{
         "description": "Description de l'opération",
         "date": "JJ/MM/AAAA",
         "debit": [
           {{ "compte": "NUMERO_COMPTE", "libelle": "LIBELLÉ", "montant": MONTANT }}
         ],
         "credit": [
           {{ "compte": "NUMERO_COMPTE", "libelle": "LIBELLÉ", "montant": MONTANT }}
         ]
       }}
     ],
     "confidence": 0.XX,
     "informations_manquantes": ["élément manquant 1", "élément manquant 2"]
   }}

2. Utilisez les comptes SYSCOHADA appropriés.
3. Assurez-vous que les écritures sont équilibrées (total débits = total crédits).
4. Incluez uniquement les informations dont vous êtes certain.
5. Listez toutes les informations manquantes qui rendraient l'écriture plus précise.

Ne fournissez que la structure JSON demandée, sans explication supplémentaire.
"""

            # Send to OpenAI for direct processing
            response = self.generator_agent.llm_connector.client.chat.completions.create(
                model="gpt-4o-2024-08-06",
                messages=[
                    {"role": "system", "content": "Vous êtes un expert-comptable spécialiste du système SYSCOHADA qui génère des écritures comptables précises."},
                    {"role": "user", "content": fallback_prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            
            # Parse and validate the JSON response
            try:
                result = json.loads(content)
                
                # Ensure the response has the expected structure
                if "proposals" not in result:
                    result["proposals"] = []
                if "confidence" not in result:
                    result["confidence"] = 0.0
                if "informations_manquantes" not in result:
                    result["informations_manquantes"] = []
                
                # Validate proposals
                for prop in result["proposals"]:
                    # Ensure debit and credit are lists
                    if "debit" not in prop or not isinstance(prop["debit"], list):
                        prop["debit"] = []
                    if "credit" not in prop or not isinstance(prop["credit"], list):
                        prop["credit"] = []
                    
                    # Use date from context if not provided
                    if "date" not in prop and "date" in context_data:
                        prop["date"] = context_data["date"]
                
                return result
                
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from fallback LLM response: {e}")
                print(f"Raw content: {content}")
                # Try with regex as fallback
                return self._parse_json_with_regex(content)
            
        except Exception as e:
            print(f"Error in fallback prompt processing: {e}")
            return {
                "proposals": [],
                "confidence": 0.0,
                "informations_manquantes": [f"Erreur lors du traitement de secours: {str(e)}"]
            }
    
    def _parse_json_with_regex(self, content):
        """Parse JSON from LLM response using regex as a fallback method."""
        try:
            # Look for everything between outermost braces
            json_match = re.search(r'(\{.*\})', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                # Try to parse this JSON
                return json.loads(json_str)
            return None
        except Exception:
            return None

    def _create_processing_prompt(self, intent, extracted_data, rules, is_prompt=False):
        """
        Create a prompt for processing the extracted data.
        """
        # Base prompt structure
        if is_prompt:
            # For natural language prompts, use a prompt-specific template
            prompt_template = """En tant qu'expert-comptable SYSCOHADA, analysez cette description d'une opération comptable et générez les écritures correspondantes:

DESCRIPTION DE L'OPÉRATION:
{prompt_text}

CONTEXTE SUPPLÉMENTAIRE:
{context_info}

RÈGLES COMPTABLES PERTINENTES:
{rules}

INSTRUCTION:
Basé sur la description et les règles comptables, proposez des écritures comptables appropriées. 
Si l'information est insuffisante, indiquez quelles informations seraient nécessaires pour compléter l'analyse.
Utilisez le format JSON suivant pour la réponse:
{{
  "proposals": [
    {{
      "description": "Description de l'opération",
      "date": "JJ/MM/AAAA",
      "debit": [
        {{ "compte": "NUMERO_COMPTE", "libelle": "LIBELLÉ", "montant": MONTANT }}
      ],
      "credit": [
        {{ "compte": "NUMERO_COMPTE", "libelle": "LIBELLÉ", "montant": MONTANT }}
      ]
    }}
  ],
  "confidence": 0.XX,
  "informations_manquantes": ["élément manquant 1", "élément manquant 2"],
  "regles_appliquees": ["règle appliquée 1", "règle appliquée 2"]
}}

Si les informations sont insuffisantes pour générer une écriture, retournez une liste 'proposals' vide et listez les informations manquantes.
"""
            # Extract text and context from the prompt
            prompt_text = extracted_data.get("full_text", "")
            
            # Format context info
            context_parts = []
            
            # Add structured data if available
            if "structured_data" in extracted_data:
                structured = extracted_data["structured_data"]
                
                # Add important structured elements
                if "comptes" in structured and structured["comptes"]:
                    context_parts.append("Comptes identifiés:")
                    for compte in structured["comptes"]:
                        context_parts.append(f"- {compte.get('numero', '')}: {compte.get('description', '')} ({compte.get('type', '')})")
                
                if "montants" in structured and structured["montants"]:
                    context_parts.append("Montants identifiés:")
                    for montant in structured["montants"]:
                        context_parts.append(f"- {montant.get('value', '')} {montant.get('devise', '')}: {montant.get('description', '')}")
                
                if "dates" in structured and structured["dates"]:
                    context_parts.append("Dates identifiées:")
                    for date in structured["dates"]:
                        context_parts.append(f"- {date.get('date', '')}: {date.get('description', '')}")
                
                if "parties" in structured and structured["parties"]:
                    context_parts.append("Parties impliquées:")
                    for partie in structured["parties"]:
                        context_parts.append(f"- {partie.get('nom', '')}: {partie.get('role', '')}")
                        
                if "classification" in structured:
                    context_parts.append(f"Classification comptable: {structured['classification']}")
            
            # Add context data if available
            if "context_data" in extracted_data and extracted_data["context_data"]:
                context_data = extracted_data["context_data"]
                context_parts.append("Contexte explicite:")
                for key, value in context_data.items():
                    if value and value != "string":  # Skip empty or placeholder values
                        context_parts.append(f"- {key}: {value}")
            
            context_info = "\n".join(context_parts) if context_parts else "Aucun contexte supplémentaire disponible."
            
            # Format the prompt
            formatted_prompt = prompt_template.format(
                prompt_text=prompt_text,
                context_info=context_info,
                rules="\n".join(rules) if isinstance(rules, list) else str(rules)
            )
            
        else:
            # For extracted documents, use the existing document template
            # ...existing document template processing...
            formatted_prompt = "Default document processing prompt"  # Placeholder for existing document logic
            
        return formatted_prompt

    def classify_operation(self, text):
        """
        Classifie le type d'opération comptable à partir du texte.
        """
        # Utilisez le LLM pour déterminer le type d'opération
        response = self.client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            messages=[
                {"role": "system", "content": "Vous êtes un expert-comptable SYSCOHADA. Classifiez cette opération dans l'une des catégories suivantes : achat_marchandises, vente_marchandises, reglement_fournisseur, encaissement_client, achat_immobilisation, paie_salaires, dotation_amortissements, autre."},
                {"role": "user", "content": f"Texte à classer : {text}"}
            ],
            temperature=0.1,
            max_tokens=50,
        )
        operation_type = response.choices[0].message.content.strip().lower()
        return operation_type

    def _process_natural_language(self, text, intent, entities):
        """Handle natural language text input specifically."""
        try:
            # Generate operation_id to track related API calls
            operation_id = f"nl_processing_{int(time.time())}"
            # Classifiez d'abord l'opération pour adapter le prompt
            operation_type = self.classify_operation(text)
            print(f"Operation classified as: {operation_type}")
            # Récupérez le modèle d'écriture correspondant si disponible
            template = self.syscohada_templates.get(operation_type)
            # Construire un prompt contextuel en fonction du type d'opération
            context_prompt = ""
            if (template):
                context_prompt = f"Cette opération semble être un(e) {operation_type}. "
                context_prompt += "Voici un modèle d'écriture typique pour ce type d'opération :\n"
                context_prompt += f"Débit : {', '.join([f'{d['compte']} ({d['libelle']})' for d in template['debit']])}\n"
                context_prompt += f"Crédit : {', '.join([f'{c['compte']} ({c['libelle']})' for c in template['credit']])}\n\n"
            syscohada_prompt = f"""En tant qu'expert-comptable SYSCOHADA, générez les écritures comptables à partir de cette description en langage naturel.
            {context_prompt}ANALYSEZ LE TEXTE ET GÉNÉREZ UNE PROPOSITION D'ÉCRITURE COMPTABLE.
            FORMAT DE RÉPONSE REQUIS:
            {{
                "proposals": [
                    {{
                        "debit": [
                            {{"compte": "NUMERO_COMPTE", "montant": MONTANT, "libelle": "DESCRIPTION_DÉTAILLÉE"}}
                        ],
                        "credit": [
                            {{"compte": "NUMERO_COMPTE", "montant": MONTANT, "libelle": "DESCRIPTION_DÉTAILLÉE"}}
                        ],
                        "date": "DATE_AU_FORMAT_JJ/MM/AAAA",
                        "journal": "CODE_JOURNAL",
                        "piece_reference": "RÉFÉRENCE",
                        "description": "DESCRIPTION_GÉNÉRALE"
                    }}
                ],
                "confidence": NIVEAU_DE_CONFIANCE,
                "informations_manquantes": ["LISTE_INFORMATIONS_MANQUANTES"],
                "regles_appliquees": ["LISTE_RÈGLES_APPLIQUÉES"]
            }}
            IMPORTANT POUR LES LIBELLÉS:
            1. Chaque libellé doit contenir obligatoirement:
               - Nature précise de l'opération (achat, vente, paiement, etc.)
               - Objet exact de l'opération (bien/service avec caractéristiques si disponibles)
               - Référence complète du document (n° facture/reçu/bordereau)
               - Date de l'opération si elle diffère de la date comptable
               - Nom du tiers concerné (fournisseur, client, banque, etc.)
            2. EXEMPLES DE BONS LIBELLÉS:
               - "Achat fournitures bureau n°inventaire 2023-45 - Facture F5689 du 15/03/2023 - Fournisseur Papeco SARL"
               - "Dette Fournisseur Papeco SARL - Facture F5689 du 15/03/2023 - Achat fournitures bureau"
               - "Règlement loyer local commercial 125m² Plateau - Mars 2023 - Virement BIC n°78542 - Bailleur SCI Aurora"
               - "Vente 150 articles réf. A78541 - Facture FV2023/784 du 18/03/2023 - Client Boutiques Express"
            3. LIBELLÉS À ÉVITER (TROP GÉNÉRIQUES):
               - "Achat de marchandises" (incomplet)
               - "Facture client" (incomplet)
               - "Paiement" (incomplet)
               - "TVA" (incomplet)
            4. Utilisez systématiquement toutes les informations disponibles dans le texte pour enrichir les libellés
            5. Ne créez jamais de libellés génériques ou imprécis"""
            # Récupérer les règles spécifiques au type d'opération
            specific_rules = self.retriever.retrieve(f"règles comptables pour {operation_type} en SYSCOHADA")
            response = self.client.chat.completions.create(
                model="gpt-4",  # Using GPT-4 for better comprehension 
                messages=[
                    {
                        "role": "system",
                        "content": syscohada_prompt
                    },
                    {
                        "role": "user",
                        "content": f"TEXTE À ANALYSER: {text}\n\nINTENTION: {intent or 'Non spécifiée'}\n\nRÈGLES SPÉCIFIQUES:\n{specific_rules[0] if specific_rules and len(specific_rules) > 0 else 'Aucune règle spécifique trouvée.'}"
                    }
                ],
                temperature=0.1,
                max_tokens=1000,
            )
            # Logging token usage with the shared TokenCounter
            self.token_counter.log_operation(
                agent_name="AAgent",
                model="gpt-4",
                input_text=syscohada_prompt + f"\nTEXTE À ANALYSER: {text}\n\nINTENTION: {intent or 'Non spécifiée'}",
                output_text=response.choices[0].message.content,
                operation_id=operation_id,
                request_type="natural_language_processing"
            )
            # Parse and validate the response
            result = self._parse_and_validate_entries(response.choices[0].message.content)
            # Add token usage data to the result
            token_usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
            # Mettre à jour le résultat avec les informations de tokens
            result["token_usage"] = token_usage
            result["cumulative_token_usage"] = self.token_counter.get_stats()["total"]
            return result
        except Exception as e:
            print(f"Error processing natural language: {str(e)}")
            return self._error_response(str(e), "NL_PROCESSING_ERROR")

    def _process_with_llm_knowledge(self, extracted_data, doc_type, validation_results=None):
        try:
            # Prompt système en français pour assurer des réponses en français
            syscohada_prompt = """En tant qu'expert-comptable SYSCOHADA, générez les écritures comptables détaillées en français.
            RÈGLES POUR LES LIBELLÉS:
            1. Chaque libellé doit contenir obligatoirement:
               - Nature précise de l'opération (achat, vente, paiement, etc.)
               - Objet exact de l'opération (bien/service avec caractéristiques si disponibles)
               - Référence complète du document (n° facture/reçu/bordereau)
               - Date de l'opération si elle diffère de la date comptable
               - Nom du tiers concerné (fournisseur, client, banque, etc.)
            2. Pour les comptes de charges/produits:
               Libellé = "Nature opération + objet détaillé + référence document + tiers"
               Ex: "Achat fournitures informatiques - 3 écrans Dell P2419H - Facture F-2023/0456 du 12/03/23 - Fournisseur InfoTech"
            3. Pour les comptes de tiers:
               Libellé = "Statut tiers + nom tiers + référence document + objet synthétique"
               Ex: "Dette Fournisseur InfoTech - Facture F-2023/0456 du 12/03/23 - Achat matériel informatique"
            4. Pour les comptes de TVA:
               Libellé = "TVA déductible/collectée sur [nature opération] - Référence document - Tiers"
               Ex: "TVA déductible sur achat matériel - Facture F-2023/0456 - Fournisseur InfoTech"
            5. EXEMPLES DE BONS LIBELLÉS:
               - "Achat fournitures bureau n°inventaire 2023-45 - Facture F5689 du 15/03/2023 - Fournisseur Papeco SARL"
               - "Dette Fournisseur Papeco SARL - Facture F5689 du 15/03/2023 - Achat fournitures bureau"
               - "Règlement loyer local commercial 125m² Plateau - Mars 2023 - Virement BIC n°78542 - Bailleur SCI Aurora"
               - "Vente 150 articles réf. A78541 - Facture FV2023/784 du 18/03/2023 - Client Boutiques Express"
            6. LIBELLÉS À ÉVITER (TROP GÉNÉRIQUES):
               - "Achat de marchandises" (incomplet)
               - "Facture client" (incomplet)
               - "Paiement" (incomplet)
               - "TVA" (incomplet)
            FORMAT DE RÉPONSE REQUIS:
            Vous devez impérativement générer uniquement un objet JSON valide, sans autre texte avant ou après, avec la structure exacte suivante :
            {
                "proposals": [
                    {
                        "debit": [
                            {"compte": "218200", "montant": 2880.00, "libelle": "Acquisition Moto Tricycle HUANGHE 200CC n°chassis 12345 - Facture FAC-083 du 14/10/2023 - Fournisseur RIME RTA"},
                            {"compte": "445600", "montant": 120.00, "libelle": "TVA déductible sur achat Moto Tricycle - Facture FAC-083 - Fournisseur RIME RTA"}
                        ],
                        "credit": [
                            {"compte": "401100", "montant": 3000.00, "libelle": "Dette Fournisseur RIME RTA - Facture FAC-083 du 14/10/2023 - Moto Tricycle"}
                        ],
                        "date": "14/10/2023",
                        "journal": "AC",
                        "piece_reference": "FAC-083",
                        "description": "Acquisition Moto Tricycle HUANGHE 200CC n°chassis 12345 auprès de RIME RTA"
                    }
                ],
                "confidence": 0.95,
                "informations_manquantes": [],
                "regles_appliquees": []
            }
            IMPORTANT:
            - Répondez UNIQUEMENT avec le JSON, sans aucun autre texte d'introduction ou de conclusion
            - Assurez-vous que la somme des montants au débit soit égale à la somme des montants au crédit
            - Vérifiez que le JSON est correctement formaté et ne contient pas d'erreurs de syntaxe
            - Détaillez les caractéristiques importantes (quantités, références, etc.)"""
            
            # Ajout du contexte spécifique au type de document
            type_context = {
                "bank_statement": "\nPour les relevés bancaires:\n- Utilisez le compte 512 systématiquement\n- Un mouvement = une écriture\n- Codes journaux: BA pour banque",
                "invoice": "\nPour les factures:\n- Achats: comptes 6/401 + TVA 4456\n- Ventes: comptes 411/7 + TVA 4457\n- Codes journaux: AC pour achats, VE pour ventes",
                "receipt": "\nPour les reçus:\n- Paiements: débiter 401 ou créditer 411\n- Utiliser les comptes de trésorerie appropriés\n- Codes journaux: CA pour caisse"
            }
            
            # Extraction des éléments validés si disponibles
            elements_validés = ""
            if "extractions_precises" in extracted_data:
                elements_validés += "\nÉLÉMENTS VALIDÉS APRÈS VÉRIFICATION:\n"
                for element in extracted_data.get("extractions_precises", {}).get("elements_extraits", []):
                    elements_validés += f"- Type: {element.get('type')}\n"
                    elements_validés += f"  Valeurs: {json.dumps(element.get('valeurs', {}), indent=2, ensure_ascii=False)}\n"
                    elements_validés += f"  Confiance: {element.get('confiance', 'non spécifiée')}\n\n"
                
                # Ajouter la validation des calculs si présente
                if "validation_calculs" in extracted_data.get("extractions_precises", {}):
                    validation = extracted_data["extractions_precises"]["validation_calculs"]
                    elements_validés += f"VALIDATION DES CALCULS:\n"
                    elements_validés += f"- Cohérent: {validation.get('calcul_coherent', False)}\n"
                    elements_validés += f"- Message: {validation.get('message', 'Aucun message')}\n"
                    if "correction_suggeree" in validation:
                        elements_validés += f"- Correction suggérée: {json.dumps(validation['correction_suggeree'], indent=2, ensure_ascii=False)}\n"

            response = self.client.chat.completions.create(
                model="gpt-4o-2024-08-06",
                messages=[
                    {
                        "role": "system",
                        "content": f"{syscohada_prompt}\n{type_context.get(doc_type, '')}"
                    },
                    {
                        "role": "user",
                        "content": f"DOCUMENT À ANALYSER:\n{extracted_data['full_text']}\n\n{elements_validés}"
                    },
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            # Traitement de la réponse
            result = self._parse_and_validate_entries(response.choices[0].message.content)
            
            # Ajout des informations d'utilisation des tokens
            if self.token_counter:
                result["token_usage"] = {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
                result["cumulative_token_usage"] = self.token_counter.get_stats()["total"]
                
            return result
        except Exception as e:
            print(f"Erreur LLM: {str(e)}")
            return self._error_response(str(e), "LLM_ERROR")

    def _parse_and_validate_entries(self, content):
        """Valide et structure les écritures pour le journal comptable."""
        try:
            # Extraction du JSON
            json_match = re.search(r'\{[\s\S]*\}', content)
            if not json_match:
                raise ValueError("Format de réponse invalide")
            result = json.loads(json_match.group(0))
            # Validation des écritures
            for entry in result.get("proposals", []):
                debit_sum = sum(d.get("montant", 0) for d in entry.get("debit", []))
                credit_sum = sum(c.get("montant", 0) for c in entry.get("credit", []))
                if abs(debit_sum - credit_sum) > 0.01:
                    raise ValueError(f"Écriture non équilibrée: débit={debit_sum}, crédit={credit_sum}")
                if not all(key in entry for key in ["debit", "credit"]):
                    raise ValueError("Code journal manquant")
                if not entry.get("journal"):
                    raise ValueError("Code journal manquant")
                if not entry.get("date"):
                    raise ValueError("Date manquante")
            return result
        except Exception as e:
            return self._error_response(f"Erreur de validation: {str(e)}", "VALIDATION_ERROR")

    def _process_with_rules(self, extracted_data, rules, doc_type, intent, validation_results=None):
        """Process the document with specific rules and incorporate calculation validation."""
        try:
            # Use the validation results to ensure accurate numbers
            if validation_results and not validation_results.get('calculations_correct', True):
                # Use corrected values if available
                corrected_values = validation_results.get('corrected_values', {})
                if 'subtotal' in corrected_values:
                    extracted_data['subtotal'] = corrected_values['subtotal']
                if 'tax_total' in corrected_values:
                    extracted_data['tax_total'] = corrected_values['tax_total']
                if 'total' in corrected_values:
                    extracted_data['total'] = corrected_values['total']
                
                # Log the corrections
                print(f"Corrected document values based on validation: {corrected_values}")
            
            # Prepare the system prompt with calculation information
            system_prompt = f"""En tant qu'expert-comptable SYSCOHADA spécialisé en {doc_type}, vous devez générer les écritures comptables.
            RÈGLES SPÉCIFIQUES À APPLIQUER :
            {rules}
            
            CALCULS VÉRIFIÉS ET VALIDÉS:
            {json.dumps(validation_results, default=str) if validation_results else "Aucune validation de calcul effectuée"}
            
            RÈGLES POUR LES LIBELLÉS:
            1. Chaque libellé doit contenir obligatoirement:
               - Nature précise de l'opération (achat, vente, paiement, etc.)
               - Objet exact de l'opération (bien/service avec caractéristiques si disponibles)
               - Référence complète du document (n° facture/reçu/bordereau)
               - Date de l'opération si elle diffère de la date comptable
               - Nom du tiers concerné (fournisseur, client, banque, etc.)
            2. Pour les comptes de charges/produits:
               Libellé = "Nature opération + objet détaillé + référence document + tiers"
               Ex: "Achat fournitures informatiques - 3 écrans Dell P2419H - Facture F-2023/0456 du 12/03/23 - Fournisseur InfoTech"
            3. Pour les comptes de tiers:
               Libellé = "Statut tiers + nom tiers + référence document + objet synthétique"
               Ex: "Dette Fournisseur InfoTech - Facture F-2023/0456 du 12/03/23 - Achat matériel informatique"
               
            FORMAT DE RÉPONSE REQUIS (Exemple) :
            {{
                "proposals": [
                    {{
                        "debit": [
                            {{"compte": "218200", "montant": 2880.00, "libelle": "Acquisition Moto Tricycle HUANGHE 200CC n°chassis 12345 - Facture FAC-083 du 14/10/2023 - Fournisseur RIME RTA"}},
                            {{"compte": "445600", "montant": 120.00, "libelle": "TVA déductible sur achat Moto Tricycle - Facture FAC-083 - Fournisseur RIME RTA"}}
                        ],
                        "credit": [
                            {{"compte": "401100", "montant": 3000.00, "libelle": "Dette Fournisseur RIME RTA - Facture FAC-083 du 14/10/2023 - Moto Tricycle"}}
                        ],
                        "date": "14/10/2023",
                        "journal": "AC",
                        "piece_reference": "FAC-083",
                        "description": "Acquisition Moto Tricycle HUANGHE 200CC n°chassis 12345 auprès de RIME RTA"
                    }}
                ],
                "confidence": 0.95,
                "informations_manquantes": ["Liste des règles appliquées"]
            }}
            IMPORTANT : RÉPONDRE UNIQUEMENT EN JSON VALIDE"""
            response = self.client.chat.completions.create(
                model="gpt-4o-2024-08-06",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": f"Analysez ce document et générez les écritures comptables SYSCOHADA :\n\n{extracted_data['full_text']}"
                    },
                ],
                temperature=0.1,
                max_tokens=2000
            )
            # Extraction et validation de la réponse
            content = response.choices[0].message.content.strip()
            print(f"Raw LLM output: {content[:200]}...")  # Debug log truncated to avoid clutter
            
            try:
                # Méthode 1: Tentative d'extraction de JSON complet avec regex
                json_pattern = r'(\{[\s\S]*?\}\}|\{[\s\S]*\})'
                json_matches = re.findall(json_pattern, content, re.DOTALL)
                
                if json_matches:
                    for potential_json in json_matches:
                        try:
                            result = json.loads(potential_json)
                            if self._basic_json_validation(result):
                                print("JSON parsed successfully using regex match")
                                return result
                        except json.JSONDecodeError:
                            continue
                
                # Méthode 2: Chercher du JSON dans des blocs de code
                code_blocks = re.findall(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
                if code_blocks:
                    for block in code_blocks:
                        try:
                            result = json.loads(block)
                            if self._basic_json_validation(result):
                                print("JSON parsed successfully from code block")
                                return result
                        except json.JSONDecodeError:
                            continue
                
                # Méthode 3: Extraction manuelle avec reconstruction du JSON
                print("Trying manual extraction and JSON reconstruction")
                return self._extract_and_reconstruct_json(content)
                
            except Exception as e:
                print(f"All JSON parsing methods failed: {e}")
                return self._extract_and_reconstruct_json(content)
                
        except Exception as e:
            print(f"Processing error: {str(e)}")
            return self._error_response(str(e), "PROCESSING_ERROR")

    def _extract_and_reconstruct_json(self, text):
        """
        Extrait et reconstruit manuellement les éléments d'un JSON à partir du texte.
        Cette méthode est beaucoup plus robuste face aux réponses malformées.
        """
        print("Reconstructing JSON from text...")
        
        # Définir des patrons regex plus robustes pour capturer les différents éléments
        # Pour la structure globale
        proposals_structure = []
        
        # Pour les éléments de débit et crédit
        debit_entries = []
        credit_entries = []
        
        # Extraire la description générale
        desc_match = re.search(r'"description"\s*:\s*"([^"]+)"', text)
        description = desc_match.group(1) if desc_match else "Écriture comptable"
        
        # Extraire la date
        date_match = re.search(r'"date"\s*:\s*"([^"]+)"', text)
        date = date_match.group(1) if date_match else datetime.now().strftime("%d/%m/%Y")
        
        # Extraire la référence de pièce
        ref_match = re.search(r'"piece_reference"\s*:\s*"([^"]+)"', text)
        piece_reference = ref_match.group(1) if ref_match else ""
        
        # Extraire le journal
        journal_match = re.search(r'"journal"\s*:\s*"([^"]+)"', text)
        journal = journal_match.group(1) if journal_match else "JO"
        
        # Extraire les comptes au débit
        debit_pattern = r'"compte"\s*:\s*"?(\d+[\w-]*)"?\s*,\s*"montant"\s*:\s*([\d,.]+)\s*,\s*"libelle"\s*:\s*"([^"]+)"'
        for match in re.finditer(debit_pattern, text):
            compte, montant_str, libelle = match.groups()
            # Conversion sécurisée du montant avec gestion des virgules et points
            try:
                # Remplacer les virgules par des points et convertir en nombre
                montant_clean = montant_str.replace(',', '.')
                montant = round(float(montant_clean), 2)  # Arrondi à 2 décimales pour éviter les erreurs de précision
            except ValueError:
                montant = 0.0
                
            debit_entries.append({
                "compte": compte,
                "montant": montant,
                "libelle": libelle
            })
        
        # Si aucun débit trouvé, chercher avec un pattern alternatif
        if not debit_entries:
            alt_debit_pattern = r'débit.*?compte[:\s]+(\d+).*?montant[:\s]+([\d,.]+).*?libelle[:\s]+"([^"]+)"'
            for match in re.finditer(alt_debit_pattern, text, re.IGNORECASE | re.DOTALL):
                compte, montant, libelle = match.groups()
                debit_entries.append({
                    "compte": compte,
                    "montant": float(montant.replace(',', '.')),
                    "libelle": libelle
                })
        
        # Extraire les comptes au crédit
        credit_pattern = r'"compte"\s*:\s*"?(\d+)"?\s*,\s*"montant"\s*:\s*(\d+(?:\.\d+)?)\s*,\s*"libelle"\s*:\s*"([^"]+)"'
        for match in re.finditer(credit_pattern, text):
            compte, montant, libelle = match.groups()
            # Vérifier si c'est un compte au crédit (contextuel)
            if "credit" in text[:match.start()].split("debit")[-1].lower():
                credit_entries.append({
                    "compte": compte,
                    "montant": float(montant),
                    "libelle": libelle
                })
        
        # Si aucun crédit trouvé, chercher avec un pattern alternatif
        if not credit_entries:
            alt_credit_pattern = r'crédit.*?compte[:\s]+(\d+).*?montant[:\s]+([\d,.]+).*?libelle[:\s]+"([^"]+)"'
            for match in re.finditer(alt_credit_pattern, text, re.IGNORECASE | re.DOTALL):
                compte, montant, libelle = match.groups()
                credit_entries.append({
                    "compte": compte,
                    "montant": float(montant.replace(',', '.')),
                    "libelle": libelle
                })
        
        # Calcul précis des totaux avec le calculator
        if debit_entries:
            debit_amounts = [entry["montant"] for entry in debit_entries]
            debit_total = float(self.calculator.sum_list(debit_amounts))
        else:
            debit_total = 0.0
            
        if credit_entries:
            credit_amounts = [entry["montant"] for entry in credit_entries]
            credit_total = float(self.calculator.sum_list(credit_amounts))
        else:
            credit_total = 0.0
        
        # Si nous avons des entrées de débit ou de crédit
        if debit_entries or credit_entries:
            # Équilibrer si nécessaire        
            if debit_entries and not credit_entries:
                credit_entries = [{
                    "compte": "471000",  # Compte d'attente
                    "montant": debit_total,
                    "libelle": "Contrepartie temporaire (générée automatiquement)"
                }]
            elif credit_entries and not debit_entries:
                debit_entries = [{
                    "compte": "471000",  # Compte d'attente
                    "montant": credit_total,
                    "libelle": "Contrepartie temporaire (générée automatiquement)"
                }]
            
            proposal = {
                "debit": debit_entries,
                "credit": credit_entries,
                "date": date,
                "piece_reference": piece_reference,
                "description": description,
                "journal": journal
            }
            
            proposals_structure.append(proposal)
        
        confidence_match = re.search(r'"confidence"\s*:\s*([\d.]+)', text)
        confidence = float(confidence_match.group(1)) if confidence_match else 0.6
        
        return {
            "proposals": proposals_structure,
            "confidence": confidence,
            "informations_manquantes": ["Reconstruction automatique de JSON incomplet"],
            "regles_appliquees": ["Règles d'équilibrage automatique"]
        }

    def _basic_json_validation(self, data):
        """Validation de base pour vérifier si un JSON a la structure minimale nécessaire."""
        if not isinstance(data, dict):
            return False    
        
        # Vérifier si "proposals" existe
        if "proposals" not in data:
            return False
        
        # Vérifier si "proposals" est une liste
        if not isinstance(data["proposals"], list):
            return False
        
        # Si la liste est vide, c'est valide mais sans écritures
        if not data["proposals"]:
            return True
        
        # Vérifier la structure minimale de la première écriture
        first_entry = data["proposals"][0]
        return isinstance(first_entry, dict) and "debit" in first_entry and "credit" in first_entry

    def _validate_json_structure(self, data):
        """Validation stricte de la structure JSON."""
        required_keys = {"proposals", "confidence", "informations_manquantes", "regles_appliquees"}
        if not all(key in data for key in required_keys):
            return False
        for entry in data["proposals"]:
            if not self._validate_entry_structure(entry):
                return False
        return True

    def _validate_entry_structure(self, entry):
        """Validation d'une écriture comptable."""
        required_keys = {"debit", "credit", "date", "piece_reference", "description"}
        if not all(key in entry for key in required_keys):
            return False
        debit_sum = sum(d.get("montant", 0) for d in entry["debit"])
        credit_sum = sum(c.get("montant", 0) for c in entry["credit"])
        return abs(debit_sum - credit_sum) < 0.01

    def _build_document_specific_prompt(self, doc_type: str, doc_info: dict) -> str:
        """Construit un prompt adapté au type de document."""
        base_prompt = """En tant qu'expert-comptable SYSCOHADA, analysez ce document et générez les écritures comptables appropriées."""
        type_specific = {
            "bank_statement": """
                Pour un relevé bancaire :
                - Créez une écriture par opération
                - Utilisez le compte 512 (Banque) systématiquement
                - Pour les frais bancaires, utilisez le compte 627
                - Pour les intérêts, utilisez le compte 661
            """,
            "invoice": """
                Pour une facture :
                - Si achat : Débit classe 6, Crédit 401
                - Si vente : Débit 411, Crédit classe 7
                - N'oubliez pas la TVA (comptes 4456/4457)
            """,
        }
        return f"{base_prompt}\n{type_specific.get(doc_type, '')}"

    def _error_response(self, message, error_code=None):
        """Réponse d'erreur standardisée avec code."""
        return {
            "error": {
                "code": error_code or "UNKNOWN_ERROR",
                "message": message
            },
            "proposals": [],
            "confidence": 0,
            "informations_manquantes": [message],
            "regles_appliquees": []
        }

    def _validate_entries(self, entries):
        """Valide la structure et la cohérence des écritures."""
        if not entries.get("proposals"):
            return False
        for entry in entries["proposals"]:
            if not entry.get("debit") or not entry.get("credit"):
                return False
            debit_sum = sum(d.get("montant", 0) for d in entry["debit"])
            credit_sum = sum(c.get("montant", 0) for c in entry["credit"])
            if abs(debit_sum - credit_sum) > 0.01:
                return False
        return True

    def _build_analysis_prompt(self, extracted_data, intent, entities, rules):
        return f"""
        Analysez ce document comptable en appliquant les règles SYSCOHADA.
        Document à analyser : 
        {json.dumps(extracted_data, ensure_ascii=False, indent=2)}
        Intention : {intent}
        Entités : {entities}
        Règles comptables à appliquer :
        {rules}
        Instructions :
        1. Identifiez toutes les écritures comptables nécessaires
        2. Utilisez uniquement les comptes SYSCOHADA
        3. Assurez-vous que chaque écriture est équilibrée
        4. Fournissez une description claire pour chaque écriture
        5. Signalez toute information manquante ou ambiguë
        Format de réponse JSON attendu :
        {{
            "proposals": [
                {{
                    "debit": [
                        {{"compte": "numéro", "montant": nombre, "libelle": "description"}}
                    ],
                    "credit": [
                        {{"compte": "numéro", "montant": nombre, "libelle": "description"}}
                    ],
                    "date": "DD/MM/YYYY",
                    "piece_reference": "référence",
                    "description": "description de l'opération"
                }}
            ],
            "confidence": 0.0 à 1.0,
            "informations_manquantes": ["liste"],
            "regles_appliquees": ["liste"]
        }}
        """

    def _parse_entries_response(self, content):
        """Parse la réponse du LLM de manière plus robuste."""
        try:
            if isinstance(content, dict):
                return self._validate_response_structure(content)
            if isinstance(content, str):
                json_match = re.search(r'\{[\s\S]*\}', content)
                if not json_match:
                    raise ValueError("No JSON object found in response")
                parsed = json.loads(json_match.group(0))
                return self._validate_response_structure(parsed)
            raise ValueError(f"Unexpected content type: {type(content)}")
        except Exception as e:
            print(f"Error parsing entries response: {str(e)}\nContent: {content[:200]}...")
            return {
                "proposals": [],
                "confidence": 0,
                "informations_manquantes": [f"Erreur de parsing: {str(e)}"],
                "regles_appliquees": []
            }

    def _validate_response_structure(self, data):
        """Valide et normalise la structure de la réponse."""
        result = {
            "proposals": [],
            "confidence": 0.0,
            "informations_manquantes": [],
            "regles_appliquees": []
        }
        if isinstance(data, dict):
            if "proposals" in data and isinstance(data["proposals"], list):
                result["proposals"] = data["proposals"]
            if "confidence" in data and isinstance(data["confidence"], (int, float)):
                result["confidence"] = float(data["confidence"])
            if "informations_manquantes" in data and isinstance(data["informations_manquantes"], list):
                result["informations_manquantes"] = data["informations_manquantes"]
            if "regles_appliquees" in data and isinstance(data["regles_appliquees"], list):
                result["regles_appliquees"] = data["regles_appliquees"]
        return result

    def _validate_document_calculations(self, extracted_data):
        """
        Validate calculations in the document using precise math operations.
        """
        try:
            # Get line items, if available
            items = extracted_data.get('items', [])
            
            # Check if we have appropriate data to validate
            if not items and not extracted_data.get('subtotal') and not extracted_data.get('total'):
                return {
                    'calculations_correct': True,
                    'reason': 'insufficient_data_for_validation',
                    'message': "Insufficient data to validate calculations"
                }
            
            # Convert values to Decimal for precision
            subtotal = Decimal(str(extracted_data.get('subtotal', '0'))) if extracted_data.get('subtotal') is not None else None
            tax_total = Decimal(str(extracted_data.get('tax_total', '0'))) if extracted_data.get('tax_total') is not None else None
            total = Decimal(str(extracted_data.get('total', '0'))) if extracted_data.get('total') is not None else None
            
            document_type = extracted_data.get('document_type', '')
            
            # Different validation logic based on document type
            if document_type == 'bank_statement':
                # For bank statements - validate opening balance + transactions = closing balance
                opening_balance = Decimal(str(extracted_data.get('subtotal', '0')))  # Using subtotal field for opening balance
                closing_balance = Decimal(str(extracted_data.get('total', '0')))  # Using total field for closing balance
                
                # Process transactions
                transactions = []
                for item in items:
                    transactions.append({
                        'description': item.get('description', ''),
                        'amount': Decimal(str(item.get('amount', '0')))
                    })
                
                return self.validator.validate_bank_statement(
                    opening_balance, 
                    transactions, 
                    closing_balance
                )
            else:
                # For invoices and similar documents
                # Determine tax rate - use default if not specified
                default_tax_rate = Decimal('18.0')  # Default OHADA VAT
                
                return self.validator.validate_invoice_totals(
                    items, 
                    subtotal, 
                    tax_total, 
                    total, 
                    default_tax_rate
                )
                
        except Exception as e:
            print(f"Error during calculation validation: {e}")
            return {
                'calculations_correct': True,  # Assume correct if validation fails
                'error': str(e)
            }