export interface Service {
  id?: number;
  agent_id: number;
  customer_id: number;
  customer_name?: string;
  device_type_id: number;
  device_name: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'paid';
  image_path?: string;
  created_at?: string;
}