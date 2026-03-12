import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import { bannerApi } from "../../services/api";

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

export default function Banners() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    bannerApi
      .list({ limit: 50 })
      .then((res) => {
        if (res.data.success && res.data.data) {
          const d = res.data.data as { items: Banner[] };
          setItems(d.items ?? []);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageMeta title="Banners | Admin" description="Manage banners" />
      <PageBreadCrumb pageTitle="Banners" />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Banners
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create banners via API (POST /api/admin/banner) with FormData or JSON.
          </p>
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
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Banner
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Type
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Link
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
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
                      No banners yet. Use the API to create banners.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          {(b.imageUrl ?? b.image) ? (
                            <img
                              src={b.imageUrl ?? b.image}
                              alt=""
                              className="h-12 w-20 rounded object-cover"
                            />
                          ) : (
                            <div className="h-12 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                          )}
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {b.title ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                        {b.bannerType ?? "—"}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                        {b.redirectUrl ? (
                          <a
                            href={b.redirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-500 hover:underline"
                          >
                            {b.redirectUrl}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="py-3">
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
    </>
  );
}
