export interface MetricData {
  [key: string]: number | string | boolean;
}

export interface Relationship {
  sourceType: string;
  targetType: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties?: Record<string, any>;
}

export interface IngestionData {
  metrics: MetricData;
  type: string;
  service: string;
  entityId: string;
  relationships?: Relationship[];
}

export interface TimeseriesQuery {
  startTime: Date;
  endTime: Date;
  metricType?: string;
  sourceService?: string;
  entityId?: string;
}
