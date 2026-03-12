import { useEffect, useState } from "react";
import { Link } from "react-router";
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
import { productApi } from "../../services/api";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";

interface Product {
  _id: string;
  name?: string;
  slug?: string;
  images?: string[];
  basePrice?: number;
  isActive?: boolean;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const fetchProducts = () => {
    setLoading(true);
    productApi
      .list({ page, limit, sortBy: "latest" })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setItems((res.data.data as { items: Product[] }).items ?? []);
          setTotal((res.data.data as { total: number }).total ?? 0);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete product "${name}"?`)) return;
    productApi
      .delete(id)
      .then(() => fetchProducts())
      .catch((err) => alert((err as { message?: string })?.message ?? "Delete failed"));
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <>
      <PageMeta title="Products | Admin" description="Manage jewellery products" />
      <PageBreadCrumb pageTitle="Products" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            All Products
          </h2>
          <Link to="/admin/products/new">
            <Button size="sm" className="inline-flex items-center gap-2">
              <PlusIcon className="size-5" />
              Add Product
            </Button>
          </Link>
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
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Product
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Price
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No products yet. Add your first product.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt=""
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700" />
                          )}
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {p.name ?? p.slug ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                        {p.basePrice != null ? formatCurrency(p.basePrice) : "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          size="sm"
                          color={p.isActive !== false ? "success" : "error"}
                        >
                          {p.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-end">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/products/${p._id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Edit"
                          >
                            <PencilIcon className="size-5 text-gray-500" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p._id, p.name ?? "")}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete"
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
    </>
  );
}
