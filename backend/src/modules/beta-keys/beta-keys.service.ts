import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BetaKey } from './entities/beta-key.entity';

@Injectable()
export class BetaKeysService {
  constructor(
    @InjectRepository(BetaKey)
    private betaKeyRepository: Repository<BetaKey>,
  ) {}

  /**
   * Genera una clave beta en formato BETA-XXXXX-XXXXX
   */
  private generateBetaKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part1 = Array.from({ length: 5 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    const part2 = Array.from({ length: 5 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    return `BETA-${part1}-${part2}`;
  }

  /**
   * Crea una nueva beta key
   */
  async createBetaKey(notes?: string): Promise<BetaKey> {
    let key: string;
    let exists = true;

    // Generar clave única
    while (exists) {
      key = this.generateBetaKey();
      const found = await this.betaKeyRepository.findOne({ where: { key } });
      exists = !!found;
    }

    const betaKey = this.betaKeyRepository.create({
      key,
      notes,
    });

    return this.betaKeyRepository.save(betaKey);
  }

  /**
   * Crea múltiples beta keys
   */
  async createMultipleBetaKeys(count: number, notes?: string): Promise<BetaKey[]> {
    const keys: BetaKey[] = [];
    for (let i = 0; i < count; i++) {
      const key = await this.createBetaKey(notes ? `${notes} #${i + 1}` : undefined);
      keys.push(key);
    }
    return keys;
  }

  /**
   * Obtiene todas las beta keys con información de uso
   */
  async findAll(): Promise<BetaKey[]> {
    return this.betaKeyRepository.find({
      relations: ['usedByTenant'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Valida si una beta key existe y está disponible
   */
  async validateBetaKey(key: string): Promise<{ valid: boolean; message?: string }> {
    const betaKey = await this.betaKeyRepository.findOne({ where: { key } });

    if (!betaKey) {
      return { valid: false, message: 'Clave beta no válida' };
    }

    if (betaKey.isUsed) {
      return { valid: false, message: 'Esta clave beta ya ha sido utilizada' };
    }

    return { valid: true };
  }

  /**
   * Marca una beta key como usada
   */
  async markAsUsed(key: string, tenantId: string): Promise<BetaKey> {
    const betaKey = await this.betaKeyRepository.findOne({ where: { key } });

    if (!betaKey) {
      throw new NotFoundException('Clave beta no encontrada');
    }

    if (betaKey.isUsed) {
      throw new ConflictException('Esta clave beta ya ha sido utilizada');
    }

    betaKey.isUsed = true;
    betaKey.usedByTenantId = tenantId;
    betaKey.usedAt = new Date();

    return this.betaKeyRepository.save(betaKey);
  }

  /**
   * Obtiene estadísticas de beta keys
   */
  async getStats() {
    const total = await this.betaKeyRepository.count();
    const used = await this.betaKeyRepository.count({ where: { isUsed: true } });
    const available = total - used;

    return {
      total,
      used,
      available,
      usagePercentage: total > 0 ? Math.round((used / total) * 100) : 0,
    };
  }

  /**
   * Elimina una beta key (solo si no está usada)
   */
  async deleteBetaKey(id: string): Promise<void> {
    const betaKey = await this.betaKeyRepository.findOne({ where: { id } });

    if (!betaKey) {
      throw new NotFoundException('Clave beta no encontrada');
    }

    if (betaKey.isUsed) {
      throw new ConflictException('No se puede eliminar una clave beta ya utilizada');
    }

    await this.betaKeyRepository.remove(betaKey);
  }

  /**
   * Actualiza las notas de una beta key
   */
  async updateNotes(id: string, notes: string): Promise<BetaKey> {
    const betaKey = await this.betaKeyRepository.findOne({ where: { id } });

    if (!betaKey) {
      throw new NotFoundException('Clave beta no encontrada');
    }

    betaKey.notes = notes;
    return this.betaKeyRepository.save(betaKey);
  }

  /**
   * Devuelve un conteo simple para verificar la conexión a la BD
   */
  async getHealthCheck(): Promise<{ db_connection: boolean; count: number }> {
    try {
      const count = await this.betaKeyRepository.count();
      return { db_connection: true, count };
    } catch (error) {
      return { db_connection: false, count: 0 };
    }
  }
