export interface AuthUser {
  id: string;
  public_id: string;
  email: string;
  display_name: string;
  roles: string[];
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}
