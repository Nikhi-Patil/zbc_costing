import React, { useEffect, useMemo, useState } from "react";
import { generateFinancialYears } from "../../utils/costingUtils";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/api";
import "../../assets/css/Molding.css";
import * as XLSX from "xlsx";

const SALES_MONTHLY_API = `${API_BASE_URL}/sales-monthly`;

const financialYearOptions = generateFinancialYears(2026);

const defaultFinancialYear =
  financialYearOptions.find((item) => item.selected)?.value ||
  financialYearOptions[financialYearOptions.length - 1]?.value ||
  "";

const getMonthValue = (month) => Number(month?.value ?? month);

const fiscalMonths = [
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

const Molding = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  // SALES MONTHLY FILTERS
  const [salesFinancialYear, setSalesFinancialYear] =
    useState(defaultFinancialYear);

  const [salesFromMonth, setSalesFromMonth] = useState(getCurrentFiscalMonth());

  const [salesToMonth, setSalesToMonth] = useState(getCurrentFiscalMonth());

  const [salesMonthlyEntries, setSalesMonthlyEntries] = useState([]);

  const [salesMonthlyLoading, setSalesMonthlyLoading] = useState(false);

  // FETCH TRANSACTIONS
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/molding`);
      const result = await response.json();
      if (result.success) {
        setTransactions(result.data);
        setCurrentPage(1);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Error fetching molding transactions:", error);
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
          `${SALES_MONTHLY_API}?financialYear=${encodeURIComponent(salesFinancialYear)}`,
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

  // SALES MONTHLY CALCULATION
  const salesMonthlyByTransaction = useMemo(() => {
    const map = new Map();
    salesMonthlyEntries.forEach((entry) => {
      const partNo = normalizeKey(entry.partNo);
      const unit = normalizeKey(entry.unit);
      const month = Number(entry.month);
      const fromFiscalIndex = getFiscalMonthIndex(salesFromMonth);
      const toFiscalIndex = getFiscalMonthIndex(salesToMonth);
      const monthFiscalIndex = getFiscalMonthIndex(month);

      if (
        !partNo ||
        !unit ||
        monthFiscalIndex < fromFiscalIndex ||
        monthFiscalIndex > toFiscalIndex
      ) {
        return;
      }
      const key = `${partNo}||${unit}`;
      const existing = map.get(key) || {
        totalQty: 0,
        weightedRateTotal: 0,
        hasData: false,
      };
      const qty = Number(entry.qty || 0);
      const sellRate = Number(entry.sellRate || 0);

      // TOTAL QTY
      existing.totalQty += qty;
      if (entry.qty !== null && entry.qty !== undefined && qty > 0) {
        existing.weightedRateTotal += qty * sellRate;
      }
      existing.hasData = true;
      map.set(key, existing);
    });

    // FINAL WEIGHTED AVERAGE
    map.forEach((value) => {
      value.weightedAverageSellCost =
        value.totalQty > 0 ? value.weightedRateTotal / value.totalQty : 0;
    });
    return map;
  }, [salesMonthlyEntries, salesFromMonth, salesToMonth]);

  // PAGINATION CALCULATIONS
  const totalRecords = transactions.length;
  const totalPages =
    totalRecords === 0 ? 0 : Math.ceil(totalRecords / recordsPerPage);

  // GET PAGE NUMBERS
  const getPageNumbers = () => {
    const maxVisiblePages = 4;

    // No records
    if (totalPages === 0) {
      return [];
    }

    // If total pages are 4 or less
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    let startPage;

    // PAGE 1 AND PAGE 2
    if (currentPage <= 2) {
      startPage = 1;
    }

    // LAST 2 PAGES
    else if (currentPage >= totalPages - 1) {
      startPage = totalPages - 3;
    }

    // MIDDLE PAGES
    else {
      startPage = currentPage - 1;
    }
    return Array.from(
      { length: maxVisiblePages },
      (_, index) => startPage + index,
    );
  };

  // PAGINATED TRANSACTIONS
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return transactions.slice(startIndex, endIndex);
  }, [transactions, currentPage, recordsPerPage]);

  // PAGE NAVIGATION
  const goToPage = (page) => {
    if (page < 1) {
      return;
    }
    if (totalPages > 0 && page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  const goToNextPage = () => {
    if (totalPages > 0 && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // ROWS PER PAGE
  const handleRecordsPerPageChange = (event) => {
    const newRecordsPerPage = Number(event.target.value);
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(1);
  };

  // KEEP MONTH RANGE VALID IN FINANCIAL-YEAR ORDER
  useEffect(() => {
    if (
      getFiscalMonthIndex(salesFromMonth) > getFiscalMonthIndex(salesToMonth)
    ) {
      setSalesToMonth(salesFromMonth);
    }
  }, [salesFromMonth, salesToMonth]);

  // FILTERS CHANGE
  useEffect(() => {
    setCurrentPage(1);
  }, [salesFinancialYear, salesFromMonth, salesToMonth]);

  // TRANSACTION HANDLERS
  const handleAddTransaction = () => {
    navigate("/molding/costing-wizard");
  };

  const handleOpenTransaction = (transactionId) => {
    navigate(`/molding/costing-wizard/${transactionId}`);
  };

  // EXPORT EXCEL
  const handleExportExcel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/molding/export`);
      const result = await response.json();
      if (!result.success) {
        alert(result.message || "Failed to export molding data.");
        return;
      }
      const { moldingData, bopData } = result;
      if (!moldingData || moldingData.length === 0) {
        alert("No molding transactions available to export.");
        return;
      }

      // MOLDING DATA
      const moldingWorksheet = XLSX.utils.json_to_sheet(moldingData);

      // BOP DATA
      const bopWorksheet = XLSX.utils.json_to_sheet(bopData || []);

      // CREATE WORKBOOK
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, moldingWorksheet, "Molding Data");
      XLSX.utils.book_append_sheet(workbook, bopWorksheet, "BOP Data");

      // DOWNLOAD
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Molding_All_Data_${date}.xlsx`);
    } catch (error) {
      console.error("Error exporting molding data:", error);
      alert("Failed to export molding data.");
    }
  };

  // KEEP CURRENT PAGE VALID
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // RENDER
  return (
    <div className="molding-page">
      {/* HEADER */}
      <div className="molding-header-1">
        <div>
          <h2>Molding</h2>
        </div>

        <div className="molding-actions">
          {/* SALES MONTHLY FILTERS */}
          <div className="sales-monthly-report-filters">
            {/* FINANCIAL YEAR */}
            <div className="sales-monthly-filter-group">
              <label>Financial Year</label>

              <select
                value={salesFinancialYear}
                onChange={(event) => setSalesFinancialYear(event.target.value)}
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
                value={salesFromMonth}
                onChange={(event) =>
                  setSalesFromMonth(Number(event.target.value))
                }
              >
                {fiscalMonths.map((month) => (
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
                value={salesToMonth}
                onChange={(event) =>
                  setSalesToMonth(Number(event.target.value))
                }
              >
                {fiscalMonths.map((month) => (
                  <option
                    key={month.value}
                    value={month.value}
                    disabled={
                      getFiscalMonthIndex(getMonthValue(month)) <
                      getFiscalMonthIndex(salesFromMonth)
                    }
                  >
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* LOADING */}
            {salesMonthlyLoading && (
              <span className="sales-monthly-filter-loading">Loading...</span>
            )}
          </div>

          {/* EXPORT */}
          <button
            type="button"
            className="export-excel-btn"
            onClick={handleExportExcel}
          >
            <i className="fa-solid fa-file-excel" aria-hidden="true"></i>
            Export Excel
          </button>

          {/* ADD TRANSACTION */}
          <button
            type="button"
            className="add-transaction-btn"
            onClick={handleAddTransaction}
          >
            <i className="fa-solid fa-plus" aria-hidden="true"></i>
            Add New
          </button>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="molding-table-card">
        {/* TABLE HEADER */}
        <div className="table-header">
          <h3>Transactions</h3>
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
              {transactions.length} Transactions
            </span>
          </span>
        </div>

        {/* TABLE SCROLL AREA */}
        <div className="molding-table-scroll">
          <table className="molding-table">
            {/* TABLE HEADER */}
            <thead>
              <tr>
                <th>TR ID</th>
                <th>Customer Name</th>
                <th>Prod Unit</th>
                <th>Billing Unit</th>
                <th>Subcategory</th>
                <th>Part No</th>
                <th>Mfg W/O Margin</th>
                <th>Mfg With Margin</th>
                <th>Sale Cost</th>
                <th>Extra P/L</th>
                <th>P/L VS Mfg Cost</th>
                <th>Monthly Qty</th>
                <th>Total Mfg P/L</th>
                <th>Extra P/L Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody>
              {/* LOADING */}
              {loading ? (
                <tr>
                  <td colSpan="16" className="no-data">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                /* NO DATA */
                <tr>
                  <td colSpan="16" className="no-data">
                    No transactions found
                  </td>
                </tr>
              ) : (
                /* PAGINATED DATA */
                paginatedTransactions.map((transaction) => {
                  // SALES MONTHLY MATCH
                  const salesKey = `${normalizeKey(
                    transaction.part_no,
                  )}||${normalizeKey(transaction.billing_unit)}`;

                  const salesMonthly = salesMonthlyByTransaction.get(salesKey);

                  // SELL COST
                  const customerSalesCost = salesMonthly?.hasData
                    ? Number(salesMonthly.weightedAverageSellCost || 0)
                    : Number(transaction.customer_sales_cost || 0);

                  // MONTHLY QTY
                  const monthlyQty = salesMonthly?.hasData
                    ? Number(salesMonthly.totalQty || 0)
                    : Number(transaction.monthly_quantity || 0);

                  // EXISTING CALCULATIONS
                  const extra_profit =
                    customerSalesCost - Number(transaction.part_cost || 0);
                  const profit_vs_mfg_cost =
                    customerSalesCost - Number(transaction.subtotal_a || 0);
                  const extra_monthlyProfitLoss = extra_profit * monthlyQty;
                  const monthlyProfitLoss = profit_vs_mfg_cost * monthlyQty;

                  return (
                    <tr key={transaction.transaction_id}>
                      {/* TRANSACTION ID */}
                      <td className="transaction-id">
                        {transaction.transaction_id}
                      </td>

                      {/* CUSTOMER */}
                      <td className="customer-name">
                        {transaction.customer_name}
                      </td>

                      {/* PRODUCTION UNIT */}
                      <td className="production-unit">
                        {transaction.production_unit}
                      </td>

                      {/* BILLING UNIT */}
                      <td className="billing-unit">
                        {transaction.billing_unit}
                      </td>

                      {/* SUBCATEGORY */}
                      <td className="sub-category">
                        {transaction.sub_category}
                      </td>

                      {/* PART NO */}
                      <td className="part-no">{transaction.part_no}</td>

                      {/* MFG W/O MARGIN */}
                      <td className="part-cost">
                        {Number(transaction.subtotal_a || 0).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}
                      </td>

                      {/* MFG WITH MARGIN */}
                      <td className="part-cost">
                        {Number(transaction.part_cost || 0).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          },
                        )}
                      </td>

                      {/* SELL COST */}
                      <td className="sell-cost">
                        {customerSalesCost.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>

                      {/* EXTRA P/L */}
                      <td className="profit-loss">
                        <span className={extra_profit >= 0 ? "profit" : "loss"}>
                          {extra_profit >= 0 ? "+" : "-"}
                          {Math.abs(extra_profit).toLocaleString("en-IN", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </td>

                      {/* P/L VS MFG COST */}
                      <td className="profit-loss">
                        <span
                          className={
                            profit_vs_mfg_cost >= 0 ? "profit" : "loss"
                          }
                        >
                          {profit_vs_mfg_cost >= 0 ? "+" : "-"}
                          {Math.abs(profit_vs_mfg_cost).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            },
                          )}
                        </span>
                      </td>

                      {/* MONTHLY QTY */}
                      <td className="monthly-qty">
                        {monthlyQty.toLocaleString("en-IN")}
                      </td>

                      {/* TOTAL MFG P/L */}
                      <td className="monthly-profit-loss">
                        <span
                          className={monthlyProfitLoss >= 0 ? "profit" : "loss"}
                        >
                          {monthlyProfitLoss >= 0 ? "+" : "-"}
                          {Math.abs(monthlyProfitLoss).toLocaleString("en-IN", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </td>

                      {/* EXTRA P/L TOTAL */}
                      <td className="monthly-profit-loss">
                        <span
                          className={
                            extra_monthlyProfitLoss >= 0 ? "profit" : "loss"
                          }
                        >
                          {extra_monthlyProfitLoss >= 0 ? "+" : "-"}
                          {Math.abs(extra_monthlyProfitLoss).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            },
                          )}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="status-cell">
                        <span
                          className={`status ${String(
                            transaction.status || "",
                          ).toLowerCase()}`}
                        >
                          {transaction.status}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="action-cell">
                        <button
                          type="button"
                          className="open-btn"
                          onClick={() =>
                            handleOpenTransaction(transaction.transaction_id)
                          }
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && totalRecords > 0 && (
          <div className="sales-pagination">
            {/* ROWS PER PAGE */}
            <div className="records-per-page">
              <label>Rows:</label>

              <select
                value={recordsPerPage}
                onChange={handleRecordsPerPageChange}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            {/* PAGE CONTROLS */}
            <div className="pagination-controls">
              {/* FIRST PAGE */}
              <button
                type="button"
                className="pagination-arrow"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                title="First Page"
              >
                «
              </button>

              {/* PREVIOUS PAGE */}
              <button
                type="button"
                className="pagination-arrow"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                title="Previous Page"
              >
                ‹
              </button>

              {/* PAGE NUMBERS */}
              <div className="page-numbers">
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={
                      currentPage === page
                        ? "pagination-page active"
                        : "pagination-page"
                    }
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* NEXT PAGE */}
              <button
                type="button"
                className="pagination-arrow"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                title="Next Page"
              >
                ›
              </button>

              {/* LAST PAGE */}
              <button
                type="button"
                className="pagination-arrow"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Last Page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Molding;
