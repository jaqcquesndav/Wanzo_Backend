import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OIDCSession } from '../entities/session.entity';

interface SessionQuery {
  userId: string;
  clientId: string;
  active?: boolean;
}

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(OIDCSession)
    private sessionRepository: Repository<OIDCSession>,
  ) {}

  async create(sessionData: Partial<OIDCSession>): Promise<OIDCSession> {
    const session = this.sessionRepository.create(sessionData);
    return await this.sessionRepository.save(session);
  }

  async findById(id: string): Promise<OIDCSession | null> {
    return await this.sessionRepository.findOne({ where: { id } });
  }

  async findByUserAndClient(userId: string, clientId: string): Promise<OIDCSession[]> {
    const query: SessionQuery = { userId, clientId };
    return await this.sessionRepository.find({ 
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, sessionData: Partial<OIDCSession>): Promise<OIDCSession | null> {
    await this.sessionRepository.update(id, sessionData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.sessionRepository.delete(id);
  }

  async deleteExpiredSessions(): Promise<void> {
    await this.sessionRepository.createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }

  async extendSession(id: string, duration: number): Promise<OIDCSession | null> {
    const session = await this.findById(id);
    if (!session) {
      return null;
    }

    const newExpiryDate = new Date();
    newExpiryDate.setSeconds(newExpiryDate.getSeconds() + duration);
    
    session.expiresAt = newExpiryDate;
    return await this.sessionRepository.save(session);
  }
}