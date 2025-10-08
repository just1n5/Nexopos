import { apiFetch } from '@/lib/api';

export interface TenantInfo {
  id: string;
  businessName: string;
  nit: string;
  businessType: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  usersCount: number;
  ownerEmail: string | null;
}

export interface OtpResponse {
  message: string;
  expiresAt: string;
}

export interface ActionResponse {
  message: string;
  tenantId?: string;
  businessName?: string;
  deletedAt?: string;
}

export const tenantManagementService = {
  async getAllTenants(token: string): Promise<TenantInfo[]> {
    const response = await apiFetch('/tenant-management', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener la lista de tenants');
    }

    return response.json();
  },

  async requestSuspensionOtp(
    token: string,
    tenantId: string,
    email: string,
  ): Promise<OtpResponse> {
    const response = await apiFetch('/tenant-management/suspend/request-otp', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId, email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al solicitar OTP');
    }

    return response.json();
  },

  async requestDeletionOtp(
    token: string,
    tenantId: string,
    email: string,
  ): Promise<OtpResponse> {
    const response = await apiFetch('/tenant-management/delete/request-otp', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId, email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al solicitar OTP');
    }

    return response.json();
  },

  async suspendAccount(
    token: string,
    tenantId: string,
    otpCode: string,
    email: string,
  ): Promise<ActionResponse> {
    const response = await apiFetch('/tenant-management/suspend/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId, otpCode, email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al suspender cuenta');
    }

    return response.json();
  },

  async deleteAccount(
    token: string,
    tenantId: string,
    otpCode: string,
    email: string,
  ): Promise<ActionResponse> {
    const response = await apiFetch('/tenant-management/delete/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId, otpCode, email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al eliminar cuenta');
    }

    return response.json();
  },

  async reactivateAccount(
    token: string,
    tenantId: string,
  ): Promise<ActionResponse> {
    const response = await apiFetch(`/tenant-management/reactivate/${tenantId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al reactivar cuenta');
    }

    return response.json();
  },
};
