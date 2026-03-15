import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams, Link } from "react-router";
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
import Alert from "../../components/ui/alert/Alert";
import { Modal } from "../../components/ui/modal";
import {
  productApi,
  variantApi,
  inventoryApi,
  reviewApi,
  type Variant,
  type InventoryItem,
  type ReviewItem,
} from "../../services/api";
import { PencilIcon, TrashBinIcon, PlusIcon, BoxIcon } from "../../icons";

type TabId = "overview" | "variants" | "inventory" | "reviews";

interface ProductData {
  _id: string;
  name?: string;
  slug?: string;
  description?: string;
  images?: string[];
  basePrice?: number;
  isActive?: boolean;
  categoryId?: string | { _id: string; name?: string };
  metalType?: string;
  metalColor?: string;
  purity?: string;
  goldWeight?: number;
  diamondWeight?: number;
  diamondType?: string;
  makingCharges?: number;
  gstRate?: number;
}

type AlertVariant = "success" | "error" | "warning" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Variant fields we show for inventory (populated variantId object). */
interface VariantDisplayFields {
  ringSize?: string;
  purity?: string;
  metalColor?: string;
  priceAdjustment?: number;
}

function variantDisplayFromItem(item: InventoryItem): ReactNode {
  const v = item.variantId;
  if (typeof v !== "object" || v === null) {
    return String(v ?? "—");
  }
  const vv = v as VariantDisplayFields;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const parts = [
    vv.ringSize,
    vv.purity,
    vv.metalColor ? cap(String(vv.metalColor)) : undefined,
  ].filter(Boolean);
  const main = parts.length ? parts.join(" · ") : "—";
  const adjustment = vv.priceAdjustment != null && vv.priceAdjustment !== 0;
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span>{main}</span>
      {adjustment && (
        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
          {vv.priceAdjustment! > 0 ? "+" : ""}{formatCurrency(vv.priceAdjustment!)}
        </span>
      )}
    </span>
  );
}

function isLowStock(item: InventoryItem): boolean {
  const reorder = item.reorderLevel ?? 0;
  const available = item.stockAvailable ?? 0;
  return reorder > 0 && available <= reorder;
}

export default function ProductDetail() {
  const { id: productId } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  const fetchProduct = useCallback(() => {
    if (!productId) return;
    setLoading(true);
    productApi
      .getById(productId)
      .then((res: { data: { success?: boolean; data?: unknown } }) => {
        if (res.data.success && res.data.data) {
          setProduct(res.data.data as ProductData);
        } else {
          setProduct(null);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="mt-6 h-32 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (!product || !productId) {
    return (
      <>
        <PageBreadCrumb pageTitle="Product" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-gray-500 dark:text-gray-400">Product not found.</p>
          <Link to="/admin/products" className="mt-4 inline-block text-brand-500 hover:underline">
            Back to Products
          </Link>
        </div>
      </>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "variants", label: "Variants" },
    { id: "inventory", label: "Inventory" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <>
      <PageMeta
        title={`${product.name ?? "Product"} | Admin`}
        description="Manage product, variants and inventory"
      />
      <PageBreadCrumb pageTitle={product.name ?? "Product"} />
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <BoxIcon className="size-7 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {product.name ?? product.slug ?? "—"}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge size="sm" color={product.isActive !== false ? "success" : "error"}>
                  {product.isActive !== false ? "Active" : "Inactive"}
                </Badge>
                {product.basePrice != null && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(product.basePrice)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/admin/products/${productId}/edit`}>
              <Button size="sm" className="inline-flex items-center gap-2">
                <PencilIcon className="size-4" />
                Edit Product
              </Button>
            </Link>
            <Link to="/admin/products">
              <Button size="sm" variant="outline">Back to List</Button>
            </Link>
          </div>
        </div>

        <div className="border-b border-gray-100 dark:border-gray-800">
          <nav className="flex gap-1 px-4 sm:px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === "overview" && (
            <OverviewTab product={product} />
          )}
          {activeTab === "variants" && (
            <VariantsTab
              productId={productId}
              productName={product.name ?? product.slug ?? "Product"}
              onAlert={setAlertState}
            />
          )}
          {activeTab === "inventory" && (
            <InventoryTab
              productId={productId}
              productName={product.name ?? product.slug ?? "Product"}
              onAlert={setAlertState}
            />
          )}
          {activeTab === "reviews" && (
            <ReviewsTab productId={productId} />
          )}
        </div>
      </div>
    </>
  );
}

function OverviewTab({ product }: { product: ProductData }) {
  const categoryName: string =
    typeof product.categoryId === "object" && product.categoryId?.name
      ? product.categoryId.name
      : typeof product.categoryId === "string"
        ? product.categoryId
        : "—";

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt className="text-sm text-gray-500 dark:text-gray-400">Slug</dt>
        <dd className="mt-0.5 font-medium text-gray-800 dark:text-white/90">{product.slug ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500 dark:text-gray-400">Category</dt>
        <dd className="mt-0.5 text-gray-800 dark:text-white/90">{categoryName}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500 dark:text-gray-400">Base price</dt>
        <dd className="mt-0.5 text-gray-800 dark:text-white/90">
          {product.basePrice != null ? formatCurrency(product.basePrice) : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500 dark:text-gray-400">Metal</dt>
        <dd className="mt-0.5 text-gray-800 dark:text-white/90">
          {[product.metalType, product.metalColor, product.purity].filter(Boolean).join(" / ") || "—"}
        </dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500 dark:text-gray-400">Gold weight (g)</dt>
        <dd className="mt-0.5 text-gray-800 dark:text-white/90">{product.goldWeight ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-sm text-gray-500 dark:text-gray-400">Diamond</dt>
        <dd className="mt-0.5 text-gray-800 dark:text-white/90">
          {product.diamondWeight != null ? `${product.diamondWeight} ct` : "—"}
          {product.diamondType ? ` (${product.diamondType})` : ""}
        </dd>
      </div>
      {product.description && (
        <div className="sm:col-span-2 lg:col-span-3">
          <dt className="text-sm text-gray-500 dark:text-gray-400">Description</dt>
          <dd className="mt-0.5 text-gray-800 dark:text-white/90 whitespace-pre-wrap">{product.description}</dd>
        </div>
      )}
    </dl>
  );
}

function VariantsTab({
  productId,
  productName,
  onAlert,
}: {
  productId: string;
  productName: string;
  onAlert: (a: AlertState) => void;
}) {
  const [items, setItems] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    ringSize: "",
    purity: "",
    metalColor: "",
    priceAdjustment: 0,
  });

  const fetchVariants = useCallback(() => {
    setLoading(true);
    variantApi
      .listByProduct(productId)
      .then((res) => {
        if (res.data.success && res.data.data) {
          setItems(Array.isArray(res.data.data) ? res.data.data : []);
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        setItems([]);
        onAlert({ variant: "error", title: "Error", message: "Failed to load variants." });
      })
      .finally(() => setLoading(false));
  }, [productId, onAlert]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ringSize: "", purity: "", metalColor: "", priceAdjustment: 0 });
    setModalOpen(true);
  };

  const openEdit = (v: Variant) => {
    setEditingId(v._id);
    setForm({
      ringSize: v.ringSize ?? "",
      purity: v.purity ?? "",
      metalColor: v.metalColor ?? "",
      priceAdjustment: v.priceAdjustment ?? 0,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editingId) {
      variantApi
        .update(editingId, {
          ringSize: form.ringSize.trim() || undefined,
          purity: form.purity.trim() || undefined,
          metalColor: form.metalColor.trim() || undefined,
          priceAdjustment: form.priceAdjustment,
        })
        .then(() => {
          setModalOpen(false);
          fetchVariants();
          onAlert({ variant: "success", title: "Success", message: "Variant updated." });
        })
        .catch((err: unknown) => {
          onAlert({
            variant: "error",
            title: "Error",
            message: (err as { message?: string })?.message ?? "Update failed.",
          });
        })
        .finally(() => setSaving(false));
    } else {
      variantApi
        .create({
          productId,
          ringSize: form.ringSize.trim() || undefined,
          purity: form.purity.trim() || undefined,
          metalColor: form.metalColor.trim() || undefined,
          priceAdjustment: form.priceAdjustment,
        })
        .then(() => {
          setModalOpen(false);
          fetchVariants();
          onAlert({ variant: "success", title: "Success", message: "Variant created." });
        })
        .catch((err: unknown) => {
          onAlert({
            variant: "error",
            title: "Error",
            message: (err as { message?: string })?.message ?? "Create failed.",
          });
        })
        .finally(() => setSaving(false));
    }
  };

  const handleDelete = (v: Variant) => {
    const label = [v.ringSize, v.purity, v.metalColor].filter(Boolean).join(" / ") || v._id;
    if (!window.confirm(`Delete variant "${label}"? This will also delete the associated inventory.`)) return;
    setSaving(true);
    variantApi
      .delete(v._id)
      .then(() => {
        fetchVariants();
        onAlert({ variant: "success", title: "Deleted", message: "Variant deleted." });
      })
      .catch((err: unknown) => {
        onAlert({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Delete failed.",
        });
      })
      .finally(() => setSaving(false));
  };

  const inventoryDisplay = (v: Variant) => {
    const inv = v.inventoryId;
    if (!inv) return "—";
    if (typeof inv === "object") {
      const parts = [];
      if (inv.sku) parts.push(inv.sku);
      if (inv.stockAvailable != null) parts.push(`Stock: ${inv.stockAvailable}`);
      return parts.length ? parts.join(" · ") : "—";
    }
    return String(inv);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Variants for {productName}. Each variant can have its own ring size, purity, metal color and price adjustment.
        </p>
        <Button size="sm" onClick={openCreate}>
          <span className="inline-flex items-center gap-2">
            <PlusIcon className="size-5 fill-white" />
            Add Variant
          </span>
        </Button>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <Table className="w-full">
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/80 dark:bg-gray-800/40">
            <TableRow>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">Ring size</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">Purity</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">Metal color</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">Price adjustment</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">Inventory</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-right font-medium text-gray-500 text-theme-xs dark:text-gray-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No variants yet. Add a variant to define size/purity/color options and link inventory.
                </TableCell>
              </TableRow>
            ) : (
              items.map((v) => (
                <TableRow key={v._id}>
                  <TableCell className="px-4 py-2.5 font-medium text-gray-800 dark:text-white/90">{v.ringSize ?? "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{v.purity ?? "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{v.metalColor ?? "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                    {v.priceAdjustment != null ? formatCurrency(v.priceAdjustment) : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-theme-xs">{inventoryDisplay(v)}</TableCell>
                  <TableCell className="px-4 py-2.5 text-right">
                    <div className="inline-flex justify-end gap-2">
                      <button type="button" onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Edit">
                        <PencilIcon className="size-5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(v)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
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

      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} className="max-w-xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {editingId ? "Edit Variant" : "Add Variant"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Ring size</label>
              <input
                value={form.ringSize}
                onChange={(e) => setForm((f) => ({ ...f, ringSize: e.target.value }))}
                placeholder="e.g. 8"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Purity</label>
              <input
                value={form.purity}
                onChange={(e) => setForm((f) => ({ ...f, purity: e.target.value }))}
                placeholder="e.g. 22k"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Metal color</label>
              <input
                value={form.metalColor}
                onChange={(e) => setForm((f) => ({ ...f, metalColor: e.target.value }))}
                placeholder="e.g. yellow"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Price adjustment (₹)</label>
              <input
                type="number"
                value={form.priceAdjustment || ""}
                onChange={(e) => setForm((f) => ({ ...f, priceAdjustment: Number(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : editingId ? "Save" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InventoryTab({
  productId,
  productName,
  onAlert,
}: {
  productId: string;
  productName: string;
  onAlert: (a: AlertState) => void;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    variantId: "",
    sku: "",
    stockAvailable: 100,
    stockReserved: 0,
    reorderLevel: 10,
    warehouseLocation: "",
  });

  const fetchInventory = useCallback(() => {
    setLoading(true);
    inventoryApi
      .list({ page: 1, limit: 50, productId })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setItems(res.data.data.items ?? []);
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        setItems([]);
        onAlert({ variant: "error", title: "Error", message: "Failed to load inventory." });
      })
      .finally(() => setLoading(false));
  }, [productId, onAlert]);

  const fetchVariants = useCallback(() => {
    variantApi.listByProduct(productId).then((res) => {
      if (res.data.success && res.data.data) {
        setVariants(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setVariants([]);
      }
    }).catch(() => setVariants([]));
  }, [productId]);

  useEffect(() => {
    fetchInventory();
    fetchVariants();
  }, [fetchInventory, fetchVariants]);

  const openCreate = () => {
    setForm({
      variantId: variants[0]?._id ?? "",
      sku: "",
      stockAvailable: 100,
      stockReserved: 0,
      reorderLevel: 10,
      warehouseLocation: "",
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.variantId.trim()) {
      onAlert({ variant: "warning", title: "Validation", message: "Select a variant." });
      return;
    }
    setSaving(true);
    inventoryApi
      .create({
        productId,
        variantId: form.variantId.trim(),
        sku: form.sku.trim() || undefined,
        stockAvailable: form.stockAvailable,
        stockReserved: form.stockReserved,
        reorderLevel: form.reorderLevel,
        warehouseLocation: form.warehouseLocation.trim() || undefined,
      })
      .then(() => {
        setModalOpen(false);
        fetchInventory();
        onAlert({ variant: "success", title: "Success", message: "Inventory created." });
      })
      .catch((err: unknown) => {
        onAlert({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Create failed.",
        });
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = (item: InventoryItem) => {
    const label = item.sku ?? item._id;
    if (!window.confirm(`Delete inventory "${label}"?`)) return;
    setSaving(true);
    inventoryApi
      .delete(item._id)
      .then(() => {
        fetchInventory();
        onAlert({ variant: "success", title: "Deleted", message: "Inventory deleted." });
      })
      .catch((err: unknown) => {
        onAlert({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Delete failed.",
        });
      })
      .finally(() => setSaving(false));
  };

  const variantLabel = (v: Variant) =>
    [v.ringSize, v.purity, v.metalColor].filter(Boolean).join(" / ") || v._id;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Inventory for {productName}. Each row is one variant’s stock. Open a row to adjust stock and view history.
        </p>
        <Button size="sm" onClick={openCreate} disabled={variants.length === 0}>
          <span className="inline-flex items-center gap-2">
            <PlusIcon className="size-5 fill-white" />
            Add Inventory
          </span>
        </Button>
      </div>
      {variants.length === 0 && (
        <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
          Add at least one variant in the Variants tab before adding inventory.
        </p>
      )}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <Table className="w-full">
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50/80 dark:bg-gray-800/40">
            <TableRow>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">Variant</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">SKU</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">Available</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">Reserved</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">Reorder</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">Location</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-right font-medium text-gray-500 text-theme-xs dark:text-gray-400">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No inventory for this product. Add a variant first, then add inventory.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="px-4 py-2.5 font-medium text-gray-800 dark:text-white/90">{variantDisplayFromItem(item)}</TableCell>
                  <TableCell className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{item.sku ?? "—"}</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <span className={isLowStock(item) ? "font-medium text-amber-600 dark:text-amber-400" : ""}>
                      {item.stockAvailable ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{item.stockReserved ?? 0}</TableCell>
                  <TableCell className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{item.reorderLevel ?? "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{item.warehouseLocation ?? "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-right">
                    <div className="inline-flex justify-end gap-2">
                      <Link
                        to={`/admin/inventory/${item._id}`}
                        state={{ fromProductId: productId }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Manage stock"
                      >
                        <PencilIcon className="size-5 text-gray-500" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
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

      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} className="max-w-xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Add Inventory</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create an inventory record for a variant of this product.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Variant *</label>
            <select
              value={form.variantId}
              onChange={(e) => setForm((f) => ({ ...f, variantId: e.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Select variant</option>
              {variants.map((v) => (
                <option key={v._id} value={v._id}>{variantLabel(v)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">SKU (optional)</label>
            <input
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              placeholder="e.g. GOLD-RING-8-22K-001"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Stock available</label>
              <input
                type="number"
                min={0}
                value={form.stockAvailable}
                onChange={(e) => setForm((f) => ({ ...f, stockAvailable: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Reorder level</label>
              <input
                type="number"
                min={0}
                value={form.reorderLevel}
                onChange={(e) => setForm((f) => ({ ...f, reorderLevel: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Warehouse location</label>
            <input
              value={form.warehouseLocation}
              onChange={(e) => setForm((f) => ({ ...f, warehouseLocation: e.target.value }))}
              placeholder="e.g. Warehouse A"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ReviewsTab({ productId }: { productId: string }) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState<number | null>(null);
  const [ratingDistribution, setRatingDistribution] = useState<Record<string, number> | null>(null);
  const limit = 10;

  const fetchReviews = useCallback(() => {
    setLoading(true);
    reviewApi
      .getByProduct(productId, { page, limit })
      .then((res: { data: { success?: boolean; data?: { items?: ReviewItem[]; total?: number; averageRating?: number; totalReviews?: number; ratingDistribution?: Record<string, number> } } }) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setItems(d.items ?? []);
          setTotal(d.total ?? 0);
          setAverageRating(d.averageRating ?? null);
          setTotalReviews(d.totalReviews ?? d.total ?? null);
          setRatingDistribution(d.ratingDistribution ?? null);
        } else {
          setItems([]);
          setTotal(0);
        }
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [productId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const userName = (item: ReviewItem) => {
    const u = item.userId;
    if (typeof u === "object" && u?.name) return u.name;
    return String(u ?? "—");
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-6 rounded-lg border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-800/40">
        {averageRating != null && (
          <div>
            <span className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {averageRating.toFixed(1)}
            </span>
            <span className="ml-1 text-amber-500">★</span>
          </div>
        )}
        {totalReviews != null && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </div>
        )}
        {ratingDistribution && Object.keys(ratingDistribution).length > 0 && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {[5, 4, 3, 2, 1].map((r) => {
              const count = ratingDistribution[String(r)] ?? 0;
              const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <span key={r} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <span>{r}★</span>
                  <span className="w-16 rounded bg-gray-200 dark:bg-gray-700">
                    <span className="block h-2 rounded bg-amber-500" style={{ width: `${pct}%` }} />
                  </span>
                  <span>{count}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Customer reviews for this product (read-only). Moderate from Admin → Reviews.
      </p>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet for this product.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item._id}
                  className="rounded-lg border border-gray-100 p-4 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800 dark:text-white/90">{userName(item)}</span>
                    <span className="text-amber-500">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className={i <= (item.rating ?? 0) ? "opacity-100" : "opacity-30"}>★</span>
                      ))}
                    </span>
                  </div>
                  {item.comment && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.comment}</p>
                  )}
                  {item.createdAt && (
                    <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
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
        </>
      )}
    </div>
  );
}
