import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import {
  RefreshCw,
  Search,
  X,
  FileSpreadsheet,
  Plus,
  Upload,
  Pencil,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/api";
import "../../assets/css/Molding.css";
import * as XLSX from "xlsx";

const financialYearOptions = generateFinancialYears();

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

const defaultFinancialYear =
  financialYearOptions.find((item) => item.selected)?.value ||
  financialYearOptions[financialYearOptions.length - 1]?.value ||
  "";

const getCurrentFiscalMonth = () => new Date().getMonth() + 1;

const getSelectedMonthLabel = (financialYearValue, fromMonth, toMonth) => {
  const fyMatch = String(financialYearValue || "").match(/^(\d{4})-(\d{2})$/);

  if (!fyMatch) {
    return "";
  }

  const startYear = Number(fyMatch[1]);

  const monthNames = [
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
  ];

  const getLabel = (monthNumber) => {
    const month = Number(monthNumber);

    if (month < 1 || month > 12) {
      return "";
    }

    const year = month >= 4 ? startYear : startYear + 1;
    return `${monthNames[month - 1]} ${year}`;
  };

  return `${getLabel(fromMonth)} to ${getLabel(toMonth)}`;
};

const getFiscalMonthIndex = (month) => {
  const monthNumber = Number(month);

  if (monthNumber < 1 || monthNumber > 12) {
    return -1;
  }

  // Financial-year order:
  // Apr = 0, May = 1, ... Dec = 8, Jan = 9, Feb = 10, Mar = 11
  return monthNumber >= 4 ? monthNumber - 4 : monthNumber + 8;
};

const normalizeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const extractSalesMonthlyArray = (response) => {
  if (Array.isArray(response)) return response;

  if (!response || typeof response !== "object") return [];

  const keys = ["data", "entries", "salesMonthly", "records", "items"];

  for (const key of keys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  return [];
};

const normalizeSalesMonthlyEntry = (entry) => ({
  partNo: entry?.partNo ?? entry?.part_no ?? "",
  unit: entry?.unit ?? "",
  financialYear: entry?.financialYear ?? entry?.financial_year ?? "",
  month: Number(entry?.month),
  qty:
    entry?.qty === null || entry?.qty === undefined || entry?.qty === ""
      ? null
      : Number(entry.qty),
  sellRate:
    entry?.sell_rate === null ||
    entry?.sell_rate === undefined ||
    entry?.sell_rate === ""
      ? null
      : Number(entry.sell_rate),
});

const formatInteger = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const MOLDING_TABLE_COLUMNS = (handleOpenTransaction, handleDownloadExcel) => [
  {
    name: "TR ID",
    selector: (row) => row.transaction_id,
    grow: 0.8,
    sortable: true,
    minWidth: "50px",
    cell: (row) => <span className="transaction-id">{row.transaction_id}</span>,
  },
  {
    name: "Customer Name",
    selector: (row) => row.customer_name,
    sortable: true,
    grow: 2.4,
    minWidth: "170px",
    left: true,
    cell: (row) => <span className="customer-name">{row.customer_name}</span>,
  },
  {
    name: "Part No",
    selector: (row) => row.part_no,
    sortable: true,
    grow: 2.4,
    minWidth: "170px",
    left: true,
    cell: (row) => <span className="part-no">{row.part_no}</span>,
  },
  {
    name: "Sub category",
    selector: (row) => row.sub_category,
    sortable: true,
    grow: 0.9,
    minWidth: "80px",
    center: true,
    cell: (row) => <span className="sub-category">{row.sub_category}</span>,
  },
  {
    name: "Mfg W/O Margin",
    selector: (row) => Number(row.__display?.subtotalA || 0),
    sortable: true,
    grow: 0.9,
    minWidth: "75px",
    center: true,
    cell: (row) => formatNumber(row.__display?.subtotalA, 2),
  },
  {
    name: "Mfg With Margin",
    selector: (row) => Number(row.__display?.partCost || 0),
    sortable: true,
    grow: 0.9,
    minWidth: "75px",
    center: true,
    cell: (row) => formatNumber(row.__display?.partCost, 2),
  },
  {
    name: "Sale Cost",
    selector: (row) => Number(row.__display?.customerSalesCost || 0),
    sortable: true,
    grow: 0.9,
    minWidth: "60px",
    center: true,
    cell: (row) => formatNumber(row.__display?.customerSalesCost, 2),
  },
  {
    name: "Extra P/L",
    selector: (row) => Number(row.__display?.extra_profit || 0),
    sortable: true,
    grow: 1,
    minWidth: "60px",
    center: true,
    cell: (row) => {
      const value = Number(row.__display?.extra_profit || 0);
      return (
        <span className={value > 0 ? "profit" : value < 0 ? "loss" : "neutral"}>
          {value > 0
            ? `+${formatNumber(value, 2)}`
            : value < 0
              ? `-${formatNumber(Math.abs(value), 2)}`
              : formatNumber(0, 2)}
        </span>
      );
    },
  },
  {
    name: " Mfg vs Sales Cost",
    selector: (row) => Number(row.__display?.profit_vs_mfg_cost || 0),
    sortable: true,
    grow: 1,
    minWidth: "75px",
    center: true,
    cell: (row) => {
      const value = Number(row.__display?.profit_vs_mfg_cost || 0);

      return (
        <span className={value > 0 ? "profit" : value < 0 ? "loss" : "neutral"}>
          {value > 0
            ? `+${formatNumber(value, 2)}`
            : value < 0
              ? `-${formatNumber(Math.abs(value), 2)}`
              : formatNumber(0, 2)}
        </span>
      );
    },
  },
  {
    name: "Monthly Qty",
    selector: (row) => Number(row.__display?.monthlyQty || 0),
    sortable: true,
    grow: 1,
    minWidth: "75px",
    center: true,
    cell: (row) => formatInteger(row.__display?.monthlyQty),
  },
  {
    name: "Extra P/L Total",
    selector: (row) => Number(row.__display?.extra_monthlyProfitLoss || 0),
    sortable: true,
    grow: 1,
    minWidth: "75px",
    center: true,
    cell: (row) => {
      const value = Number(row.__display?.extra_monthlyProfitLoss || 0);
      return (
        <span className={value > 0 ? "profit" : value < 0 ? "loss" : "neutral"}>
          {value > 0
            ? `+${formatInteger(Math.abs(value))}`
            : value < 0
              ? `-${formatInteger(Math.abs(value))}`
              : formatInteger(0)}
        </span>
      );
    },
  },
  {
    name: "Total Mfg P/L",
    selector: (row) => Number(row.__display?.monthlyProfitLoss || 0),
    sortable: true,
    grow: 1,
    minWidth: "75px",
    center: true,
    cell: (row) => {
      const value = Number(row.__display?.monthlyProfitLoss || 0);
      return (
        <span className={value > 0 ? "profit" : value < 0 ? "loss" : "neutral"}>
          {value > 0
            ? `+${formatInteger(Math.abs(value))}`
            : value < 0
              ? `-${formatInteger(Math.abs(value))}`
              : formatInteger(0)}
        </span>
      );
    },
  },

  {
    name: "Prod Unit",
    selector: (row) => row.production_unit,
    sortable: true,
    grow: 0.8,
    minWidth: "60px",
    center: true,
    cell: (row) => (
      <span className="production-unit">{row.production_unit}</span>
    ),
  },
  {
    name: "Billing Unit",
    selector: (row) => row.billing_unit,
    sortable: true,
    grow: 0.8,
    minWidth: "60px",
    center: true,
    cell: (row) => <span className="billing-unit">{row.billing_unit}</span>,
  },
  {
    name: "Status",
    selector: (row) => row.status,
    sortable: true,
    grow: 0.8,
    minWidth: "60px",
    center: true,
    cell: (row) => (
      <span className={`status ${String(row.status || "").toLowerCase()}`}>
        {row.status}
      </span>
    ),
  },
  {
    name: "Action",
    width: "90px",
    center: true,
    cell: (row) => (
      <div className="molding-action-buttons">
        {/* EDIT */}
        <button
          type="button"
          className="molding-edit-btn"
          onClick={() => handleOpenTransaction(row.transaction_id)}
          title="Edit Transaction"
          aria-label="Edit Transaction"
        >
          <Pencil size={14} />
        </button>

        {/* DOWNLOAD EXCEL */}
        <button
          type="button"
          className="molding-download-btn"
          onClick={() => handleDownloadExcel(row.transaction_id)}
          title="Download Excel"
          aria-label="Download Excel"
        >
          <FileSpreadsheet size={14} />
        </button>
      </div>
    ),
  },
];

const moldingDataTableStyles = {
  table: {
    style: {
      width: "100%",
      minWidth: "0",
      maxWidth: "100%",
    },
  },
  headRow: {
    style: {
      fontSize: "11px",
      minHeight: "55px",
      backgroundColor: "#eaf2fb",
      borderBottom: "1px solid #cbd8e8",
    },
  },
  headCells: {
    style: {
      paddingLeft: "8px",
      paddingRight: "8px",
      color: "#19224a",
      fontSize: "11px",
      fontWeight: 700,

      // IMPORTANT: allow header text to wrap
      whiteSpace: "normal",
      wordBreak: "normal",
      overflowWrap: "break-word",
      lineHeight: "1.15",
      textAlign: "center",

      borderRight: "1px solid #dce5f0",
    },
  },
  rows: {
    style: {
      minHeight: "35px",
      fontSize: "12px",
      color: "#475569",
      borderBottom: "1px solid #edf1f5",
    },
    highlightOnHoverStyle: {
      backgroundColor: "#f5f9ff",
      outline: "none",
    },
  },
  cells: {
    style: {
      paddingLeft: "8px",
      paddingRight: "8px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      borderRight: "1px solid #edf1f5",
    },
  },
  pagination: {
    style: {
      minHeight: "42px",
      borderTop: "1px solid #e7ebf0",
      color: "#64748b",
      fontSize: "12px",
    },
  },
};

const getStoredUserName = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (user.user_name || user.username || user.name || "").trim();
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
    return "";
  }
};

const Molding = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [selectedFinancialYear, setSelectedFinancialYear] =
    useState(defaultFinancialYear);
  const [selectedFromMonth, setSelectedFromMonth] = useState(
    getCurrentFiscalMonth(),
  );
  const [selectedToMonth, setSelectedToMonth] = useState(
    getCurrentFiscalMonth(),
  );
  const [selectedCustomer, setSelectedCustomer] = useState("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [selectedPartNo, setSelectedPartNo] = useState("All");
  const [selectedProfitLoss, setSelectedProfitLoss] = useState("All");
  const [salesFinancialYear, setSalesFinancialYear] =
    useState(defaultFinancialYear);
  const [salesFromMonth, setSalesFromMonth] = useState(getCurrentFiscalMonth());
  const [salesToMonth, setSalesToMonth] = useState(getCurrentFiscalMonth());
  const [customerFilter, setCustomerFilter] = useState("All");
  const [subCategoryFilter, setSubCategoryFilter] = useState("All");
  const [partFilter, setPartFilter] = useState("All");
  const [profitLossFilter, setProfitLossFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [salesMonthlyLoading, setSalesMonthlyLoading] = useState(false);
  const [salesMonthlyEntries, setSalesMonthlyEntries] = useState([]);
  const [moldingMonthlyReports, setMoldingMonthlyReports] = useState([]);
  const [moldingMonthlyReportLoading, setMoldingMonthlyReportLoading] =
    useState(false);

  useEffect(() => {
    if (!isApplyingFilters) return;

    if (salesMonthlyLoading || moldingMonthlyReportLoading) {
      return;
    }

    const timer = setTimeout(() => {
      setIsApplyingFilters(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [isApplyingFilters, salesMonthlyLoading, moldingMonthlyReportLoading]);

  // FETCH TRANSACTIONS
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/molding?userName=${encodeURIComponent(
          getStoredUserName(),
        )}`,
        {
          credentials: "include",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch molding transactions",
        );
      }

      setTransactions(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Error fetching molding transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // FETCH SALES MONTHLY DATA
  useEffect(() => {
    let cancelled = false;
    const fetchSalesMonthly = async () => {
      if (!salesFinancialYear) {
        setSalesMonthlyEntries([]);
        return;
      }
      try {
        setSalesMonthlyLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/molding?userName=${encodeURIComponent(
            getStoredUserName(),
          )}`,
          {
            credentials: "include",
          },
        );
        if (!response.ok) {
          throw new Error(
            `Unable to load Sales Monthly data. Status: ${response.status}`,
          );
        }
        const result = await response.json();
        const data = extractSalesMonthlyArray(result)
          .map(normalizeSalesMonthlyEntry)
          .filter(
            (entry) =>
              entry.partNo &&
              String(entry.financialYear) === String(salesFinancialYear) &&
              entry.month >= 1 &&
              entry.month <= 12,
          );
        if (!cancelled) {
          setSalesMonthlyEntries(data);
        }
      } catch (error) {
        console.error("Error fetching Sales Monthly data:", error);
        if (!cancelled) {
          setSalesMonthlyEntries([]);
        }
      } finally {
        if (!cancelled) {
          setSalesMonthlyLoading(false);
        }
      }
    };
    fetchSalesMonthly();
    return () => {
      cancelled = true;
    };
  }, [salesFinancialYear]);

  // FETCH SAVED MONTHLY MOLDING REPORT
  useEffect(() => {
    let cancelled = false;

    const fetchMoldingMonthlyReports = async () => {
      if (!salesFinancialYear) {
        setMoldingMonthlyReports([]);
        return;
      }

      try {
        setMoldingMonthlyReportLoading(true);

        const params = new URLSearchParams({
          financialYear: salesFinancialYear,
          userName: getStoredUserName(),
        });

        const response = await fetch(
          `${API_BASE_URL}/molding-monthly-report?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load saved molding monthly report. Status: ${response.status}`,
          );
        }

        const result = await response.json();
        if (!result?.success) {
          throw new Error(
            result?.message || "Unable to load saved molding monthly report.",
          );
        }

        const data = Array.isArray(result.data) ? result.data : [];

        if (!cancelled) {
          setMoldingMonthlyReports(data);
        }
      } catch (error) {
        console.error("Error fetching saved molding monthly report:", error);

        if (!cancelled) {
          setMoldingMonthlyReports([]);
        }
      } finally {
        if (!cancelled) {
          setMoldingMonthlyReportLoading(false);
        }
      }
    };

    fetchMoldingMonthlyReports();

    return () => {
      cancelled = true;
    };
  }, [salesFinancialYear]);

  // SAVED MONTHLY REPORT LOOKUP
  const savedMonthlyReportByTransactionMonth = useMemo(() => {
    const map = new Map();

    moldingMonthlyReports.forEach((report) => {
      const transactionId = normalizeKey(
        report?.transaction_id ?? report?.transactionId,
      );
      const financialYear = normalizeKey(
        report?.financial_year ?? report?.financialYear,
      );
      const month = Number(report?.month);

      if (!transactionId || !financialYear || !Number.isFinite(month)) {
        return;
      }

      map.set(`${transactionId}||${financialYear}||${month}`, report);
    });

    return map;
  }, [moldingMonthlyReports]);

  const getSavedMonthlyReportsForTransaction = (transactionId) => {
    const normalizedTransactionId = normalizeKey(transactionId);
    const normalizedFinancialYear = normalizeKey(salesFinancialYear);

    return months
      .map((month) =>
        savedMonthlyReportByTransactionMonth.get(
          `${normalizedTransactionId}||${normalizedFinancialYear}||${month.value}`,
        ),
      )
      .filter(Boolean);
  };

  const getSavedPeriodValues = (transactionId) => {
    const reports = getSavedMonthlyReportsForTransaction(transactionId);

    const fromIndex = getFiscalMonthIndex(salesFromMonth);
    const toIndex = getFiscalMonthIndex(salesToMonth);

    const selectedReports = reports.filter((report) => {
      const monthIndex = getFiscalMonthIndex(report.month);
      return monthIndex >= fromIndex && monthIndex <= toIndex;
    });

    if (selectedReports.length === 0) {
      return null;
    }

    // Monthly quantity is summed across the selected period.
    const monthlyQty = selectedReports.reduce(
      (total, report) => total + Number(report.monthly_quantity || 0),
      0,
    );

    // Customer Sales Cost is a SIMPLE ARITHMETIC AVERAGE
    // across all selected saved months.
    const customerSalesCostTotal = selectedReports.reduce(
      (total, report) => total + Number(report?.customer_sales_cost || 0),
      0,
    );

    const customerSalesCost =
      selectedReports.length > 0
        ? customerSalesCostTotal / selectedReports.length
        : 0;

    // For cost values, use a SIMPLE ARITHMETIC AVERAGE
    // of all saved months in the selected fiscal period.
    // No costing recalculation is performed.
    const subtotalATotal = selectedReports.reduce(
      (total, report) => total + Number(report?.subtotal_a || 0),
      0,
    );

    const partCostTotal = selectedReports.reduce(
      (total, report) => total + Number(report?.part_cost || 0),
      0,
    );

    const reportCount = selectedReports.length;

    const averageSubtotalA = reportCount > 0 ? subtotalATotal / reportCount : 0;

    const averagePartCost = reportCount > 0 ? partCostTotal / reportCount : 0;

    return {
      subtotalA: averageSubtotalA,
      partCost: averagePartCost,
      customerSalesCost,
      monthlyQty,
      hasSavedData: true,
    };
  };

  // KEEP MONTH RANGE VALID IN FINANCIAL-YEAR ORDER
  useEffect(() => {
    if (
      getFiscalMonthIndex(salesFromMonth) > getFiscalMonthIndex(salesToMonth)
    ) {
      setSalesToMonth(salesFromMonth);
    }
  }, [salesFromMonth, salesToMonth]);

  const handleApplyFilters = () => {
    const fromIndex = getFiscalMonthIndex(selectedFromMonth);
    const toIndex = getFiscalMonthIndex(selectedToMonth);

    if (fromIndex > toIndex) {
      alert("To Month cannot be before From Month.");
      return;
    }

    setIsApplyingFilters(true);

    // Rate period
    setSalesFinancialYear(selectedFinancialYear);
    setSalesFromMonth(selectedFromMonth);
    setSalesToMonth(selectedToMonth);

    // Table filters
    setCustomerFilter(selectedCustomer);
    setSubCategoryFilter(selectedSubCategory);
    setPartFilter(selectedPartNo);
    setProfitLossFilter(selectedProfitLoss);
  };

  // TRANSACTION HANDLERS
  const handleAddTransaction = () => {
    navigate("/vp/molding/costing-wizard");
  };

  const handleOpenTransaction = (transactionId) => {
    navigate(`/vp/molding/costing-wizard/${transactionId}`);
  };

  const handleBulkUpload = () => {
    navigate("/vp/molding/bulk-upload");
  };
  const handleDownloadExcel = async (transactionId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/molding/${transactionId}/download-excel`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Excel API error:", response.status, errorText);

        throw new Error(
          `Excel download failed (${response.status}): ${errorText}`,
        );
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${transactionId}_Costing.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel download error:", error);
      alert(error.message || "Failed to download Excel.");
    }
  };

  // EXPORT EXCEL
  const handleExportExcel = () => {
    try {
      // Export exactly the rows shown after applying table filters.
      if (!filteredTableRows.length) {
        alert("No table data available to export.");
        return;
      }

      const exportData = filteredTableRows.map((row) => ({
        "TR ID": row.transaction_id ?? "",
        "Customer Name": row.customer_name ?? "",
        "Part No": row.part_no ?? "",
        "Sub Category": row.sub_category ?? "",
        "Mfg W/O Margin": Number(row.__display?.subtotalA ?? 0),
        "Mfg With Margin": Number(row.__display?.partCost ?? 0),
        "Sale Cost": Number(row.__display?.customerSalesCost ?? 0),
        "Extra P/L": Number(row.__display?.extra_profit ?? 0),
        "P/L VS Mfg Cost": Number(row.__display?.profit_vs_mfg_cost ?? 0),
        "Monthly Qty": Number(row.__display?.monthlyQty ?? 0),
        "Extra P/L Total": Number(row.__display?.extra_monthlyProfitLoss ?? 0),
        "Total Mfg P/L": Number(row.__display?.monthlyProfitLoss ?? 0),
        "Prod Unit": row.production_unit ?? "",
        "Billing Unit": row.billing_unit ?? "",
        Status: row.status ?? "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet["!cols"] = [
        { wch: 12 },
        { wch: 25 },
        { wch: 22 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Molding Report");

      const date = new Date().toISOString().slice(0, 10);

      XLSX.writeFile(
        workbook,
        `Molding_Report_${salesFinancialYear}_${date}.xlsx`,
      );
    } catch (error) {
      console.error("Error exporting molding table:", error);
      alert("Failed to export molding table.");
    }
  };

  // Prepare display values once for DataTable.
  const tableRows = useMemo(
    () =>
      transactions.map((transaction) => {
        const savedPeriodValues = getSavedPeriodValues(
          transaction.transaction_id,
        );

        const subtotalA = savedPeriodValues?.hasSavedData
          ? savedPeriodValues.subtotalA
          : Number(transaction.subtotal_a || 0);

        const partCost = savedPeriodValues?.hasSavedData
          ? savedPeriodValues.partCost
          : Number(transaction.part_cost || 0);

        const customerSalesCost = savedPeriodValues?.hasSavedData
          ? savedPeriodValues.customerSalesCost
          : Number(transaction.customer_sales_cost || 0);

        const monthlyQty = savedPeriodValues?.hasSavedData
          ? savedPeriodValues.monthlyQty
          : Number(transaction.monthly_quantity || 0);

        const extra_profit = customerSalesCost - partCost;
        const profit_vs_mfg_cost = customerSalesCost - subtotalA;
        const extra_monthlyProfitLoss = extra_profit * monthlyQty;
        const monthlyProfitLoss = profit_vs_mfg_cost * monthlyQty;

        return {
          ...transaction,
          __display: {
            subtotalA,
            partCost,
            customerSalesCost,
            monthlyQty,
            extra_profit,
            profit_vs_mfg_cost,
            extra_monthlyProfitLoss,
            monthlyProfitLoss,
          },
        };
      }),
    [
      transactions,
      moldingMonthlyReports,
      salesFinancialYear,
      salesFromMonth,
      salesToMonth,
    ],
  );

  const filteredTableRows = useMemo(() => {
    const search = normalizeKey(searchText);

    return tableRows.filter((row) => {
      // SEARCH BAR
      if (search) {
        const searchableText = [
          row.transaction_id,
          row.customer_name,
          row.sub_category,
          row.part_no,
          row.production_unit,
          row.billing_unit,
          row.status,
        ]
          .map((value) => normalizeKey(value))
          .join(" ");

        if (!searchableText.includes(search)) {
          return false;
        }
      }

      // CUSTOMER FILTER
      if (
        customerFilter !== "All" &&
        normalizeKey(row.customer_name) !== normalizeKey(customerFilter)
      ) {
        return false;
      }

      // SUB CATEGORY FILTER
      if (
        subCategoryFilter !== "All" &&
        normalizeKey(row.sub_category) !== normalizeKey(subCategoryFilter)
      ) {
        return false;
      }

      // PART NO FILTER
      if (
        partFilter !== "All" &&
        normalizeKey(row.part_no) !== normalizeKey(partFilter)
      ) {
        return false;
      }

      // PROFIT / LOSS FILTER
      const totalMfgPL = Number(row.__display?.monthlyProfitLoss || 0);
      if (profitLossFilter === "Profit" && totalMfgPL <= 0) {
        return false;
      }
      if (profitLossFilter === "Loss" && totalMfgPL >= 0) {
        return false;
      }

      return true;
    });
  }, [
    tableRows,
    searchText,
    customerFilter,
    subCategoryFilter,
    partFilter,
    profitLossFilter,
  ]);

  const customerOptions = useMemo(() => {
    return [
      "All",
      ...new Set(
        transactions
          .map((t) => t.customer_name)
          .filter(Boolean)
          .sort(),
      ),
    ];
  }, [transactions]);

  const subCategoryOptions = useMemo(() => {
    return [
      "All",
      ...new Set(
        transactions
          .map((t) => t.sub_category)
          .filter(Boolean)
          .sort(),
      ),
    ];
  }, [transactions]);

  const partOptions = useMemo(() => {
    return [
      "All",
      ...new Set(
        transactions
          .map((t) => t.part_no)
          .filter(Boolean)
          .sort(),
      ),
    ];
  }, [transactions]);

  const moldingColumns = useMemo(
    () => MOLDING_TABLE_COLUMNS(handleOpenTransaction, handleDownloadExcel),
    [moldingMonthlyReports, salesFinancialYear, salesFromMonth, salesToMonth],
  );

  // RENDER
  return (
    <div className="molding-page">
      {/* HEADER */}
      <div className="molding-header-1">
        <div>
          <h1>Molding</h1>
        </div>

        <div className="molding-actions">
          {/* SALES MONTHLY FILTERS */}
          {/* <div className="sales-monthly-report-filters">
            LOADING
            {(salesMonthlyLoading || moldingMonthlyReportLoading) && (
              <span className="sales-monthly-filter-loading">Loading...</span>
            )}
          </div> */}
          <button
            type="button"
            className="bulk-upload-btn"
            onClick={handleBulkUpload}
          >
            <Upload size={15} />
            Bulk Upload
          </button>

          {/* EXPORT */}
          <button
            type="button"
            className="export-excel-btn"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet size={15} />
            Export Excel
          </button>

          {/* ADD TRANSACTION */}
          <button
            type="button"
            className="add-transaction-btn"
            onClick={handleAddTransaction}
          >
            <Plus size={16} />
            Add New
          </button>
        </div>
      </div>
      <div className="molding-table-filters">
        {/* FINANCIAL YEAR */}
        <div className="sales-monthly-filter-group">
          <label>Financial Year</label>

          <select
            value={selectedFinancialYear}
            onChange={(event) => setSelectedFinancialYear(event.target.value)}
          >
            {financialYearOptions.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        {/* FROM MONTH */}
        <div className="sales-monthly-filter-group">
          <label>From Month</label>

          <select
            value={selectedFromMonth}
            onChange={(event) =>
              setSelectedFromMonth(Number(event.target.value))
            }
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* TO MONTH */}
        <div className="sales-monthly-filter-group">
          <label>To Month</label>

          <select
            value={selectedToMonth}
            onChange={(event) => setSelectedToMonth(Number(event.target.value))}
          >
            {months.map((month) => (
              <option
                key={month.value}
                value={month.value}
                disabled={
                  getFiscalMonthIndex(month.value) <
                  getFiscalMonthIndex(selectedFromMonth)
                }
              >
                {month.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sales-monthly-filter-group">
          <label>Customer</label>
          <select
            value={selectedCustomer}
            onChange={(event) => setSelectedCustomer(event.target.value)}
          >
            {customerOptions.map((customer) => (
              <option key={customer} value={customer}>
                {customer}
              </option>
            ))}
          </select>
        </div>

        <div className="sales-monthly-filter-group">
          <label>Sub Category</label>
          <select
            value={selectedSubCategory}
            onChange={(event) => setSelectedSubCategory(event.target.value)}
          >
            {subCategoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="sales-monthly-filter-group">
          <label>Part No</label>
          <select
            value={selectedPartNo}
            onChange={(event) => setSelectedPartNo(event.target.value)}
          >
            {partOptions.map((part) => (
              <option key={part} value={part}>
                {part}
              </option>
            ))}
          </select>
        </div>

        <div className="sales-monthly-filter-group">
          <label>Total Mfg P/L</label>
          <select
            value={selectedProfitLoss}
            onChange={(event) => setSelectedProfitLoss(event.target.value)}
          >
            <option value="All">All</option>
            <option value="Profit">Profit</option>
            <option value="Loss">Loss</option>
          </select>
        </div>

        <button
          type="button"
          className="molding-apply-filter-btn"
          onClick={handleApplyFilters}
          disabled={isApplyingFilters}
        >
          <RefreshCw
            size={15}
            className={isApplyingFilters ? "molding-apply-spin" : ""}
          />
          {isApplyingFilters ? "Loading..." : "Apply"}
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="molding-table-card">
        {/* TABLE HEADER */}
        <div className="table-header">
          <div className="table-header-left">
            <h3>Transactions</h3>
            {/* SEARCH */}
            <div className="moldingb-search-box">
              <Search size={16} className="molding-search-icon" />

              <input
                type="text"
                placeholder="Search transactions..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />

              {searchText && (
                <button
                  type="button"
                  className="molding-search-clear"
                  onClick={() => setSearchText("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="table-header-right">
            {/* PERIOD + COUNT */}
            <span className="transaction-count-range">
              <span className="selected-month-range">
                <span>Period - </span>

                {getSelectedMonthLabel(
                  salesFinancialYear,
                  salesFromMonth,
                  salesToMonth,
                )}
              </span>

              <span className="transaction-count-range">
                {filteredTableRows.length} Transactions
              </span>
            </span>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="molding-table-scroll">
          <DataTable
            className="molding-data-table"
            columns={moldingColumns}
            data={filteredTableRows}
            customStyles={moldingDataTableStyles}
            progressPending={loading}
            progressComponent={
              <div className="no-data">Loading transactions...</div>
            }
            noDataComponent={
              <div className="no-data">No transactions found</div>
            }
            pagination
            paginationPerPage={12}
            paginationRowsPerPageOptions={[12, 25, 50, 100]}
            paginationComponentOptions={{
              rowsPerPageText: "Rows:",
              rangeSeparatorText: "of",
              noRowsPerPage: false,
              selectAllRowsItem: false,
            }}
            persistTableHead
            highlightOnHover
            responsive={false}
            dense
          />
        </div>
      </div>
    </div>
  );
};

export default Molding;
