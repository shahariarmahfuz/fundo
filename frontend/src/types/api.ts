export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description?: string | null;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string | null;
  is_system: boolean;
  permissions?: Permission[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string | null;
  is_active: boolean;
  roles?: string[];
  permissions?: string[];
  is_superadmin?: boolean;
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
