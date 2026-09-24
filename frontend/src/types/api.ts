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
  avatar_url?: string | null;
  avatar_public_id?: string | null;
  is_active: boolean;
  roles?: string[];
  permissions?: string[];
  is_superadmin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  provider: string;
  public_id: string;
  secure_url: string;
  resource_type: string;
  format?: string | null;
  bytes_size?: number | null;
  width?: number | null;
  height?: number | null;
  purpose: string;
  folder: string;
  original_filename?: string | null;
  created_at: string;
}

export interface MediaUploadResponse {
  success: boolean;
  message: string;
  asset: MediaAsset;
  url: string;
  public_id: string;
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
