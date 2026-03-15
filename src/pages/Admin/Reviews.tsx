import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import Alert from "../../components/ui/alert/Alert";
import { reviewApi, productApi, type ReviewItem } from "../../services/api";
import { TrashBinIcon } from "../../icons";

type AlertVariant = "success" | "error" | "warning" | "info";
interface AlertState {
  variant: AlertVariant;
  title: string;
  message: string;
}

interface ProductOption {
  _id: string;
  name?: string;
  slug?: string;
}

function productName(item: ReviewItem): string {
  const p = item.productId;
  if (typeof p === "object" && p?.name) return p.name;
  return String(p ?? "—");
}

function userName(item: ReviewItem): string {
  const u = item.userId;
  if (typeof u === "object" && u?.name) return u.name;
  if (typeof u === "object" && u?.email) return u.email;
  return String(u ?? "—");
}

function renderStars(rating: number) {
  const full = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" title={`${rating} star(s)`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? "opacity-100" : "opacity-30"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function Reviews() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [filters, setFilters] = useState<{
    productId: string;
    rating: string;
  }>({ productId: "", rating: "" });
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const limit = 20;

  const fetchReviews = () => {
    setLoading(true);
    const params: { page: number; limit: number; productId?: string; rating?: number } = {
      page,
      limit,
    };
    if (filters.productId) params.productId = filters.productId;
    if (filters.rating) params.rating = Number(filters.rating);

    reviewApi
      .list(params)
      .then((res) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setItems(d.items ?? []);
          setTotal(d.total ?? 0);
        } else {
          setItems([]);
          setTotal(0);
        }
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
        setAlertState({
          variant: "error",
          title: "Error",
          message: "Failed to load reviews.",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, [page, filters.productId, filters.rating]);

  useEffect(() => {
    productApi
      .list({ page: 1, limit: 200, sortBy: "latest" })
      .then((res: { data: { success?: boolean; data?: { items?: ProductOption[] } } }) => {
        if (res.data.success && res.data.data?.items) {
          setProducts(res.data.data.items);
        }
      })
      .catch(() => setProducts([]));
  }, []);

  const handleDelete = (item: ReviewItem) => {
    const label = `${productName(item)} – ${userName(item)} (${item.rating}★)`;
    if (!window.confirm(`Delete this review?\n${label}\n\nThis cannot be undone.`)) return;
    setSaving(true);
    reviewApi
      .delete(item._id)
      .then(() => {
        fetchReviews();
        setAlertState({
          variant: "success",
          title: "Deleted",
          message: "Review removed.",
        });
      })
      .catch((err: unknown) => {
        setAlertState({
          variant: "error",
          title: "Error",
          message: (err as { message?: string })?.message ?? "Delete failed.",
        });
      })
      .finally(() => setSaving(false));
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <>
      <PageMeta title="Reviews | Admin" description="Moderate product reviews" />
      <PageBreadCrumb pageTitle="Reviews" />
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
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Product Reviews
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View and moderate customer reviews. Reviews are created by users on the storefront.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">Filters:</span>
            <select
              value={filters.productId}
              onChange={(e) => {
                setFilters((f) => ({ ...f, productId: e.target.value }));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white min-w-[180px]"
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name ?? p.slug ?? p._id}
                </option>
              ))}
            </select>
            <select
              value={filters.rating}
              onChange={(e) => {
                setFilters((f) => ({ ...f, rating: e.target.value }));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r !== 1 ? "s" : ""}
                </option>
              ))}
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
                  <TableCell isHeader className="w-[18%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Product
                  </TableCell>
                  <TableCell isHeader className="w-[16%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    User
                  </TableCell>
                  <TableCell isHeader className="w-[10%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Rating
                  </TableCell>
                  <TableCell isHeader className="w-[36%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Comment
                  </TableCell>
                  <TableCell isHeader className="w-[12%] px-4 py-2.5 text-left font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Date
                  </TableCell>
                  <TableCell isHeader className="w-[8%] px-4 py-2.5 text-right font-medium text-gray-500 text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No reviews found. Change filters or wait for customers to submit reviews.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="px-4 py-2.5 text-left align-middle font-medium text-gray-800 dark:text-white/90">
                        {productName(item)}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400">
                        {userName(item)}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle">
                        {renderStars(item.rating ?? 0)}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400 text-theme-xs max-w-[280px] truncate">
                        {item.comment ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-left align-middle text-gray-500 dark:text-gray-400 text-theme-xs">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete review"
                          disabled={saving}
                        >
                          <TrashBinIcon className="size-5 text-red-500" />
                        </button>
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
    </>
  );
}
