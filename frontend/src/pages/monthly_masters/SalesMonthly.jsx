import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import "../../assets/css/SalesMonthly.css";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";

const SALES_MONTHLY_API = `${API_BASE_URL}/sales-monthly`;

const financialYearOptions = generateFinancialYears();

const getMonthYearLabel = (monthValue, financialYearValue) => {
  const monthNumber = Number(monthValue);
  const match = String(financialYearValue || "").match(/^(\d{4})-(\d{2})$/);

  if (!match || monthNumber < 1 || monthNumber > 12) {
    return "";
  }

  const startYear = Number(match[1]);
  const year = monthNumber >= 4 ? startYear : startYear + 1;

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

  return `${monthNames[monthNumber - 1]} ${year}`;
};

const defaultFinancialYear =
  financialYearOptions.find((item) => item.selected)?.value ||
  financialYearOptions[0]?.value ||
  "";

const extractArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (!response || typeof response !== "object") {
    return [];
  }
  const keys = [
    "data",
    "entries",
    "salesMonthly",
    "salesMonthlyEntries",
    "records",
    "items",
  ];
  for (const key of keys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }
  return [];
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const number = Number(value);
  if (Number.isNaN(number)) {
    return "-";
  }
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
};

const normalizeEntry = (entry) => ({
  id: entry?.id ?? entry?._id ?? null,
  partId: entry?.partId ?? entry?.part_id ?? null,
  partNo: entry?.partNo ?? entry?.part_no ?? entry?.partNumber ?? "",
  partName: entry?.partName ?? entry?.part_name ?? "",
  unit: entry?.unit ?? "",
  unitId: entry?.unitId ?? entry?.unit_id ?? null,
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

const salesMonthlyColumns = (
  months,
  financialYear,
  view,
  handleEditEntry,
  currentPage,
  pageSize,
) => [
  {
    name: "Sr. No.",
    width: "55px",
    center: true,
    cell: (row, index) => (currentPage - 1) * pageSize + index + 1,
  },

  {
    name: "Part No.",
    selector: (row) => row.partNo,
    sortable: true,
    width: "150px",
    left: true,
    cell: (row) => <span className="sales-part-no">{row.partNo}</span>,
  },

  {
    name: "Part Name",
    selector: (row) => row.partName,
    sortable: true,
    width: "150px",
    left: true,
    cell: (row) => (
      <span className="sales-part-name">{row.partName || "-"}</span>
    ),
  },

  {
    name: "Unit",
    selector: (row) => row.unit,
    sortable: true,
    width: "60px",
    center: true,
    cell: (row) => <span className="sales-unit">{row.unit || "-"}</span>,
  },

  ...months.map((month) => ({
    name: getMonthYearLabel(month.value, financialYear),
    width: "80px",
    center: true,

    selector: (row) => {
      const entry = row.months[Number(month.value)];

      if (!entry) return 0;

      return view === "Qty"
        ? Number(entry.qty || 0)
        : Number(entry.sellRate || 0);
    },

    sortable: true,

    cell: (row) => {
      const entry = row.months[Number(month.value)];

      const value = view === "Qty" ? entry?.qty : entry?.sellRate;

      return (
        <span
          className={`sales-month-cell ${entry?.id ? "editable-cell" : ""}`}
          title={entry?.id ? "Double click to edit" : ""}
          onDoubleClick={() => handleEditEntry(entry)}
        >
          {formatNumber(value)}
        </span>
      );
    },
  })),
];

const salesMonthlyDataTableStyles = {
  table: {
    style: {
      minWidth: "1000px",
      width: "max-content", 
    },
  },

  headRow: {
    style: {
      fontSize: "11px",
      minHeight: "42px",
      backgroundColor: "#eaf2fb",
      borderBottom: "1px solid #cbd8e8",
    },
  },

  headCells: {
    style: {
      paddingLeft: "8px",
      paddingRight: "8px",
      color: "#173d70",
      fontSize: "11px",
      fontWeight: 700,
      whiteSpace: "nowrap",
      borderRight: "1px solid #dce5f0",
    },
  },

  rows: {
    style: {
      minHeight: "42px",
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

const SalesMonthly = () => {
  const navigate = useNavigate();
  const [financialYear, setFinancialYear] = useState(defaultFinancialYear);
  const [view, setView] = useState("Qty");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  /* TOAST */
  const showToast = (message, type = "success") => {
    setToast({
      show: true,
      message,
      type,
    });
    window.setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 3000);
  };

  /* LOAD SALES MONTHLY ONLY */
  const fetchSalesMonthly = async (selectedYear) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${SALES_MONTHLY_API}?financialYear=${encodeURIComponent(
          selectedYear,
        )}`,
      );
      if (!response.ok) {
        throw new Error(
          `Unable to load Sales Monthly data. Status: ${response.status}`,
        );
      }
      const result = await response.json();
      const data = extractArray(result)
        .map(normalizeEntry)
        .filter(
          (entry) =>
            entry.partNo &&
            String(entry.financialYear) === String(selectedYear),
        );
      setEntries(data);
    } catch (error) {
      console.error("Sales Monthly error:", error);
      setEntries([]);
      showToast("Unable to load Sales Monthly data.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* LOAD ON PAGE / FY CHANGE */
  useEffect(() => {
    if (financialYear) {
      fetchSalesMonthly(financialYear);
    }
  }, [financialYear]);

  /* BUILD ROWS FROM SALES MONTHLY ONLY */
  const tableRows = useMemo(() => {
    const map = new Map();
    entries.forEach((entry) => {
      const partNo = String(entry.partNo).trim();
      if (!partNo) {
        return;
      }
      const key = partNo.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          partId: entry.partId ?? null,
          partNo,
          partName: entry.partName || "",
          unit: entry.unit || "",
          months: {},
        });
      }
      const row = map.get(key);
      if (entry.partName) {
        row.partName = entry.partName;
      }
      if (entry.unit) {
        row.unit = entry.unit;
      }
      if (entry.month >= 1 && entry.month <= 12) {
        const existingEntry = row.months[entry.month];

        if (!existingEntry) {
          row.months[entry.month] = entry;
        } else {
          const existingQty = Number(existingEntry.qty) || 0;
          const currentQty = Number(entry.qty) || 0;

          // Keep the entry having the maximum Qty
          if (currentQty > existingQty) {
            row.months[entry.month] = entry;
          }
        }
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.partNo).localeCompare(String(b.partNo), undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
  }, [entries]);

  /* SEARCH */
  const filteredRows = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) {
      return tableRows;
    }
    return tableRows.filter((row) =>
      String(row.partNo).toLowerCase().includes(value),
    );
  }, [tableRows, search]);

  /* ADD */
  const handleAddRate = () => {
    navigate("/sales-monthly/add");
  };

  /* EDIT */
  const handleEditEntry = (entry) => {
    if (!entry?.id) {
      showToast("No saved entry found for this month.", "error");
      return;
    }
    navigate(`/sales-monthly/add?id=${entry.id}`);
  };

  /* RENDER */
  return (
    <div className="sales-monthly-page">
      {/* TOAST */}
      {toast.show && (
        <div className={`sales-toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() =>
              setToast({
                show: false,
                message: "",
                type: "success",
              })
            }
          >
            ×
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="sales-monthly-header">
        <div className="sales-monthly-title">
          <h2>Sales Monthly Qty & Sales Rate</h2>
          <p>Monthly quantity and Sales rate records by part.</p>
        </div>
        <div className="sales-monthly-actions">
          <button
            type="button"
            className="btn-add-rate"
            onClick={handleAddRate}
          >
            <span>+</span>
            Add Rate
          </button>
          <button
            type="button"
            className="btn-bulk-upload"
            onClick={() => navigate("/sales-monthly/bulk")}
          >
            <span className="upload-icon">⇧</span>
            Bulk Upload
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="sales-filter-card">
        <div className="sales-filter-group">
          <label>Financial Year</label>
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
          >
            {financialYearOptions.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sales-filter-group">
          <label>View</label>
          <select value={view} onChange={(e) => setView(e.target.value)}>
            <option value="Qty">Qty</option>
            <option value="Rate">Rate</option>
          </select>
        </div>

        <div className="sales-search-group">
          <label>Search Part No.</label>
          <div className="sales-search-wrapper">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              value={search}
              placeholder="Search Part No..."
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="sales-table-card">
        <div className="sales-table-header">
          <div>
            <h3>
              {view === "Qty" ? "Monthly Sales Qty" : "Monthly Sales Rate"}
            </h3>

            <span>{filteredRows.length} Parts</span>
          </div>
        </div>

        <DataTable
          columns={salesMonthlyColumns(
            months,
            financialYear,
            view,
            handleEditEntry,
            1,
            10,
          )}
          data={filteredRows}
          customStyles={salesMonthlyDataTableStyles}
          progressPending={loading}
          progressComponent={
            <div className="sales-loading">
              <div className="loading-spinner" />
              <h4>Loading data...</h4>
            </div>
          }
          noDataComponent={
            <div className="sales-no-data">
              <div className="empty-icon">◌</div>

              <h4>No Sales Monthly Records</h4>

              <p>
                No monthly sales records have been entered for this financial
                year.
              </p>
            </div>
          }
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          paginationComponentOptions={{
            rowsPerPageText: "Show",
            rangeSeparatorText: "of",
            noRowsPerPage: false,
          }}
          highlightOnHover
          pointerOnHover
          responsive
          persistTableHead
        />
      </div>
    </div>
  );
};

export default SalesMonthly;
