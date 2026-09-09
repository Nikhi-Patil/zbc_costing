import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/SalesMonthly.css";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";

const SALES_MONTHLY_API = `${API_BASE_URL}/sales-monthly`;

const financialYearOptions = generateFinancialYears(2026);

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

const SalesMonthly = () => {
  const navigate = useNavigate();
  const [financialYear, setFinancialYear] = useState(defaultFinancialYear);
  const [view, setView] = useState("Qty");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
        row.months[entry.month] = entry;
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

  /* PAGINATION */
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, financialYear, pageSize]);
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
          <h2>Sales Monthly Qty & Sell Rate</h2>
          <p>Monthly quantity and sell rate records by part.</p>
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

        <div className="sales-table-scroll">
          <table className="sales-monthly-table">
            <thead>
              <tr>
                <th className="sr-col">Sr. No.</th>
                <th className="part-no-col">Part No.</th>
                <th className="part-name-col">Part Name</th>
                <th className="unit-col">Unit</th>
                {months.map((month) => (
                  <th key={month.value} className="month-col">
                    {getMonthYearLabel(month.value, financialYear)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={16} className="empty-state-cell">
                    <div className="empty-state">
                      <div className="loading-spinner" />
                      <h4>Loading data...</h4>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length > 0 ? (
                paginatedRows.map((row, index) => (
                  <tr key={row.partNo}>
                    <td className="sr-cell">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="part-no-cell">{row.partNo}</td>
                    <td>{row.partName || "-"}</td>
                    <td>
                      <span className="unit-badge">{row.unit || "-"}</span>
                    </td>
                    {months.map((month) => {
                      const entry = row.months[Number(month.value)];
                      const value =
                        view === "Qty" ? entry?.qty : entry?.sellRate;
                      return (
                        <td
                          key={month.value}
                          className={`numeric-cell ${
                            entry?.id ? "editable-cell" : ""
                          }`}
                          title={entry?.id ? "Double click to edit" : ""}
                          onDoubleClick={() => handleEditEntry(entry)}
                        >
                          {formatNumber(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={16} className="empty-state-cell">
                    <div className="empty-state">
                      <div className="empty-icon">◌</div>
                      <h4>No Sales Monthly Records</h4>
                      <p>
                        No monthly sales records have been entered for this
                        financial year.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="sales-pagination">
          <div className="page-size-control">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          {/* <div className="page-info">
            Page <strong>{filteredRows.length ? currentPage : 0}</strong> of{" "}
            <strong>{filteredRows.length ? totalPages : 0}</strong>
          </div> */}
          <div className="pagination-buttons">
            <button
              type="button"
              disabled={currentPage === 1 || filteredRows.length === 0}
              onClick={() => setCurrentPage(1)}
            >
              «
            </button>

            <button
              type="button"
              disabled={currentPage === 1 || filteredRows.length === 0}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              ‹
            </button>

            <button type="button" className="page-number active" disabled>
              {filteredRows.length ? currentPage : 0}
            </button>

            <button
              type="button"
              disabled={currentPage === totalPages || filteredRows.length === 0}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              ›
            </button>

            <button
              type="button"
              disabled={currentPage === totalPages || filteredRows.length === 0}
              onClick={() => setCurrentPage(totalPages)}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesMonthly;
