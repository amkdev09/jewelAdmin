import api from "../../utils/axios";

const BASE = "/admin/upload";

export const uploadApi = {
  uploadImage: (file: File, folder = "products") => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post<{
      success: boolean;
      data: { url: string; publicId: string; width?: number; height?: number; format?: string; size?: number };
    }>(`${BASE}/image?folder=${folder}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadImages: (files: File[], folder = "products") => {
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    return api.post<{ success: boolean; data: { urls: string[] } }>(`${BASE}/images?folder=${folder}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteImage: (publicId: string) =>
    api.delete<{ success: boolean }>(`${BASE}/image/${encodeURIComponent(publicId)}`),
};
