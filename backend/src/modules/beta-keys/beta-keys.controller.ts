import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { BetaKeysService } from './beta-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions, Permission } from '../users/decorators/permissions.decorator';
import { PermissionsGuard } from '../users/guards/permissions.guard';

@ApiTags('Beta Keys')
@Controller('beta-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BetaKeysController {
  constructor(private readonly betaKeysService: BetaKeysService) {}

  /**
   * Endpoint público para validar beta key (sin autenticación)
   */
  @Get('validate/:key')
  @ApiOperation({ summary: 'Validate a beta key (public endpoint)' })
  @ApiResponse({ status: 200, description: 'Beta key validation result' })
  async validateBetaKey(@Param('key') key: string) {
    return this.betaKeysService.validateBetaKey(key);
  }

  @Get('health-check')
  @ApiOperation({ summary: 'DB connection health check' })
  async healthCheck() {
    return this.betaKeysService.getHealthCheck();
  }

  /**
   * Endpoints protegidos (solo SUPER_ADMIN puede gestionar beta keys)
   */
  @Get()
  @Permissions(Permission.BETA_KEYS_MANAGE)
  @ApiOperation({ summary: 'Get all beta keys (SUPER_ADMIN only)' })
  async findAll() {
    return this.betaKeysService.findAll();
  }

  @Get('stats')
  @Permissions(Permission.BETA_KEYS_MANAGE)
  @ApiOperation({ summary: 'Get beta keys statistics (SUPER_ADMIN only)' })
  async getStats() {
    return this.betaKeysService.getStats();
  }

  @Post()
  @Permissions(Permission.BETA_KEYS_MANAGE)
  @ApiOperation({ summary: 'Create a new beta key (SUPER_ADMIN only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        notes: { type: 'string' },
      },
    },
  })
  async createBetaKey(@Body() body: { notes?: string }) {
    return this.betaKeysService.createBetaKey(body.notes);
  }

  @Post('bulk')
  @Permissions(Permission.BETA_KEYS_MANAGE)
  @ApiOperation({ summary: 'Create multiple beta keys (SUPER_ADMIN only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['count'],
      properties: {
        count: { type: 'number', minimum: 1, maximum: 100 },
        notes: { type: 'string' },
      },
    },
  })
  async createMultipleBetaKeys(@Body() body: { count: number; notes?: string }) {
    return this.betaKeysService.createMultipleBetaKeys(body.count, body.notes);
  }

  @Patch(':id/notes')
  @Permissions(Permission.BETA_KEYS_MANAGE)
  @ApiOperation({ summary: 'Update beta key notes (SUPER_ADMIN only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['notes'],
      properties: {
        notes: { type: 'string' },
      },
    },
  })
  async updateNotes(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { notes: string },
  ) {
    return this.betaKeysService.updateNotes(id, body.notes);
  }

  @Delete(':id')
  @Permissions(Permission.BETA_KEYS_MANAGE)
  @ApiOperation({ summary: 'Delete an unused beta key (SUPER_ADMIN only)' })
  async deleteBetaKey(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.betaKeysService.deleteBetaKey(id);
    return { message: 'Beta key eliminada exitosamente' };
  }
}