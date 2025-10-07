import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAuditLog, UserAuditAction } from '../entities/user-audit.entity';

interface AuditMetadata {
  userId?: string;
  performedBy?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class UserAuditService {
  private readonly logger = new Logger(UserAuditService.name);

  constructor(
    @InjectRepository(UserAuditLog)
    private readonly auditRepository: Repository<UserAuditLog>
  ) {}

  async log(action: UserAuditAction, data: AuditMetadata): Promise<void> {
    try {
      const auditLog = this.auditRepository.create({
        action,
        userId: data.userId || null,
        performedBy: data.performedBy || null,
        metadata: data.metadata || {},
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null
      });

      await this.auditRepository.save(auditLog);

      // Log adicional en consola para debugging
      this.logger.log(
        `[AUDIT] ${action} - User: ${data.userId || 'N/A'} - By: ${data.performedBy || 'N/A'}`
      );
    } catch (error) {
      // No fallar la operación principal si el audit log falla
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
    }
  }

  async getUserAuditLogs(userId: string, limit: number = 50): Promise<UserAuditLog[]> {
    return this.auditRepository.find({
      where: [
        { userId },
        { performedBy: userId }
      ],
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user', 'performer']
    });
  }

  async getRecentLogs(limit: number = 100): Promise<UserAuditLog[]> {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user', 'performer']
    });
  }

  async getLogsByAction(action: UserAuditAction, limit: number = 50): Promise<UserAuditLog[]> {
    return this.auditRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user', 'performer']
    });
  }
}
