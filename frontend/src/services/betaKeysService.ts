import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface BetaKey {
  id: string;
  key: string;
  isUsed: boolean;
  usedByTenantId: string | null;
  usedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  usedByTenant?: {
    id: string;
    businessName: string;
  };
}

export interface BetaKeyStats {
  total: number;
  used: number;
  available: number;
  usagePercentage: number;
}

export interface CreateBetaKeyDto {
  notes?: string;
}

export const betaKeysService = {
  /**
   * Obtiene todas las beta keys (requiere auth de admin)
   */
  async getAll(token: string): Promise<BetaKey[]> {
    const { data } = await axios.get<BetaKey[]>(`${API_URL}/beta-keys`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  /**
   * Obtiene estadísticas de beta keys (requiere auth de admin)
   */
  async getStats(token: string): Promise<BetaKeyStats> {
    const { data } = await axios.get<BetaKeyStats>(`${API_URL}/beta-keys/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },

  /**
   * Genera nuevas beta keys (requiere auth de admin)
   */
  async generateKeys(token: string, count: number, notes?: string): Promise<BetaKey[]> {
    const { data } = await axios.post<BetaKey[]>(
      `${API_URL}/beta-keys/bulk`,
      { count, notes },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  },

  /**
   * Elimina una beta key (requiere auth de admin)
   */
  async delete(token: string, id: string): Promise<void> {
    await axios.delete(`${API_URL}/beta-keys/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Actualiza notas de una beta key (requiere auth de admin)
   */
  async updateNotes(token: string, id: string, notes: string): Promise<BetaKey> {
    const { data } = await axios.patch<BetaKey>(
      `${API_URL}/beta-keys/${id}`,
      { notes },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  },
};
