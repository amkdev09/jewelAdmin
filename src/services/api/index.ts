export { authApi } from "./authApi";
export { productApi } from "./productApi";
export { orderApi } from "./orderApi";
export { userApi } from "./userApi";
export { couponApi } from "./couponApi";
export { bannerApi } from "./bannerApi";
export { goldPriceApi } from "./goldPriceApi";
export { analyticsApi } from "./analyticsApi";
export { uploadApi } from "./uploadApi";
export { categoryApi } from "./categoryApi";
export { inventoryApi } from "./inventoryApi";
export { variantApi } from "./variantApi";
export { reviewApi } from "./reviewApi";

export type { AdminLoginBody, AdminLoginResponse } from "./authApi";
export type { ProductListParams, ProductFormData } from "./productApi";
export type { OrderListParams, OrderStatus, PaymentStatus, UpdateOrderStatusBody } from "./orderApi";
export type { UserListParams } from "./userApi";
export type { CreateCouponBody, CouponListParams } from "./couponApi";
export type { CreateBannerBody, BannerListParams } from "./bannerApi";
export type { GoldPriceBody } from "./goldPriceApi";
export type { DashboardMetrics } from "./analyticsApi";
export type {
  InventoryListParams,
  CreateInventoryBody,
  UpdateInventoryBody,
  AddStockBody,
  RemoveStockBody,
  InventoryItem,
  InventoryHistoryItem,
} from "./inventoryApi";
export type {
  CreateVariantBody,
  UpdateVariantBody,
  Variant,
  VariantInventoryRef,
} from "./variantApi";
export type {
  AdminReviewListParams,
  ReviewItem,
  ReviewListResponse,
  ReviewsByProductResponse,
  ReviewUserRef,
  ReviewProductRef,
} from "./reviewApi";
