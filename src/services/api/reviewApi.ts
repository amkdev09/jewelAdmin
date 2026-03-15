import api from "../../utils/axios";

const ADMIN_BASE = "/admin/review";
const PUBLIC_BASE = "/reviews";

export interface AdminReviewListParams {
  page?: number;
  limit?: number;
  productId?: string;
  userId?: string;
  rating?: number;
}

export interface ReviewUserRef {
  _id: string;
  name?: string;
  email?: string;
}

export interface ReviewProductRef {
  _id: string;
  name?: string;
  slug?: string;
}

export interface ReviewItem {
  _id: string;
  userId: string | ReviewUserRef;
  productId: string | ReviewProductRef;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewListResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewsByProductResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: Record<string, number>;
}

/** Admin: list reviews with optional filters */
export const reviewApi = {
  list: (params?: AdminReviewListParams) =>
    api.get<{ success: boolean; data: ReviewListResponse }>(ADMIN_BASE, {
      params,
    }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: ReviewItem }>(`${ADMIN_BASE}/${id}`),

  delete: (id: string) =>
    api.delete<{ success: boolean; message?: string }>(`${ADMIN_BASE}/${id}`),

  /** Public: get reviews for a product (for display on product detail) */
  getByProduct: (productId: string, params?: { page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: ReviewsByProductResponse }>(
      `${PUBLIC_BASE}/product/${productId}`,
      { params }
    ),
};
