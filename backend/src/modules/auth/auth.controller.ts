import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-email/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for email verification during registration' })
  async requestEmailVerificationOtp(@Body() body: { email: string }) {
    return this.authService.requestEmailVerificationOtp(body.email);
  }

  @Post('verify-email/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email OTP before registration' })
  async verifyEmailOtp(@Body() body: { email: string; otpCode: string }) {
    return this.authService.verifyEmailOtp(body.email, body.otpCode);
  }

  @Post('register')
  @ApiCreatedResponse({ description: 'Registers a new user and returns a JWT.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('check-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if user exists by email or phone and return basic info' })
  async checkUser(@Body() body: { identifier: string }) {
    return this.authService.checkUserExists(body.identifier);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Logs in and returns a JWT.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
