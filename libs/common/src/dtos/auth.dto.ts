export interface SignUpDto {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface RefreshTokenDto {
  refreshToken: string;
}
