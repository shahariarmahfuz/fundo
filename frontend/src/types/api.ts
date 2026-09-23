export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'staff' | 'viewer';
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string;
  error_code?: string;
}
