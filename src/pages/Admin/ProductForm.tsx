import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import Button from "../../components/ui/button/Button";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { productApi } from "../../services/api";

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    metalType: "gold",
    metalColor: "yellow",
    purity: "22k",
    goldWeight: "",
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
      .then((res) => {
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
            makingCharges: p.makingCharges != null ? String(p.makingCharges) : "",
            gstRate: p.gstRate != null ? String(p.gstRate) : "3",
            tags: Array.isArray(p.tags) ? (p.tags as string[]).join(",") : "",
            imageUrls: Array.isArray(p.images) ? (p.images as string[]).join("\n") : "",
            isActive: p.isActive !== false,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Name is required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
      description: form.description || undefined,
      categoryId: form.categoryId || undefined,
      metalType: form.metalType,
      metalColor: form.metalColor,
      purity: form.purity,
      goldWeight: form.goldWeight ? Number(form.goldWeight) : undefined,
      makingCharges: form.makingCharges ? Number(form.makingCharges) : undefined,
      gstRate: form.gstRate ? Number(form.gstRate) : undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      images: form.imageUrls
        ? form.imageUrls.split("\n").map((u) => u.trim()).filter(Boolean)
        : undefined,
      isActive: form.isActive,
    };
    const promise = isEdit
      ? productApi.update(id!, payload)
      : productApi.create(payload);
    promise
      .then(() => {
        alert(isEdit ? "Product updated." : "Product created.");
        navigate("/admin/products");
      })
      .catch((err) =>
        alert((err as { message?: string })?.message ?? "Save failed")
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
              required
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
            <Label>Category ID</Label>
            <Input
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              placeholder="MongoDB category ID"
            />
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
            <Label>Purity</Label>
            <select
              value={form.purity}
              onChange={(e) => setForm((f) => ({ ...f, purity: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="24k">24k</option>
              <option value="22k">22k</option>
              <option value="18k">18k</option>
            </select>
          </div>
          <div>
            <Label>Gold weight (g)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.goldWeight}
              onChange={(e) => setForm((f) => ({ ...f, goldWeight: e.target.value }))}
              placeholder="5.5"
            />
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
          <Label>Image URLs (one per line)</Label>
          <textarea
            value={form.imageUrls}
            onChange={(e) => setForm((f) => ({ ...f, imageUrls: e.target.value }))}
            placeholder="https://..."
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
