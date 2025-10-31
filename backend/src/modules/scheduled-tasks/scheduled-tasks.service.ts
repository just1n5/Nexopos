import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegister, CashRegisterStatus } from '../cash-register/entities/cash-register.entity';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private readonly cashRegisterService: CashRegisterService,
    @InjectRepository(CashRegister)
    private cashRegisterRepository: Repository<CashRegister>,
  ) {}

  /**
   * Cierre automático de cajas a medianoche (00:00)
   * Se ejecuta todos los días a las 12:00 AM
   */
  @Cron('0 0 * * *', {
    name: 'auto-close-cash-registers',
    timeZone: 'America/Bogota', // Zona horaria de Colombia
  })
  async autoCloseCashRegisters() {
    this.logger.log('🕛 Iniciando cierre automático de cajas a medianoche...');

    try {
      // Buscar todas las cajas abiertas
      const openSessions = await this.cashRegisterRepository.find({
        where: {
          status: CashRegisterStatus.OPEN,
        },
        relations: ['user'],
      });

      if (openSessions.length === 0) {
        this.logger.log('✅ No hay cajas abiertas para cerrar');
        return;
      }

      this.logger.log(`📋 Encontradas ${openSessions.length} caja(s) abierta(s) para cerrar`);

      const results = [];
      const errors = [];

      for (const session of openSessions) {
        try {
          this.logger.log(`🔄 Cerrando caja ${session.sessionNumber} (Usuario: ${session.userId})...`);

          // Calcular balance esperado
          const expectedBalance = await this.cashRegisterService['calculateExpectedBalance'](session.id);

          // Cerrar la caja automáticamente
          session.status = CashRegisterStatus.CLOSED;
          session.closedAt = new Date();
          session.closedBy = 'system-auto-close';
          session.closingBalance = expectedBalance;
          session.expectedBalance = expectedBalance;
          session.actualBalance = expectedBalance; // Asumimos que coincide
          session.difference = 0; // No hay diferencia en cierre automático
          session.totalCounted = expectedBalance;
          session.closingNotes = '🤖 Cierre automático de medianoche - Sistema NexoPOS';
          session.discrepancyReason = null;

          await this.cashRegisterRepository.save(session);

          // Intentar crear asiento contable si es posible
          try {
            if (session.user?.tenantId) {
              const journalEntry = await this.cashRegisterService['journalEntryService'].createCashRegisterCloseEntry(
                session,
                session.user.tenantId,
                'system-auto-close'
              );

              session.journalEntryId = journalEntry.id;
              await this.cashRegisterRepository.save(session);

              this.logger.log(`✅ Asiento contable creado: ${journalEntry.entryNumber}`);
            }
          } catch (journalError) {
            this.logger.warn(`⚠️ No se pudo crear asiento contable para ${session.sessionNumber}: ${journalError.message}`);
            // No fallar el cierre por esto
          }

          results.push({
            sessionNumber: session.sessionNumber,
            userId: session.userId,
            expectedBalance,
            closedAt: session.closedAt,
            status: 'success',
          });

          this.logger.log(`✅ Caja ${session.sessionNumber} cerrada exitosamente`);
        } catch (error) {
          this.logger.error(`❌ Error al cerrar caja ${session.sessionNumber}:`, error.stack);
          errors.push({
            sessionNumber: session.sessionNumber,
            error: error.message,
          });
        }
      }

      // Log del resumen
      this.logger.log('📊 Resumen del cierre automático:');
      this.logger.log(`   ✅ Exitosos: ${results.length}`);
      this.logger.log(`   ❌ Errores: ${errors.length}`);

      if (results.length > 0) {
        this.logger.log('   Cajas cerradas:');
        results.forEach((r) => {
          this.logger.log(`     - ${r.sessionNumber}: $${r.expectedBalance.toFixed(2)}`);
        });
      }

      if (errors.length > 0) {
        this.logger.error('   Errores encontrados:');
        errors.forEach((e) => {
          this.logger.error(`     - ${e.sessionNumber}: ${e.error}`);
        });
      }

      this.logger.log('🎉 Cierre automático de cajas completado');
    } catch (error) {
      this.logger.error('💥 Error fatal en cierre automático de cajas:', error.stack);
    }
  }

  /**
   * Health check del scheduler (cada hora)
   * Útil para debugging y monitoreo
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'scheduler-health-check',
  })
  async healthCheck() {
    const openSessions = await this.cashRegisterRepository.count({
      where: { status: CashRegisterStatus.OPEN },
    });

    this.logger.debug(`💚 Scheduler activo - Cajas abiertas: ${openSessions}`);
  }
}
