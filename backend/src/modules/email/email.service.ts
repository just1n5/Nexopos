import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface WelcomeEmailData {
  businessName: string;
  adminName: string;
  adminEmail: string;
  betaKey: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailEnabled = this.configService.get<string>('EMAIL_ENABLED', 'false') === 'true';

    if (!emailEnabled) {
      this.logger.warn('Email service is disabled. Set EMAIL_ENABLED=true to enable.');
      return;
    }

    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT', 587);
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    const from = this.configService.get<string>('EMAIL_FROM', 'NexoPOS <noreply@nexopos.com>');

    if (!host || !user || !pass) {
      this.logger.warn('Email configuration incomplete. Emails will not be sent.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    this.logger.log(`Email service initialized with host: ${host}`);
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping welcome email.');
      return;
    }

    const html = this.getWelcomeEmailTemplate(data);

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM', 'NexoPOS <noreply@nexopos.com>'),
        to: data.adminEmail,
        subject: '¡Bienvenido a NexoPOS! 🚀',
        html,
      });

      this.logger.log(`Welcome email sent to ${data.adminEmail}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${data.adminEmail}:`, error);
      // No lanzamos error para no bloquear el registro si falla el email
    }
  }

  private getWelcomeEmailTemplate(data: WelcomeEmailData): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a NexoPOS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        h1 {
            color: #2d3748;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .welcome-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .info-box {
            background-color: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box strong {
            color: #667eea;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .features {
            margin: 30px 0;
        }
        .feature {
            display: flex;
            align-items: start;
            margin-bottom: 15px;
        }
        .feature-icon {
            width: 24px;
            height: 24px;
            background-color: #667eea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
        }
        .beta-key {
            background-color: #fff5f5;
            border: 2px dashed #fc8181;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .beta-key code {
            font-size: 18px;
            font-weight: bold;
            color: #c53030;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">N</div>
            <div class="welcome-badge">🎉 Beta Cerrada</div>
            <h1>¡Bienvenido a NexoPOS!</h1>
            <p>Hola <strong>${data.adminName}</strong>, gracias por unirte a nuestra beta cerrada</p>
        </div>

        <p>Nos complace confirmar que tu cuenta para <strong>${data.businessName}</strong> ha sido creada exitosamente.</p>

        <div class="info-box">
            <strong>📧 Email de acceso:</strong> ${data.adminEmail}<br>
            <strong>🏢 Negocio:</strong> ${data.businessName}
        </div>

        <div class="beta-key">
            <p style="margin: 0 0 10px 0; color: #c53030; font-weight: 600;">Tu clave beta utilizada:</p>
            <code>${data.betaKey}</code>
        </div>

        <div style="text-align: center;">
            <a href="${this.configService.get<string>('FRONTEND_URL', 'https://nexopos-1.onrender.com')}/login" class="button">
                Acceder a NexoPOS →
            </a>
        </div>

        <div class="features">
            <h2 style="color: #2d3748; font-size: 20px; margin-bottom: 20px;">¿Qué puedes hacer ahora?</h2>

            <div class="feature">
                <div class="feature-icon">✓</div>
                <div>
                    <strong>Configurar tu negocio:</strong> Personaliza la información de tu empresa, logo y preferencias
                </div>
            </div>

            <div class="feature">
                <div class="feature-icon">✓</div>
                <div>
                    <strong>Agregar productos:</strong> Crea tu catálogo con precios, categorías y stock
                </div>
            </div>

            <div class="feature">
                <div class="feature-icon">✓</div>
                <div>
                    <strong>Gestionar usuarios:</strong> Invita a tu equipo (1 Manager y 2 Cajeros)
                </div>
            </div>

            <div class="feature">
                <div class="feature-icon">✓</div>
                <div>
                    <strong>Abrir caja y vender:</strong> Inicia operaciones y registra tus primeras ventas
                </div>
            </div>
        </div>

        <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <h3 style="color: #2d3748; margin-top: 0;">💡 Consejos para empezar:</h3>
            <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Completa la configuración de tu negocio en "Configuración"</li>
                <li>Agrega tus primeros productos en "Inventario"</li>
                <li>Abre caja en "Caja" antes de realizar ventas</li>
                <li>Explora el módulo de "Fiado" para ventas a crédito</li>
            </ol>
        </div>

        <div class="footer">
            <p><strong>¿Necesitas ayuda?</strong></p>
            <p>Estamos aquí para ayudarte. Contáctanos en soporte@nexopos.com</p>
            <p style="margin-top: 20px;">
                Este es un correo automático de bienvenida.<br>
                © ${new Date().getFullYear()} NexoPOS - Sistema de Punto de Venta para Colombia
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed:', error);
      return false;
    }
  }
}
