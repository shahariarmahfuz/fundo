import { User } from '@/types/api';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return (
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL?.startsWith('http')
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://127.0.0.1:8000/api/v1')
  );
};

const BASE_URL = getBaseUrl();

export class ApiClient {
  private static token: string | null = null;
  private static user: User | null = null;

  static setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem('fundo_auth_token', token);
        document.cookie = `fundo_access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        sessionStorage.removeItem('fundo_auth_token');
        document.cookie = 'fundo_access_token=; path=/; max-age=0; SameSite=Lax';
      }
    }
  }

  static getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('fundo_auth_token');
      if (stored) {
        this.token = stored;
        return stored;
      }
      const match = document.cookie.match(/(?:^|;\s*)fundo_access_token=([^;]+)/);
      if (match) {
        this.token = match[1];
        return match[1];
      }
    }
    return null;
  }

  static setUser(user: User | null) {
    this.user = user;
    if (typeof window !== 'undefined') {
      if (user) {
        sessionStorage.setItem('fundo_auth_user', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('fundo_auth_user');
      }
    }
  }

  static getUser(): User | null {
    if (this.user) return this.user;
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('fundo_auth_user');
      if (stored) {
        try {
          this.user = JSON.parse(stored);
          return this.user;
        } catch {
          sessionStorage.removeItem('fundo_auth_user');
        }
      }
    }
    return null;
  }

  static hasPermission(permissionCode: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    if (user.is_superadmin || user.role === 'super_admin' || user.role === 'superadmin') return true;
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permissionCode);
    }
    return false;
  }

  static async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.setToken(null);
        this.setUser(null);
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          window.location.href = '/login';
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        const err = new Error(errorData.detail || `Request failed with status ${response.status}`);
        (err as any).status = response.status;
        throw err;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err.message);
      throw err;
    }
  }

  // Convenience methods
  static get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }

  static post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
