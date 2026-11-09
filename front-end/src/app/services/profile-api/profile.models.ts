export interface ProfileUser {
  name: string;
  email: string;
  avatar?: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface NewJWT {
  token: string;
}