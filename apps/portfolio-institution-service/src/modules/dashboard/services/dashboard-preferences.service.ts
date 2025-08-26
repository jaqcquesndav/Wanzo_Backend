import { Injectable } from '@nestjs/common';
import { 
  DashboardPreferences, 
  WidgetType, 
  WidgetConfig,
  WidgetCategory
} from '../interfaces/dashboard.interface';

@Injectable()
export class DashboardPreferencesService {
  private userPreferences: Map<string, DashboardPreferences> = new Map();

  async getUserPreferences(userId: string): Promise<DashboardPreferences> {
    // Vérifier si les préférences existent en cache/base
    let preferences = this.userPreferences.get(userId);

    if (!preferences) {
      // Générer les préférences par défaut
      preferences = this.generateDefaultPreferences(userId);
      this.userPreferences.set(userId, preferences);
    }

    return preferences;
  }

  async updateWidgetVisibility(
    userId: string, 
    widgetId: WidgetType, 
    visible: boolean, 
    position: number
  ): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    if (preferences.widgets[widgetId]) {
      preferences.widgets[widgetId].visible = visible;
      preferences.widgets[widgetId].position = position;
      preferences.lastUpdated = new Date().toISOString();
      
      this.userPreferences.set(userId, preferences);
    }
  }

  async updateWidgetPosition(
    userId: string, 
    widgetId: WidgetType, 
    position: number
  ): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    if (preferences.widgets[widgetId]) {
      preferences.widgets[widgetId].position = position;
      preferences.lastUpdated = new Date().toISOString();
      
      this.userPreferences.set(userId, preferences);
    }
  }

  async resetToDefault(userId: string): Promise<DashboardPreferences> {
    const defaultPreferences = this.generateDefaultPreferences(userId);
    this.userPreferences.set(userId, defaultPreferences);
    return defaultPreferences;
  }

  async updateSelectorPosition(
    userId: string, 
    x: number, 
    y: number, 
    minimized: boolean
  ): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    preferences.selectorPosition = { x, y, minimized };
    preferences.lastUpdated = new Date().toISOString();
    
    this.userPreferences.set(userId, preferences);
  }

  getAvailableWidgets(): WidgetConfig[] {
    return [
      {
        id: WidgetType.OVERVIEW_METRICS,
        title: 'Métriques Globales',
        description: 'Vue d\'ensemble des métriques OHADA',
        category: WidgetCategory.KPI,
        defaultVisible: true,
        position: 0
      },
      {
        id: WidgetType.PORTFOLIO_PERFORMANCE,
        title: 'Performance Portefeuille',
        description: 'Performance des portefeuilles traditionnels',
        category: WidgetCategory.KPI,
        defaultVisible: true,
        position: 1
      },
      {
        id: WidgetType.RISK_INDICATORS,
        title: 'Indicateurs de Risque',
        description: 'Métriques de risque OHADA/BCEAO',
        category: WidgetCategory.KPI,
        defaultVisible: true,
        position: 2
      },
      {
        id: WidgetType.BALANCE_AGE_ANALYSIS,
        title: 'Analyse Balance Âgée',
        description: 'Répartition par ancienneté conforme OHADA',
        category: WidgetCategory.ANALYSIS,
        defaultVisible: true,
        position: 3
      },
      {
        id: WidgetType.SECTOR_DISTRIBUTION,
        title: 'Répartition Sectorielle',
        description: 'Distribution par secteur d\'activité',
        category: WidgetCategory.ANALYSIS,
        defaultVisible: false,
        position: 4
      },
      {
        id: WidgetType.GEOGRAPHIC_DISTRIBUTION,
        title: 'Distribution Géographique',
        description: 'Répartition géographique des portfolios',
        category: WidgetCategory.ANALYSIS,
        defaultVisible: false,
        position: 5
      },
      {
        id: WidgetType.PERFORMANCE_TRENDS,
        title: 'Tendances Performance',
        description: 'Évolution des performances dans le temps',
        category: WidgetCategory.ANALYSIS,
        defaultVisible: true,
        position: 6
      },
      {
        id: WidgetType.REGULATORY_COMPLIANCE,
        title: 'Conformité Réglementaire',
        description: 'Statut de conformité OHADA/BCEAO',
        category: WidgetCategory.COMPLIANCE,
        defaultVisible: true,
        position: 7
      },
      {
        id: WidgetType.RISK_ASSESSMENT,
        title: 'Évaluation des Risques',
        description: 'Analyse détaillée des risques',
        category: WidgetCategory.COMPLIANCE,
        defaultVisible: false,
        position: 8
      },
      {
        id: WidgetType.RECENT_ACTIVITIES,
        title: 'Activités Récentes',
        description: 'Dernières activités du portfolio',
        category: WidgetCategory.ACTIVITY,
        defaultVisible: true,
        position: 9
      },
      {
        id: WidgetType.PORTFOLIO_HEALTH,
        title: 'Santé du Portfolio',
        description: 'Indicateurs de santé globale',
        category: WidgetCategory.ACTIVITY,
        defaultVisible: false,
        position: 10
      },
      {
        id: WidgetType.CLIENT_DISTRIBUTION,
        title: 'Distribution Clients',
        description: 'Répartition et analyse clients',
        category: WidgetCategory.ACTIVITY,
        defaultVisible: false,
        position: 11
      }
    ];
  }

  generateDefaultPreferences(userId: string): DashboardPreferences {
    const widgets = this.getAvailableWidgets();
    const widgetPreferences: Record<WidgetType, any> = {} as any;

    widgets.forEach(widget => {
      widgetPreferences[widget.id] = {
        visible: widget.defaultVisible,
        position: widget.position,
        config: widget.config || {}
      };
    });

    return {
      userId,
      widgets: widgetPreferences,
      selectorPosition: {
        x: 20,
        y: 20,
        minimized: false
      },
      lastUpdated: new Date().toISOString()
    };
  }

  async savePreferences(userId: string, preferences: DashboardPreferences): Promise<void> {
    preferences.lastUpdated = new Date().toISOString();
    this.userPreferences.set(userId, preferences);
    
    // TODO: Persister en base de données
    // await this.preferencesRepository.save(preferences);
  }

  async loadPreferences(userId: string): Promise<DashboardPreferences> {
    // TODO: Charger depuis la base de données
    // const saved = await this.preferencesRepository.findOne({ userId });
    // if (saved) {
    //   this.userPreferences.set(userId, saved);
    //   return saved;
    // }

    return this.getUserPreferences(userId);
  }
}
