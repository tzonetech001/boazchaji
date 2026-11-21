export interface Service {
  id?: number;
  agent_id: number;
  agent_name?: string;          // Ongeza
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;      // Ongeza
  device_type_id: number;
  device_type_name?: string;    // Ongeza
  device_name: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'paid';
  image_path?: string;
  created_at?: string;
}