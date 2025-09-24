import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: User; accessToken: string }> {
    const created = await this.usersService.create(registerDto);
    const user = await this.usersService.findById(created.id);
    const accessToken = this.generateAccessToken(user);
    return { user, accessToken };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; accessToken: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const safeUser = await this.usersService.findById(user.id);
    const accessToken = this.generateAccessToken(safeUser);
    return { user: safeUser, accessToken };
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isValid = await this.usersService.validatePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return user;
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
