import api from "../../utils/axios";

const BASE = "/admin/auth";

export interface AdminRegisterBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

export interface AdminLoginBody {
  identifier: string;
  password: string;
}

export interface AdminLoginResponse {
  admin: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  token: string;
}

export const authApi = {
  register: (body: AdminRegisterBody) =>
    api.post<{ success: boolean; data: { admin: unknown; token: string } }>(`${BASE}/register`, body),

  login: (body: AdminLoginBody) =>
    api.post<{ success: boolean; data: AdminLoginResponse }>(`${BASE}/login`, body),

  sendOtp: (phone: string) =>
    api.post<{ success: boolean }>(`${BASE}/send-otp`, { phone }),

  verifyOtp: (phone: string, otp: string) =>
    api.post<{ success: boolean; data?: { token: string } }>(`${BASE}/verify-otp`, { phone, otp }),
};
