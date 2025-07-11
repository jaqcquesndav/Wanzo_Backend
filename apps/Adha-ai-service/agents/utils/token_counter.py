from typing import Dict, List, Optional
import json
import os
import time

class TokenCounter:
    def __init__(self, token_limit: int = None):
        self.stats = {}
        self.token_limit = token_limit
        self.total_tokens_used = 0
        self.session_start_time = time.time()
        
        # Chargement de l'historique des tokens si disponible
        self.history_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                       "data", "token_usage_history.json")
        self.load_history()
        
        try:
            import tiktoken
            self.tiktoken = tiktoken
            self.encoders = {
                "gpt-4": tiktoken.encoding_for_model("gpt-4"),
                "gpt-4o-2024-08-06": tiktoken.encoding_for_model("gpt-4"),  # Utilise l'encodeur gpt-4
                "gpt-3.5-turbo": tiktoken.encoding_for_model("gpt-3.5-turbo"),
            }
        except ImportError:
            print("Warning: tiktoken not installed, falling back to basic token counting")
            self.tiktoken = None
            self.encoders = {}

    def count_tokens(self, text: str, model: str = "gpt-4") -> int:
        """Compte le nombre de tokens dans un texte."""
        if not text:
            return 0
            
        try:
            if self.tiktoken and model in self.encoders:
                return len(self.encoders[model].encode(text))
            else:
                # Fallback simple : estimation basique (4 caractères = ~1 token en moyenne)
                return len(text) // 4
        except Exception as e:
            print(f"Error counting tokens: {e}")
            return len(text) // 4

    def log_operation(self, agent_name: str, model: str, input_text: str, output_text: str, 
                     operation_id: Optional[str] = None, request_type: Optional[str] = None):
        """
        Enregistre les statistiques de tokens pour une opération et incrémente le compteur total.
        
        Args:
            agent_name: Nom de l'agent effectuant l'opération
            model: Modèle LLM utilisé
            input_text: Texte d'entrée envoyé au LLM
            output_text: Texte de sortie reçu du LLM
            operation_id: Identifiant optionnel de l'opération (pour regrouper les appels)
            request_type: Type de requête (analyse, vérification, etc.)
        """
        input_tokens = self.count_tokens(input_text, model)
        output_tokens = self.count_tokens(output_text, model)
        total_tokens = input_tokens + output_tokens
        timestamp = time.time()
        
        # Incrémenter le compteur global
        self.total_tokens_used += total_tokens
        
        # Vérifier la limite de tokens si définie
        if self.token_limit and self.total_tokens_used > self.token_limit:
            print(f"WARNING: Token limit exceeded! Used: {self.total_tokens_used}, Limit: {self.token_limit}")
        
        if agent_name not in self.stats:
            self.stats[agent_name] = []
        
        # Enregistrer les détails de l'opération
        operation_data = {
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
            "timestamp": timestamp,
            "operation_id": operation_id or f"{agent_name}_{len(self.stats[agent_name])}",
            "request_type": request_type or "default"
        }
        
        self.stats[agent_name].append(operation_data)
        
        # Mettre à jour l'historique périodiquement (toutes les 10 opérations)
        if sum(len(ops) for ops in self.stats.values()) % 10 == 0:
            self.save_history()
            
        return operation_data

    def get_stats(self) -> Dict:
        """Retourne les statistiques agrégées de consommation de tokens."""
        total_stats = {
            "per_agent": {},
            "total": {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": self.total_tokens_used,
                "token_limit": self.token_limit,
                "session_duration": time.time() - self.session_start_time
            }
        }

        for agent, operations in self.stats.items():
            agent_total = {
                "input_tokens": sum(op["input_tokens"] for op in operations),
                "output_tokens": sum(op["output_tokens"] for op in operations),
                "operations": len(operations),
                "models_used": list(set(op["model"] for op in operations))
            }
            agent_total["total_tokens"] = agent_total["input_tokens"] + agent_total["output_tokens"]
            
            total_stats["per_agent"][agent] = agent_total
            total_stats["total"]["input_tokens"] += agent_total["input_tokens"]
            total_stats["total"]["output_tokens"] += agent_total["output_tokens"]

        return total_stats

    def get_token_usage_header(self) -> Dict:
        """
        Génère un en-tête avec les informations de consommation de tokens.
        Utile pour les réponses API.
        """
        stats = self.get_stats()
        return {
            "X-Token-Usage-Total": stats["total"]["total_tokens"],
            "X-Token-Usage-Limit": self.token_limit or "unlimited",
            "X-Token-Usage-Remaining": (self.token_limit - stats["total"]["total_tokens"]) if self.token_limit else "unlimited",
            "X-Token-Usage-Details": json.dumps({
                "input_tokens": stats["total"]["input_tokens"],
                "output_tokens": stats["total"]["output_tokens"],
                "per_agent": {agent: stats["per_agent"][agent]["total_tokens"] for agent in stats["per_agent"]}
            })
        }

    def set_token_limit(self, limit: int):
        """Définit une nouvelle limite de tokens."""
        self.token_limit = limit
        print(f"Token limit updated to: {limit}")

    def reset_session_counter(self):
        """Réinitialise le compteur pour la session actuelle mais conserve l'historique."""
        self.total_tokens_used = 0
        self.session_start_time = time.time()
        self.stats = {}
        print("Session token counter reset.")

    def save_history(self):
        """Sauvegarde l'historique d'utilisation des tokens."""
        try:
            os.makedirs(os.path.dirname(self.history_file), exist_ok=True)
            
            # Charger l'historique existant s'il existe
            history = []
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            
            # Ajouter les nouvelles entrées
            current_session = {
                "session_id": int(self.session_start_time),
                "timestamp": time.time(),
                "total_tokens": self.total_tokens_used,
                "token_limit": self.token_limit,
                "stats": self.stats
            }
            
            # Limiter la taille de l'historique (garder les 100 dernières sessions)
            history.append(current_session)
            if len(history) > 100:
                history = history[-100:]
            
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2)
                
        except Exception as e:
            print(f"Error saving token usage history: {e}")

    def load_history(self):
        """Charge l'historique d'utilisation des tokens."""
        try:
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
                
                if history:
                    # Calculer le total historique pour information
                    historical_total = sum(session["total_tokens"] for session in history)
                    print(f"Loaded token usage history: {historical_total} tokens across {len(history)} sessions")
        except Exception as e:
            print(f"Error loading token usage history: {e}")
