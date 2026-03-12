import api from "../../utils/axios";

const BASE = "/admin/coupon";

export interface CreateCouponBody {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit?: number;
  isActive?: boolean;
}

export interface CouponListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export const couponApi = {
  list: (params?: CouponListParams) =>
    api.get<{ success: boolean; data: { items: unknown[]; total: number; page: number; limit: number; totalPages: number } }>(BASE, { params }),

  create: (body: CreateCouponBody) =>
    api.post<{ success: boolean; data: unknown }>(BASE, body),
};
