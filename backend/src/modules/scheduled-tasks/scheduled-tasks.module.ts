import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { CashRegister } from '../cash-register/entities/cash-register.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([CashRegister]),
    CashRegisterModule,
  ],
  providers: [ScheduledTasksService],
  exports: [ScheduledTasksService],
})
export class ScheduledTasksModule {}
