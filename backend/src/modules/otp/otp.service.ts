import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OtpCode, OtpPurpose } from './entities/otp.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpCode)
    private otpRepository: Repository<OtpCode>,
  ) {}

  /**
   * Genera un código OTP de 6 dígitos
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Crea un nuevo código OTP
   */
  async createOtp(
    email: string,
    purpose: OtpPurpose,
    relatedTenantId?: string,
  ): Promise<OtpCode> {
    // Invalidar códigos anteriores del mismo propósito y tenant
    await this.otpRepository.update(
      {
        email,
        purpose,
        relatedTenantId,
        isUsed: false,
      },
      { isUsed: true },
    );

    const code = this.generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expira en 10 minutos

    const otp = this.otpRepository.create({
      code,
      email,
      purpose,
      relatedTenantId,
      expiresAt,
    });

    return await this.otpRepository.save(otp);
  }

  /**
   * Verifica un código OTP
   */
  async verifyOtp(
    email: string,
    code: string,
    purpose: OtpPurpose,
    relatedTenantId?: string,
  ): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        email,
        code,
        purpose,
        relatedTenantId,
        isUsed: false,
      },
    });

    if (!otp) {
      throw new BadRequestException('Código OTP inválido');
    }

    if (new Date() > otp.expiresAt) {
      throw new BadRequestException('Código OTP expirado');
    }

    // Marcar como usado
    await this.otpRepository.update(otp.id, { isUsed: true });

    return true;
  }

  /**
   * Limpia códigos OTP expirados (tarea de mantenimiento)
   */
  async cleanExpiredOtps(): Promise<void> {
    await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
      isUsed: true,
    });
  }
}
