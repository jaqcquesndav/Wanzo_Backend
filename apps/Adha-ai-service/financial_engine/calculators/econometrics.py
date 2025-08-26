"""
Calculateur d'Analyses Économétriques
Implémentation des analyses statistiques de base pour la finance
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any, Optional, Union
import statistics
import logging

logger = logging.getLogger(__name__)

class EconometricsCalculator:
    """
    Calculateur pour les analyses économétriques et statistiques financières
    """
    
    def __init__(self):
        self.precision = Decimal('0.01')
    
    def calculate_linear_regression(self, x_data: List[Union[float, Decimal]], 
                                   y_data: List[Union[float, Decimal]]) -> Dict[str, Any]:
        """
        Calcule une régression linéaire simple
        """
        try:
            if len(x_data) != len(y_data) or len(x_data) < 2:
                return {'error': 'Données insuffisantes ou incompatibles pour la régression'}
            
            x_data = [float(x) for x in x_data]
            y_data = [float(y) for y in y_data]
            
            n = len(x_data)
            sum_x = sum(x_data)
            sum_y = sum(y_data)
            sum_xy = sum(x * y for x, y in zip(x_data, y_data))
            sum_x2 = sum(x * x for x in x_data)
            
            # Calcul des coefficients
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
            intercept = (sum_y - slope * sum_x) / n
            
            # Coefficient de corrélation
            correlation = self.calculate_correlation(x_data, y_data)['correlation']
            
            # R-carré
            r_squared = correlation ** 2
            
            return {
                'method': 'Régression linéaire',
                'equation': f'y = {slope:.4f}x + {intercept:.4f}',
                'slope': round(slope, 4),
                'intercept': round(intercept, 4),
                'correlation': correlation,
                'r_squared': round(r_squared, 4),
                'sample_size': n
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul régression: {str(e)}"}
    
    def calculate_correlation(self, x_data: List[Union[float, Decimal]], 
                             y_data: List[Union[float, Decimal]]) -> Dict[str, Any]:
        """
        Calcule le coefficient de corrélation de Pearson
        """
        try:
            if len(x_data) != len(y_data) or len(x_data) < 2:
                return {'error': 'Données insuffisantes ou incompatibles'}
            
            x_data = [float(x) for x in x_data]
            y_data = [float(y) for y in y_data]
            
            n = len(x_data)
            
            # Moyennes
            mean_x = statistics.mean(x_data)
            mean_y = statistics.mean(y_data)
            
            # Calcul du coefficient de corrélation
            numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_data, y_data))
            sum_sq_x = sum((x - mean_x) ** 2 for x in x_data)
            sum_sq_y = sum((y - mean_y) ** 2 for y in y_data)
            denominator = (sum_sq_x * sum_sq_y) ** 0.5
            
            correlation = numerator / denominator if denominator != 0 else 0
            
            # Interprétation
            if abs(correlation) >= 0.8:
                interpretation = 'Corrélation forte'
            elif abs(correlation) >= 0.5:
                interpretation = 'Corrélation modérée'
            elif abs(correlation) >= 0.3:
                interpretation = 'Corrélation faible'
            else:
                interpretation = 'Corrélation très faible'
            
            return {
                'method': 'Corrélation de Pearson',
                'correlation': round(correlation, 4),
                'interpretation': interpretation,
                'sample_size': n,
                'mean_x': round(mean_x, 2),
                'mean_y': round(mean_y, 2)
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul corrélation: {str(e)}"}
    
    def calculate_trend_forecast(self, data: List[Union[float, Decimal]], 
                                periods_ahead: int = 3) -> Dict[str, Any]:
        """
        Calcule une prévision de tendance simple
        """
        try:
            if len(data) < 3:
                return {'error': 'Au moins 3 points de données nécessaires'}
            
            data = [float(d) for d in data]
            n = len(data)
            
            # Créer une série temporelle simple (1, 2, 3, ...)
            time_series = list(range(1, n + 1))
            
            # Régression linéaire pour la tendance
            regression = self.calculate_linear_regression(time_series, data)
            
            if 'error' in regression:
                return regression
            
            slope = regression['slope']
            intercept = regression['intercept']
            
            # Prévisions
            forecasts = []
            for i in range(1, periods_ahead + 1):
                forecast_period = n + i
                forecast_value = slope * forecast_period + intercept
                forecasts.append({
                    'period': forecast_period,
                    'forecast': round(forecast_value, 2)
                })
            
            return {
                'method': 'Prévision par tendance linéaire',
                'historical_data': data,
                'trend_equation': regression['equation'],
                'forecasts': forecasts,
                'r_squared': regression['r_squared']
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul prévision: {str(e)}"}
    
    def calculate_descriptive_stats(self, data: List[Union[float, Decimal]]) -> Dict[str, Any]:
        """
        Calcule les statistiques descriptives
        """
        try:
            if len(data) < 1:
                return {'error': 'Données insuffisantes'}
            
            data = [float(d) for d in data]
            
            return {
                'count': len(data),
                'mean': round(statistics.mean(data), 2),
                'median': round(statistics.median(data), 2),
                'mode': round(statistics.mode(data), 2) if len(set(data)) < len(data) else 'Aucun mode',
                'std_dev': round(statistics.stdev(data), 2) if len(data) > 1 else 0,
                'variance': round(statistics.variance(data), 2) if len(data) > 1 else 0,
                'min': round(min(data), 2),
                'max': round(max(data), 2),
                'range': round(max(data) - min(data), 2)
            }
            
        except Exception as e:
            return {'error': f"Erreur calcul statistiques: {str(e)}"}
