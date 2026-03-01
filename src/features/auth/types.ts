export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  field?: "email" | "password" | "name" | "root";
}
