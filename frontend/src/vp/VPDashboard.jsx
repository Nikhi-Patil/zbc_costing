import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  AlertCircle,
  ArrowUp,
  CheckCircle2,
  ClipboardList,
  Factory,
  IndianRupee,
  PackageCheck,
  Percent,
  RefreshCw,
  Search,
  Settings2,
  TrendingUp,
} from "lucide-react";

import "./../assets/css/MoldingDashboard.css";

const COLORS = {
  navy: "#173d70",
  blue: "#2878e8",
  green: "#24a866",
  orange: "#f59a23",
  red: "#ef4764",
  amber: "#f6bd16",
  slate: "#64748b",
};

const FISCAL_MONTHS = [
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
];

const STATUS_COLORS = {
  ACTIVE: COLORS.green,
  PENDING: COLORS.amber,
  COMPLETED: COLORS.blue,
  INACTIVE: COLORS.red,
  DRAFT: "#94a3b8",
  FINAL: COLORS.green,
};

const number = (value) => Number(value) || 0;
const fiscalIndex = (month) =>
  number(month) >= 4 ? number(month) - 4 : number(month) + 8;
const sumBy = (rows, accessor) =>
  rows.reduce((total, row) => total + number(accessor(row)), 0);

const formatNumber = (value, digits = 0) =>
  number(value).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const formatCurrency = (value) => {
  const absolute = Math.abs(number(value));
  const sign = number(value) < 0 ? "-" : "";

  if (absolute >= 10000000)
    return `${sign}₹ ${(absolute / 10000000).toFixed(2)} Cr`;
  return `${sign}₹ ${(absolute / 100000).toFixed(absolute >= 100000 ? 1 : 2)} L`;
};

const formatLakhs = (value) =>
  `₹ ${number(value).toFixed(number(value) >= 10 ? 0 : 2)} L`;
const formatPercent = (value, digits = 2) =>
  `${number(value).toFixed(digits)}%`;

const monthLabel = (financialYear, month) => {
  const startYear = number(String(financialYear || "").slice(0, 4));
  const name =
    FISCAL_MONTHS.find((item) => item.value === number(month))?.label || "";
  return startYear
    ? `${name} ${number(month) >= 4 ? startYear : startYear + 1}`
    : name;
};

function DashboardCard({ title, action, children, className = "" }) {
  return (
    <section
      className={`molding-card rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.045)] ${className}`}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-[17px] font-bold text-[#173d70]">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function KpiCard({ icon: Icon, iconClass, title, value, trend }) {
  const hasTrend = trend !== null && trend !== undefined;
  const isPositive = number(trend) >= 0;

  return (
    <DashboardCard className="molding-kpi min-h-[132px] p-3.5">
      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${iconClass}`}
        >
          <Icon size={22} strokeWidth={2.3} />
        </div>
        <div className="min-w-0">
          <p className="mt-0.5 text-sm font-semibold text-[#173d70]">{title}</p>
          <p className="mt-1 font-serif text-[26px] font-bold leading-tight text-[#0f2d5a]">
            {value}
          </p>
          <div
            className={`mt-2 flex items-center gap-1 text-xs font-semibold ${hasTrend && isPositive ? "text-emerald-600" : hasTrend ? "text-rose-500" : "text-slate-400"}`}
          >
            {hasTrend &&
              (isPositive ? (
                <ArrowUp size={14} />
              ) : (
                <TrendingUp size={14} className="rotate-180" />
              ))}
            <span>
              {hasTrend
                ? `${isPositive ? "+" : ""}${formatPercent(trend, 1)}`
                : "No prior period"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">vs. previous period</p>
        </div>
      </div>
    </DashboardCard>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="molding-select-field block min-w-0">
      <span className="mb-1 block text-xs font-bold text-[#173d70]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

const getColorClass = (color) => {
  const colorClasses = {
    "#2878e8": "molding-color-blue",
    "#24a866": "molding-color-green",
    "#16a34a": "molding-color-profit",
    "#f59a23": "molding-color-orange",
    "#ef4764": "molding-color-red",
    "#ef4444": "molding-color-loss",
    "#f6bd16": "molding-color-amber",
    "#64748b": "molding-color-slate",
    "#94a3b8": "molding-color-muted",
  };

  return colorClasses[String(color).toLowerCase()] || "molding-color-default";
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const validItems = payload.filter(
    (entry) =>
      entry.value !== null &&
      entry.value !== undefined &&
      Number.isFinite(Number(entry.value)),
  );

  if (!validItems.length) return null;

  return (
    <div className="molding-chart-tooltip">
      <div className="molding-tooltip-title">{label}</div>

      {validItems.map((entry, index) => (
        <div className="molding-tooltip-row" key={`${entry.dataKey}-${index}`}>
          <span
            className="molding-tooltip-dot"
            style={{ backgroundColor: entry.color || "#2878e8" }}
          />

          <span className="molding-tooltip-name">{entry.name}</span>

          <strong className="molding-tooltip-value">
            {formatLakhs(entry.value)}
          </strong>
        </div>
      ))}
    </div>
  );
}

function LegendDot({ color, label, value }) {
  return (
    <div className="molding-legend-dot flex items-center gap-2 text-sm text-slate-600">
      <span className={`molding-legend-color ${getColorClass(color)}`} />
      <span>{label}</span>
      {value && (
        <span className="ml-auto font-semibold text-[#173d70]">{value}</span>
      )}
    </div>
  );
}

function PartsTable({ rows, title, positive }) {
  return (
    <DashboardCard
      title={title}
      className="molding-parts-table overflow-hidden p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[390px] text-left text-xs">
          <thead className="bg-blue-50 text-[#173d70]">
            <tr>
              <th className="w-10 px-3 py-2.5 font-bold">#</th>
              <th className="px-3 py-2.5 font-bold">Part No.</th>
              <th className="px-3 py-2.5 font-bold">Part Name</th>
              <th className="px-3 py-2.5 text-right font-bold">
                P/L (₹ in Lakhs)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((row, index) => (
                <tr
                  key={
                    row.monthlyReportId ??
                    `${row.moldingId}-${row.month}-${index}`
                  }
                  className="text-slate-600"
                >
                  <td className="px-3 py-1.5">{index + 1}</td>
                  <td className="px-3 py-1.5 font-medium">{row.partNo}</td>
                  <td className="px-3 py-1.5">
                    {row.partName || row.subcategory}
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right font-bold molding-pl-value ${
                      positive
                        ? "molding-pl-value--profit"
                        : "molding-pl-value--loss"
                    }`}
                  >
                    {number(row.totalMfgPL / 100000).toFixed(1)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-3 py-7 text-center text-slate-400"
                >
                  No matching parts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}

function CustomerAxisTick({ x, y, payload }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      dominantBaseline="middle"
      fill="#334155"
      fontSize={8}
    >
      {payload.value}
    </text>
  );
}

/**
 * @param {{
 *   transactions?: Array<object>,
 *   fetchTransactions?: () => Promise<Array<object>>
 * }} props
 */
export default function MoldingDashboard({ transactions, fetchTransactions }) {
  const [fetchedTransactions, setFetchedTransactions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [fetchedTotalTransactions, setFetchedTotalTransactions] = useState(0);

  const [draftFilters, setDraftFilters] = useState({
    financialYear: "2026-27",
    fromMonth: "4",
    toMonth: "1",
    prodUnit: "ALL",
    billingUnit: "ALL",
    customer: "ALL",
    status: "ALL",
  });

  const [appliedFilters, setAppliedFilters] = useState(draftFilters);

  useEffect(() => {
    if (typeof fetchTransactions !== "function") return undefined;
    let cancelled = false;

    async function loadTransactions() {
      setIsLoading(true);
      try {
        // Example: fetchTransactions can call GET /api/molding/transactions.
        const result = await fetchTransactions();

        console.log("Dashboard API response:", result);
        console.log("Total API transactions:", result?.transactions?.length);

        console.log(
          "MTRB transactions:",
          result?.transactions?.filter((row) =>
            String(row.subCategory || row.subcategory || "")
              .toUpperCase()
              .includes("MTRB"),
          ),
        );

        // IMPORTANT: Save API data into React state
        if (!cancelled) {
          const rows = Array.isArray(result?.transactions)
            ? result.transactions
            : [];

          setFetchedTransactions(rows);
          setFetchedTotalTransactions(Number(result?.totalTransactions) || 0);
        }
      } catch (error) {
        console.error("Unable to load molding transactions", error);
        if (!cancelled) setFetchedTransactions([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setLastUpdated(new Date());
        }
      }
    }

    loadTransactions();
    return () => {
      cancelled = true;
    };
  }, [fetchTransactions, loadVersion]);

  const sourceTransactions = Array.isArray(transactions)
    ? transactions
    : Array.isArray(fetchedTransactions)
      ? fetchedTransactions
      : [];

  const financialYears = useMemo(
    () =>
      [
        ...new Set(
          sourceTransactions.map((row) => row.financialYear).filter(Boolean),
        ),
      ]
        .sort()
        .reverse(),
    [sourceTransactions],
  );

  // Keep a useful financial year selected when data from the API has a different year.
  useEffect(() => {
    if (
      financialYears.length &&
      !financialYears.includes(draftFilters.financialYear)
    ) {
      const nextYear = financialYears[0];
      setDraftFilters((current) => ({ ...current, financialYear: nextYear }));
      setAppliedFilters((current) => ({ ...current, financialYear: nextYear }));
    }
  }, [financialYears, draftFilters.financialYear]);

  const options = useMemo(() => {
    const getUnique = (rows, key) =>
      [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();

    const matchesFilters = (row, excludeKey) => {
      return (
        (excludeKey === "prodUnit" ||
          draftFilters.prodUnit === "ALL" ||
          row.prodUnit === draftFilters.prodUnit) &&
        (excludeKey === "billingUnit" ||
          draftFilters.billingUnit === "ALL" ||
          row.billingUnit === draftFilters.billingUnit) &&
        (excludeKey === "customerName" ||
          draftFilters.customer === "ALL" ||
          row.customerName === draftFilters.customer)
      );
    };

    const filteredForProduction = sourceTransactions.filter((row) =>
      matchesFilters(row, "prodUnit"),
    );

    const filteredForBilling = sourceTransactions.filter((row) =>
      matchesFilters(row, "billingUnit"),
    );

    const filteredForCustomer = sourceTransactions.filter((row) =>
      matchesFilters(row, "customerName"),
    );

    return {
      prodUnits: getUnique(filteredForProduction, "prodUnit"),
      billingUnits: getUnique(filteredForBilling, "billingUnit"),
      customers: getUnique(filteredForCustomer, "customerName"),
      statuses: getUnique(sourceTransactions, "status"),
    };
  }, [sourceTransactions, draftFilters]);

  const filteredTransactions = useMemo(() => {
    const fromIndex = fiscalIndex(appliedFilters.fromMonth);
    const toIndex = fiscalIndex(appliedFilters.toMonth);

    return sourceTransactions.filter((transaction) => {
      const transactionMonth = fiscalIndex(transaction.month);
      return (
        (!appliedFilters.financialYear ||
          transaction.financialYear === appliedFilters.financialYear) &&
        transactionMonth >= fromIndex &&
        transactionMonth <= toIndex &&
        (appliedFilters.prodUnit === "ALL" ||
          transaction.prodUnit === appliedFilters.prodUnit) &&
        (appliedFilters.billingUnit === "ALL" ||
          transaction.billingUnit === appliedFilters.billingUnit) &&
        (appliedFilters.customer === "ALL" ||
          transaction.customerName === appliedFilters.customer) &&
        (appliedFilters.status === "ALL" ||
          transaction.status === appliedFilters.status)
      );
    });
  }, [sourceTransactions, appliedFilters]);

  const summary = useMemo(() => {
    const salesValue = sumBy(
      filteredTransactions,
      (row) => row.saleCost * row.monthlyQty,
    );
    const manufacturingValue = sumBy(
      filteredTransactions,
      (row) => row.mfgWithMargin * row.monthlyQty,
    );
    const totalMfgPL = sumBy(filteredTransactions, (row) => row.totalMfgPL);
    const averageMargin =
      salesValue !== 0 ? (totalMfgPL / salesValue) * 100 : 0;

    const uniqueTransactions = new Set(
      filteredTransactions
        .filter((row) => {
          return (
            (appliedFilters.prodUnit === "ALL" ||
              row.prodUnit === appliedFilters.prodUnit) &&
            (appliedFilters.billingUnit === "ALL" ||
              row.billingUnit === appliedFilters.billingUnit) &&
            (appliedFilters.customer === "ALL" ||
              row.customerName === appliedFilters.customer) &&
            (appliedFilters.status === "ALL" ||
              row.status === appliedFilters.status)
          );
        })
        .map((row) => row.moldingId)
        .filter(Boolean),
    ).size;

    return {
      transactionCount: uniqueTransactions,
      monthlyQty: sumBy(filteredTransactions, (row) => row.monthlyQty),
      salesValue,
      manufacturingValue,
      totalMfgPL,
      averageMargin,
    };
  }, [filteredTransactions, fetchedTotalTransactions]);

  const monthlyData = useMemo(() => {
    const selectedMonths = FISCAL_MONTHS.filter((item) => {
      const index = fiscalIndex(item.value);
      return (
        index >= fiscalIndex(appliedFilters.fromMonth) &&
        index <= fiscalIndex(appliedFilters.toMonth)
      );
    });

    return selectedMonths.map((item) => {
      const rows = filteredTransactions.filter(
        (row) => number(row.month) === item.value,
      );
      const monthlySalesValue = sumBy(
        rows,
        (row) => number(row.saleCost) * number(row.monthlyQty),
      );

      const monthlyTotalMfgPL = sumBy(rows, (row) => row.totalMfgPL);

      return {
        month: monthLabel(appliedFilters.financialYear, item.value),
        manufacturing:
          sumBy(rows, (row) => row.mfgWithMargin * row.monthlyQty) / 100000,
        sales: monthlySalesValue / 100000,
        profit: monthlyTotalMfgPL / 100000,
        transactionCount: rows.length,
        monthlyQty: sumBy(rows, (row) => row.monthlyQty),
        averageMargin:
          monthlySalesValue > 0
            ? (monthlyTotalMfgPL / monthlySalesValue) * 100
            : 0,
      };
    });
  }, [filteredTransactions, appliedFilters]);

  const monthlyProfitValues = monthlyData.map(
    (item) => Number(item.profit) || 0,
  );

  const plMin = Math.min(0, ...monthlyProfitValues);
  const plMax = Math.max(0, ...monthlyProfitValues);
  const zeroOffset = plMax === plMin ? 50 : (plMax / (plMax - plMin)) * 100;
  const previousPeriod =
    monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;
  const latestPeriod = monthlyData.length
    ? monthlyData[monthlyData.length - 1]
    : null;

  const calcTrend = (current, previous) => {
    if (!previous || !current || !number(previous)) return null;
    return (
      ((number(current) - number(previous)) / Math.abs(number(previous))) * 100
    );
  };

  const trends =
    latestPeriod && previousPeriod
      ? {
          transactionCount: calcTrend(
            latestPeriod.transactionCount,
            previousPeriod.transactionCount,
          ),
          monthlyQty: calcTrend(
            latestPeriod.monthlyQty,
            previousPeriod.monthlyQty,
          ),
          salesValue: calcTrend(latestPeriod.sales, previousPeriod.sales),
          manufacturingValue: calcTrend(
            latestPeriod.manufacturing,
            previousPeriod.manufacturing,
          ),
          totalMfgPL: calcTrend(latestPeriod.profit, previousPeriod.profit),
          averageMargin: calcTrend(
            latestPeriod.averageMargin,
            previousPeriod.averageMargin,
          ),
        }
      : {};

  const customerData = useMemo(
    () =>
      Object.values(
        filteredTransactions.reduce((result, row) => {
          const name = row.customerName || "Unassigned";
          if (!result[name]) result[name] = { customer: name, profit: 0 };
          result[name].profit += number(row.totalMfgPL) / 100000;
          return result;
        }, {}),
      )
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 10),
    [filteredTransactions],
  );

  const productionData = useMemo(
    () =>
      Object.values(
        filteredTransactions.reduce((result, row) => {
          const name = row.prodUnit || "Unassigned";
          if (!result[name]) result[name] = { unit: name, sales: 0, profit: 0 };
          result[name].sales +=
            (number(row.saleCost) * number(row.monthlyQty)) / 100000;
          result[name].profit += number(row.totalMfgPL) / 100000;
          return result;
        }, {}),
      ).sort((a, b) => b.sales - a.sales),
    [filteredTransactions],
  );

  const billingData = useMemo(
    () =>
      Object.values(
        filteredTransactions.reduce((result, row) => {
          const name = row.billingUnit || "Unassigned";
          if (!result[name]) result[name] = { name, value: 0 };
          result[name].value += number(row.saleCost) * number(row.monthlyQty);
          return result;
        }, {}),
      ).sort((a, b) => b.value - a.value),
    [filteredTransactions],
  );

  const statusData = useMemo(
    () =>
      Object.entries(STATUS_COLORS)
        .map(([status, color]) => {
          const uniqueTransactions = new Set(
            filteredTransactions
              .filter(
                (row) =>
                  String(row.status || "")
                    .trim()
                    .toUpperCase() === status,
              )
              .map((row) => row.moldingId)
              .filter(Boolean),
          );

          return {
            name: status.charAt(0) + status.slice(1).toLowerCase(),
            value: uniqueTransactions.size,
            color,
          };
        })
        .filter((item) => item.value > 0),
    [filteredTransactions],
  );

  const partWiseData = useMemo(() => {
    const groupedParts = filteredTransactions.reduce((result, row) => {
      const key = String(row.partNo || row.subcategory || row.moldingId).trim();

      if (!result[key]) {
        result[key] = {
          partNo: row.partNo,
          partName: row.partName || row.subcategory,
          totalMfgPL: 0,
          monthlyQty: 0,
        };
      }

      result[key].totalMfgPL += Number(row.totalMfgPL) || 0;
      result[key].monthlyQty += Number(row.monthlyQty) || 0;

      return result;
    }, {});

    return Object.values(groupedParts);
  }, [filteredTransactions]);

  const profitableParts = useMemo(
    () =>
      partWiseData
        .filter((row) => row.totalMfgPL > 0)
        .sort((a, b) => b.totalMfgPL - a.totalMfgPL)
        .slice(0, 10),
    [partWiseData],
  );

  const lossParts = useMemo(
    () =>
      partWiseData
        .filter((row) => row.totalMfgPL < 0)
        .sort((a, b) => a.totalMfgPL - b.totalMfgPL)
        .slice(0, 10),
    [partWiseData],
  );

  const alerts = useMemo(() => {
    const getUniquePartCount = (condition) =>
      new Set(
        filteredTransactions
          .filter(condition)
          .map((row) =>
            String(row.partNo || row.subcategory || row.moldingId).trim(),
          ),
      ).size;

    const getMargin = (row) => {
      const saleCost = Number(row.saleCost) || 0;
      if (saleCost === 0) return 0;

      return ((Number(row.plVsMfgCost) || 0) / saleCost) * 100;
    };

    const belowCost = getUniquePartCount(
      (row) => (Number(row.saleCost) || 0) < (Number(row.mfgWithMargin) || 0),
    );

    const lowMargin = getUniquePartCount((row) => getMargin(row) < 5);

    const highQtyLowMargin = getUniquePartCount(
      (row) => (Number(row.monthlyQty) || 0) > 50000 && getMargin(row) < 3,
    );

    return [
      {
        tone: "red",
        count: belowCost,
        text: "parts have Sale Cost below Mfg Cost.",
      },
      {
        tone: "orange",
        count: lowMargin,
        text: "parts have margin below 5%.",
      },
      {
        tone: "amber",
        count: highQtyLowMargin,
        text: "parts have Monthly Qty > 50,000 but margin < 3%.",
      },
    ];
  }, [filteredTransactions]);

  const updateDraftFilter = (key, value) => {
    setDraftFilters((current) => {
      const next = { ...current, [key]: value };
      if (fiscalIndex(next.toMonth) < fiscalIndex(next.fromMonth))
        next.toMonth = next.fromMonth;
      return next;
    });
  };

  const handleRefresh = () => {
    if (typeof fetchTransactions === "function")
      setLoadVersion((version) => version + 1);
    else setLastUpdated(new Date());
  };

  const chartAxis = {
    fontSize: 11,
    fill: "#475569",
    tickLine: false,
    axisLine: { stroke: "#94a3b8" },
  };

  const totalBilling = sumBy(billingData, (item) => item.value);

  const billingChartData = billingData.map((item) => ({
    ...item,
    chartValue: Math.max(item.value, totalBilling * 0.03),
  }));

  useEffect(() => {
    setDraftFilters((current) => {
      let changed = false;
      const next = { ...current };

      if (
        next.prodUnit !== "ALL" &&
        !options.prodUnits.includes(next.prodUnit)
      ) {
        next.prodUnit = "ALL";
        changed = true;
      }

      if (
        next.billingUnit !== "ALL" &&
        !options.billingUnits.includes(next.billingUnit)
      ) {
        next.billingUnit = "ALL";
        changed = true;
      }

      if (
        next.customer !== "ALL" &&
        !options.customers.includes(next.customer)
      ) {
        next.customer = "ALL";
        changed = true;
      }

      // Prevent unnecessary state updates and infinite rendering
      return changed ? next : current;
    });
  }, [options]);

  return (
    <main className="molding-dashboard min-h-screen bg-slate-50 text-slate-700">
      <header className="molding-header bg-gradient-to-r from-[#173d70] via-[#335d91] to-slate-100 px-4 py-3 text-white shadow-sm sm:px-6">
        <div className="molding-header-inner mx-auto flex max-w-[1600px] flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="molding-brand flex items-center gap-3">
            <Factory size={43} strokeWidth={1.7} className="shrink-0" />
            <div>
              <h3 className="font-serif text-2xl font-bold leading-none sm:text-[27px]">
                Jayashree Polymers Molding Dashboard
              </h3>
              <p className="mt-1 text-sm text-blue-100">
                Manufacturing Cost &amp; Profitability Analysis
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="molding-content mx-auto max-w-[1600px] space-y-3 px-4 py-3 sm:px-6">
        <DashboardCard className="molding-filter-bar p-3">
          <div className="molding-filter-fields grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
            <SelectField
              label="Financial Year"
              value={draftFilters.financialYear}
              onChange={(value) => updateDraftFilter("financialYear", value)}
            >
              {financialYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="From Month"
              value={draftFilters.fromMonth}
              onChange={(value) => updateDraftFilter("fromMonth", value)}
            >
              {FISCAL_MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {monthLabel(draftFilters.financialYear, month.value)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="To Month"
              value={draftFilters.toMonth}
              onChange={(value) => updateDraftFilter("toMonth", value)}
            >
              {FISCAL_MONTHS.map((month) => (
                <option
                  key={month.value}
                  value={month.value}
                  disabled={
                    fiscalIndex(month.value) <
                    fiscalIndex(draftFilters.fromMonth)
                  }
                >
                  {monthLabel(draftFilters.financialYear, month.value)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Production Unit"
              value={draftFilters.prodUnit}
              onChange={(value) => updateDraftFilter("prodUnit", value)}
            >
              <option value="ALL">All Units</option>
              {options.prodUnits.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Billing Unit"
              value={draftFilters.billingUnit}
              onChange={(value) => updateDraftFilter("billingUnit", value)}
            >
              <option value="ALL">All Units</option>
              {options.billingUnits.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Customer"
              value={draftFilters.customer}
              onChange={(value) => updateDraftFilter("customer", value)}
            >
              <option value="ALL">All Customers</option>
              {options.customers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Status"
              value={draftFilters.status}
              onChange={(value) => updateDraftFilter("status", value)}
            >
              <option value="ALL">All</option>
              {options.statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </SelectField>
            <button
              type="button"
              onClick={() => setAppliedFilters(draftFilters)}
              className="mt-[21px] flex h-9 items-center justify-center gap-2 rounded-md bg-[#173d70] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102e55] focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <Search size={16} /> Apply Filters
            </button>
          </div>
        </DashboardCard>

        <div className="molding-kpis grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <KpiCard
            icon={ClipboardList}
            iconClass="bg-blue-100 text-blue-600"
            title="Total Transactions"
            value={formatNumber(summary.transactionCount)}
            trend={trends.transactionCount}
          />
          <KpiCard
            icon={PackageCheck}
            iconClass="bg-rose-100 text-rose-500"
            title="Monthly Qty"
            value={formatNumber(summary.monthlyQty)}
            trend={trends.monthlyQty}
          />
          <KpiCard
            icon={IndianRupee}
            iconClass="bg-emerald-100 text-emerald-600"
            title="Total Sales Value"
            value={formatCurrency(summary.salesValue)}
            trend={trends.salesValue}
          />
          <KpiCard
            icon={Settings2}
            iconClass="bg-blue-100 text-blue-600"
            title="Manufacturing Value"
            value={formatCurrency(summary.manufacturingValue)}
            trend={trends.manufacturingValue}
          />
          <KpiCard
            icon={TrendingUp}
            iconClass="bg-rose-100 text-rose-500"
            title="Total Mfg P/L"
            value={formatCurrency(summary.totalMfgPL)}
            trend={trends.totalMfgPL}
          />
          <KpiCard
            icon={Percent}
            iconClass="bg-emerald-100 text-emerald-600"
            title="Average Margin"
            value={formatPercent(summary.averageMargin)}
            trend={trends.averageMargin}
          />
        </div>

        <div className="molding-primary-charts grid grid-cols-1 gap-3 xl:grid-cols-2">
          <DashboardCard title="Manufacturing Cost vs Sales Cost">
            <div className="mb-1 flex justify-end gap-5">
              <LegendDot color={COLORS.blue} label="Manufacturing Cost" />
              <LegendDot color={COLORS.green} label="Sales Cost" />
            </div>
            <div className="h-[214px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 8, right: 15, left: 5, bottom: 5 }}
                  barGap={4}
                  barCategoryGap="20%"
                >
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => value.replace(" ", "\n")}
                    {...chartAxis}
                  />

                  <YAxis
                    {...chartAxis}
                    label={{
                      value: "Value (₹ in Lakhs)",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 11,
                      fill: "#334155",
                    }}
                  />

                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Bar
                    dataKey="manufacturing"
                    name="Manufacturing Cost"
                    fill={COLORS.blue}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={20}
                  >
                    <LabelList
                      dataKey="manufacturing"
                      position="top"
                      formatter={(value) => Math.round(value)}
                      fill="#173d70"
                      fontSize={10}
                    />
                  </Bar>

                  <Bar
                    dataKey="sales"
                    name="Sales Cost"
                    fill={COLORS.green}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={20}
                  >
                    <LabelList
                      dataKey="sales"
                      position="top"
                      formatter={(value) => Math.round(value)}
                      fill="#173d70"
                      fontSize={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard title="Monthly Profit / Loss">
            <div className="mb-1 flex justify-end">
              <div className="flex justify-end gap-4">
                <LegendDot color="#16a34a" label="Profit" />
                <LegendDot color="#ef4444" label="Loss" />
              </div>
            </div>

            <div className="h-[215px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 8, right: 6, left: -10, bottom: 2 }}
                >
                  <defs>
                    {/* Line changes colour at zero */}
                    <linearGradient
                      id="plLineGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#16a34a" />
                      <stop offset={`${zeroOffset}%`} stopColor="#16a34a" />
                      <stop offset={`${zeroOffset}%`} stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>

                    {/* Original shaded AreaChart appearance */}
                    <linearGradient
                      id="plAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#16a34a"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset={`${zeroOffset}%`}
                        stopColor="#16a34a"
                        stopOpacity={0.02}
                      />
                      <stop
                        offset={`${zeroOffset}%`}
                        stopColor="#ef4444"
                        stopOpacity={0.02}
                      />
                      <stop
                        offset="100%"
                        stopColor="#ef4444"
                        stopOpacity={0.25}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="#e2e8f0" vertical={false} />

                  <XAxis dataKey="month" {...chartAxis} />
                  <YAxis
                    {...chartAxis}
                    domain={["auto", "auto"]}
                    tickFormatter={(value) => Number(value).toFixed(0)}
                    allowDecimals={false}
                  />
                  <ReferenceLine
                    y={0}
                    stroke="#64748b"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    ifOverflow="extendDomain"
                  />

                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="P/L"
                    stroke="url(#plLineGradient)"
                    fill="url(#plAreaGradient)"
                    strokeWidth={2.5}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const value = Number(payload.profit) || 0;

                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={3}
                          fill={value >= 0 ? "#16a34a" : "#ef4444"}
                          stroke="none"
                        />
                      );
                    }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </div>

        <div className="molding-performance-grid grid grid-cols-1 gap-3 xl:grid-cols-[1.05fr_0.92fr_1.05fr]">
          <DashboardCard
            title="Top 10 Customers by P/L"
            action={
              <span className="text-xs text-slate-500">P/L (₹ in Lakhs)</span>
            }
          >
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={customerData}
                  margin={{ top: 5, right: 45, left: 5, bottom: 5 }}
                >
                  <CartesianGrid stroke="#edf2f7" horizontal={false} />

                  <XAxis type="number" hide />

                  <YAxis
                    type="category"
                    dataKey="customer"
                    width={175}
                    interval={0}
                    tick={<CustomerAxisTick />}
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                  />

                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Bar
                    dataKey="profit"
                    name="P/L"
                    fill={COLORS.blue}
                    radius={[0, 3, 3, 0]}
                    maxBarSize={20}
                  >
                    <LabelList
                      dataKey="profit"
                      position="right"
                      formatter={(value) => number(value).toFixed(1)}
                      fill="#173d70"
                      fontSize={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard title="Production Unit Performance">
            <div className="mb-1 flex justify-end gap-4">
              <LegendDot color={COLORS.blue} label="Sales Value" />
              <LegendDot color={COLORS.green} label="P/L" />
            </div>
            <div className="flex h-[300px] items-center justify-center">
              <div className="h-[214px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productionData}
                    margin={{ top: 14, right: 2, left: -12, bottom: 0 }}
                    barGap={3}
                  >
                    <CartesianGrid stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="unit" {...chartAxis} />
                    <YAxis
                      {...chartAxis}
                      label={{
                        value: "Value (₹ in Lakhs)",
                        angle: -90,
                        position: "insideLeft",
                        fontSize: 11,
                        fill: "#334155",
                      }}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={false} />{" "}
                    <Bar
                      dataKey="sales"
                      name="Sales Value"
                      fill={COLORS.blue}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={24}
                    >
                      <LabelList
                        dataKey="sales"
                        position="top"
                        formatter={(value) => Math.round(value)}
                        fill="#173d70"
                        fontSize={10}
                      />
                    </Bar>
                    <Bar
                      dataKey="profit"
                      name="P/L"
                      fill={COLORS.green}
                      radius={[2, 2, 0, 0]}
                      maxBarSize={24}
                    >
                      <LabelList
                        dataKey="profit"
                        position="top"
                        formatter={(value) => number(value).toFixed(0)}
                        fill="#173d70"
                        fontSize={10}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Billing Unit Performance">
            <div className="molding-billing-content flex h-[300px] items-center justify-center gap-2">
              <div className="relative h-full min-w-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={billingChartData}
                      dataKey="chartValue"
                      nameKey="name"
                      innerRadius="52%"
                      outerRadius="83%"
                      paddingAngle={0}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {billingChartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            [
                              COLORS.blue,
                              COLORS.green,
                              COLORS.orange,
                              COLORS.red,
                            ][index % 4]
                          }
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="font-serif text-lg font-bold text-[#173d70]">
                      {formatCurrency(totalBilling)}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      Total Sales
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-[42%] space-y-3 pr-1">
                {billingData.map((entry, index) => (
                  <LegendDot
                    key={entry.name}
                    color={
                      [COLORS.blue, COLORS.green, COLORS.orange, COLORS.red][
                        index % 4
                      ]
                    }
                    label={entry.name}
                    value={formatCurrency(entry.value)}
                  />
                ))}
              </div>
            </div>
          </DashboardCard>
        </div>

        <div className="molding-bottom-grid grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr_0.9fr]">
          <PartsTable
            title="Top 10 Profitable Parts"
            rows={profitableParts}
            positive
          />
          <PartsTable
            title="Top 10 Loss Making Parts"
            rows={lossParts}
            positive={false}
          />
          <div className="grid gap-3">
            <DashboardCard title="Transaction Status">
              <div className="molding-status-content">
                <div className="relative h-full min-w-0 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={58}
                        paddingAngle={0}
                        minAngle={10}
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="font-serif text-xl font-bold text-[#173d70]">
                        {summary.transactionCount}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500">
                        Transactions
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-[45%] space-y-2">
                  {statusData.map((item) => (
                    <LegendDot
                      key={item.name}
                      color={item.color}
                      label={item.name}
                      value={item.value}
                    />
                  ))}
                </div>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Costing Alerts"
              action={
                <button
                  type="button"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              }
            >
              <div className="divide-y divide-slate-100">
                {alerts.map((alert) => {
                  const Icon =
                    alert.tone === "green"
                      ? CheckCircle2
                      : alert.tone === "red"
                        ? AlertCircle
                        : AlertCircle;
                  const iconStyle = {
                    red: "text-rose-500",
                    orange: "text-orange-500",
                    amber: "text-amber-500",
                    green: "text-emerald-600",
                  }[alert.tone];
                  return (
                    <div
                      key={alert.text}
                      className="flex gap-2 py-1.5 text-xs leading-4 text-slate-600"
                    >
                      <Icon
                        size={16}
                        className={`mt-0.5 shrink-0 ${iconStyle}`}
                      />
                      <p>
                        <strong className="text-[#173d70]">
                          {alert.count}
                        </strong>{" "}
                        {alert.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>
          </div>
        </div>

        {!isLoading && filteredTransactions.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            No transactions match the selected filters.
          </div>
        )}
      </div>
    </main>
  );
}

export { formatCurrency, formatPercent };
