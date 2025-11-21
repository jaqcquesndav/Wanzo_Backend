import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdhaContextSource, AdhaContextType, ZoneCibleType } from '../entities/adha-context.entity';
import {
    CreateAdhaContextSourceDto,
    UpdateAdhaContextSourceDto,
    AdhaContextQueryDto,
    ToggleActiveDto,
    FileUploadResponseDto
} from '../dtos/adha-context.dto';
import { EventsService } from '../../events/events.service';
import {
    AdhaContextCreatedEvent,
    AdhaContextUpdatedEvent,
    AdhaContextToggledEvent,
    AdhaContextDeletedEvent,
    ADHA_CONTEXT_EVENT_VERSION
} from '@wanzobe/shared';

@Injectable()
export class AdhaContextService {
    private readonly logger = new Logger(AdhaContextService.name);
    private readonly eventVersion = ADHA_CONTEXT_EVENT_VERSION;

    constructor(
        @InjectRepository(AdhaContextSource)
        private adhaContextRepository: Repository<AdhaContextSource>,
        private readonly eventsService: EventsService,
    ) {}

    async findAll(query: AdhaContextQueryDto): Promise<{ data: AdhaContextSource[]; pagination: any }> {
        const page = query.page || 1;
        const pageSize = query.pageSize || 10;
        const skip = (page - 1) * pageSize;

        // Build query with filters
        const queryBuilder = this.adhaContextRepository.createQueryBuilder('source');

        // Apply filters
        if (query.search) {
            queryBuilder.andWhere(
                '(source.titre ILIKE :search OR source.description ILIKE :search)',
                { search: `%${query.search}%` }
            );
        }

        if (query.type) {
            queryBuilder.andWhere('source.type = :type', { type: query.type });
        }

        if (query.domaine && query.domaine.length) {            // For simple-array column, need to check if any element is in the array
            const domainConditions = query.domaine.map((d, i) => 
                `source.domaine LIKE :domain${i}`
            ).join(' OR ');
            const domainParams: Record<string, string> = {};
            query.domaine.forEach((d, i) => {
                domainParams[`domain${i}`] = `%${d}%`;
            });
            queryBuilder.andWhere(`(${domainConditions})`, domainParams);
        }

        if (query.zoneType && query.zoneValue) {
            queryBuilder.andWhere(
                `jsonb_exists_any(source.zoneCible, array['{"type":"${query.zoneType}","value":"${query.zoneValue}"}']::jsonb[])`
            );
        }

        if (query.niveau) {
            queryBuilder.andWhere('source.niveau = :niveau', { niveau: query.niveau });
        }

        if (query.active === 'true' || query.active === 'false') {
            queryBuilder.andWhere('source.active = :active', { active: query.active === 'true' });
        }

        if (query.tags && query.tags.length) {            // For simple-array column, need to check if any element is in the array
            const tagConditions = query.tags.map((tag, i) => 
                `source.tags LIKE :tag${i}`
            ).join(' OR ');
            const tagParams: Record<string, string> = {};
            query.tags.forEach((tag, i) => {
                tagParams[`tag${i}`] = `%${tag}%`;
            });
            queryBuilder.andWhere(`(${tagConditions})`, tagParams);
        }

        if (query.expire === 'true') {
            queryBuilder.andWhere('source.canExpire = true AND source.dateFin < NOW()');
        } else if (query.expire === 'false') {
            queryBuilder.andWhere('(source.canExpire = false OR source.dateFin >= NOW())');
        }

        if (query.dateValidite) {
            const validityDate = new Date(query.dateValidite);
            queryBuilder.andWhere(
                '(source.canExpire = false OR (source.dateDebut <= :date AND source.dateFin >= :date))',
                { date: validityDate }
            );
        }

        // Count total before pagination
        const totalItems = await queryBuilder.getCount();
        const totalPages = Math.ceil(totalItems / pageSize);

        // Apply pagination
        queryBuilder.skip(skip).take(pageSize);
        queryBuilder.orderBy('source.createdAt', 'DESC');

        const data = await queryBuilder.getMany();
        
        return {
            data,
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages
            }
        };
    }

    async findOne(id: string): Promise<AdhaContextSource> {
        const source = await this.adhaContextRepository.findOne({ where: { id } });
        if (!source) {
            throw new NotFoundException(`AdhaContext source with ID ${id} not found`);
        }
        return source;
    }    /**
     * Vérifie si un document est éligible à l'indexation dans ChromaDB
     * Règles: active=true AND url exists AND (pas d'expiration OR dans période de validité)
     */
    private isIndexable(source: AdhaContextSource): boolean {
        // 1. Doit être actif
        if (!source.active) {
            return false;
        }

        // 2. Doit avoir une URL Cloudinary
        if (!source.url) {
            return false;
        }

        // 3. Vérifier l'expiration si applicable
        if (source.canExpire) {
            const now = new Date();
            const start = source.dateDebut ? new Date(source.dateDebut) : null;
            const end = source.dateFin ? new Date(source.dateFin) : null;

            // Si dates définies, vérifier la validité
            if (start && end) {
                if (now < start || now > end) {
                    return false; // Pas encore valide ou expiré
                }
            } else if (end && now > end) {
                return false; // Expiré
            }
        }

        return true;
    }

    /**
     * Convertit une source en payload d'événement de base
     * Évite la duplication de code et assure la cohérence des événements
     */
    private toEventPayload(source: AdhaContextSource): Omit<AdhaContextCreatedEvent, 'shouldIndex' | 'metadata' | 'timestamp' | 'version'> {
        return {
            id: source.id,
            titre: source.titre,
            description: source.description,
            type: source.type,
            url: source.url,
            downloadUrl: source.downloadUrl,
            coverImageUrl: source.coverImageUrl,
            active: source.active,
            canExpire: source.canExpire,
            dateDebut: source.dateDebut?.toISOString(),
            dateFin: source.dateFin?.toISOString(),
            domaine: source.domaine || [],
            zoneCible: source.zoneCible || [],
            niveau: source.niveau,
            tags: source.tags || [],
        };
    }

    async create(createDto: CreateAdhaContextSourceDto): Promise<AdhaContextSource> {
        const source = this.adhaContextRepository.create({
            ...createDto,
            // Convert string dates to Date objects
            dateDebut: new Date(createDto.dateDebut),
            dateFin: new Date(createDto.dateFin),
            // If downloadUrl and coverImageUrl aren't provided, use the url
            downloadUrl: createDto.url,
            coverImageUrl: createDto.url + '_thumbnail' // This would be generated by the file upload service
        });
        
        const saved = await this.adhaContextRepository.save(source);

        // 🔥 ÉMETTRE ÉVÉNEMENT KAFKA UNIQUEMENT SI INDEXABLE
        const shouldIndex = this.isIndexable(saved);
        
        if (shouldIndex) {
            try {
                const event: AdhaContextCreatedEvent = {
                    ...this.toEventPayload(saved),
                    shouldIndex: true, // Toujours true pour les events created
                    timestamp: new Date().toISOString(),
                    version: this.eventVersion,
                    metadata: {
                        createdAt: saved.createdAt.toISOString(),
                        sourceService: 'admin-service',
                    },
                };

                await this.eventsService.publishAdhaContextCreated(event);
                this.logger.log(`✅ Kafka event emitted: adha.context.created for document ${saved.id} (${saved.titre})`);
            } catch (error) {
                // ⚠️ NE PAS BLOQUER LA CRÉATION si Kafka échoue
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`❌ Failed to emit Kafka event for document ${saved.id}: ${errorMessage}`);
            }
        } else {
            this.logger.debug(`⏭️ Document ${saved.id} created but not indexable (active=${saved.active}, url=${!!saved.url}). No Kafka event emitted.`);
        }

        return saved;
    }

    async update(id: string, updateDto: UpdateAdhaContextSourceDto): Promise<AdhaContextSource> {
        const source = await this.findOne(id);
        const wasIndexable = this.isIndexable(source);

        const updated = this.adhaContextRepository.merge(source, updateDto);
        const saved = await this.adhaContextRepository.save(updated);
        const isNowIndexable = this.isIndexable(saved);

        // 🔥 ÉMETTRE ÉVÉNEMENT UNIQUEMENT SI CHAMPS D'INDEXATION CHANGENT
        const indexationFieldsChanged =
            updateDto.active !== undefined ||
            updateDto.url !== undefined ||
            updateDto.canExpire !== undefined ||
            updateDto.dateDebut !== undefined ||
            updateDto.dateFin !== undefined;

        // Émettre SI les champs d'indexation ont changé ET (était indexable OU devient indexable)
        if (indexationFieldsChanged && (wasIndexable || isNowIndexable)) {
            try {
                const event: AdhaContextUpdatedEvent = {
                    ...this.toEventPayload(saved),
                    shouldIndex: isNowIndexable,
                    previouslyIndexable: wasIndexable,
                    changes: Object.keys(updateDto),
                    timestamp: new Date().toISOString(),
                    version: this.eventVersion,
                    metadata: {
                        updatedAt: saved.updatedAt.toISOString(),
                        sourceService: 'admin-service',
                    },
                };

                await this.eventsService.publishAdhaContextUpdated(event);
                this.logger.log(`✅ Kafka event emitted: adha.context.updated for document ${saved.id} (${saved.titre})`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`❌ Failed to emit Kafka event for document ${saved.id}: ${errorMessage}`);
            }
        } else {
            this.logger.debug(`⏭️ Document ${saved.id} updated but no indexation impact. No Kafka event emitted.`);
        }

        return saved;
    }

    async remove(id: string): Promise<void> {
        const source = await this.findOne(id);

        // 🔥 TOUJOURS ÉMETTRE ÉVÉNEMENT DE SUPPRESSION (pour nettoyage ChromaDB)
        try {
            const event: AdhaContextDeletedEvent = {
                id: source.id,
                titre: source.titre,
                url: source.url,
                type: source.type,
                timestamp: new Date().toISOString(),
                version: this.eventVersion,
                metadata: {
                    deletedAt: new Date().toISOString(),
                    sourceService: 'admin-service',
                },
            };

            await this.eventsService.publishAdhaContextDeleted(event);
            this.logger.log(`✅ Kafka event emitted: adha.context.deleted for document ${source.id}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`❌ Failed to emit Kafka event for deleted document ${source.id}: ${errorMessage}`);
        }

        await this.adhaContextRepository.remove(source);
    }

    async toggleActive(id: string, toggleDto: ToggleActiveDto): Promise<{ id: string; active: boolean; updatedAt: Date }> {
        const source = await this.findOne(id);
        const wasIndexable = this.isIndexable(source);
        const previousActive = source.active;

        source.active = toggleDto.active;
        const updated = await this.adhaContextRepository.save(source);
        const isNowIndexable = this.isIndexable(updated);

        // 🔥 ÉMETTRE ÉVÉNEMENT UNIQUEMENT SI L'ÉLIGIBILITÉ À L'INDEXATION CHANGE
        if (wasIndexable !== isNowIndexable) {
            try {
                const event: AdhaContextToggledEvent = {
                    id: updated.id,
                    titre: updated.titre,
                    url: updated.url,
                    active: updated.active,
                    shouldIndex: isNowIndexable,
                    canExpire: updated.canExpire,
                    dateDebut: updated.dateDebut?.toISOString(),
                    dateFin: updated.dateFin?.toISOString(),
                    previousState: {
                        active: previousActive,
                        wasIndexable: wasIndexable,
                    },
                    timestamp: new Date().toISOString(),
                    version: this.eventVersion,
                    metadata: {
                        toggledAt: updated.updatedAt.toISOString(),
                        sourceService: 'admin-service',
                    },
                };

                await this.eventsService.publishAdhaContextToggled(event);
                this.logger.log(`✅ Kafka event emitted: adha.context.toggled for document ${updated.id} (active: ${previousActive} → ${updated.active}, indexable: ${wasIndexable} → ${isNowIndexable})`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`❌ Failed to emit Kafka event for toggled document ${updated.id}: ${errorMessage}`);
            }
        } else {
            this.logger.debug(`⏭️ Document ${updated.id} toggled but indexability unchanged (${wasIndexable}). No Kafka event emitted.`);
        }

        return {
            id: updated.id,
            active: updated.active,
            updatedAt: updated.updatedAt
        };
    }

    async uploadFile(file: Express.Multer.File): Promise<FileUploadResponseDto> {
        // This would normally use a file upload service like Cloudinary
        // For now, we'll return mock URLs
        const mockUrl = `https://cloudinary.com/url/${file.originalname}`;
        return {
            url: mockUrl,
            coverImageUrl: `${mockUrl}_thumbnail`
        };
    }

    async getTagSuggestions(): Promise<string[]> {
        // This would normally query the database for unique tags
        // For now, return the sample tags from the documentation
        return [
            "marché", "statistiques", "juridique", "innovation", "RDC", "Kinshasa",
            "agriculture", "industrie", "banque", "startup", "énergie", "mines",
            "commerce", "santé", "éducation", "export", "import", "PME", "financement",
            "formation", "loi", "fiscalité", "prix", "tendance", "analyse", "benchmark",
            "licence", "propriété intellectuelle", "open data", "public", "privé",
            "zone économique", "province", "ville", "Afrique", "international"
        ];
    }

    async getZoneSuggestions(): Promise<{ type: ZoneCibleType; value: string }[]> {
        // This would normally query the database for unique zones
        // For now, return the sample zones from the documentation
        return [
            { type: ZoneCibleType.PAYS, value: "RDC" },
            { type: ZoneCibleType.VILLE, value: "Kinshasa" },
            { type: ZoneCibleType.PROVINCE, value: "Kinshasa" },
            { type: ZoneCibleType.PROVINCE, value: "Haut-Katanga" },
            { type: ZoneCibleType.PROVINCE, value: "Kasaï" }
        ];
    }
}
