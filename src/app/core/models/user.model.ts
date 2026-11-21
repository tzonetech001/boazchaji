export interface User {
  id: number;
  first_name: string;
  second_name?: string;
  last_name: string;
  phone: string;
  email?: string;
  sex: 'Male' | 'Female';
  role: 'admin' | 'agent';
  language: string;
  theme: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}