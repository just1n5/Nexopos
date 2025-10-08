import axios from 'axios';
import type { RegisterFormData, BetaKeyValidation, RegisterResponse, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface LoginResponse {
  user: User;
  accessToken: string;
}

export const authService = {
  /**
   * Login de usuario
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return data;
  },

  /**
   * Valida una clave beta (endpoint público)
   */
  async validateBetaKey(betaKey: string): Promise<BetaKeyValidation> {
    try {
      const { data } = await axios.get<BetaKeyValidation>(
        `${API_URL}/beta-keys/validate/${betaKey}`
      );
      return data;
    } catch (error) {
      return {
        valid: false,
        message: 'Error al validar la clave beta',
      };
    }
  },

  /**
   * Registro de nuevo usuario + tenant
   */
  async register(formData: Omit<RegisterFormData, 'confirmPassword'>): Promise<RegisterResponse> {
    const { data } = await axios.post<RegisterResponse>(`${API_URL}/auth/register`, formData);
    return data;
  },

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getProfile(token: string): Promise<User> {
    const { data } = await axios.get<User>(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  /**
   * Solicita OTP para verificación de email
   */
  async requestEmailVerificationOtp(email: string): Promise<{ message: string; expiresAt: Date }> {
    const { data } = await axios.post(`${API_URL}/auth/verify-email/request-otp`, { email });
    return data;
  },

  /**
   * Verifica el código OTP de email
   */
  async verifyEmailOtp(email: string, otpCode: string): Promise<{ verified: boolean; message: string; email: string }> {
    const { data } = await axios.post(`${API_URL}/auth/verify-email/verify-otp`, { email, otpCode });
    return data;
  },
};
