import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Alert from "../../components/ui/alert/Alert";
import { bannerApi } from "../../services/api";
import { PlusIcon } from "../../icons";

type AlertVariant = "success" | "error" | "warning" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

interface Banner {
  _id: string;
  title?: string;
  imageUrl?: string;
  image?: string;
  redirectUrl?: string;
  bannerType?: string;
  isActive?: boolean;
  priority?: number;
}

const BANNER_TYPES = ["homepage", "category", "promo", "other"];

function getBannerList(
  data: { items?: Banner[] } | Banner[] | undefined
): Banner[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export default function Banners() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<{ bannerType?: string; isActive?: boolean }>({});
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    redirectUrl: "",
    bannerType: "homepage",
    isActive: true,
    priority: 1,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  const fetchBanners = () => {
    setLoading(true);
    const params: { limit?: number; page?: number; bannerType?: string; isActive?: boolean } = {
      limit: 50,
      page: 1,
    };
    if (filters.bannerType) params.bannerType = filters.bannerType;
    if (filters.isActive !== undefined) params.isActive = filters.isActive;
    bannerApi
      .list(params)
      .then((res: { data: { success?: boolean; data?: { items?: Banner[] } | Banner[] } }) => {
        if (res.data.success && res.data.data !== undefined) {
          setItems(getBannerList(res.data.data as { items?: Banner[] } | Banner[]));
        } else {
          setItems([]);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, [filters.bannerType, filters.isActive]);

  const openModal = () => {
    setAlertState(null);
    setForm({
      title: "",
      imageUrl: "",
      redirectUrl: "",
      bannerType: "homepage",
      isActive: true,
      priority: 1,
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertState(null);
    const title = form.title.trim();
    if (!title) {
      setAlertState({ variant: "warning", title: "Validation", message: "Title is required." });
      return;
    }
    const hasImage = imageFile != null || (form.imageUrl && form.imageUrl.trim() !== "");
    if (!hasImage) {
      setAlertState({ variant: "warning", title: "Validation", message: "Provide either an image file or an image URL." });
      return;
    }
    setSaving(true);
    if (imageFile) {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("image", imageFile);
      if (form.redirectUrl.trim()) fd.append("redirectUrl", form.redirectUrl.trim());
      fd.append("bannerType", form.bannerType);
      fd.append("isActive", form.isActive ? "true" : "false");
      fd.append("priority", String(form.priority));
      bannerApi
        .create(fd)
        .then(() => {
          setModalOpen(false);
          fetchBanners();
          setAlertState({ variant: "success", title: "Success", message: "Banner created." });
        })
        .catch((err: unknown) => {
          setAlertState({
            variant: "error",
            title: "Error",
            message: (err as { message?: string })?.message ?? "Create failed",
          });
        })
        .finally(() => setSaving(false));
    } else {
      const body = {
        title,
        imageUrl: form.imageUrl.trim(),
        redirectUrl: form.redirectUrl.trim() || undefined,
        bannerType: form.bannerType,
        isActive: form.isActive,
        priority: form.priority,
      };
      bannerApi
        .create(body)
        .then(() => {
          setModalOpen(false);
          fetchBanners();
          setAlertState({ variant: "success", title: "Success", message: "Banner created." });
        })
        .catch((err: unknown) => {
          setAlertState({
            variant: "error",
            title: "Error",
            message: (err as { message?: string })?.message ?? "Create failed",
          });
        })
        .finally(() => setSaving(false));
    }
  };

  return (
    <>
      <PageMeta title="Banners | Admin" description="Manage banners" />
      <PageBreadCrumb pageTitle="Banners" />
      {alertState && (
        <div className="relative mb-4">
          <Alert
            variant={alertState.variant}
            title={alertState.title}
            message={alertState.message}
          />
          <button
            type="button"
            onClick={() => setAlertState(null)}
            className="absolute right-3 top-3 rounded p-1 text-gray-500 hover:bg-gray-200/80 hover:text-gray-700 dark:hover:bg-gray-700/80 dark:hover:text-gray-300"
            aria-label="Dismiss"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Banners
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create and manage homepage and promo banners.
            </p>
          </div>
          <Button size="sm" onClick={openModal} className="inline-flex items-center gap-2">
            <PlusIcon className="size-5 text-white fill-white" />
            Add Banner
          </Button>
        </div>
        <div className="border-t border-gray-100 px-4 pb-4 pt-2 sm:px-6 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
            <select
              value={filters.bannerType ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, bannerType: e.target.value || undefined }))
              }
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All types</option>
              {BANNER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={filters.isActive === undefined ? "" : String(filters.isActive)}
              onChange={(e) => {
                const v = e.target.value;
                setFilters((f) => ({
                  ...f,
                  isActive: v === "" ? undefined : v === "true",
                }));
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <Table className="w-full table-fixed">
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/80 dark:bg-gray-800/40">
                <TableRow>
                  <TableCell
                    isHeader
                    className="w-[32%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Banner
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[14%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Type
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[10%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Priority
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[28%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Link
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[16%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No banners yet. Click &quot;Add Banner&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell className="px-4 py-2.5 text-left align-middle">
                        <div className="flex items-center gap-3">
                          {(b.imageUrl ?? b.image) ? (
                            <img
                              src={b.imageUrl ?? b.image}
                              alt=""
                              className="h-12 w-20 shrink-0 rounded object-cover"
                            />
                          ) : (
                            <div className="h-12 w-20 shrink-0 rounded bg-gray-200 dark:bg-gray-700" />
                          )}
                          <span className="min-w-0 font-medium text-gray-800 dark:text-white/90">
                            {b.title ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {b.bannerType ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {b.priority ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {b.redirectUrl ? (
                          <a
                            href={b.redirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-500 hover:underline truncate block max-w-full"
                          >
                            {b.redirectUrl}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle">
                        <Badge
                          size="sm"
                          color={b.isActive !== false ? "success" : "error"}
                        >
                          {b.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        className="max-w-lg p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Create Banner
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          POST /api/admin/banner — use image file (FormData) or image URL (JSON).
        </p>
        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Festival Sale"
            />
          </div>
          <div>
            <Label>Image (file or URL) *</Label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setImageFile(file ?? null);
                  if (file) setForm((f) => ({ ...f, imageUrl: "" }));
                }}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-white file:text-sm dark:text-gray-400"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">— or —</span>
              <Input
                value={form.imageUrl}
                onChange={(e) => {
                  setForm((f) => ({ ...f, imageUrl: e.target.value }));
                  if (e.target.value.trim()) setImageFile(null);
                }}
                placeholder="https://res.cloudinary.com/.../banner.jpg"
                disabled={!!imageFile}
              />
            </div>
          </div>
          <div>
            <Label>Redirect URL</Label>
            <Input
              value={form.redirectUrl}
              onChange={(e) => setForm((f) => ({ ...f, redirectUrl: e.target.value }))}
              placeholder="/products?category=festival"
            />
          </div>
          <div>
            <Label>Banner type</Label>
            <select
              value={form.bannerType}
              onChange={(e) => setForm((f) => ({ ...f, bannerType: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {BANNER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="banner-active"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <Label htmlFor="banner-active" className="mb-0">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="mb-0">Priority</Label>
              <Input
                type="number"
                min="0"
                value={String(form.priority)}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))
                }
                className="w-20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Creating…" : "Create Banner"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}