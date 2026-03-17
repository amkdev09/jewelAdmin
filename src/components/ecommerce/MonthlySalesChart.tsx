import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useEffect, useMemo, useState } from "react";
import { analyticsApi } from "../../services/api";

type SalesPoint = {
  label?: string;
  date?: string;
  totalRevenue?: number;
  value?: number;
};

type TimeRangeKey = "this_year" | "last_6_months" | "last_12_months";

function buildDateRange(key: TimeRangeKey) {
  const end = new Date();
  const start = new Date(end);

  if (key === "this_year") {
    start.setMonth(0, 1);
  } else if (key === "last_6_months") {
    start.setMonth(end.getMonth() - 5, 1);
  } else {
    start.setMonth(end.getMonth() - 11, 1);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function MonthlySalesChart() {
  const [range, setRange] = useState<TimeRangeKey>("last_12_months");
  const [points, setPoints] = useState<SalesPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { startDate, endDate } = buildDateRange(range);
    setLoading(true);
    analyticsApi
      .getSales({ startDate, endDate, groupBy: "month" })
      .then((res: { data: { success?: boolean; data?: unknown } }) => {
        if (!res.data?.success || !res.data?.data) {
          setPoints([]);
          return;
        }

        const raw = res.data.data as unknown;
        const list: SalesPoint[] = Array.isArray(raw)
          ? raw
              .map((item) => {
                const anyItem = item as Record<string, unknown>;
                const label = (anyItem.label as string) ?? (anyItem.month as string);
                const date = (anyItem.date as string) ?? undefined;
                const totalRevenue =
                  (anyItem.totalRevenue as number) ??
                  (anyItem.revenue as number) ??
                  (anyItem.value as number);
                if (!label && !date) return null;
                if (typeof totalRevenue !== "number") return null;
                return {
                  label,
                  date,
                  totalRevenue,
                  value: totalRevenue,
                };
              })
              .filter(Boolean) as SalesPoint[]
          : [];

        setPoints(list);
      })
      .catch(() => setPoints([]))
      .finally(() => setLoading(false));
  }, [range]);

  const { categories, seriesData } = useMemo(() => {
    if (!points.length) {
      return {
        categories: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        seriesData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
    }

    const cats = points.map((p) => {
      if (p.label) return p.label;
      if (!p.date) return "";
      const d = new Date(p.date);
      return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    });

    return {
      categories: cats,
      seriesData: points.map((p) => p.value ?? p.totalRevenue ?? 0),
    };
  }, [points]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };
  const series = [
    {
      name: "Sales",
      data: seriesData,
    },
  ];
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Monthly Sales
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={() => {
                setRange("this_year");
                closeDropdown();
              }}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              This year
            </DropdownItem>
            <DropdownItem
              onItemClick={() => {
                setRange("last_6_months");
                closeDropdown();
              }}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Last 6 months
            </DropdownItem>
            <DropdownItem
              onItemClick={() => {
                setRange("last_12_months");
                closeDropdown();
              }}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Last 12 months
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {loading ? (
            <div className="py-8 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <Chart options={options} series={series} type="bar" height={180} />
          )}
        </div>
      </div>
    </div>
  );
}
