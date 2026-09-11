export type MovementType = 'IN' | 'OUT';

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
}

export interface Department {
  id: number;
  code: string;
  name: string;
  manager: string;
  active: number; // 1 or 0
  created_at?: string;
  materials_count?: number;
}

export interface Material {
  id: number;
  code: string;
  name: string;
  unit: string;
  min_quantity: number;
  unit_price: number;
  current_stock: number;
  category: string;
  location: string;
  created_at?: string;
  updated_at?: string;
  // Computed helpers:
  total_value?: number;
  status?: 'NORMAL' | 'LOW' | 'OUT_OF_STOCK';
}

export interface Movement {
  id: number;
  type: MovementType;
  material_id: number;
  material_code?: string;
  material_name?: string;
  material_unit?: string;
  date: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier?: string | null;
  invoice_number?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  department_code?: string | null;
  reason?: string | null;
  requested_by?: string | null;
  stock_before: number;
  stock_after: number;
  user_name?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface RequisitionItem {
  material_id: number;
  material_code: string;
  material_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Requisition {
  id: number;
  req_number: string;
  department_id: number;
  department_name?: string;
  department_code?: string;
  requested_by: string;
  authorized_by: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  reason: string;
  date: string;
  items: RequisitionItem[];
  total_value: number;
  notes?: string | null;
  created_at?: string;
}

export interface StockStats {
  total_materials: number;
  total_inventory_value: number;
  items_low_stock_count: number;
  items_out_of_stock_count: number;
  turnover_rate: number; // Taxa de rotatividade anualizada
  average_holding_days: number; // Tempo médio de permanência em dias
  total_entries_count: number;
  total_entries_value: number;
  total_exits_count: number;
  total_exits_value: number;
  movements_by_department: {
    department_id: number;
    department_name: string;
    department_code: string;
    total_quantity: number;
    total_value: number;
    percentage: number;
  }[];
  critical_materials: Material[];
  monthly_history: {
    month: string;
    entries_value: number;
    exits_value: number;
    entries_qty: number;
    exits_qty: number;
  }[];
}

export interface BestPracticeTopic {
  id: string;
  title: string;
  category: string;
  summary: string;
  details: string[];
  formula?: string;
  recommendation: string;
  badge: string;
}
