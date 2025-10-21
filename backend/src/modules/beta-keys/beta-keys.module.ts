import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BetaKeysService } from './beta-keys.service';
import { BetaKeysController } from './beta-keys.controller';
import { BetaKey } from './entities/beta-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BetaKey])],
  controllers: [BetaKeysController],
  providers: [BetaKeysService],
  exports: [BetaKeysService],
})
export class BetaKeysModule {
  private readonly logger = new Logger(BetaKeysModule.name);
  constructor() {
    this.logger.log('BetaKeysModule initialized');
  }
}
