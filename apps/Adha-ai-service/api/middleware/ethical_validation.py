"""
Middleware de Validation Éthique pour ADHA AI
==============================================

Ce middleware valide toutes les requêtes utilisateur AVANT traitement par les agents LLM.
Il détecte et bloque les tentatives de prompt injection, jeux de rôle, et autres violations éthiques.

Appliqué automatiquement sur tous les endpoints sensibles (chat, génération d'écritures, etc.)
"""

import logging
import json
from typing import Dict, Optional
from django.http import JsonResponse, HttpRequest
from django.utils.deprecation import MiddlewareMixin
from agents.core.adha_identity import ADHAIdentity, ADHAEthicalViolationType

logger = logging.getLogger(__name__)


class EthicalValidationMiddleware(MiddlewareMixin):
    """
    Middleware Django qui valide toutes les requêtes pour détecter les violations éthiques
    AVANT qu'elles ne soient traitées par les agents IA.
    """
    
    # Endpoints à surveiller (patterns qui nécessitent validation éthique)
    MONITORED_ENDPOINTS = [
        '/api/chat/',
        '/api/generate/',
        '/api/conversation/',
        '/api/journal-entries/generate',
        '/api/history/query',
        '/api/analysis/',
        '/api/dde/',  # Document Data Extraction
    ]
    
    # Endpoints exemptés de validation (authentification, santé, admin, etc.)
    EXEMPT_ENDPOINTS = [
        '/api/auth/',
        '/api/health/',
        '/api/swagger/',
        '/api/docs/',
        '/admin/',
        '/static/',
        '/media/',
    ]
    
    def __init__(self, get_response):
        super().__init__(get_response)
        self.get_response = get_response
        logger.info("EthicalValidationMiddleware initialized")
    
    def process_request(self, request: HttpRequest) -> Optional[JsonResponse]:
        """
        Valide la requête avant qu'elle ne soit traitée.
        Retourne une réponse d'erreur si violation éthique détectée, None sinon.
        """
        # Vérifier si l'endpoint nécessite validation
        if not self._should_validate_endpoint(request.path):
            return None
        
        # Extraire le contenu utilisateur de la requête
        user_content = self._extract_user_content(request)
        
        if not user_content:
            return None  # Pas de contenu à valider
        
        # Détecter les violations éthiques
        violation = ADHAIdentity.detect_violation(user_content)
        
        if violation:
            # Enregistrer l'événement de sécurité
            self._log_security_violation(request, violation, user_content)
            
            # Retourner une réponse de refus avec le message approprié
            return self._create_violation_response(violation, request)
        
        # Aucune violation détectée, continuer le traitement
        return None
    
    def _should_validate_endpoint(self, path: str) -> bool:
        """
        Détermine si un endpoint nécessite validation éthique.
        
        Args:
            path: Chemin de l'endpoint (ex: /api/chat/)
        
        Returns:
            True si l'endpoint doit être validé, False sinon
        """
        # Vérifier si l'endpoint est dans la liste des exemptions
        for exempt_pattern in self.EXEMPT_ENDPOINTS:
            if path.startswith(exempt_pattern):
                return False
        
        # Vérifier si l'endpoint est dans la liste des surveillés
        for monitored_pattern in self.MONITORED_ENDPOINTS:
            if path.startswith(monitored_pattern):
                return True
        
        # Par défaut, ne pas valider (éviter faux positifs)
        return False
    
    def _extract_user_content(self, request: HttpRequest) -> Optional[str]:
        """
        Extrait le contenu fourni par l'utilisateur depuis la requête.
        
        Args:
            request: Requête HTTP Django
        
        Returns:
            Contenu utilisateur à valider, ou None si non trouvé
        """
        content_parts = []
        
        # Extraire depuis le body JSON (POST/PUT)
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if request.content_type == 'application/json':
                    body = json.loads(request.body.decode('utf-8'))
                    
                    # Champs courants contenant du texte utilisateur
                    user_fields = [
                        'message', 'prompt', 'query', 'question', 
                        'text', 'content', 'description', 'input'
                    ]
                    
                    for field in user_fields:
                        if field in body and isinstance(body[field], str):
                            content_parts.append(body[field])
                    
                    # Vérifier également les messages dans les conversations
                    if 'messages' in body and isinstance(body['messages'], list):
                        for msg in body['messages']:
                            if isinstance(msg, dict) and 'content' in msg:
                                content_parts.append(msg['content'])
            
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                logger.warning(f"Failed to decode request body: {e}")
        
        # Extraire depuis les paramètres GET
        elif request.method == 'GET':
            for param in ['q', 'query', 'search', 'message']:
                if param in request.GET:
                    content_parts.append(request.GET[param])
        
        # Combiner tous les contenus extraits
        if content_parts:
            return " ".join(content_parts)
        
        return None
    
    def _log_security_violation(self, request: HttpRequest, 
                                violation: ADHAEthicalViolationType, 
                                user_content: str):
        """
        Enregistre un événement de sécurité lorsqu'une violation est détectée.
        
        Args:
            request: Requête HTTP contenant la violation
            violation: Type de violation éthique détectée
            user_content: Contenu utilisateur problématique
        """
        user_id = getattr(request.user, 'id', 'anonymous')
        company_id = getattr(request.user, 'company_id', 'unknown')
        institution_id = getattr(request.user, 'institution_id', None)
        
        # Tronquer le contenu utilisateur pour les logs (max 200 chars)
        truncated_content = user_content[:200] + "..." if len(user_content) > 200 else user_content
        
        security_event = {
            "event_type": "ethical_violation",
            "violation_type": violation.value,
            "user_id": user_id,
            "company_id": company_id,
            "institution_id": institution_id,
            "endpoint": request.path,
            "method": request.method,
            "ip_address": self._get_client_ip(request),
            "user_agent": request.META.get('HTTP_USER_AGENT', 'unknown'),
            "content_preview": truncated_content
        }
        
        # Log critique pour sécurité
        logger.error(
            f"🚨 SECURITY VIOLATION DETECTED | "
            f"Type: {violation.value} | "
            f"User: {user_id} | "
            f"Company: {company_id} | "
            f"Endpoint: {request.path} | "
            f"IP: {security_event['ip_address']}"
        )
        
        # Utiliser la méthode centralisée de logging ADHA
        ADHAIdentity.log_security_event(
            event_type="ethical_violation",
            user_id=str(user_id),
            details=security_event
        )
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """
        Extrait l'adresse IP du client depuis la requête.
        Gère les proxies et load balancers.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip
    
    def _create_violation_response(self, violation: ADHAEthicalViolationType, 
                                   request: HttpRequest) -> JsonResponse:
        """
        Crée une réponse HTTP appropriée pour une violation éthique.
        
        Args:
            violation: Type de violation détectée
            request: Requête HTTP originale
        
        Returns:
            JsonResponse avec code 403 et message approprié
        """
        # Récupérer le message de réponse standard pour ce type de violation
        violation_message = ADHAIdentity.get_violation_response(violation)
        
        # Déterminer le niveau de sévérité
        severity_map = {
            ADHAEthicalViolationType.PROMPT_INJECTION: "high",
            ADHAEthicalViolationType.ROLE_PLAY_ATTEMPT: "medium",
            ADHAEthicalViolationType.DATA_LEAK_ATTEMPT: "critical",
            ADHAEthicalViolationType.UNAUTHORIZED_ACCESS: "high",
            ADHAEthicalViolationType.MISSION_DETOURNEMENT: "medium",
            ADHAEthicalViolationType.HARMFUL_REQUEST: "critical",
        }
        
        severity = severity_map.get(violation, "medium")
        
        response_data = {
            "error": "ethical_violation",
            "violation_type": violation.value,
            "severity": severity,
            "message": violation_message,
            "blocked": True,
            "timestamp": self._get_timestamp(),
            "request_id": self._generate_request_id(request)
        }
        
        # Code HTTP selon sévérité
        status_codes = {
            "low": 400,
            "medium": 403,
            "high": 403,
            "critical": 403
        }
        
        status_code = status_codes.get(severity, 403)
        
        return JsonResponse(response_data, status=status_code)
    
    def _get_timestamp(self) -> str:
        """Retourne un timestamp ISO 8601 actuel"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"
    
    def _generate_request_id(self, request: HttpRequest) -> str:
        """
        Génère un identifiant unique pour la requête (pour traçabilité).
        Utilise l'ID de requête existant si disponible, sinon en génère un.
        """
        # Vérifier si un request_id existe déjà (ajouté par un middleware précédent)
        if hasattr(request, 'request_id'):
            return request.request_id
        
        # Générer un nouvel ID
        import uuid
        request_id = str(uuid.uuid4())
        request.request_id = request_id
        return request_id
    
    def process_response(self, request: HttpRequest, response) -> JsonResponse:
        """
        Ajoute des en-têtes de sécurité à la réponse si nécessaire.
        """
        # Ajouter l'ID de requête dans les headers pour traçabilité
        if hasattr(request, 'request_id'):
            response['X-Request-ID'] = request.request_id
        
        # Ajouter header indiquant que la requête a été validée éthiquement
        if self._should_validate_endpoint(request.path):
            response['X-ADHA-Ethical-Validation'] = 'passed'
        
        return response


class ChatMessageValidator:
    """
    Validateur spécialisé pour les messages de chat.
    Utilisé directement dans les vues de chat pour validation supplémentaire.
    """
    
    @staticmethod
    def validate_message(message: str, user_context: Dict) -> Dict:
        """
        Valide un message de chat et retourne le résultat de validation.
        
        Args:
            message: Message utilisateur à valider
            user_context: Contexte utilisateur (company_id, permissions, etc.)
        
        Returns:
            Dict avec 'is_valid', 'violation_type', 'response_message'
        """
        # Détecter violation éthique
        violation = ADHAIdentity.detect_violation(message)
        
        if violation:
            return {
                'is_valid': False,
                'violation_type': violation.value,
                'response_message': ADHAIdentity.get_violation_response(violation),
                'should_log': True
            }
        
        # Message valide
        return {
            'is_valid': True,
            'violation_type': None,
            'response_message': None,
            'should_log': False
        }
    
    @staticmethod
    def validate_data_access(requested_company_id: str, user_company_id: str, 
                            user_permissions: list) -> Dict:
        """
        Valide qu'un utilisateur peut accéder aux données d'une entreprise.
        
        Args:
            requested_company_id: ID de l'entreprise demandée
            user_company_id: ID de l'entreprise de l'utilisateur
            user_permissions: Liste des permissions de l'utilisateur
        
        Returns:
            Dict avec 'is_valid', 'violation_type', 'response_message'
        """
        is_authorized = ADHAIdentity.validate_data_access(
            requested_company_id=requested_company_id,
            user_company_id=user_company_id,
            user_permissions=user_permissions
        )
        
        if not is_authorized:
            violation = ADHAEthicalViolationType.DATA_LEAK_ATTEMPT
            return {
                'is_valid': False,
                'violation_type': violation.value,
                'response_message': ADHAIdentity.get_violation_response(violation),
                'should_log': True
            }
        
        return {
            'is_valid': True,
            'violation_type': None,
            'response_message': None,
            'should_log': False
        }
