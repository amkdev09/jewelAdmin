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
  /** GET /api/admin/banner?page=1&limit=20&bannerType=homepage&isActive=true */
  list: (params?: BannerListParams) =>
    api.get<{ success: boolean; data: { items?: unknown[]; total?: number; page?: number; limit?: number; totalPages?: number } | unknown[] }>(BASE, { params }),

  /** POST /api/admin/banner — FormData (title, image, redirectUrl, bannerType, isActive, priority) or JSON (title, imageUrl, ...) */
  create: (data: FormData | CreateBannerBody) => {
    const isFormData = data instanceof FormData;
    return api.post<{ success: boolean; data: unknown }>(BASE, data, {
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
    });
  },
};
