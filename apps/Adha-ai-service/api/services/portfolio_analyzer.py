"""
Module d'analyse de portefeuille pour Adha AI Service.
Ce service traite les demandes d'analyse de portefeuilles d'institutions financières
et génère des recommandations basées sur l'IA.
"""

import logging
import datetime
from enum import Enum
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class AnalysisType(Enum):
    """Types d'analyse de portefeuille supportés"""
    FINANCIAL = "financial"
    MARKET = "market" 
    OPERATIONAL = "operational"
    RISK = "risk"

class PortfolioType(Enum):
    """Types de portefeuilles supportés"""
    CREDIT = "credit"
    SAVINGS = "savings"
    INVESTMENT = "investment"
    MICRO_FINANCE = "micro_finance"
    INSURANCE = "insurance"

class PortfolioAnalyzer:
    """
    Analyseur de portefeuille qui génère des recommandations basées
    sur les données du portefeuille et les critères d'analyse.
    """
    
    def analyze_portfolio(self, portfolio_data: Dict[str, Any], 
                          analysis_types: List[str] = None) -> Dict[str, Any]:
        """
        Analyse un portefeuille selon les types d'analyse demandés.
        
        Args:
            portfolio_data: Les données du portefeuille à analyser
            analysis_types: Les types d'analyse à effectuer, si None tous les types sont effectués
            
        Returns:
            Dict: Les résultats de l'analyse avec recommandations
        """
        if not portfolio_data:
            return {"error": "Aucune donnée de portefeuille fournie"}
            
        portfolio_type = self._determine_portfolio_type(portfolio_data)
        
        # Par défaut, effectuer tous les types d'analyse
        if not analysis_types:
            analysis_types = [t.value for t in AnalysisType]
            
        results = {
            "portfolio_id": portfolio_data.get("id"),
            "portfolio_type": portfolio_type.value,
            "analyses": {}
        }
        
        # Effectuer chaque type d'analyse demandé
        for analysis_type in analysis_types:
            try:
                analysis_result = self._perform_analysis(
                    portfolio_data, 
                    analysis_type,
                    portfolio_type
                )
                results["analyses"][analysis_type] = analysis_result
            except Exception as e:
                logger.error(f"Erreur lors de l'analyse {analysis_type}: {str(e)}")
                results["analyses"][analysis_type] = {"error": str(e)}
                
        # Générer des recommandations consolidées
        results["recommendations"] = self._generate_consolidated_recommendations(
            results["analyses"],
            portfolio_type
        )
            
        return results
    
    def _determine_portfolio_type(self, portfolio_data: Dict[str, Any]) -> PortfolioType:
        """
        Détermine le type de portefeuille à partir des données.
        
        Args:
            portfolio_data: Les données du portefeuille
            
        Returns:
            PortfolioType: Le type de portefeuille identifié
        """
        # Essayer d'obtenir le type directement des données
        portfolio_type_str = portfolio_data.get("type", "").lower()
        
        try:
            return PortfolioType(portfolio_type_str)
        except ValueError:
            # Déterminer le type en fonction des champs présents
            if "loans" in portfolio_data or "credits" in portfolio_data:
                return PortfolioType.CREDIT
            elif "investments" in portfolio_data:
                return PortfolioType.INVESTMENT
            elif "savings" in portfolio_data:
                return PortfolioType.SAVINGS
            elif "insurance" in portfolio_data:
                return PortfolioType.INSURANCE
            else:
                # Par défaut
                return PortfolioType.CREDIT
    
    def _perform_analysis(self, portfolio_data: Dict[str, Any], 
                          analysis_type: str, 
                          portfolio_type: PortfolioType) -> Dict[str, Any]:
        """
        Effectue un type d'analyse spécifique sur le portefeuille.
        
        Args:
            portfolio_data: Les données du portefeuille
            analysis_type: Le type d'analyse à effectuer
            portfolio_type: Le type de portefeuille
            
        Returns:
            Dict: Les résultats de l'analyse
        """
        # Appeler la fonction d'analyse appropriée en fonction du type
        analysis_functions = {
            AnalysisType.FINANCIAL.value: self._analyze_financial,
            AnalysisType.MARKET.value: self._analyze_market,
            AnalysisType.OPERATIONAL.value: self._analyze_operational,
            AnalysisType.RISK.value: self._analyze_risk
        }
        
        analysis_func = analysis_functions.get(analysis_type)
        if not analysis_func:
            return {"error": f"Type d'analyse non pris en charge: {analysis_type}"}
            
        return analysis_func(portfolio_data, portfolio_type)
    
    def _analyze_financial(self, portfolio_data: Dict[str, Any], 
                           portfolio_type: PortfolioType) -> Dict[str, Any]:
        """Analyse financière du portefeuille"""
        # Logique à implémenter pour l'analyse financière
        # TODO: Intégrer avec des modèles de ML pour l'analyse financière
        
        if portfolio_type == PortfolioType.CREDIT:
            return {
                "indicators": {
                    "outstanding_balance": portfolio_data.get("totalOutstanding", 0),
                    "average_interest_rate": portfolio_data.get("averageInterestRate", 0),
                    "non_performing_ratio": self._calculate_non_performing_ratio(portfolio_data),
                    "profitability_index": 0.75  # Placeholder
                },
                "findings": [
                    "Diversification du portefeuille recommandée",
                    "Ratio de prêts non performants dans la limite acceptable"
                ]
            }
        
        return {"status": "Analyse financière à implémenter pour ce type de portefeuille"}
    
    def _analyze_market(self, portfolio_data: Dict[str, Any], 
                        portfolio_type: PortfolioType) -> Dict[str, Any]:
        """Analyse de marché du portefeuille"""
        # Logique à implémenter pour l'analyse de marché
        return {"status": "Analyse de marché à implémenter"}
    
    def _analyze_operational(self, portfolio_data: Dict[str, Any], 
                            portfolio_type: PortfolioType) -> Dict[str, Any]:
        """Analyse opérationnelle du portefeuille"""
        # Logique à implémenter pour l'analyse opérationnelle
        return {"status": "Analyse opérationnelle à implémenter"}
    
    def _analyze_risk(self, portfolio_data: Dict[str, Any], 
                      portfolio_type: PortfolioType) -> Dict[str, Any]:
        """Analyse de risque du portefeuille"""
        # Logique à implémenter pour l'analyse de risque
        
        if portfolio_type == PortfolioType.CREDIT:
            risk_factors = [
                {"factor": "Concentration sectorielle", "score": 0.65},
                {"factor": "Qualité des garanties", "score": 0.80},
                {"factor": "Risque de défaut", "score": 0.45}
            ]
            
            return {
                "risk_score": 0.63,  # Score global (0-1)
                "risk_factors": risk_factors,
                "findings": [
                    "Concentration de risque élevée dans le secteur immobilier",
                    "Portefeuille de garanties solide",
                    "Surveiller le risque de défaut dans les PME du secteur manufacturier"
                ]
            }
        
        return {"status": "Analyse de risque à implémenter pour ce type de portefeuille"}
    
    def _calculate_non_performing_ratio(self, portfolio_data: Dict[str, Any]) -> float:
        """Calcule le ratio de prêts non performants"""
        # Logique à implémenter
        non_performing = portfolio_data.get("nonPerformingLoans", 0)
        total_outstanding = portfolio_data.get("totalOutstanding", 1)  # Éviter division par zéro
        return non_performing / total_outstanding if total_outstanding > 0 else 0
    
    def _generate_consolidated_recommendations(self, 
                                              analyses: Dict[str, Dict], 
                                              portfolio_type: PortfolioType) -> List[str]:
        """
        Génère des recommandations consolidées basées sur toutes les analyses.
        
        Args:
            analyses: Les résultats des différentes analyses
            portfolio_type: Le type de portefeuille
            
        Returns:
            List[str]: Liste de recommandations
        """
        recommendations = []
        
        # Collecter les résultats de chaque analyse
        financial = analyses.get(AnalysisType.FINANCIAL.value, {})
        risk = analyses.get(AnalysisType.RISK.value, {})
        
        # Générer des recommandations spécifiques au type de portefeuille
        if portfolio_type == PortfolioType.CREDIT:
            # Recommandations basées sur l'analyse financière
            if financial and "findings" in financial:
                recommendations.extend(financial["findings"])
                
            # Recommandations basées sur l'analyse de risque
            if risk and "findings" in risk:
                recommendations.extend(risk["findings"])
                
            # Recommandations générales pour les portefeuilles de crédit
            recommendations.append(
                "Considérer une révision des taux d'intérêt en fonction du profil de risque des clients"
            )
            
        elif portfolio_type == PortfolioType.INVESTMENT:
            # Recommandations pour les portefeuilles d'investissement
            recommendations.append(
                "Surveiller les marchés financiers pour des opportunités d'investissement"
            )
            
        # Ajouter des recommandations générales
        recommendations.append(
            "Effectuer des analyses régulières pour maintenir une vision actualisée du portefeuille"
        )
        
        return recommendations

# Instance singleton de l'analyseur de portefeuille
portfolio_analyzer = PortfolioAnalyzer()

def analyze_portfolio(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Point d'entrée pour l'analyse de portefeuille.
    
    Args:
        message: Le message contenant les données du portefeuille et les paramètres d'analyse
        
    Returns:
        Dict: Les résultats de l'analyse
    """
    # Adapter le format du message venant du portfolio-institution-service
    portfolio_data = message.get("portfolio", {})
    
    # Si le portfolio n'est pas directement dans le message, chercher dans contextInfo
    if not portfolio_data and "contextInfo" in message and "portfolio" in message["contextInfo"]:
        portfolio_data = message["contextInfo"]["portfolio"]
        
    # Si toujours pas de données mais qu'on a un ID, créer un portfolio minimal
    if not portfolio_data and "portfolioId" in message:
        portfolio_id = message["portfolioId"]
        portfolio_type = message.get("contextInfo", {}).get("portfolioType", "credit")
        logger.info(f"Utilisation des données minimales pour le portefeuille {portfolio_id}")
        portfolio_data = {"id": portfolio_id, "type": portfolio_type}
    
    # Extraire les types d'analyse demandés
    analysis_types = message.get("analysisTypes", [])
    
    # Convertir les types d'analyse enum en strings si nécessaire
    if analysis_types and isinstance(analysis_types[0], dict) and 'value' in analysis_types[0]:
        analysis_types = [a['value'].lower() for a in analysis_types]
    elif analysis_types and not isinstance(analysis_types[0], str):
        analysis_types = [str(a).lower() for a in analysis_types]
    
    # Effectuer l'analyse
    results = portfolio_analyzer.analyze_portfolio(portfolio_data, analysis_types)
    
    # Ajouter les informations d'identification pour la réponse Kafka
    results["requestId"] = message.get("id")
    results["portfolioId"] = message.get("portfolioId")
    results["institutionId"] = message.get("institutionId")
    results["timestamp"] = message.get("timestamp") or datetime.now().isoformat()
    results["metadata"] = {
        "processed_by": "adha_ai_portfolio_analyzer",
        "analysis_types": analysis_types
    }
    
    # Envoyer la réponse via Kafka si importé
    try:
        from ..kafka.producer_portfolio import send_analysis_response
        send_analysis_response(results)
    except ImportError:
        logger.warning("Could not import producer_portfolio, analysis response not sent via Kafka")
    except Exception as e:
        logger.error(f"Error sending analysis response via Kafka: {str(e)}")
    
    return results
