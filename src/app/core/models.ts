export interface User {
  id: number;
  first_name: string;
  second_name?: string | null;
  last_name: string;
  phone: string;
  email?: string | null;
  role: 'admin' | 'agent';
  is_super_admin?: boolean;
  language: 'sw' | 'en';
  theme: 'light' | 'dark';
  profile_image_path?: string | null;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
}

export interface DeviceType {
  id: number;
  name: string;
}

export interface ServiceRecord {
  id: number;
  agent_id?: number;
  customer_id?: number;
  customer_name: string;
  customer_phone?: string | null;
  device_type: string;
  device_name: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'paid';
  image_path?: string | null;
  created_at: string;
  agent_first_name?: string;
  agent_last_name?: string;
}

export interface DashboardData {
  stats: {
    pending_amount: string;
    paid_today: string;
    total_services: number;
    pending_count: number;
  };
  recent: ServiceRecord[];
  agents?: Array<{
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    service_count: number;
    paid_total: string;
  }>;
}

export interface ActivityEntry {
  id: number;
  action_taken: string;
  target_record_id: number | null;
  details: string | null;
  timestamp: string;
  user_id: number;
  first_name: string;
  last_name: string;
  role: 'admin' | 'agent';
}
