
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AdhaContextType {
    ETUDE_MARCHE = 'etude_marche',
    REGLEMENTATION = 'reglementation',
    RAPPORT_ANNUEL = 'rapport_annuel',
    ARTICLE_PRESSE = 'article_presse',
    STATISTIQUES = 'statistiques',
    AUTRE = 'autre',
}

export enum ZoneCibleType {
    PAYS = 'pays',
    VILLE = 'ville',
    PROVINCE = 'province',
    REGION = 'region',
}

export class ZoneCible {
    @Column({ type: 'enum', enum: ZoneCibleType })
    type: ZoneCibleType;

    @Column()
    value: string;
}

@Entity('adha_context_sources')
export class AdhaContextSource {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    titre: string;

    @Column('text')
    description: string;

    @Column({ type: 'enum', enum: AdhaContextType })
    type: AdhaContextType;

    @Column('simple-array')
    domaine: string[];

    @Column('jsonb')
    zoneCible: ZoneCible[];

    @Column()
    niveau: string;

    @Column()
    canExpire: boolean;

    @Column({ type: 'timestamp with time zone' })
    dateDebut: Date;

    @Column({ type: 'timestamp with time zone' })
    dateFin: Date;

    @Column()
    url: string;

    @Column()
    downloadUrl: string;

    @Column()
    coverImageUrl: string;

    @Column('simple-array')
    tags: string[];

    @Column({ default: true })
    active: boolean;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date;
}
