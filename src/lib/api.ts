import { Material, Department, Movement, Requisition, StockStats, User } from '../types.ts';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('inventory_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }
  return data;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Materials
  async getMaterials(): Promise<Material[]> {
    const res = await fetch(`${API_BASE}/materials`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async createMaterial(data: Partial<Material>): Promise<Material> {
    const res = await fetch(`${API_BASE}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateMaterial(id: number, data: Partial<Material>): Promise<Material> {
    const res = await fetch(`${API_BASE}/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteMaterial(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/materials/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    const res = await fetch(`${API_BASE}/departments`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const res = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateDepartment(id: number, data: Partial<Department>): Promise<Department> {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteDepartment(id: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Movements
  async getMovements(filters?: {
    type?: string;
    material_id?: number;
    department_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<Movement[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.material_id) params.append('material_id', String(filters.material_id));
    if (filters?.department_id) params.append('department_id', String(filters.department_id));
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const res = await fetch(`${API_BASE}/movements?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async registerEntry(data: {
    material_id: number;
    quantity: number;
    unit_price?: number;
    supplier?: string;
    invoice_number?: string;
    date?: string;
    user_name?: string;
    notes?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/movements/in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async registerExit(data: {
    material_id: number;
    quantity: number;
    department_id: number;
    reason: string;
    requested_by?: string;
    date?: string;
    user_name?: string;
    notes?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/movements/out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Requisitions
  async getRequisitions(): Promise<Requisition[]> {
    const res = await fetch(`${API_BASE}/requisitions`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async createRequisition(data: {
    department_id: number;
    requested_by: string;
    authorized_by?: string;
    reason: string;
    date?: string;
    items: { material_id: number; quantity: number }[];
    notes?: string;
  }): Promise<Requisition> {
    const res = await fetch(`${API_BASE}/requisitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Stats
  async getStats(): Promise<StockStats> {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Reset demo
  async resetDemo(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/system/reset-demo`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },
};
