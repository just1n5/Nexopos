import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TenantManagementService } from './tenant-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { RequestOtpDto, VerifyOtpDto } from './dto/tenant-action.dto';

@ApiTags('Tenant Management')
@Controller('tenant-management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class TenantManagementController {
  constructor(
    private readonly tenantManagementService: TenantManagementService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all tenants (SUPER_ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Returns all tenants' })
  async getAllTenants() {
    return this.tenantManagementService.getAllTenants();
  }

  @Post('suspend/request-otp')
  @ApiOperation({ summary: 'Request OTP for account suspension' })
  @ApiResponse({ status: 200, description: 'OTP sent to admin email' })
  async requestSuspensionOtp(@Body() dto: RequestOtpDto) {
    return this.tenantManagementService.requestSuspensionOtp(
      dto.tenantId,
      dto.email,
    );
  }

  @Post('delete/request-otp')
  @ApiOperation({ summary: 'Request OTP for account deletion' })
  @ApiResponse({ status: 200, description: 'OTP sent to admin email' })
  async requestDeletionOtp(@Body() dto: RequestOtpDto) {
    return this.tenantManagementService.requestDeletionOtp(
      dto.tenantId,
      dto.email,
    );
  }

  @Post('suspend/verify')
  @ApiOperation({ summary: 'Suspend account with OTP verification' })
  @ApiResponse({ status: 200, description: 'Account suspended successfully' })
  async suspendAccount(@Body() dto: VerifyOtpDto) {
    return this.tenantManagementService.suspendAccount(
      dto.tenantId,
      dto.otpCode,
      dto.email,
    );
  }

  @Post('delete/verify')
  @ApiOperation({ summary: 'Delete account permanently with OTP verification' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteAccount(@Body() dto: VerifyOtpDto) {
    return this.tenantManagementService.deleteAccount(
      dto.tenantId,
      dto.otpCode,
      dto.email,
    );
  }

  @Post('reactivate/:id')
  @ApiOperation({ summary: 'Reactivate suspended account' })
  @ApiResponse({ status: 200, description: 'Account reactivated successfully' })
  async reactivateAccount(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tenantManagementService.reactivateAccount(id);
  }
}
