import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Alert from "../../components/ui/alert/Alert";
import { productApi, categoryApi, type ProductFormData } from "../../services/api";

const METAL_COLORS = ["yellow", "rose", "white"];
const PURITIES = ["24k", "22k", "18k"];
const DIAMOND_TYPES = ["natural", "lab-grown", "none"];

interface CategoryOption {
  _id: string;
  name?: string;
  slug?: string;
}

type AlertVariant = "success" | "error" | "warning" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

/** MongoDB ObjectId is 24 hexadecimal characters */
function isValidObjectId(s: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(s);
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    metalType: "gold",
    metalColor: "yellow",
    purity: "22k",
    goldWeight: "",
    diamondWeight: "",
    diamondType: "natural",
    makingCharges: "",
    gstRate: "3",
    tags: "",
    imageUrls: "",
    isActive: true,
  });

  useEffect(() => {
    if (!id) return;
    productApi
      .getById(id)
      .then((res: { data: { success?: boolean; data?: unknown } }) => {
        if (res.data.success && res.data.data) {
          const p = res.data.data as Record<string, unknown>;
          setForm({
            name: (p.name as string) ?? "",
            slug: (p.slug as string) ?? "",
            description: (p.description as string) ?? "",
            categoryId: (p.categoryId as string) ?? "",
            metalType: (p.metalType as string) ?? "gold",
            metalColor: (p.metalColor as string) ?? "yellow",
            purity: (p.purity as string) ?? "22k",
            goldWeight: p.goldWeight != null ? String(p.goldWeight) : "",
            diamondWeight: p.diamondWeight != null ? String(p.diamondWeight) : "",
            diamondType: (p.diamondType as string) ?? "natural",
            makingCharges: p.makingCharges != null ? String(p.makingCharges) : "",
            gstRate: p.gstRate != null ? String(p.gstRate) : "3",
            tags: Array.isArray(p.tags) ? (p.tags as string[]).join(", ") : "",
            imageUrls: Array.isArray(p.images) ? (p.images as string[]).join("\n") : "",
            isActive: p.isActive !== false,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    setCategoriesLoading(true);
    categoryApi
      .list({ limit: 100, parentCategory: null, isActive: true })
      .then((res: {
        data: {
          success?: boolean;
          data?: { items?: CategoryOption[]; total?: number };
        };
      }) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data as { items: CategoryOption[] };
          setCategories(d.items ?? []);
        } else {
          setCategories([]);
        }
      })
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  const appendFormField = (fd: FormData, key: string, value: string | number | boolean) => {
    if (value === undefined || value === "") return;
    fd.append(key, String(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertState(null);
    if (!form.name.trim()) {
      setAlertState({
        variant: "warning",
        title: "Validation",
        message: "Name is required.",
      });
      return;
    }
    const categoryIdTrimmed = form.categoryId.trim();
    if (categoryIdTrimmed && !isValidObjectId(categoryIdTrimmed)) {
      setAlertState({
        variant: "warning",
        title: "Validation",
        message:
          "Category ID must be a valid 24-character hex ID (e.g. from your Categories list). Remove placeholders like {{...}}.",
      });
      return;
    }
    const slug =
      form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-");
    const tagsArray = form.tags
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    setSaving(true);

    if (imageFiles.length > 0) {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("slug", slug);
      appendFormField(fd, "description", form.description.trim());
      if (categoryIdTrimmed) fd.append("categoryId", categoryIdTrimmed);
      fd.append("metalType", form.metalType);
      fd.append("metalColor", form.metalColor);
      fd.append("purity", form.purity);
      appendFormField(fd, "goldWeight", form.goldWeight);
      appendFormField(fd, "diamondWeight", form.diamondWeight);
      appendFormField(fd, "diamondType", form.diamondType);
      appendFormField(fd, "makingCharges", form.makingCharges);
      appendFormField(fd, "gstRate", form.gstRate);
      tagsArray.forEach((t) => fd.append("tags", t));
      imageFiles.forEach((file) => fd.append("images", file));
      fd.append("isActive", form.isActive ? "true" : "false");

      const promise = isEdit
        ? productApi.update(id!, fd)
        : productApi.create(fd);
      promise
        .then(() => {
          setAlertState({
            variant: "success",
            title: "Success",
            message: isEdit ? "Product updated." : "Product created.",
          });
          navigate(isEdit && id ? `/admin/products/${id}` : "/admin/products");
        })
        .catch((err: unknown) =>
          setAlertState({
            variant: "error",
            title: "Error",
            message: (err as { message?: string })?.message ?? "Save failed",
          })
        )
        .finally(() => setSaving(false));
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description || undefined,
      categoryId: categoryIdTrimmed || undefined,
      metalType: form.metalType,
      metalColor: form.metalColor,
      purity: form.purity,
      goldWeight: form.goldWeight ? Number(form.goldWeight) : undefined,
      diamondWeight: form.diamondWeight ? Number(form.diamondWeight) : undefined,
      diamondType: form.diamondType || undefined,
      makingCharges: form.makingCharges ? Number(form.makingCharges) : undefined,
      gstRate: form.gstRate ? Number(form.gstRate) : undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      images: form.imageUrls
        ? form.imageUrls.split("\n").map((u) => u.trim()).filter(Boolean)
        : undefined,
      isActive: form.isActive,
    };
    const promise = isEdit
      ? productApi.update(id!, payload as ProductFormData)
      : productApi.create(payload as ProductFormData);
    promise
      .then(() => {
        setAlertState({
          variant: "success",
          title: "Success",
          message: isEdit ? "Product updated." : "Product created.",
        });
        navigate(isEdit && id ? `/admin/products/${id}` : "/admin/products");
      })
      .catch((err: unknown) =>
        setAlertState({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Save failed",
        })
      )
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-11 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={isEdit ? "Edit Product | Admin" : "New Product | Admin"}
        description={isEdit ? "Edit product" : "Create product"}
      />
      <PageBreadCrumb pageTitle={isEdit ? "Edit Product" : "New Product"} />
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-5"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Gold Ring"
            />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="gold-ring"
            />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Product description"
            rows={3}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label>Category</Label>
            <select
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  categoryId: e.target.value,
                }))
              }
              disabled={categoriesLoading}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">
                {categoriesLoading ? "Loading categories..." : "No category"}
              </option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name ?? c.slug ?? c._id}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select a category from your admin categories list. The selected category&apos;s
              ID will be sent as <span className="font-mono">categoryId</span> in the product API.
            </p>
          </div>
          <div>
            <Label>Metal type</Label>
            <select
              value={form.metalType}
              onChange={(e) => setForm((f) => ({ ...f, metalType: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
            </select>
          </div>
          <div>
            <Label>Metal color</Label>
            <select
              value={form.metalColor}
              onChange={(e) => setForm((f) => ({ ...f, metalColor: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {METAL_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Purity</Label>
            <select
              value={form.purity}
              onChange={(e) => setForm((f) => ({ ...f, purity: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {PURITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Gold weight (g)</Label>
            <Input
              type="number"
              step={0.01}
              value={form.goldWeight}
              onChange={(e) => setForm((f) => ({ ...f, goldWeight: e.target.value }))}
              placeholder="5.5"
            />
          </div>
          <div>
            <Label>Diamond weight (ct)</Label>
            <Input
              type="number"
              step={0.01}
              value={form.diamondWeight}
              onChange={(e) => setForm((f) => ({ ...f, diamondWeight: e.target.value }))}
              placeholder="0.5"
            />
          </div>
          <div>
            <Label>Diamond type</Label>
            <select
              value={form.diamondType}
              onChange={(e) => setForm((f) => ({ ...f, diamondType: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {DIAMOND_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Making charges (₹)</Label>
            <Input
              type="number"
              value={form.makingCharges}
              onChange={(e) => setForm((f) => ({ ...f, makingCharges: e.target.value }))}
              placeholder="2000"
            />
          </div>
          <div>
            <Label>GST %</Label>
            <Input
              type="number"
              value={form.gstRate}
              onChange={(e) => setForm((f) => ({ ...f, gstRate: e.target.value }))}
              placeholder="3"
            />
          </div>
        </div>
        <div>
          <Label>Tags (comma-separated)</Label>
          <Input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="ring, gold, diamond"
          />
        </div>
        <div>
          <Label>Images (upload files)</Label>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            Upload image files to send as FormData (per API). If you upload files, they are used instead of URLs below.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            multiple
            onChange={(e) => setImageFiles(e.target.files ? Array.from(e.target.files) : [])}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-600 dark:text-gray-400"
          />
          {imageFiles.length > 0 && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {imageFiles.length} file(s) selected
            </p>
          )}
        </div>
        <div>
          <Label>Image URLs (one per line, used when no files uploaded)</Label>
          <textarea
            value={form.imageUrls}
            onChange={(e) => setForm((f) => ({ ...f, imageUrls: e.target.value }))}
            placeholder="https://res.cloudinary.com/.../image1.jpg"
            rows={3}
            className="h-auto w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Product" : "Create Product"}
          </Button>
          <Link to="/admin/products">
            <Button
              type="button"
              size="sm"
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </>
  );
}
