export type UserRole = 'SELLER' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
}

export interface LoginCredentials {
  name: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: string;
}