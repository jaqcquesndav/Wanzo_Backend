"""
Module de traitement des messages de chat pour Adha AI Service.
Ce service traite les messages de chat des utilisateurs et génère des réponses
contextuelles en utilisant un modèle de langage.
"""

import logging
import os
import datetime
from typing import Dict, Any, List, Optional
import json

logger = logging.getLogger(__name__)

class ChatProcessor:
    """
    Processeur de messages de chat qui génère des réponses contextuelles
    en utilisant un modèle de langage.
    """
    
    def __init__(self):
        """
        Initialise le processeur de chat avec le modèle de langage.
        """
        # TODO: Initialiser le modèle de langage ou la connexion à l'API
        self.model_loaded = False
        self.conversation_history = {}
        
    def _load_model(self):
        """
        Charge le modèle de langage si nécessaire.
        """
        # TODO: Implémenter le chargement du modèle ou l'initialisation de l'API
        self.model_loaded = True
        logger.info("Chat model loaded")
        
    def process_message(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Traite un message de chat et génère une réponse.
        
        Args:
            message_data: Les données du message à traiter
            
        Returns:
            Dict: La réponse générée avec métadonnées
        """
        if not self.model_loaded:
            self._load_model()
            
        # Extraire les informations du message
        user_id = message_data.get("userId")
        chat_id = message_data.get("chatId")
        content = message_data.get("content", "")
        context_info = message_data.get("contextInfo", {})
        
        if not user_id or not chat_id:
            return {
                "error": "Les identifiants d'utilisateur et de chat sont requis"
            }
            
        # Identifier la clé de conversation
        conversation_key = f"{user_id}:{chat_id}"
        
        # Récupérer ou initialiser l'historique de la conversation
        conversation = self.conversation_history.get(
            conversation_key, 
            {"messages": [], "context": {}}
        )
        
        # Mettre à jour le contexte si des informations sont fournies
        if context_info:
            conversation["context"].update(context_info)
            
        # Ajouter le message à l'historique
        conversation["messages"].append({
            "role": "user",
            "content": content,
            "timestamp": message_data.get("timestamp")
        })
        
        # Limiter la taille de l'historique (éviter les dépassements de contexte)
        if len(conversation["messages"]) > 10:
            conversation["messages"] = conversation["messages"][-10:]
            
        # Générer une réponse en fonction du contexte et de l'historique
        response_content = self._generate_response(content, conversation)
        
        # Ajouter la réponse à l'historique
        conversation["messages"].append({
            "role": "assistant",
            "content": response_content,
            "timestamp": None  # Ajouté par le système appelant
        })
        
        # Mettre à jour l'historique de la conversation
        self.conversation_history[conversation_key] = conversation
        
        # Préparer et renvoyer la réponse
        return {
            "type": "chat_response",
            "chatId": chat_id,
            "userId": user_id,
            "content": response_content,
            "metadata": {
                "processed_by": "adha_ai_chat_processor",
                "context_used": list(conversation["context"].keys())
            }
        }
        
    def _generate_response(self, message: str, 
                          conversation: Dict[str, Any]) -> str:
        """
        Génère une réponse en fonction du message et du contexte de la conversation.
        
        Args:
            message: Le message de l'utilisateur
            conversation: Le contexte et l'historique de la conversation
            
        Returns:
            str: La réponse générée
        """
        # TODO: Implémenter l'intégration avec le modèle de langage
        
        # Créer le prompt avec le contexte et l'historique
        context_info = conversation.get("context", {})
        messages = conversation.get("messages", [])
        
        # Exemple de génération de réponse (à remplacer par l'appel au modèle)
        if "portfolio" in context_info:
            return "Voici les informations concernant votre portefeuille. Que souhaitez-vous savoir spécifiquement?"
        elif "institution" in context_info:
            return "En tant qu'institution financière, je peux vous aider avec votre analyse de portefeuille. Quels aspects souhaitez-vous explorer?"
        else:
            return "Je suis Adha AI, votre assistant bancaire. Comment puis-je vous aider aujourd'hui?"

# Instance singleton du processeur de chat
chat_processor = ChatProcessor()

def process_chat_message(message_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Point d'entrée pour le traitement des messages de chat.
    
    Args:
        message_data: Les données du message à traiter
        
    Returns:
        Dict: La réponse générée
    """
    response = chat_processor.process_message(message_data)
    
    # Ajouter les informations d'identification pour la réponse Kafka
    if "error" not in response:
        response["requestId"] = message_data.get("id", "")
        response["timestamp"] = datetime.datetime.now().isoformat()
        
        # Envoyer la réponse via Kafka si importé
        try:
            from ..kafka.producer_portfolio import send_chat_response
            send_chat_response(response)
        except ImportError:
            logger.warning("Could not import producer_portfolio, chat response not sent via Kafka")
        except Exception as e:
            logger.error(f"Error sending chat response via Kafka: {str(e)}")
    
    return response
