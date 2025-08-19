import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Node } from './node.entity';

export enum EdgeType {
  BELONGS_TO = 'belongs_to',
  OWNS = 'owns',
  INVESTS_IN = 'invests_in',
  APPROVES = 'approves',
  GENERATES = 'generates',
  CONCERNS = 'concerns',
  SIGNALS = 'signals',
  IMPACTS = 'impacts',
  EVOLVES_WITH = 'evolves_with',
  SUCCEEDS = 'succeeds'
}

@Entity('graph_edges')
export class Edge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: EdgeType
  })
  type!: EdgeType;

  @Column('uuid')
  sourceId!: string;

  @ManyToOne(() => Node)
  @JoinColumn({ name: 'sourceId' })
  source!: Node;

  @Column('uuid')
  targetId!: string;

  @ManyToOne(() => Node)
  @JoinColumn({ name: 'targetId' })
  target!: Node;

  @Column('jsonb')
  properties!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
