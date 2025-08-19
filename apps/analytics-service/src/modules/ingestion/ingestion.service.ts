import { Injectable } from '@nestjs/common';
import { GraphService } from '../graph/graph.service';
import { TimeseriesService } from '../timeseries/timeseries.service';

interface MetricData {
  [key: string]: number | string | boolean;
}

interface Relationship {
  sourceType: string;
  targetType: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties?: Record<string, any>;
}

interface IngestionData {
  metrics: MetricData;
  type: string;
  service: string;
  entityId: string;
  relationships?: Relationship[];
}

@Injectable()
export class IngestionService {
  constructor(
    private graphService: GraphService,
    private timeseriesService: TimeseriesService,
  ) {}

  async ingestData(data: IngestionData): Promise<void> {
    // Store time-series data
    await this.timeseriesService.store({
      timestamp: new Date(),
      data: data.metrics,
      metricType: data.type,
      sourceService: data.service,
      entityId: data.entityId,
    });

    // Store graph relationships
    if (data.relationships) {
      for (const rel of data.relationships) {
        await this.graphService.executeQuery(`
          MERGE (source:${rel.sourceType} {id: $sourceId})
          MERGE (target:${rel.targetType} {id: $targetId})
          MERGE (source)-[r:${rel.type}]->(target)
          SET r += $properties
        `, {
          sourceId: rel.sourceId,
          targetId: rel.targetId,
          properties: rel.properties || {},
        });
      }
    }
  }
}
