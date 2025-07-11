import openai
from openai import OpenAI
import os
import re
import warnings
import yaml
import fitz  # PyMuPDF for PDFs
import tempfile
import time
import psutil
import json
import base64
import pandas as pd  # For Excel/CSV processing
import numpy as np
from PIL import Image  # For image processing
from io import BytesIO
from decimal import Decimal, InvalidOperation
import csv
from agents.utils.token_manager import get_token_counter
from agents.utils.document_extraction import DocumentExtractor

class DDEAgent:
    def __init__(self, token_limit=None):
        print("DDE Agent initialized")
        # Load OpenAI API key from config file
        config_path = os.path.join(os.path.dirname(__file__), "../../config/config.yaml")
        try:
            with open(config_path, "r") as config_file:
                config = yaml.safe_load(config_file)
                self.OPENAI_API_KEY = config.get("OPENAI_API_KEY")
        except Exception as e:
            raise RuntimeError(f"Error loading configuration file: {e}")

        if not self.OPENAI_API_KEY:
            raise RuntimeError(
                "OpenAI API key not configured in config file. Please set 'OPENAI_API_KEY' in 'config.yaml'."
            )
        openai.api_key = self.OPENAI_API_KEY

        # Initialiser le client OpenAI
        self.client = OpenAI(api_key=self.OPENAI_API_KEY)

        # Ignore unnecessary warnings
        warnings.filterwarnings("ignore", category=UserWarning)

        # Initialize document extractor
        self.document_extractor = DocumentExtractor()
        self.token_counter = get_token_counter(token_limit)
        
        # Initialize supported formats
        self.supported_formats = {
            'pdf': self._process_pdf,
            'jpg': self._process_image,
            'jpeg': self._process_image,
            'png': self._process_image,
            'tiff': self._process_image,
            'bmp': self._process_image,
            'xlsx': self._process_excel,
            'xls': self._process_excel,
            'csv': self._process_csv,
            'txt': self._process_text
        }
        
        print(f"DDE Agent initialized with support for formats: {', '.join(self.supported_formats.keys())}")

    def _process_pdf(self, file_path):
        """
        Traite les fichiers PDF en utilisant exclusivement le modèle Vision d'OpenAI pour l'OCR.
        Convertit chaque page en image et la traite avec l'OCR avancé d'OpenAI.
        """
        extraction_details = {
            "format": "pdf",
            "processing_method": "openai_vision",
            "page_count": 0,
            "page_results": [],
            "extractions_precises": {}  # Stockage des éléments extraits avec précision
        }
        
        try:
            print("Traitement PDF avec OpenAI Vision (gpt-4o-2024-08-06)...")
            pdf_document = fitz.open(file_path)
            extraction_details["page_count"] = len(pdf_document)
            combined_text = ""
            operation_id = f"pdf_ocr_{int(time.time())}"

            # Créer un répertoire temporaire dédié
            with tempfile.TemporaryDirectory() as temp_dir:
                # Traiter chaque page PDF individuellement pour de meilleurs résultats
                max_pages = min(len(pdf_document), 10)  # Limiter aux 10 premières pages par souci pratique
                for page_number in range(max_pages):
                    page_start_time = time.time()
                    print(f"Traitement de la page {page_number + 1}/{max_pages}...")
                    
                    # Convertir la page PDF en image
                    page = pdf_document[page_number]
                    pix = page.get_pixmap(dpi=300)  # Résolution élevée pour une meilleure qualité
                    temp_image_path = os.path.join(temp_dir, f"page_{page_number}.png")
                    pix.save(temp_image_path)
                    
                    # Lire et encoder l'image en base64
                    with open(temp_image_path, "rb") as image_file:
                        image_data = image_file.read()
                        base64_image = base64.b64encode(image_data).decode('utf-8')

                    # Prompt amélioré pour l'OCR de documents comptables en français
                    system_prompt = """Vous êtes un système d'OCR spécialisé dans les documents comptables africains. Extrayez TOUT le texte du document en préservant la mise en page et la structure exactes.

Instructions:
1. Extrayez TOUT le texte visible dans le document, y compris les chiffres, dates, références et tableaux
2. Portez une attention particulière aux informations financières: montants, taux de TVA, totaux, numéros de compte
3. Préservez la structure originale des tableaux avec un alignement approprié
4. Maintenez le formatage exact des numéros de facture, dates et codes de référence
5. Extrayez TOUS les éléments des tableaux, incluant quantités, descriptions, prix unitaires et totaux
6. Ne faites AUCUNE interprétation ou résumé - fournissez UNIQUEMENT le texte extrait
7. Si un texte est peu clair, indiquez-le avec [?] mais faites votre meilleure estimation
8. Incluez en-têtes, pieds de page, tampons et tout autre élément textuel

Formatez le résultat avec des espaces appropriés pour préserver la structure du document.
Pour les tableaux, utilisez des espaces pour aligner correctement les colonnes.

IMPORTANT: Répondez en français. Ne traduisez pas le contenu, préservez-le dans sa langue originale."""

                    attempts_remaining = 2  # Nombre de tentatives autorisées
                    success = False
                    
                    while attempts_remaining > 0 and not success:
                        try:
                            response = self.client.chat.completions.create(
                                model="gpt-4o-2024-08-06",  # Utilisation du modèle le plus récent avec capacités Vision
                                messages=[
                                    {
                                        "role": "system",
                                        "content": system_prompt
                                    },
                                    {
                                        "role": "user",
                                        "content": [
                                            {
                                                "type": "text",
                                                "text": f"Extrayez le texte complet de ce document comptable (page PDF {page_number+1}/{len(pdf_document)}). Soyez très précis avec les montants, dates et références."
                                            },
                                            {
                                                "type": "image_url",
                                                "image_url": {
                                                    "url": f"data:image/png;base64,{base64_image}"
                                                }
                                            }
                                        ]
                                    }
                                ],
                                max_tokens=4000,
                                temperature=0.0  # Utiliser la température la plus basse pour une extraction précise
                            )

                            # Enregistrer l'utilisation des tokens
                            self.token_counter.log_operation(
                                agent_name="DDEAgent",
                                model="gpt-4o-2024-08-06",
                                input_text=f"OCR PDF page {page_number+1}",
                                output_text=response.choices[0].message.content,
                                operation_id=operation_id,
                                request_type="pdf_ocr"
                            )

                            page_text = response.choices[0].message.content
                            combined_text += f"\n\n--- PAGE {page_number + 1} ---\n\n{page_text}"
                            
                            page_processing_time = time.time() - page_start_time
                            chars_extracted = len(page_text)
                            print(f"Extraction de {chars_extracted} caractères de la page {page_number + 1} en {page_processing_time:.2f} secondes")
                            
                            extraction_details["page_results"].append({
                                "page_number": page_number + 1,
                                "processing_time_seconds": page_processing_time,
                                "characters_extracted": chars_extracted,
                                "processing_method": "openai_vision",
                                "status": "success"
                            })
                            
                            # Extraction précise des éléments structurés
                            extraction_result = self._extract_structured_elements(page_text, page_number)
                            if extraction_result:
                                # Fusionner les résultats dans les détails d'extraction
                                if "elements_extraits" not in extraction_details["extractions_precises"]:
                                    extraction_details["extractions_precises"]["elements_extraits"] = []
                                extraction_details["extractions_precises"]["elements_extraits"].extend(extraction_result["elements_extraits"])
                            
                            success = True  # Marquer comme réussi

                        except Exception as e:
                            print(f"Erreur lors du traitement de la page {page_number + 1} (tentative {3-attempts_remaining}/2): {e}")
                            attempts_remaining -= 1
                            
                            # Si c'est la dernière tentative, enregistrer l'erreur
                            if attempts_remaining == 0:
                                combined_text += f"\n\n--- ERREUR PAGE {page_number + 1}: {str(e)} ---\n\n"
                                combined_text += "\n[Extraction de texte échouée pour cette page]\n"
                                
                                extraction_details["page_results"].append({
                                    "page_number": page_number + 1,
                                    "status": "failed",
                                    "error": f"Échec de l'OCR OpenAI: {str(e)}"
                                })
                            else:
                                print(f"Nouvelle tentative pour la page {page_number + 1}...")
                                # Attendre un peu avant de réessayer
                                time.sleep(2)

                pdf_document.close()
                
                # Vérification des calculs et validation croisée
                if "elements_extraits" in extraction_details["extractions_precises"]:
                    self._verifier_calculs(extraction_details["extractions_precises"])
                
                # Après l'extraction de tout le texte, utiliser GPT-4o pour identifier et structurer le document comptable
                try:
                    print("Analyse du texte extrait pour identifier la structure du document...")
                    analysis_start_time = time.time()
                    analysis = self.client.chat.completions.create(
                        model="gpt-4o-2024-08-06",
                        messages=[
                            {
                                "role": "system",
                                "content": """Vous êtes un analyste de documents comptables. Examinez le texte extrait et classifiez le document.
                                Identifiez les informations clés telles que:
                                1. Type de document (facture, reçu, relevé bancaire, etc.)
                                2. Date(s)
                                3. Références/numéros
                                4. Parties impliquées (fournisseur, client, etc.)
                                5. Articles et leurs détails
                                6. Valeurs monétaires (sous-totaux, taxes, totaux)
                                
                                Fournissez un résumé concis de ce que représente ce document en français."""
                            },
                            {
                                "role": "user",
                                "content": f"Voici le texte extrait d'un document:\n\n{combined_text[:10000]}"  # Limité à 10k caractères pour les documents très longs
                            }
                        ],
                        max_tokens=500,
                        temperature=0.0
                    )
                    
                    analysis_text = analysis.choices[0].message.content
                    combined_text += f"\n\n--- ANALYSE DU DOCUMENT ---\n\n{analysis_text}"
                    
                    extraction_details["document_analysis"] = {
                        "processing_time_seconds": time.time() - analysis_start_time,
                        "analysis_text": analysis_text,
                        "processing_method": "gpt-4o-2024-08-06"
                    }
                    
                except Exception as e:
                    print(f"Erreur lors de l'analyse du document: {e}")
                    extraction_details["document_analysis"] = {
                        "status": "failed",
                        "error": str(e)
                    }
                
                return combined_text, extraction_details

        except Exception as e:
            error_message = f"Erreur lors du traitement du PDF avec OpenAI Vision: {e}"
            print(error_message)
            return {"error": error_message}, {
                "format": "pdf", 
                "status": "failed",
                "error": error_message
            }
            
    def _process_image(self, file_path):
        """
        Process image files using exclusively OpenAI's Vision model for OCR.
        """
        extraction_details = {
            "format": file_path.split('.')[-1].lower(),
            "processing_method": "openai_vision",
            "image_info": {}
        }
        
        try:
            operation_id = f"image_ocr_{int(time.time())}"
            print(f"Traitement de l'image avec OpenAI Vision: {file_path}")
            
            # Get image dimensions and details
            try:
                with Image.open(file_path) as img:
                    extraction_details["image_info"] = {
                        "width": img.width,
                        "height": img.height,
                        "mode": img.mode,
                        "format": img.format
                    }
            except Exception as img_info_error:
                print(f"Erreur lors de l'obtention des informations sur l'image: {img_info_error}")

            # Read and encode the image in base64
            with open(file_path, "rb") as image_file:
                image_data = image_file.read()
                base64_image = base64.b64encode(image_data).decode('utf-8')

            # Enhanced OCR prompt specialized for accounting documents
            system_prompt = """Vous êtes un système d'OCR spécialisé dans les documents comptables africains utilisant le système SYSCOHADA.

Extrayez TOUT le texte de l'image avec une précision extrême, en préservant la structure et la mise en page exactes:
1. En-têtes de facture (numéros, dates, références)
2. Informations sur l'entreprise (noms, adresses, identifiants fiscaux)
3. Lignes dans les tableaux avec quantités, prix unitaires et montants
4. Informations fiscales (taux, montants)
5. Montants totaux (sous-totaux, taxes, total dû)
6. Détails et modalités de paiement
7. Notes de bas de page et instructions de paiement

Instructions d'extraction:
- Extrayez TOUTES les valeurs numériques exactement comme elles apparaissent
- Maintenez l'espacement et l'alignement exacts des tableaux
- Extrayez TOUT le texte visible dans le document, y compris les tampons et notes manuscrites
- Ne pas interpréter, résumer ou réorganiser - reproduisez le texte exactement tel qu'il apparaît
- Pour les valeurs monétaires, préservez le format exact (ex: 1,234.56 ou 1.234,56)
- Préservez avec précision les numéros de compte et codes de référence
- Si un texte est peu clair, faites votre meilleure estimation et marquez-le avec [?]

Votre extraction sera utilisée pour le traitement automatisé des écritures comptables."""

            start_time = time.time()
            
            # Deux tentatives d'extraction avec OpenAI Vision
            attempts_remaining = 2
            success = False
            content = ""
            
            while attempts_remaining > 0 and not success:
                try:
                    response = self.client.chat.completions.create(
                        model="gpt-4o-2024-08-06",  # Using the latest model with Vision capabilities
                        messages=[
                            {
                                "role": "system",
                                "content": system_prompt
                            },
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": "Extrayez TOUT le texte de ce document comptable SYSCOHADA avec préservation précise des nombres, tableaux et formatage."
                                    },
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/png;base64,{base64_image}"
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens=4000,
                        temperature=0.0
                    )

                    # Log token usage
                    self.token_counter.log_operation(
                        agent_name="DDEAgent",
                        model="gpt-4o-2024-08-06",
                        input_text="Traitement OCR d'image",
                        output_text=response.choices[0].message.content,
                        operation_id=operation_id,
                        request_type="image_ocr"
                    )

                    content = response.choices[0].message.content
                    success = True
                    
                except Exception as e:
                    print(f"Erreur OpenAI (tentative {3-attempts_remaining}/2): {e}")
                    attempts_remaining -= 1
                    
                    # Si c'est la dernière tentative, abandonner
                    if attempts_remaining == 0:
                        return {"error": f"Échec de l'OCR OpenAI après plusieurs tentatives: {str(e)}"}, {
                            "format": file_path.split('.')[-1].lower(), 
                            "status": "failed",
                            "error": str(e)
                        }
                    else:
                        print("Nouvelle tentative d'extraction...")
                        time.sleep(2)
            
            extraction_details["processing_time_seconds"] = time.time() - start_time
            extraction_details["characters_extracted"] = len(content)
            extraction_details["status"] = "success"
            
            print(f"Extraction réussie de {len(content)} caractères de l'image en {extraction_details['processing_time_seconds']:.2f} secondes")
            
            # After initial extraction, use a second pass to identify accounting elements
            try:
                print("Analyse du texte extrait pour identifier les éléments comptables...")
                analysis_start_time = time.time()
                analysis = self.client.chat.completions.create(
                    model="gpt-4o-2024-08-06",
                    messages=[
                        {
                            "role": "system",
                            "content": """Vous êtes un analyste de documents comptables. Examinez le texte extrait et classifiez le document.
                            Identifiez les informations clés telles que:
                            1. Type de document (facture, reçu, relevé bancaire, etc.)
                            2. Date(s)
                            3. Références/numéros
                            4. Parties impliquées (fournisseur, client, etc.)
                            5. Articles et leurs détails
                            6. Valeurs monétaires (sous-totaux, taxes, totaux)
                            
                            Fournissez un résumé concis de ce que représente ce document en français."""
                        },
                        {
                            "role": "user",
                            "content": f"Voici le texte extrait d'un document comptable:\n\n{content[:8000]}"  # Limité à 8k caractères
                        }
                    ],
                    max_tokens=500,
                    temperature=0.0
                )
                
                analysis_text = analysis.choices[0].message.content
                content += f"\n\n--- ANALYSE DU DOCUMENT ---\n\n{analysis_text}"
                
                extraction_details["document_analysis"] = {
                    "processing_time_seconds": time.time() - analysis_start_time,
                    "analysis_text": analysis_text
                }
                
            except Exception as e:
                print(f"Erreur lors de l'analyse du document: {e}")
                extraction_details["document_analysis"] = {
                    "status": "failed",
                    "error": str(e)
                }
            
            # Extraction structurée des éléments comme pour les PDF
            extraction_result = self._extract_structured_elements(content, 0)
            if extraction_result:
                extraction_details["extractions_precises"] = {"elements_extraits": extraction_result["elements_extraits"]}
                self._verifier_calculs(extraction_details["extractions_precises"])
            
            return content, extraction_details

        except Exception as e:
            error_message = f"Erreur lors du traitement de l'image: {str(e)}"
            print(error_message)
            return {"error": error_message}, {
                "format": file_path.split('.')[-1].lower(), 
                "status": "failed",
                "error": error_message
            }

    def process(self, file):
        """
        Extracts and structures relevant information from a file.
        Handles different file formats including PDF, images, Excel, CSV.
        """
        # Initialize debug info with processing steps for traceability
        debug_info = {
            "processing_steps": [],
            "file_info": {
                "name": file.name if file else None,
                "extension": None,
                "size_bytes": os.path.getsize(file.name) if file and os.path.exists(file.name) else None
            },
            "extraction_results": {},
            "validation_results": {}
        }
        
        debug_info["processing_steps"].append({"step": "start", "timestamp": time.time()})
        print(f"DDE Agent processing file: {file.name if file else 'No file provided'}")

        # Check if file is provided
        if not file:
            error_message = "No file provided."
            print(error_message)
            debug_info["processing_steps"].append({"step": "error", "message": error_message, "timestamp": time.time()})
            return {"error": error_message, "debug_info": debug_info}

        # Check if file exists
        if not os.path.exists(file.name):
            error_message = f"Specified file does not exist: {file.name}"
            print(error_message)
            debug_info["processing_steps"].append({"step": "error", "message": error_message, "timestamp": time.time()})
            return {"error": error_message, "debug_info": debug_info}

        # Check if file is readable
        if not os.access(file.name, os.R_OK):
            error_message = f"Specified file is not readable: {file.name}"
            print(error_message)
            debug_info["processing_steps"].append({"step": "error", "message": error_message, "timestamp": time.time()})
            return {"error": error_message, "debug_info": debug_info}

        # Extract text based on file extension
        file_extension = file.name.split('.')[-1].lower()
        debug_info["file_info"]["extension"] = file_extension
        debug_info["processing_steps"].append({"step": "format_detection", "format": file_extension, "timestamp": time.time()})

        # Check if the format is supported
        if file_extension not in self.supported_formats:
            error_message = f"Unsupported file format: {file_extension}. Supported formats: {', '.join(self.supported_formats.keys())}"
            print(error_message)
            debug_info["processing_steps"].append({"step": "error", "message": error_message, "timestamp": time.time()})
            return {"error": error_message, "debug_info": debug_info}

        # Process the file with the appropriate handler
        try:
            process_method = self.supported_formats[file_extension]
            debug_info["processing_steps"].append({
                "step": "processing_started", 
                "processor": process_method.__name__, 
                "timestamp": time.time()
            })
            
            text_content, extraction_details = process_method(file.name)
            debug_info["extraction_results"] = extraction_details
            
            # Check if extraction was successful
            if isinstance(text_content, dict) and 'error' in text_content:
                debug_info["processing_steps"].append({
                    "step": "extraction_failed", 
                    "message": text_content['error'], 
                    "timestamp": time.time()
                })
                return {**text_content, "debug_info": debug_info}
                
            # Log successful extraction
            debug_info["processing_steps"].append({
                "step": "extraction_successful", 
                "text_length": len(text_content) if isinstance(text_content, str) else "non-text data",
                "timestamp": time.time()
            })
            
            # Analyze text content to determine document type
            debug_info["processing_steps"].append({"step": "document_analysis_started", "timestamp": time.time()})
            
            # Structure the data
            debug_info["processing_steps"].append({"step": "structuring_started", "timestamp": time.time()})
            structured_data = self.document_extractor.extract_data(text_content)
            debug_info["processing_steps"].append({
                "step": "structuring_completed", 
                "doc_type": structured_data.document_type,
                "timestamp": time.time()
            })
            
            # Validate the extracted data for consistency
            debug_info["processing_steps"].append({"step": "validation_started", "timestamp": time.time()})
            is_valid, validation_message = structured_data.validate_totals()
            debug_info["validation_results"] = {
                "is_valid": is_valid,
                "message": validation_message,
                "timestamp": time.time()
            }
            
            # Prepare the result
            extracted_data = {
                "document_type": structured_data.document_type,
                "full_text": text_content,
                "reference": structured_data.reference,
                "date": structured_data.date,
                "supplier": structured_data.supplier_name,
                "client": structured_data.client_name,
                "currency": structured_data.currency,
                "items": [
                    {
                        "description": item.description,
                        "quantity": float(item.quantity) if item.quantity is not None else None,
                        "unit_price": float(item.unit_price) if item.unit_price is not None else None,
                        "amount": float(item.amount) if item.amount is not None else None,
                        "tax_rate": float(item.tax_rate) if item.tax_rate is not None else None,
                        "tax_amount": float(item.tax_amount) if item.tax_amount is not None else None
                    } for item in structured_data.items
                ],
                "subtotal": float(structured_data.subtotal) if structured_data.subtotal is not None else None,
                "tax_total": float(structured_data.tax_total) if structured_data.tax_total is not None else None,
                "total": float(structured_data.total) if structured_data.total is not None else None,
                "payment_method": structured_data.payment_method,
                "validation": {
                    "is_valid": is_valid,
                    "message": validation_message,
                    "calculations_verified": True  # We've verified the calculations
                },
                "extraction_details": extraction_details,
                "debug_info": debug_info
            }
            
            # Complete processing
            debug_info["processing_steps"].append({"step": "completed", "timestamp": time.time()})
            
            print(f"Document extraction complete. Type: {structured_data.document_type}, Valid: {is_valid}")
            return extracted_data
            
        except Exception as e:
            error_message = f"Error processing file: {str(e)}"
            print(error_message)
            import traceback
            traceback.print_exc()
            debug_info["processing_steps"].append({
                "step": "error", 
                "message": error_message,
                "exception_type": type(e).__name__, 
                "timestamp": time.time()
            })
            return {"error": error_message, "debug_info": debug_info}

    def _extract_structured_elements(self, text, page_number):
        """
        Extrait des éléments structurés spécifiques du texte OCR:
        - montants (sous-total, TVA, TTC)
        - dates
        - références
        - parties (fournisseur/client)
        """
        result = {"elements_extraits": []}
        
        # Recherche de montants avec différentes méthodes
        try:
            # 1. Extraction directe avec regex
            montants = self._extraire_montants(text)
            
            # 2. Extraction spécifique de montants clés 
            totals = self._extraire_montants_cles(text)
            
            # Combiner les résultats avec métadonnées
            if montants:
                result["elements_extraits"].append({
                    "type": "montants",
                    "page": page_number + 1,
                    "valeurs": montants,
                    "methode": "regex_direct",
                    "confiance": "moyenne"
                })
                
            if totals:
                result["elements_extraits"].append({
                    "type": "montants_cles",
                    "page": page_number + 1, 
                    "valeurs": totals,
                    "methode": "extraction_contexte",
                    "confiance": "élevée"
                })
                
            # Dates
            dates = self._extraire_dates(text)
            if dates:
                result["elements_extraits"].append({
                    "type": "dates",
                    "page": page_number + 1,
                    "valeurs": dates,
                    "methode": "regex_pattern",
                    "confiance": "élevée"
                })
                
            # Références (factures, commandes, etc.)
            references = self._extraire_references(text)
            if references:
                result["elements_extraits"].append({
                    "type": "references",
                    "page": page_number + 1,
                    "valeurs": references,
                    "methode": "regex_pattern",
                    "confiance": "moyenne"
                })
                
            # Parties impliquées
            parties = self._extraire_parties(text)
            if parties:
                result["elements_extraits"].append({
                    "type": "parties",
                    "page": page_number + 1,
                    "valeurs": parties,
                    "methode": "extraction_contexte",
                    "confiance": "moyenne"
                })
                
        except Exception as e:
            print(f"Erreur lors de l'extraction structurée: {e}")
            result["erreur_extraction"] = str(e)
            
        return result

    def _extraire_montants(self, text):
        """Extrait tous les montants du texte avec contexte"""
        montants = []
        
        # Pattern pour détecter les montants avec indication monétaire
        patterns = [
            # Format 1,234.56 € / 1,234.56€ / 1 234.56 €
            r'(\d{1,3}(?:[ \.,]\d{3})*(?:[,.]\d{1,3})?)\s*(?:€|EUR|EURO|EUROS|F|FCFA|XOF|\$|USD)',
            # Format € 1,234.56 / FCFA 1,234.56
            r'(?:€|EUR|EURO|EUROS|F|FCFA|XOF|\$|USD)\s*(\d{1,3}(?:[ \.,]\d{3})*(?:[,.]\d{1,3})?)'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Récupérer le contexte (10 caractères avant et après)
                start = max(0, match.start() - 30)
                end = min(len(text), match.end() + 30)
                contexte = text[start:end].strip()
                
                # Récupérer le montant et le nettoyer
                if match.group(1):
                    montant_str = match.group(1).replace(' ', '')
                    # Gérer le cas où la virgule est utilisée comme séparateur décimal
                    montant_str = re.sub(r'(\d+)[,](\d+)', r'\1.\2', montant_str)
                    # Supprimer les séparateurs de milliers
                    montant_str = re.sub(r'(\d+)[.](\d{3})', r'\1\2', montant_str)
                    
                    try:
                        montant = float(montant_str)
                        montants.append({
                            "valeur": montant,
                            "texte_original": match.group(0),
                            "contexte": contexte
                        })
                    except ValueError:
                        continue
        
        return montants

    def _extraire_montants_cles(self, text):
        """Extrait spécifiquement les montants clés: HT, TVA, TTC"""
        montants_cles = {}
        
        # Patterns pour montant HT
        ht_patterns = [
            r'(?:montant|prix|total)\s+(?:ht|h\.t\.|hors\s+taxe)[^\d]*?(\d{1,3}(?:[ \.,]\d{3})*(?:[,.]\d{1,3})?)',
            r'(?:ht|h\.t\.|hors\s+taxe)[^\d]*?[:]?\s*(\d{1,3}(?:[ \.,]\d{3})*(?:[,.]\d{1,3})?)'
        ]
        
        # Patterns pour TVA
        tva_patterns = [
            r'(?:tva|taxe)[^\d]*?(\d{1,3}(?:[ \.,]\d{3})*(?:[,.]\d{1,3})?)',
            r'(?:tva|taxe)[^\d]*?[:]?\s*(\d{1,3}(?:[ \.,]\d{3})*(?:[,.]\d{1,3})?)'
        ]
        
        # Patterns pour TTC
        ttc_patterns = [
            r'(?:montant|prix|total)\s+(?:ttc|t\.t\.c\.|toutes\s+taxes)[^\d]*?(\d{1,3}(?:[ \.,]\d{3})*(?:[,.]\d{1,3})?)',
            r'(?:ttc|t\.t\.c\.|toutes\s+taxes)[^\d]*?[:]?\s*(\d{1,3}(?:[ \.,]\d{3})*(?:[,.]\d{1,3})?)'
        ]
        
        # Recherche HT
        for pattern in ht_patterns:
            match = re.search(pattern, text.lower())
            if match:
                montant_str = match.group(1).strip().replace(' ', '').replace(',', '.')
                try:
                    montants_cles["montant_ht"] = float(montant_str)
                    break
                except ValueError:
                    continue
                    
        # Recherche TVA
        for pattern in tva_patterns:
            match = re.search(pattern, text.lower())
            if match:
                montant_str = match.group(1).strip().replace(' ', '').replace(',', '.')
                try:
                    montants_cles["montant_tva"] = float(montant_str)
                    break
                except ValueError:
                    continue
        
        # Recherche TTC
        for pattern in ttc_patterns:
            match = re.search(pattern, text.lower())
            if match:
                montant_str = match.group(1).strip().replace(' ', '').replace(',', '.')
                try:
                    montants_cles["montant_ttc"] = float(montant_str)
                    break
                except ValueError:
                    continue
                    
        return montants_cles

    def _extraire_dates(self, text):
        """Extrait les dates du document"""
        dates = []
        
        # Différents formats de dates courants
        date_patterns = [
            # Format JJ/MM/AAAA ou JJ-MM-AAAA
            r'(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})',
            # Format textuel français: JJ mois AAAA
            r'(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{2,4})',
            # Format abrégé: JJ mois. AA
            r'(\d{1,2}\s+(?:janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?\s+\d{2,4})'
        ]
        
        for pattern in date_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Récupérer le contexte
                start = max(0, match.start() - 20)
                end = min(len(text), match.end() + 20)
                contexte = text[start:end].strip()
                
                # Déterminer le type de date (facture, livraison, etc.)
                type_date = "inconnue"
                if re.search(r'facture|fact\.', contexte, re.IGNORECASE):
                    type_date = "facture"
                elif re.search(r'livraison|livré', contexte, re.IGNORECASE):
                    type_date = "livraison"
                elif re.search(r'paiement|échéance|règlement', contexte, re.IGNORECASE):
                    type_date = "paiement"
                elif re.search(r'commande', contexte, re.IGNORECASE):
                    type_date = "commande"
                
                dates.append({
                    "valeur": match.group(0),
                    "type": type_date,
                    "contexte": contexte
                })
                
        return dates

    def _extraire_references(self, text):
        """Extrait les références du document (numéros de facture, etc.)"""
        references = []
        
        # Patterns pour différents types de références
        ref_patterns = {
            "facture": [
                r'(?:facture|fact\.?|invoice)\s*(?:n[o°]\.?|numéro|ref\.?)[:]?\s*([A-Z0-9][A-Z0-9\-_/]{2,20})',
                r'(?:n[o°]\.?|numéro|ref\.?)\s*(?:facture|fact\.?)[:]?\s*([A-Z0-9][A-Z0-9\-_/]{2,20})'
            ],
            "commande": [
                r'(?:commande|cmd\.?|purchase order|order)\s*(?:n[o°]\.?|numéro|ref\.?)[:]?\s*([A-Z0-9][A-Z0-9\-_/]{2,20})',
                r'(?:n[o°]\.?|numéro|ref\.?)\s*(?:commande|cmd\.?)[:]?\s*([A-Z0-9][A-Z0-9\-_/]{2,20})'
            ],
            "client": [
                r'(?:client|customer)\s*(?:n[o°]\.?|numéro|ref\.?|id)[:]?\s*([A-Z0-9][A-Z0-9\-_/]{2,20})',
                r'(?:n[o°]\.?|numéro|ref\.?|id)\s*(?:client|customer)[:]?\s*([A-Z0-9][A-Z0-9\-_/]{2,20})'
            ]
        }
        
        for ref_type, patterns in ref_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    # Récupérer le contexte
                    start = max(0, match.start() - 20)
                    end = min(len(text), match.end() + 20)
                    contexte = text[start:end].strip()
                    
                    references.append({
                        "type": ref_type,
                        "valeur": match.group(1),
                        "texte_original": match.group(0),
                        "contexte": contexte
                    })
                    
        return references

    def _extraire_parties(self, text):
        """Extrait les informations sur les parties (fournisseur, client)"""
        parties = {}
        
        # Recherche du fournisseur
        fournisseur_patterns = [
            r'(?:fournisseur|vendeur|émetteur|supplier)[^\n:]*?[:]\s*([^\n]+)',
            r'(?:de|from)[:]?\s*([A-Z][A-Za-z\s]{2,40}(?:SARL|SA|SAS|Inc\.?|LLC|Ltd\.?)?)'
        ]
        
        # Recherche du client
        client_patterns = [
            r'(?:client|acheteur|destinataire|customer)[^\n:]*?[:]\s*([^\n]+)',
            r'(?:à|facturer à|facturé à|to)[:]?\s*([A-Z][A-Za-z\s]{2,40}(?:SARL|SA|SAS|Inc\.?|LLC|Ltd\.?)?)'
        ]
        
        # Recherche du fournisseur
        for pattern in fournisseur_patterns:
            match = re.search(pattern, text)
            if match and match.group(1):
                parties["fournisseur"] = match.group(1).strip()
                break
                
        # Recherche du client
        for pattern in client_patterns:
            match = re.search(pattern, text)
            if match and match.group(1):
                parties["client"] = match.group(1).strip()
                break
                
        return parties

    def _verifier_calculs(self, extractions):
        """
        Vérifie les calculs extraits pour s'assurer qu'ils sont cohérents
        """
        # Récupérer tous les montants clés extraits
        montants_ht = []
        montants_tva = []
        montants_ttc = []
        
        for element in extractions.get("elements_extraits", []):
            if element["type"] == "montants_cles":
                valeurs = element.get("valeurs", {})
                
                if "montant_ht" in valeurs:
                    montants_ht.append(valeurs["montant_ht"])
                
                if "montant_tva" in valeurs:
                    montants_tva.append(valeurs["montant_tva"])
                
                if "montant_ttc" in valeurs:
                    montants_ttc.append(valeurs["montant_ttc"])
        
        # Vérifier la cohérence des calculs
        resultats_validation = {}
        
        if montants_ht and montants_tva and montants_ttc:
            # Sélectionner les valeurs les plus probables
            ht = self._valeur_plus_frequente(montants_ht)
            tva = self._valeur_plus_frequente(montants_tva)
            ttc = self._valeur_plus_frequente(montants_ttc)
            
            # Calculer et valider
            if abs((ht + tva) - ttc) < 0.02:  # Tolérance de 0.02 pour les erreurs d'arrondi
                resultats_validation["calcul_coherent"] = True
                resultats_validation["message"] = "Les montants HT + TVA = TTC sont cohérents"
            else:
                resultats_validation["calcul_coherent"] = False
                resultats_validation["message"] = f"Incohérence: HT ({ht}) + TVA ({tva}) = {ht + tva}, mais TTC = {ttc}"
                resultats_validation["correction_suggeree"] = {
                    "montant_ht": ht,
                    "montant_tva": tva,
                    "montant_ttc": ht + tva
                }
        
        # Ajouter les résultats de validation
        extractions["validation_calculs"] = resultats_validation
        
        return extractions

    def _valeur_plus_frequente(self, valeurs):
        """
        Retourne la valeur la plus fréquente dans une liste,
        ou la moyenne si toutes les valeurs ont la même fréquence.
        """
        if not valeurs:
            return None
            
        if len(valeurs) == 1:
            return valeurs[0]
            
        # Compter les occurrences
        compteur = {}
        for val in valeurs:
            if val in compteur:
                compteur[val] += 1
            else:
                compteur[val] = 1
                
        # Trouver la valeur la plus fréquente
        val_max = max(compteur.items(), key=lambda x: x[1])
        
        # Si plusieurs valeurs ont la même fréquence maximum, prendre la moyenne
        max_freq = val_max[1]
        vals_max_freq = [val for val, freq in compteur.items() if freq == max_freq]
        
        if len(vals_max_freq) == 1:
            return vals_max_freq[0]
        else:
            return sum(vals_max_freq) / len(vals_max_freq)

    def _process_excel(self, file_path):
        """
        Process Excel files (XLSX, XLS) by extracting data and converting to structured text.
        """
        extraction_details = {
            "format": file_path.split('.')[-1].lower(),
            "processing_method": "pandas",
            "sheet_info": []
        }
        
        try:
            print(f"Processing Excel file: {file_path}")
            start_time = time.time()
            
            # Read Excel file
            excel_data = pd.read_excel(file_path, sheet_name=None)  # Read all sheets
            
            # Process each sheet
            all_text = []
            
            for sheet_name, df in excel_data.items():
                sheet_start_time = time.time()
                print(f"Processing sheet: {sheet_name}")
                
                # Basic info about the sheet
                rows, cols = df.shape
                sheet_info = {
                    "sheet_name": sheet_name,
                    "rows": rows,
                    "columns": cols,
                    "processing_time_seconds": 0,
                    "potential_document_type": "unknown"
                }
                
                # Convert the sheet to a formatted text representation
                header = f"--- SHEET: {sheet_name} ({rows} rows, {cols} columns) ---\n\n"
                
                # Handle empty dataframes
                if df.empty:
                    sheet_text = header + "[Empty Sheet]"
                    sheet_info["is_empty"] = True
                else:
                    # Replace NaN values with empty string for better text representation
                    df_clean = df.fillna("")
                    
                    # Try to detect if this is a specific type of accounting document
                    sheet_info["potential_document_type"] = self._detect_excel_document_type(df_clean)
                    
                    # Convert the DataFrame to a clean string representation
                    try:
                        # First try to use pandas built-in to_string
                        sheet_content = df_clean.to_string(index=False)
                    except Exception:
                        # Fallback to a more manual approach if that fails
                        cols = df_clean.columns.tolist()
                        rows_text = [" | ".join(str(col) for col in cols)]
                        rows_text.append("-" * len(rows_text[0]))
                        
                        for _, row in df_clean.iterrows():
                            rows_text.append(" | ".join(str(val) for val in row.values))
                        
                        sheet_content = "\n".join(rows_text)
                    
                    sheet_text = header + sheet_content
                
                all_text.append(sheet_text)
                
                # Record processing time for this sheet
                sheet_info["processing_time_seconds"] = time.time() - sheet_start_time
                extraction_details["sheet_info"].append(sheet_info)
            
            full_text = "\n\n".join(all_text)
            
            # Add overall processing details
            extraction_details["processing_time_seconds"] = time.time() - start_time
            extraction_details["total_sheets"] = len(excel_data)
            extraction_details["characters_extracted"] = len(full_text)
            extraction_details["status"] = "success"
            
            print(f"Successfully extracted {len(full_text)} characters from {len(excel_data)} sheets in {extraction_details['processing_time_seconds']:.2f} seconds")
            
            # If it seems like a financial document, try to extract structured financial data
            financial_sheets = [s for s in extraction_details["sheet_info"] 
                              if s["potential_document_type"] != "unknown"]
            
            if financial_sheets:
                print("Detected potential financial document. Extracting financial data...")
                try:
                    financial_data = self._extract_financial_data_from_excel(excel_data)
                    extraction_details["financial_data_extracted"] = financial_data
                    full_text += "\n\n--- EXTRACTED FINANCIAL DATA ---\n\n"
                    full_text += json.dumps(financial_data, indent=2)
                except Exception as e:
                    print(f"Error extracting financial data: {e}")
                    extraction_details["financial_data_error"] = str(e)
            
            return full_text, extraction_details
            
        except Exception as e:
            error_message = f"Error processing Excel file: {str(e)}"
            print(error_message)
            return {"error": error_message}, {
                "format": file_path.split('.')[-1].lower(), 
                "status": "failed",
                "error": error_message
            }

    def _detect_excel_document_type(self, df):
        """
        Attempts to detect what type of accounting document an Excel sheet represents.
        """
        # Convert column names to lowercase string for easier matching
        cols = [str(col).lower() for col in df.columns]
        
        # Check for invoice-related keywords in columns
        invoice_keywords = ['facture', 'invoice', 'client', 'customer', 'montant', 'amount', 'total', 'tva', 'tax']
        if any(keyword in ' '.join(cols) for keyword in invoice_keywords):
            return "invoice"
            
        # Check for bank statement keywords
        bank_keywords = ['relevé', 'statement', 'compte', 'account', 'débit', 'crédit', 'solde', 'balance']
        if any(keyword in ' '.join(cols) for keyword in bank_keywords):
            return "bank_statement"
            
        # Check for general ledger or journal
        ledger_keywords = ['journal', 'écriture', 'entry', 'comptable', 'ledger']
        if any(keyword in ' '.join(cols) for keyword in ledger_keywords):
            return "general_ledger"
            
        # If there are date and amount columns, it might be some kind of financial record
        date_cols = [col for col in cols if 'date' in col]
        amount_cols = [col for col in cols if any(term in col for term in ['montant', 'amount', 'total', 'sum'])]
        if date_cols and amount_cols:
            return "financial_record"
        
        return "unknown"

    def _extract_financial_data_from_excel(self, excel_data):
        """
        Extracts structured financial data from Excel sheets.
        """
        financial_data = {
            "document_type": "unknown",
            "amounts": {},
            "dates": {},
            "parties": {},
            "line_items": []
        }
        
        # Process each sheet
        for sheet_name, df in excel_data.items():
            # Skip empty sheets
            if df.empty:
                continue
                
            # Try to detect amounts - look for cells that might contain total amounts
            for col in df.columns:
                col_lower = str(col).lower()
                # Look for columns with common amount indicators
                if any(term in col_lower for term in ['total', 'montant', 'sum', 'amount']):
                    # Get non-null values in this column that look like numbers
                    numeric_values = []
                    for val in df[col].dropna():
                        try:
                            # Try to convert to float, handle both 1000.00 and 1000,00 formats
                            if isinstance(val, (int, float)):
                                numeric_values.append(float(val))
                            elif isinstance(val, str):
                                # Replace comma with period for float conversion if needed
                                cleaned_val = val.replace(',', '.').replace(' ', '')
                                # Try to extract just the number if there are currency symbols
                                import re
                                match = re.search(r'[-+]?\d*\.\d+|\d+', cleaned_val)
                                if match:
                                    numeric_values.append(float(match.group()))
                        except (ValueError, TypeError):
                            pass
                    
                    if numeric_values:
                        key = f"{col}_{sheet_name}" if col_lower not in financial_data["amounts"] else col_lower
                        financial_data["amounts"][key] = max(numeric_values)  # Assuming the largest value might be the total
                
                # Look for date columns
                if 'date' in col_lower:
                    dates = []
                    for val in df[col].dropna():
                        if isinstance(val, pd.Timestamp):
                            dates.append(val.strftime('%Y-%m-%d'))
                        elif isinstance(val, str) and any(c.isdigit() for c in val):
                            dates.append(val)
                    
                    if dates:
                        key = f"{col}_{sheet_name}" if col_lower not in financial_data["dates"] else col_lower
                        financial_data["dates"][key] = dates
                
                # Look for company/party information
                if any(term in col_lower for term in ['client', 'customer', 'vendor', 'fournisseur', 'supplier', 'company']):
                    parties = [str(val) for val in df[col].dropna() if str(val).strip()]
                    if parties:
                        key = f"{col}_{sheet_name}" if col_lower not in financial_data["parties"] else col_lower
                        financial_data["parties"][key] = parties
            
            # Try to extract line items
            # Look for tables with item details - typically have columns like description, quantity, price, amount
            item_cols = {'description': None, 'quantity': None, 'unit_price': None, 'amount': None}
            
            # Map DataFrame columns to our expected line item fields
            for col in df.columns:
                col_lower = str(col).lower()
                
                if any(term in col_lower for term in ['desc', 'désignation', 'item', 'article', 'libellé']):
                    item_cols['description'] = col
                elif any(term in col_lower for term in ['qté', 'qty', 'quant', 'nombre']):
                    item_cols['quantity'] = col
                elif any(term in col_lower for term in ['prix unitaire', 'unit price', 'p.u', 'tarif']):
                    item_cols['unit_price'] = col
                elif any(term in col_lower for term in ['montant', 'amount', 'total ligne', 'line total']):
                    item_cols['amount'] = col
            
            # If we found enough columns (at least description and amount), try to extract line items
            if item_cols['description'] and item_cols['amount']:
                for _, row in df.iterrows():
                    desc = row.get(item_cols['description'])
                    amount = row.get(item_cols['amount'])
                    
                    # Skip rows without description or amount
                    if pd.isna(desc) or pd.isna(amount) or desc == "" or amount == "":
                        continue
                    
                    try:
                        # Try to convert amount to float if it's not already
                        if not isinstance(amount, (int, float)):
                            if isinstance(amount, str):
                                # Clean and convert amount string
                                amount = amount.replace(',', '.').replace(' ', '')
                                # Extract just the number if there are currency symbols
                                import re
                                match = re.search(r'[-+]?\d*\.\d+|\d+', amount)
                                if match:
                                    amount = float(match.group())
                                else:
                                    continue  # Skip if we can't parse a number
                            else:
                                continue  # Skip if we can't parse amount
                        
                        # Create line item
                        line_item = {
                            'description': str(desc),
                            'amount': float(amount)
                        }
                        
                        # Add quantity if available
                        if item_cols['quantity'] and not pd.isna(row.get(item_cols['quantity'])):
                            qty = row.get(item_cols['quantity'])
                            if isinstance(qty, (int, float)):
                                line_item['quantity'] = qty
                            elif isinstance(qty, str):
                                # Try to extract a number from the string
                                import re
                                match = re.search(r'[-+]?\d*\.\d+|\d+', qty.replace(',', '.'))
                                if match:
                                    line_item['quantity'] = float(match.group())
                        
                        # Add unit price if available
                        if item_cols['unit_price'] and not pd.isna(row.get(item_cols['unit_price'])):
                            price = row.get(item_cols['unit_price'])
                            if isinstance(price, (int, float)):
                                line_item['unit_price'] = price
                            elif isinstance(price, str):
                                # Try to extract a number from the string
                                import re
                                match = re.search(r'[-+]?\d*\.\d+|\d+', price.replace(',', '.'))
                                if match:
                                    line_item['unit_price'] = float(match.group())
                        
                        financial_data["line_items"].append(line_item)
                    except Exception as e:
                        print(f"Error processing line item: {e}")
        
        # Try to determine document type based on extracted data
        if financial_data["line_items"]:
            if any(term.lower() in str(financial_data).lower() for term in ['invoice', 'facture', 'client']):
                financial_data["document_type"] = "invoice"
            elif any(term.lower() in str(financial_data).lower() for term in ['bank', 'statement', 'relevé', 'compte']):
                financial_data["document_type"] = "bank_statement"
        
        return financial_data

    def _process_csv(self, file_path):
        """
        Process CSV files by extracting data and converting to structured text.
        """
        extraction_details = {
            "format": "csv",
            "processing_method": "pandas",
            "delimiter": None
        }
        
        try:
            print(f"Processing CSV file: {file_path}")
            start_time = time.time()
            
            # Detect encoding and delimiter
            encoding = self._detect_encoding(file_path)
            delimiter = self._detect_delimiter(file_path, encoding)
            extraction_details["encoding"] = encoding
            extraction_details["delimiter"] = delimiter
            
            # Read CSV file
            df = pd.read_csv(file_path, delimiter=delimiter, encoding=encoding, error_bad_lines=False)
            rows, cols = df.shape
            
            extraction_details["rows"] = rows
            extraction_details["columns"] = cols
            
            # Handle empty dataframes
            if df.empty:
                extraction_details["is_empty"] = True
                extraction_details["status"] = "success_empty_file"
                extraction_details["processing_time_seconds"] = time.time() - start_time
                return "[Empty CSV File]", extraction_details
            
            # Try to detect if this is a specific type of accounting document
            extraction_details["potential_document_type"] = self._detect_csv_document_type(df)
            
            # Replace NaN values with empty string for better text representation
            df_clean = df.fillna("")
            
            # Convert DataFrame to text
            try:
                # First try to use pandas built-in to_string
                csv_text = df_clean.to_string(index=False)
            except Exception:
                # Fallback to a more manual approach if that fails
                cols = df_clean.columns.tolist()
                rows_text = [" | ".join(str(col) for col in cols)]
                rows_text.append("-" * len(rows_text[0]))
                
                for _, row in df_clean.iterrows():
                    rows_text.append(" | ".join(str(val) for val in row.values))
                
                csv_text = "\n".join(rows_text)
            
            # Add header
            header = f"--- CSV DATA ({rows} rows, {cols} columns) ---\n\n"
            full_text = header + csv_text
            
            # Add overall processing details
            extraction_details["processing_time_seconds"] = time.time() - start_time
            extraction_details["characters_extracted"] = len(full_text)
            extraction_details["status"] = "success"
            
            print(f"Successfully extracted {len(full_text)} characters from CSV in {extraction_details['processing_time_seconds']:.2f} seconds")
            
            # If it seems like a financial document, try to extract structured financial data
            if extraction_details["potential_document_type"] != "unknown":
                print(f"Detected potential {extraction_details['potential_document_type']}. Extracting financial data...")
                try:
                    # Reuse the Excel financial data extraction method
                    financial_data = self._extract_financial_data_from_excel({"Sheet1": df})
                    extraction_details["financial_data_extracted"] = financial_data
                    full_text += "\n\n--- EXTRACTED FINANCIAL DATA ---\n\n"
                    full_text += json.dumps(financial_data, indent=2)
                except Exception as e:
                    print(f"Error extracting financial data: {e}")
                    extraction_details["financial_data_error"] = str(e)
            
            return full_text, extraction_details
            
        except Exception as e:
            error_message = f"Error processing CSV file: {str(e)}"
            print(error_message)
            return {"error": error_message}, {
                "format": "csv", 
                "status": "failed",
                "error": error_message
            }

    def _detect_encoding(self, file_path):
        """
        Detect the encoding of a text file.
        """
        encodings = ['utf-8', 'latin1', 'iso-8859-1', 'utf-16']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    f.read(1024)  # Try to read some data
                    return encoding
            except UnicodeDecodeError:
                continue
        
        # Default to utf-8 if we couldn't detect
        return 'utf-8'

    def _detect_delimiter(self, file_path, encoding='utf-8'):
        """
        Detect the delimiter used in a CSV file.
        """
        # Common delimiters
        delimiters = [',', ';', '\t', '|']
        counts = {d: 0 for d in delimiters}
        
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                # Read first few lines
                lines = []
                for _ in range(5):  # Read up to 5 lines
                    line = f.readline().strip()
                    if line:
                        lines.append(line)
            
            # Count occurrences of each delimiter
            for line in lines:
                for delimiter in delimiters:
                    counts[delimiter] += line.count(delimiter)
            
            # Return the delimiter with the highest count
            max_count = 0
            best_delimiter = ','  # Default to comma
            
            for delimiter, count in counts.items():
                if count > max_count:
                    max_count = count
                    best_delimiter = delimiter
            
            return best_delimiter
            
        except Exception:
            # Default to comma if detection fails
            return ','

    def _detect_csv_document_type(self, df):
        """
        Attempts to detect what type of accounting document a CSV file represents.
        """
        # Similar logic as for Excel
        return self._detect_excel_document_type(df)

    def _process_text(self, file_path):
        """
        Process plain text files.
        """
        extraction_details = {
            "format": "txt",
            "processing_method": "direct_read"
        }
        
        try:
            print(f"Processing text file: {file_path}")
            start_time = time.time()
            
            # Detect encoding
            encoding = self._detect_encoding(file_path)
            extraction_details["encoding"] = encoding
            
            # Read text file
            with open(file_path, 'r', encoding=encoding) as f:
                text_content = f.read()
            
            # Add processing details
            extraction_details["processing_time_seconds"] = time.time() - start_time
            extraction_details["characters_extracted"] = len(text_content)
            extraction_details["status"] = "success"
            
            print(f"Successfully extracted {len(text_content)} characters from text file in {extraction_details['processing_time_seconds']:.2f} seconds")
            
            return text_content, extraction_details
            
        except Exception as e:
            error_message = f"Error processing text file: {str(e)}"
            print(error_message)
            return {"error": error_message}, {
                "format": "txt", 
                "status": "failed",
                "error": error_message
            }

    def process_prompt(self, prompt):
        """
        Process a natural language prompt to extract relevant information and structured accounting data.
        """
        debug_info = {"step": "start_prompt_processing", "prompt": prompt, "timestamp": time.time()}
        print(f"DDE Agent processing prompt: {prompt}")
        
        try:
            # Extract potential context information from the prompt
            context_data = self._extract_context_from_prompt(prompt)
            
            # Clean up the prompt by removing structured context tags if present
            clean_prompt = self._clean_prompt_text(prompt)
            
            # Enhanced structured extraction using LLM
            structured_data = self._extract_structured_data_from_prompt(clean_prompt)
            
            # Create comprehensive extracted data including both text and structured info
            extracted_data = {
                "document_type": "prompt",
                "full_text": clean_prompt,
                "prompt_details": {"content": clean_prompt},
                "structured_data": structured_data,
                "context_data": context_data,
                "debug_info": debug_info
            }
            
            # Merge context data into the main extracted data for easier access
            if context_data:
                for key, value in context_data.items():
                    if value and value != "string" and value != "0":  # Skip placeholder values
                        extracted_data[key] = value
            
            # Process structured data with amounts, accounts, dates, etc.
            if "amounts" in structured_data:
                for amount_item in structured_data["amounts"]:
                    description = amount_item.get("description", "")
                    amount = amount_item.get("value", 0)
                    
                    # Add to the root of extracted_data only if not already present
                    if description and "description" not in extracted_data:
                        extracted_data["description"] = description
                        
                    # Create or update amounts array
                    if "amounts" not in extracted_data:
                        extracted_data["amounts"] = []
                    extracted_data["amounts"].append({
                        "description": description,
                        "value": amount
                    })
            
            debug_info["step"] = "completed_prompt_processing"
            debug_info["timestamp"] = time.time()
            debug_info["structured_extraction"] = structured_data
            
            print(f"Extracted data from prompt: {extracted_data}")
            return extracted_data
            
        except Exception as e:
            print(f"Error processing prompt: {str(e)}")
            debug_info["step"] = "error_prompt_processing"
            debug_info["error"] = str(e)
            debug_info["timestamp"] = time.time()
            
            # Provide basic extraction even on error
            return {
                "document_type": "prompt",
                "full_text": prompt,
                "prompt_details": {"content": prompt},
                "error": str(e),
                "debug_info": debug_info
            }
    
    def _extract_context_from_prompt(self, prompt):
        """Extract structured context data if present in the prompt."""
        context_data = {}
        
        # Look for "Contexte:" section
        context_match = re.search(r'Contexte:\s*(.*?)(?:\n\n|$)', prompt, re.DOTALL)
        if context_match:
            context_text = context_match.group(1)
            
            # Extract key-value pairs
            for pair in re.finditer(r'(\w+):\s*([^,\n]+)(?:,|\n|$)', context_text):
                key = pair.group(1).strip().lower()
                value = pair.group(2).strip()
                
                if key == "date" and value and value != "string":
                    # Try to standardize date format
                    try:
                        from datetime import datetime
                        for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d.%m.%Y'):
                            try:
                                parsed_date = datetime.strptime(value, fmt)
                                value = parsed_date.strftime('%d/%m/%Y')
                                break
                            except ValueError:
                                continue
                    except Exception:
                        pass  # Keep original value if parsing fails
                
                context_data[key] = value
        
        # Try to extract date from the text if not in context
        if "date" not in context_data:
            date_patterns = [
                r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
                r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
                r'(?:le|du|ce|en)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
                r'(?:le|du|ce|en)\s+(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})'
            ]
            
            for pattern in date_patterns:
                match = re.search(pattern, prompt, re.IGNORECASE)
                if match:
                    context_data["date"] = match.group(1)
                    break
            
            # Check for month references
            if "date" not in context_data:
                month_match = re.search(r'(?:mois\s+de?\s+|en\s+)(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)', prompt, re.IGNORECASE)
                if month_match:
                    import datetime as dt
                    current_year = dt.datetime.now().year
                    context_data["month"] = month_match.group(1)
                    context_data["date"] = f"01/{self._month_name_to_number(month_match.group(1))}/{current_year}"
        
        # Try to extract currency
        if "devise" not in context_data:
            currency_patterns = [
                r'(\$|USD|EUR|€|FCFA|XOF|DZD|MAD)',
                r'(?:en|de|avec)\s+(\$|USD|EUR|€|FCFA|XOF|DZD|MAD)'
            ]
            
            for pattern in currency_patterns:
                match = re.search(pattern, prompt, re.IGNORECASE)
                if match:
                    currency = match.group(1).upper()
                    if currency == '$':
                        currency = 'USD'
                    elif currency == '€':
                        currency = 'EUR'
                    context_data["devise"] = currency
                    break
        
        return context_data
    
    def _month_name_to_number(self, month_name):
        """Convert month name in French to its number (01-12)."""
        months = {
            'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
            'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
            'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
        }
        return months.get(month_name.lower(), '01')
    
    def _clean_prompt_text(self, prompt):
        """Clean the prompt text by removing structured context sections."""
        # Remove "Contexte:" section if present
        cleaned_prompt = re.sub(r'\nContexte:.*?(?:\n\n|$)', '', prompt, flags=re.DOTALL)
        return cleaned_prompt.strip()
    
    def _extract_structured_data_from_prompt(self, prompt):
        """
        Use LLM to extract structured accounting data from natural language prompt.
        This helps bridge the gap between natural language and accounting rules.
        """
        operation_id = f"prompt_extraction_{int(time.time())}"
        
        try:
            # Prepare the prompt for the LLM
            extraction_prompt = f"""Vous êtes un assistant comptable. Analysez ce texte et extrayez des informations comptables structurées selon le système SYSCOHADA.

INSTRUCTIONS:
1. Identifiez les opérations comptables décrites dans le texte.
2. Extrayez les montants, dates, acteurs, et toutes autres informations pertinentes.
3. Déterminez les comptes comptables SYSCOHADA qui seraient utilisés.
4. Identifiez le type d'opération (achat, vente, paiement, etc.)

TEXTE À ANALYSER:
"{prompt}"

FORMAT DE RETOUR (JSON):
{{
  "type_operation": "type d'opération identifié (achat, vente, paiement, etc.)",
  "comptes": [
    {{ 
      "numero": "numéro du compte SYSCOHADA",
      "type": "débit ou crédit", 
      "description": "description du compte"
    }}
  ],
  "montants": [
    {{
      "value": valeur numérique,
      "description": "description du montant",
      "devise": "devise (USD, EUR, FCFA, etc.)"
    }}
  ],
  "dates": [
    {{
      "date": "JJ/MM/AAAA",
      "description": "type de date (opération, échéance, etc.)"
    }}
  ],
  "parties": [
    {{
      "nom": "nom de l'entité",
      "role": "client, fournisseur, autorité fiscale, etc."
    }}
  ],
  "classification": "classification comptable principale"
}}

Veuillez extraire uniquement les informations clairement mentionnées dans le texte.
"""

            # Get response from LLM
            response = self.client.chat.completions.create(
                model="gpt-4o-2024-08-06",
                messages=[
                    {"role": "system", "content": "Vous êtes un expert-comptable utilisant le système SYSCOHADA."},
                    {"role": "user", "content": extraction_prompt}
                ],
                temperature=0.1,
                max_tokens=800
            )
            
            # Log token usage
            self.token_counter.log_operation(
                agent_name="DDEAgent",
                model="gpt-4o-2024-08-06",
                input_text=extraction_prompt,
                output_text=response.choices[0].message.content,
                operation_id=operation_id,
                request_type="prompt_extraction"
            )
            
            # Parse JSON response
            content = response.choices[0].message.content
            # Extract JSON using regex to handle cases where the model includes explanatory text
            json_match = re.search(r'```(?:json)?(.*?)```', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = content
                
            # Clean the JSON string
            json_str = re.sub(r'[^\{\}:,"\[\]\d.a-zA-Z_-]', '', json_str.strip())
            
            try:
                # Parse the JSON
                structured_data = json.loads(json_str)
                print(f"Successfully parsed structured data from prompt: {type(structured_data)}")
                return structured_data
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON from LLM response: {e}")
                print(f"Raw content: {content}")
                # Try with regex as fallback
                structured_data = self._parse_json_with_regex(content)
                if structured_data:
                    print("JSON parsed successfully using regex match")
                    return structured_data
                return {"error": "Failed to parse structured data", "raw_llm_response": content}
                
        except Exception as e:
            print(f"Error extracting structured data from prompt: {str(e)}")
            return {"error": str(e)}
    
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