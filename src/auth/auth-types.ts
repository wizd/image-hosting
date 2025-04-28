export interface User {
  id: string
  username: string
  email: string
  password: string // This should be hashed
  createdAt: string
}

export interface UserDTO {
  id: string
  username: string
  email: string
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  user: UserDTO
  token: string
}
