import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NodeType {
  ENTERPRISE = 'enterprise',
  INSTITUTION = 'institution',
  PORTFOLIO = 'portfolio',
  OPERATION = 'operation',
  TRANSACTION = 'transaction',
  WORKFLOW = 'workflow',
  WORKFLOW_STEP = 'workflow_step',
  ALERT_RISK = 'alert_risk',
  SCORE_AML = 'score_aml',
  MARKET_INDEX = 'market_index',
  MACRO_TREND = 'macro_trend'
}

@Entity('graph_nodes')
export class Node {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column({
    type: 'enum',
    enum: NodeType
  })
  type!: NodeType;

  @Column()
  label!: string;

  @Column('jsonb')
  properties!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
