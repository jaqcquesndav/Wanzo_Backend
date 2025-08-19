import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimeseriesData } from './entities/timeseries-data.entity';

interface TimeseriesQuery {
  startTime: Date;
  endTime: Date;
  metricType?: string;
  sourceService?: string;
  entityId?: string;
}

@Injectable()
export class TimeseriesService {
  constructor(
    @InjectRepository(TimeseriesData)
    private timeseriesRepository: Repository<TimeseriesData>
  ) {}

  async store(data: Partial<TimeseriesData>): Promise<TimeseriesData> {
    const timeseriesData = this.timeseriesRepository.create(data);
    return await this.timeseriesRepository.save(timeseriesData);
  }

  async query(params: TimeseriesQuery): Promise<TimeseriesData[]> {
    const query = this.timeseriesRepository.createQueryBuilder('data')
      .where('data.timestamp BETWEEN :startTime AND :endTime', {
        startTime: params.startTime,
        endTime: params.endTime,
      });

    if (params.metricType) {
      query.andWhere('data.metricType = :metricType', {
        metricType: params.metricType,
      });
    }

    if (params.sourceService) {
      query.andWhere('data.sourceService = :sourceService', {
        sourceService: params.sourceService,
      });
    }

    if (params.entityId) {
      query.andWhere('data.entityId = :entityId', {
        entityId: params.entityId,
      });
    }

    return await query
      .orderBy('data.timestamp', 'ASC')
      .getMany();
  }

  async aggregateMetrics(
    params: TimeseriesQuery,
    aggregation: 'sum' | 'avg' | 'min' | 'max',
    metricKey: string,
  ): Promise<{ timestamp: Date; value: number }[]> {
    const query = this.timeseriesRepository.createQueryBuilder('data')
      .select(`date_trunc('hour', data.timestamp)`, 'timestamp')
      .addSelect(`${aggregation}(data.data->>'${metricKey}')::float`, 'value')
      .where('data.timestamp BETWEEN :startTime AND :endTime', {
        startTime: params.startTime,
        endTime: params.endTime,
      });

    if (params.metricType) {
      query.andWhere('data.metricType = :metricType', {
        metricType: params.metricType,
      });
    }

    return await query
      .groupBy('timestamp')
      .orderBy('timestamp', 'ASC')
      .getRawMany();
  }
}
