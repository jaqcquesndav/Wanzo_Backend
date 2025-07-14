import { Node } from '../entities/node.entity';
import { Edge } from '../entities/edge.entity';

/**
 * Interface representing a pattern of connected transactions
 * Used for fraud detection analysis
 */
export interface Pattern {
  transaction: Node;
  connections: Edge[];
  riskLevel: number;
}
