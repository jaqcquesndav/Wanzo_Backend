import { Metric } from '../../timeseries/entities/metric.entity';

/**
 * Interface representing a correlation between two market metrics
 * Used for market trend analysis
 */
export interface Correlation {
  index1: Metric;
  index2: Metric;
  correlation: number;
}
