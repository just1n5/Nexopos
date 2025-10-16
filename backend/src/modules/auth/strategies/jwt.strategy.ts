import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService, private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'change-me')
    });
  }

  async validate(payload: JwtPayload) {
    try {
      // The user should be validated against its tenant on every request
      const user = await this.usersService.findById(payload.sub, payload.tenantId);
      if (!user) {
        throw new UnauthorizedException();
      }
      return user; // This user object (including tenantId) will be attached to req.user
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
