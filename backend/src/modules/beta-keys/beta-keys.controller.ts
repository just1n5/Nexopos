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
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Permissions, Permission } from '../users/decorators/permissions.decorator';

@ApiTags('Beta Keys')
@Controller('beta-keys')
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

  /**
   * Endpoints protegidos (solo ADMIN puede gestionar beta keys)
   */
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONFIG_MANAGE)
  @ApiOperation({ summary: 'Get all beta keys (admin only)' })
  async findAll() {
    return this.betaKeysService.findAll();
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONFIG_MANAGE)
  @ApiOperation({ summary: 'Get beta keys statistics (admin only)' })
  async getStats() {
    return this.betaKeysService.getStats();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONFIG_MANAGE)
  @ApiOperation({ summary: 'Create a new beta key (admin only)' })
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONFIG_MANAGE)
  @ApiOperation({ summary: 'Create multiple beta keys (admin only)' })
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONFIG_MANAGE)
  @ApiOperation({ summary: 'Update beta key notes (admin only)' })
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONFIG_MANAGE)
  @ApiOperation({ summary: 'Delete an unused beta key (admin only)' })
  async deleteBetaKey(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.betaKeysService.deleteBetaKey(id);
    return { message: 'Beta key eliminada exitosamente' };
  }
}
