import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Alert from "../../components/ui/alert/Alert";
import { categoryApi } from "../../services/api";
import { PencilIcon, TrashBinIcon, PlusIcon } from "../../icons";

interface Category {
  _id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  parentCategory?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

type AlertVariant = "success" | "error" | "warning" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

type ParentFilter = "all" | "root";

export default function Categories() {
  const [items, setItems] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ isActive?: boolean; parent: ParentFilter }>({
    parent: "all",
  });
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parentCategory: "",
    isActive: true,
  });
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const limit = 10;

  const fetchCategories = () => {
    setLoading(true);
    const params: {
      page: number;
      limit: number;
      parentCategory?: string | null;
      isActive?: boolean;
    } = { page, limit };

    if (filters.parent === "root") {
      params.parentCategory = null;
    }
    if (filters.isActive !== undefined) {
      params.isActive = filters.isActive;
    }

    categoryApi
      .list(params)
      .then((res: { data: { success: boolean; data: { items: Category[]; total: number } } } | unknown) => {
        if ((res as { data: { success: boolean; data: { items: Category[]; total: number } } }).data.success && (res as { data: { success: boolean; data: { items: Category[]; total: number } } }).data.data) {
          const d = (res as { data: { success: boolean; data: { items: Category[]; total: number } } }).data.data;
          setItems(d.items ?? []);
          setTotal(d.total ?? 0);
        } else {
          setItems([]);
          setTotal(0);
        }
      })
      .catch((err: unknown) => {
        setItems([]);
        setTotal(0);
        setAlertState({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Failed to load categories.",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, [page, filters.parent, filters.isActive]);

  const totalPages = Math.ceil(total / limit) || 1;

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      parentCategory: "",
      isActive: true,
    });
    setAlertState(null);
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingId(category._id);
    setForm({
      name: category.name ?? "",
      slug: category.slug ?? "",
      description: category.description ?? "",
      parentCategory: category.parentCategory ?? "",
      isActive: category.isActive !== false,
    });
    setAlertState(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setAlertState({
        variant: "warning",
        title: "Validation",
        message: "Name is required.",
      });
      return;
    }

    const slug = (form.slug || name)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    const body = {
      name,
      slug,
      description: form.description.trim() || undefined,
      parentCategory: form.parentCategory.trim() || null,
      isActive: form.isActive,
    };

    setSaving(true);
    const request = editingId
      ? categoryApi.update(editingId, body)
      : categoryApi.create(body);

    request
      .then(() => {
        setModalOpen(false);
        fetchCategories();
        setAlertState({
          variant: "success",
          title: "Success",
          message: editingId ? "Category updated." : "Category created.",
        });
      })
      .catch((err: unknown) => {
        setAlertState({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Save failed. Please try again.",
        });
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = (category: Category) => {
    if (
      !window.confirm(
        `Delete category "${category.name}"?\nThis will fail if products or subcategories use it.`
      )
    ) {
      return;
    }
    setSaving(true);
    categoryApi
      .delete(category._id)
      .then(() => {
        fetchCategories();
        setAlertState({
          variant: "success",
          title: "Deleted",
          message: "Category deleted successfully.",
        });
      })
      .catch((err: unknown) => {
        setAlertState({
          variant: "error",
          title: "Cannot delete category",
          message:
            (err as { message?: string })?.message ??
            "Category cannot be deleted if products or subcategories exist.",
        });
      })
      .finally(() => setSaving(false));
  };

  return (
    <>
      <PageMeta title="Categories | Admin" description="Manage product categories" />
      <PageBreadCrumb pageTitle="Categories" />
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
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Categories
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Organize products into categories and subcategories.
            </p>
          </div>
          <Button size="sm" onClick={openCreateModal}>
            <span className="inline-flex items-center gap-2">
              <PlusIcon className="size-5 text-white fill-white" />
              Add Category
            </span>
          </Button>
        </div>
        <div className="border-t border-gray-100 px-4 pb-4 pt-2 sm:px-6 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
            <select
              value={filters.parent}
              onChange={(e) =>
                setFilters((f) => ({ ...f, parent: e.target.value as ParentFilter }))
              }
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="all">All categories</option>
              <option value="root">Top-level only</option>
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
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <Table className="w-full table-fixed">
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/80 dark:bg-gray-800/40">
                <TableRow>
                  <TableCell
                    isHeader
                    className="w-[30%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[26%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Slug
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[22%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Parent
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[12%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-[10%] px-4 py-2.5 text-right font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                  >
                    Actions
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
                      No categories yet. Click &quot;Add Category&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="px-4 py-2.5 text-left align-middle font-medium text-gray-800 dark:text-white/90">
                        {c.name ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {c.slug ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {c.parentCategory ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${c.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                            }`}
                        >
                          {c.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right align-middle">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Edit"
                          >
                            <PencilIcon className="size-5 text-gray-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="rounded-lg p-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete"
                            disabled={saving}
                          >
                            <TrashBinIcon className="size-5 text-red-500" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-800 p-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        className="max-w-xl p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {editingId ? "Edit Category" : "Create Category"}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {editingId
            ? "Update the category name, slug, parent, and status."
            : "Create a new category to organize products."}
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Rings"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Slug
              </label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="rings"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  description: e.target.value,
                }))
              }
              placeholder="Gold and silver rings"
              className="min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Parent category ID
              </label>
              <input
                value={form.parentCategory}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parentCategory: e.target.value }))
                }
                placeholder="Leave blank for top-level"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2 pt-6 sm:pt-8">
              <input
                id="category-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label
                htmlFor="category-active"
                className="text-sm font-medium text-gray-700 dark:text-gray-400"
              >
                Active
              </label>
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
              {saving ? "Saving…" : editingId ? "Save changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

