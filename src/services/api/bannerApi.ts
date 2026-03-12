import api from "../../utils/axios";

const BASE = "/admin/banner";

export interface CreateBannerBody {
  title: string;
  imageUrl?: string;
  image?: File;
  redirectUrl?: string;
  bannerType?: string;
  isActive?: boolean;
  priority?: number;
}

export interface BannerListParams {
  page?: number;
  limit?: number;
  bannerType?: string;
  isActive?: boolean;
}

export const bannerApi = {
  list: (params?: BannerListParams) =>
    api.get<{ success: boolean; data: { items: unknown[]; total: number; page: number; limit: number; totalPages: number } }>(BASE, { params }),

  create: (data: FormData | CreateBannerBody) => {
    const isFormData = data instanceof FormData;
    return api.post<{ success: boolean; data: unknown }>(BASE, data, {
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
    });
  },
};
