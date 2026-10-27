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

/*
 * Drop this file into a React + Tailwind project with `recharts` and
 * `lucide-react` installed. It accepts an API array through `transactions`, or
 * an optional function through `fetchTransactions`. The mock rows below make
 * the component immediately usable in Storybook or a new screen.
 */

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
  `₹ ${number(value).toFixed(number(value) >= 10 ? 0 : 1)} L`;
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

const createTransaction = ({
  trId,
  customerName,
  prodUnit,
  billingUnit,
  subcategory,
  partNo,
  partName,
  mfgWoMargin,
  mfgWithMargin,
  saleCost,
  monthlyQty,
  status,
  month,
  financialYear = "2026-27",
}) => {
  const extraPL = saleCost - mfgWoMargin;
  const plVsMfgCost = saleCost - mfgWithMargin;

  return {
    trId,
    customerName,
    prodUnit,
    billingUnit,
    subcategory,
    partNo,
    partName,
    mfgWoMargin,
    mfgWithMargin,
    saleCost,
    extraPL,
    plVsMfgCost,
    monthlyQty,
    totalMfgPL: monthlyQty * plVsMfgCost,
    extraPLTotal: monthlyQty * extraPL,
    status,
    month,
    financialYear,
  };
};

// TODO: replace mockTransactions with API data from /api/molding/transactions.
const mockTransactions = [
  createTransaction({
    trId: "ML120",
    customerName: "Tata Motors",
    prodUnit: "Unit 1",
    billingUnit: "Unit 1",
    subcategory: "General Moulding",
    partNo: "335/E1805",
    partName: "FLOOR MATS",
    mfgWoMargin: 98,
    mfgWithMargin: 105,
    saleCost: 118,
    monthlyQty: 42000,
    status: "ACTIVE",
    month: 4,
  }),
  createTransaction({
    trId: "ML121",
    customerName: "Mahindra & Mahindra",
    prodUnit: "Unit 4",
    billingUnit: "Unit 4",
    subcategory: "Sealing",
    partNo: "657863",
    partName: "GASKET - HOOD TO COOLER",
    mfgWoMargin: 83,
    mfgWithMargin: 89,
    saleCost: 96,
    monthlyQty: 39000,
    status: "PENDING",
    month: 4,
  }),
  createTransaction({
    trId: "ML122",
    customerName: "Maruti Suzuki",
    prodUnit: "Unit 6",
    billingUnit: "Unit 6",
    subcategory: "General Moulding",
    partNo: "0661036_CAP",
    partName: "DUST COVER",
    mfgWoMargin: 119,
    mfgWithMargin: 128,
    saleCost: 134,
    monthlyQty: 33000,
    status: "COMPLETED",
    month: 4,
  }),
  createTransaction({
    trId: "ML123",
    customerName: "Bajaj Auto",
    prodUnit: "Unit 1",
    billingUnit: "Unit 1",
    subcategory: "O-Ring",
    partNo: "04070701X003",
    partName: "GROMMET",
    mfgWoMargin: 86,
    mfgWithMargin: 92,
    saleCost: 108,
    monthlyQty: 40500,
    status: "ACTIVE",
    month: 5,
  }),
  createTransaction({
    trId: "ML124",
    customerName: "TVS Motors",
    prodUnit: "Unit 4",
    billingUnit: "Unit 4",
    subcategory: "Sealing",
    partNo: "J1NG 233",
    partName: "SEALING RING",
    mfgWoMargin: 101,
    mfgWithMargin: 108,
    saleCost: 116,
    monthlyQty: 37000,
    status: "ACTIVE",
    month: 5,
  }),
  createTransaction({
    trId: "ML125",
    customerName: "Eicher Motors",
    prodUnit: "Unit 6",
    billingUnit: "Unit 6",
    subcategory: "General Moulding",
    partNo: "445566",
    partName: "BRACKET",
    mfgWoMargin: 126,
    mfgWithMargin: 135,
    saleCost: 141,
    monthlyQty: 35000,
    status: "COMPLETED",
    month: 5,
  }),
  createTransaction({
    trId: "ML126",
    customerName: "Ashok Leyland",
    prodUnit: "Unit 1",
    billingUnit: "Unit 1",
    subcategory: "Insulation",
    partNo: "778899",
    partName: "INSULATOR",
    mfgWoMargin: 72,
    mfgWithMargin: 77,
    saleCost: 85,
    monthlyQty: 51000,
    status: "ACTIVE",
    month: 6,
  }),
  createTransaction({
    trId: "ML127",
    customerName: "Hyundai",
    prodUnit: "Unit 4",
    billingUnit: "Unit 4",
    subcategory: "Sealing",
    partNo: "990011",
    partName: "CAP",
    mfgWoMargin: 103,
    mfgWithMargin: 110,
    saleCost: 116,
    monthlyQty: 39000,
    status: "PENDING",
    month: 6,
  }),
  createTransaction({
    trId: "ML128",
    customerName: "Force Motors",
    prodUnit: "Unit 6",
    billingUnit: "Unit 4",
    subcategory: "Hose",
    partNo: "981234",
    partName: "CAP - ENGINE COVER",
    mfgWoMargin: 138,
    mfgWithMargin: 148,
    saleCost: 143,
    monthlyQty: 28000,
    status: "INACTIVE",
    month: 6,
  }),
  createTransaction({
    trId: "ML129",
    customerName: "Tata Motors",
    prodUnit: "Unit 1",
    billingUnit: "Unit 1",
    subcategory: "General Moulding",
    partNo: "774411",
    partName: "SUPPORT BRACKET",
    mfgWoMargin: 94,
    mfgWithMargin: 101,
    saleCost: 119,
    monthlyQty: 45500,
    status: "ACTIVE",
    month: 7,
  }),
  createTransaction({
    trId: "ML130",
    customerName: "Mahindra & Mahindra",
    prodUnit: "Unit 4",
    billingUnit: "Unit 4",
    subcategory: "Hose",
    partNo: "550022",
    partName: "HOSE CLIP",
    mfgWoMargin: 117,
    mfgWithMargin: 126,
    saleCost: 121,
    monthlyQty: 36000,
    status: "DRAFT",
    month: 7,
  }),
  createTransaction({
    trId: "ML131",
    customerName: "Maruti Suzuki",
    prodUnit: "Unit 6",
    billingUnit: "Unit 6",
    subcategory: "Sealing",
    partNo: "660033",
    partName: "GUIDE",
    mfgWoMargin: 110,
    mfgWithMargin: 118,
    saleCost: 117,
    monthlyQty: 34000,
    status: "COMPLETED",
    month: 7,
  }),
  createTransaction({
    trId: "ML132",
    customerName: "Bajaj Auto",
    prodUnit: "Unit 1",
    billingUnit: "Unit 1",
    subcategory: "O-Ring",
    partNo: "770044",
    partName: "RETAINER",
    mfgWoMargin: 77,
    mfgWithMargin: 82,
    saleCost: 95,
    monthlyQty: 59000,
    status: "ACTIVE",
    month: 8,
  }),
  createTransaction({
    trId: "ML133",
    customerName: "TVS Motors",
    prodUnit: "Unit 4",
    billingUnit: "Unit 4",
    subcategory: "General Moulding",
    partNo: "880055",
    partName: "BUSH",
    mfgWoMargin: 105,
    mfgWithMargin: 113,
    saleCost: 108,
    monthlyQty: 41000,
    status: "PENDING",
    month: 8,
  }),
  createTransaction({
    trId: "ML134",
    customerName: "Eicher Motors",
    prodUnit: "Unit 6",
    billingUnit: "Unit 6",
    subcategory: "Sealing",
    partNo: "990066",
    partName: "PLATE",
    mfgWoMargin: 144,
    mfgWithMargin: 154,
    saleCost: 151,
    monthlyQty: 30000,
    status: "INACTIVE",
    month: 8,
  }),
  createTransaction({
    trId: "ML135",
    customerName: "Ashok Leyland",
    prodUnit: "Unit 1",
    billingUnit: "Unit 1",
    subcategory: "Insulation",
    partNo: "101112",
    partName: "SPACER",
    mfgWoMargin: 82,
    mfgWithMargin: 88,
    saleCost: 104,
    monthlyQty: 55000,
    status: "ACTIVE",
    month: 9,
  }),
  createTransaction({
    trId: "ML136",
    customerName: "Hyundai",
    prodUnit: "Unit 4",
    billingUnit: "Unit 4",
    subcategory: "Hose",
    partNo: "131415",
    partName: "MOUNT",
    mfgWoMargin: 121,
    mfgWithMargin: 130,
    saleCost: 127,
    monthlyQty: 38000,
    status: "PENDING",
    month: 9,
  }),
  createTransaction({
    trId: "ML137",
    customerName: "Force Motors",
    prodUnit: "Unit 6",
    billingUnit: "Unit 6",
    subcategory: "General Moulding",
    partNo: "161718",
    partName: "SHIELD",
    mfgWoMargin: 132,
    mfgWithMargin: 141,
    saleCost: 158,
    monthlyQty: 36500,
    status: "COMPLETED",
    month: 9,
  }),
  createTransaction({
    trId: "ML138",
    customerName: "Tata Motors",
    prodUnit: "Unit 1",
    billingUnit: "Unit 1",
    subcategory: "Sealing",
    partNo: "200101",
    partName: "DOOR SEAL",
    mfgWoMargin: 96,
    mfgWithMargin: 103,
    saleCost: 124,
    monthlyQty: 52000,
    status: "ACTIVE",
    month: 10,
  }),
  createTransaction({
    trId: "ML139",
    customerName: "Mahindra & Mahindra",
    prodUnit: "Unit 4",
    billingUnit: "Unit 4",
    subcategory: "O-Ring",
    partNo: "200102",
    partName: "O-RING 44MM",
    mfgWoMargin: 89,
    mfgWithMargin: 95,
    saleCost: 110,
    monthlyQty: 47000,
    status: "ACTIVE",
    month: 10,
  }),
  createTransaction({
    trId: "ML140",
    customerName: "Maruti Suzuki",
    prodUnit: "Unit 6",
    billingUnit: "Unit 6",
    subcategory: "General Moulding",
    partNo: "200103",
    partName: "MUD FLAP",
    mfgWoMargin: 113,
    mfgWithMargin: 121,
    saleCost: 118,
    monthlyQty: 32000,
    status: "INACTIVE",
    month: 10,
  }),
  createTransaction({
    trId: "ML141",
    customerName: "Bajaj Auto",
    prodUnit: "Unit 1",
    billingUnit: "Unit 1",
    subcategory: "Hose",
    partNo: "200104",
    partName: "FUEL HOSE",
    mfgWoMargin: 84,
    mfgWithMargin: 90,
    saleCost: 107,
    monthlyQty: 64000,
    status: "ACTIVE",
    month: 11,
  }),
  createTransaction({
    trId: "ML142",
    customerName: "TVS Motors",
    prodUnit: "Unit 4",
    billingUnit: "Unit 4",
    subcategory: "Sealing",
    partNo: "200105",
    partName: "COVER GASKET",
    mfgWoMargin: 109,
    mfgWithMargin: 117,
    saleCost: 136,
    monthlyQty: 43000,
    status: "COMPLETED",
    month: 11,
  }),
  createTransaction({
    trId: "ML143",
    customerName: "Eicher Motors",
    prodUnit: "Unit 6",
    billingUnit: "Unit 6",
    subcategory: "Insulation",
    partNo: "200106",
    partName: "TERMINAL BOOT",
    mfgWoMargin: 129,
    mfgWithMargin: 138,
    saleCost: 145,
    monthlyQty: 35500,
    status: "PENDING",
    month: 11,
  }),
  createTransaction({
    trId: "ML144",
    customerName: "Ashok Leyland",
    prodUnit: "Unit 1",
    billingUnit: "Unit 1",
    subcategory: "General Moulding",
    partNo: "200107",
    partName: "AIR INTAKE DUCT",
    mfgWoMargin: 106,
    mfgWithMargin: 113,
    saleCost: 138,
    monthlyQty: 61000,
    status: "ACTIVE",
    month: 12,
  }),
  createTransaction({
    trId: "ML145",
    customerName: "Hyundai",
    prodUnit: "Unit 4",
    billingUnit: "Unit 4",
    subcategory: "O-Ring",
    partNo: "200108",
    partName: "SUSPENSION BUSH",
    mfgWoMargin: 98,
    mfgWithMargin: 105,
    saleCost: 123,
    monthlyQty: 49000,
    status: "ACTIVE",
    month: 12,
  }),
  createTransaction({
    trId: "ML146",
    customerName: "Force Motors",
    prodUnit: "Unit 6",
    billingUnit: "Unit 6",
    subcategory: "Hose",
    partNo: "200109",
    partName: "VACUUM TUBE",
    mfgWoMargin: 153,
    mfgWithMargin: 164,
    saleCost: 160,
    monthlyQty: 29500,
    status: "DRAFT",
    month: 12,
  }),
  createTransaction({
    trId: "ML147",
    customerName: "Tata Motors",
    prodUnit: "Unit 1",
    billingUnit: "Unit 1",
    subcategory: "Sealing",
    partNo: "200110",
    partName: "WINDSHIELD SEAL",
    mfgWoMargin: 111,
    mfgWithMargin: 119,
    saleCost: 147,
    monthlyQty: 63000,
    status: "ACTIVE",
    month: 1,
  }),
  createTransaction({
    trId: "ML148",
    customerName: "Mahindra & Mahindra",
    prodUnit: "Unit 4",
    billingUnit: "Unit 4",
    subcategory: "General Moulding",
    partNo: "200111",
    partName: "PEDAL PAD",
    mfgWoMargin: 91,
    mfgWithMargin: 97,
    saleCost: 117,
    monthlyQty: 56000,
    status: "COMPLETED",
    month: 1,
  }),
  createTransaction({
    trId: "ML149",
    customerName: "Maruti Suzuki",
    prodUnit: "Unit 6",
    billingUnit: "Unit 6",
    subcategory: "O-Ring",
    partNo: "200112",
    partName: "GROMMET RING",
    mfgWoMargin: 126,
    mfgWithMargin: 135,
    saleCost: 151,
    monthlyQty: 41000,
    status: "PENDING",
    month: 1,
  }),
];

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

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="molding-chart-tooltip rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-700">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatLakhs(entry.value)}
        </p>
      ))}
    </div>
  );
}

function LegendDot({ color, label, value }) {
  return (
    <div className="molding-legend-dot flex items-center gap-2 text-sm text-slate-600">
      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
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
                <tr key={row.trId} className="text-slate-600">
                  <td className="px-3 py-1.5">{index + 1}</td>
                  <td className="px-3 py-1.5 font-medium">{row.partNo}</td>
                  <td className="px-3 py-1.5">
                    {row.partName || row.subcategory}
                  </td>
                  <td
                    className={`px-3 py-1.5 text-right font-bold ${positive ? "text-emerald-600" : "text-rose-500"}`}
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
        if (!cancelled)
          setFetchedTransactions(Array.isArray(result) ? result : []);
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

  const sourceTransactions =
    transactions ??
    (typeof fetchTransactions === "function"
      ? (fetchedTransactions ?? [])
      : mockTransactions);
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
    const selectRows = (key) =>
      [
        ...new Set(sourceTransactions.map((row) => row[key]).filter(Boolean)),
      ].sort();
    return {
      prodUnits: selectRows("prodUnit"),
      billingUnits: selectRows("billingUnit"),
      customers: selectRows("customerName"),
      statuses: selectRows("status"),
    };
  }, [sourceTransactions]);

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
    const averageMargin = filteredTransactions.length
      ? sumBy(
          filteredTransactions,
          (row) => (number(row.plVsMfgCost) / number(row.saleCost)) * 100,
        ) / filteredTransactions.length
      : 0;

    return {
      transactionCount: filteredTransactions.length,
      monthlyQty: sumBy(filteredTransactions, (row) => row.monthlyQty),
      salesValue,
      manufacturingValue,
      totalMfgPL,
      averageMargin,
    };
  }, [filteredTransactions]);

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
      return {
        month: monthLabel(appliedFilters.financialYear, item.value),
        manufacturing:
          sumBy(rows, (row) => row.mfgWithMargin * row.monthlyQty) / 100000,
        sales: sumBy(rows, (row) => row.saleCost * row.monthlyQty) / 100000,
        profit: sumBy(rows, (row) => row.totalMfgPL) / 100000,
        transactionCount: rows.length,
        monthlyQty: sumBy(rows, (row) => row.monthlyQty),
        averageMargin: rows.length
          ? sumBy(
              rows,
              (row) => (number(row.plVsMfgCost) / number(row.saleCost)) * 100,
            ) / rows.length
          : 0,
      };
    });
  }, [filteredTransactions, appliedFilters]);

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
        .map(([status, color]) => ({
          name: status.charAt(0) + status.slice(1).toLowerCase(),
          value: filteredTransactions.filter(
            (row) => String(row.status).toUpperCase() === status,
          ).length,
          color,
        }))
        .filter((item) => item.value > 0),
    [filteredTransactions],
  );

  const profitableParts = useMemo(
    () =>
      [...filteredTransactions]
        .filter((row) => number(row.totalMfgPL) >= 0)
        .sort((a, b) => number(b.totalMfgPL) - number(a.totalMfgPL))
        .slice(0, 10),
    [filteredTransactions],
  );
  const lossParts = useMemo(
    () =>
      [...filteredTransactions]
        .filter((row) => number(row.totalMfgPL) < 0)
        .sort((a, b) => number(a.totalMfgPL) - number(b.totalMfgPL))
        .slice(0, 10),
    [filteredTransactions],
  );

  const alerts = useMemo(() => {
    const margin = (row) =>
      (number(row.plVsMfgCost) / number(row.saleCost)) * 100;
    const belowCost = filteredTransactions.filter(
      (row) => number(row.saleCost) < number(row.mfgWithMargin),
    ).length;
    const lowMargin = filteredTransactions.filter(
      (row) => margin(row) < 5,
    ).length;
    const highQtyLowMargin = filteredTransactions.filter(
      (row) => number(row.monthlyQty) > 50000 && margin(row) < 3,
    ).length;
    const highProfit = filteredTransactions.filter(
      (row) => number(row.totalMfgPL) > 500000,
    ).length;
    return [
      {
        tone: "red",
        count: belowCost,
        text: "parts have Sell Cost below Mfg Cost.",
      },
      { tone: "orange", count: lowMargin, text: "parts have margin below 5%." },
      {
        tone: "amber",
        count: highQtyLowMargin,
        text: "parts have Monthly Qty > 50,000 but margin < 3%.",
      },
      {
        tone: "green",
        count: highProfit,
        text: "parts generate more than ₹5L monthly P/L.",
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
          <DashboardCard title="Manufacturing Cost vs Sell Cost">
            <div className="mb-1 flex justify-end gap-5">
              <LegendDot color={COLORS.blue} label="Manufacturing Cost" />
              <LegendDot color={COLORS.green} label="Sell Cost" />
            </div>
            <div className="h-[215px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 8, right: 6, left: -10, bottom: 2 }}
                  barGap={3}
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
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="manufacturing"
                    name="Manufacturing Cost"
                    fill={COLORS.blue}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={20}
                  />
                  <Bar
                    dataKey="sales"
                    name="Sell Cost"
                    fill={COLORS.green}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard title="Monthly Profit / Loss">
            <div className="mb-1 flex justify-end">
              <LegendDot color={COLORS.red} label="P/L (₹ in Lakhs)" />
            </div>
            <div className="h-[215px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 8, right: 6, left: -10, bottom: 2 }}
                >
                  <defs>
                    <linearGradient id="profitFill" x1="0" x2="0" y1="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={COLORS.red}
                        stopOpacity={0.32}
                      />
                      <stop
                        offset="100%"
                        stopColor={COLORS.red}
                        stopOpacity={0.03}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => value.replace(" ", "\n")}
                    {...chartAxis}
                  />
                  <YAxis
                    {...chartAxis}
                    label={{
                      value: "P/L (₹ in Lakhs)",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 11,
                      fill: "#334155",
                    }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="P/L"
                    stroke={COLORS.red}
                    strokeWidth={2}
                    fill="url(#profitFill)"
                    dot={{ r: 3, fill: COLORS.red }}
                    activeDot={{ r: 5 }}
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
            <div className="h-[214px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={customerData}
                  margin={{ top: 0, right: 38, left: 10, bottom: 0 }}
                >
                  <CartesianGrid stroke="#edf2f7" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="customer"
                    width={130}
                    tick={{ fontSize: 11, fill: "#334155" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="profit"
                    name="P/L"
                    fill={COLORS.blue}
                    radius={[0, 3, 3, 0]}
                    maxBarSize={15}
                  >
                    <LabelList
                      dataKey="profit"
                      position="right"
                      formatter={(value) => number(value).toFixed(1)}
                      fill="#173d70"
                      fontSize={11}
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
            <div className="h-[214px]">
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
                  <Tooltip content={<ChartTooltip />} />
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
          </DashboardCard>

          <DashboardCard title="Billing Unit Performance">
            <div className="molding-billing-content flex h-[214px] items-center gap-2">
              <div className="relative h-full min-w-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={billingData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="52%"
                      outerRadius="83%"
                      paddingAngle={1}
                      stroke="white"
                      strokeWidth={2}
                    >
                      {billingData.map((entry, index) => (
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
              <div className="flex h-[125px] items-center gap-3">
                <div className="relative h-full min-w-0 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="54%"
                        outerRadius="84%"
                        paddingAngle={1}
                        stroke="white"
                        strokeWidth={2}
                      >
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
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

export { mockTransactions, formatCurrency, formatPercent };
