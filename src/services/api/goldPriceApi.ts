import api from "../../utils/axios";

const BASE = "/admin/gold-price";

export interface GoldPriceBody {
  purity: string;
  pricePerGram: number;
  source?: string;
}

export const goldPriceApi = {
  createOrUpdate: (body: GoldPriceBody) =>
    api.post<{ success: boolean; data: unknown }>(BASE, body),

  getLatest: (purity?: string) =>
    api.get<{ success: boolean; data: unknown }>(`${BASE}/latest`, {
      params: purity ? { purity } : undefined,
    }),
};
