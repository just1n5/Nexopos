import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../users/guards/permissions.guard';
import { Permissions, Permission } from '../users/decorators/permissions.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Permissions(Permission.CONFIG_MANAGE)
  @ApiOperation({ summary: 'Get all tenants (super admin only)' })
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Permissions(Permission.CONFIG_MANAGE)
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/user-count')
  @Permissions(Permission.USERS_MANAGE)
  @ApiOperation({ summary: 'Get user count by role for tenant' })
  async getUserCount(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenantsService.getUserCountByRole(id);
  }

  @Patch(':id/deactivate')
  @Permissions(Permission.CONFIG_MANAGE)
  @ApiOperation({ summary: 'Deactivate tenant (super admin only)' })
  async deactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenantsService.deactivate(id);
  }

  @Patch(':id/activate')
  @Permissions(Permission.CONFIG_MANAGE)
  @ApiOperation({ summary: 'Activate tenant (super admin only)' })
  async activate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenantsService.activate(id);
  }
}
