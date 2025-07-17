export interface Role {
  id?: number;
  name: string;
  description?: string;
  creationDate?: string;
  lastModifyDate?: string;
}

export interface GrantedAuthority {
  authority?: string;
}

export interface User {
  id?: number;
  firstName?: string;
  email?: string;
  telephone?: string;
  dateNaiss?: string;
  photos?: string;
  password?: string;
  enabled?: boolean;          // Utilise "enabled" au lieu de "enable" pour cohérence avec backend et Angular
  accountLocked?: boolean;
  roles?: Role[];
  authorities?: GrantedAuthority[];
  username?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface RegisterRequest {
  firstName: string;
  email: string;
  telephone: string;
  dateNaiss: string;
  password: string;
}

export interface AuthenticationResponse {
  token?: string;
  refreshToken?: string;
  user?: User;
  userList?: User[];
  message?: string;
  erroMsg?: string;
  totalElements?: number;
  totalPages?: number;
}

export interface RegistrationResponse {
  message?: string;
  erroMsg?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
