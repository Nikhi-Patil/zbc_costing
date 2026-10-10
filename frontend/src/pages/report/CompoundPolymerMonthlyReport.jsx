import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";
import { RefreshCw, LoaderCircle } from "lucide-react";
import "../../assets/css/report/CompoundPolymerMonthlyReport.css";

const CompoundPolymerMonthlyReport = () => {
  const financialYears = generateFinancialYears();
  const currentFinancialYear =
    financialYears.find((fy) => fy.selected)?.value ||
    financialYears[0]?.value ||
    "";
  const [financialYear, setFinancialYear] = useState(currentFinancialYear);
  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem(
        `compound-polymer-report-${currentFinancialYear}`,
      );

      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error("Error loading cached compound report:", error);
      return [];
    }
  });
  const [viewType, setViewType] = useState("qty");
  const [loading, setLoading] = useState(false);

  // FETCH REPORT WHEN FINANCIAL YEAR CHANGES
  useEffect(() => {
    if (financialYear) {
      fetchReport();
    }
  }, [financialYear]);
  // FETCH REPORT
  const fetchReport = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/monthly-compound-polymer-report?financial_year=${encodeURIComponent(
          financialYear,
        )}`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch compound polymer report",
        );
      }

      const newData = result.data || [];

      // Update table with fresh data
      setData(newData);

      // Save latest data for page reload
      sessionStorage.setItem(
        `compound-polymer-report-${financialYear}`,
        JSON.stringify(newData),
      );
    } catch (error) {
      console.error("Error fetching compound polymer report:", error);

      // IMPORTANT:
      // Do NOT clear existing data on refresh error.
    } finally {
      setLoading(false);
    }
  };
  // GROUP DATA BY POLYMER
  const groupedData = useMemo(
    () =>
      Object.values(
        data.reduce((acc, row) => {
          const polymerName = row.polymer_name || "Unknown";

          if (!acc[polymerName]) {
            acc[polymerName] = {
              polymer_name: polymerName,
              months: {},
              total_qty: 0,
              total_cost: 0,
            };
          }

          const month = Number(row.month);
          const qty = Number(row.total_qty) || 0;
          const cost = Number(row.total_cost) || 0;

          acc[polymerName].months[month] = {
            qty,
            cost,
          };

          acc[polymerName].total_qty += qty;
          acc[polymerName].total_cost += cost;

          return acc;
        }, {}),
      ),
    [data],
  );

  // FORMAT NUMBER
  const formatNumber = (value, decimals = 2) => {
    return Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };
  // GRAND TOTAL QTY
  const grandTotalQty = useMemo(
    () => groupedData.reduce((total, polymer) => total + polymer.total_qty, 0),
    [groupedData],
  );

  // GRAND TOTAL COST
  const grandTotalCost = useMemo(
    () => groupedData.reduce((total, polymer) => total + polymer.total_cost, 0),
    [groupedData],
  );

  // REACT DATA TABLE COLUMNS
  const columns = useMemo(() => {
    const monthColumns = months.map((month) => {
      const [startYear] = financialYear.split("-");

      const startYearNumber = Number(startYear);

      const monthNumber = Number(month.value);

      const year = monthNumber >= 4 ? startYearNumber : startYearNumber + 1;

      const shortYear = String(year).slice(-2);

      return {
        name: `${month.label} ${shortYear}`,

        selector: (row) => {
          const monthData = row.months?.[month.value];

          if (!monthData) {
            return 0;
          }

          return viewType === "qty"
            ? Number(monthData.qty) || 0
            : Number(monthData.cost) || 0;
        },

        cell: (row) => {
          const monthData = row.months?.[month.value];

          if (!monthData) {
            return <span className="compound-empty-value">-</span>;
          }

          const value = viewType === "qty" ? monthData.qty : monthData.cost;

          return <span>{formatNumber(value, 2)}</span>;
        },

        sortable: true,

        sortFunction: (rowA, rowB) => {
          const valueA = rowA.months?.[month.value]
            ? viewType === "qty"
              ? Number(rowA.months[month.value].qty) || 0
              : Number(rowA.months[month.value].cost) || 0
            : 0;

          const valueB = rowB.months?.[month.value]
            ? viewType === "qty"
              ? Number(rowB.months[month.value].qty) || 0
              : Number(rowB.months[month.value].cost) || 0
            : 0;

          return valueA - valueB;
        },

        grow: 1,
      };
    });

    return [
      /* =================================
       SR NO
    ================================= */

      {
        name: "No.",

        cell: (row, index) => index + 1,

        width: "55px",
        minWidth: "55px",

        center: true,

        sortable: false,
      },

      /* =================================
       POLYMER NAME
    ================================= */

      {
        name: "Polymer Name",

        selector: (row) => row.polymer_name || "",

        cell: (row) => <b>{row.polymer_name || "-"}</b>,

        sortable: true,

        sortFunction: (rowA, rowB) => {
          const nameA = String(rowA.polymer_name || "").toLowerCase();

          const nameB = String(rowB.polymer_name || "").toLowerCase();

          return nameA.localeCompare(nameB);
        },

        width: "170px",
        minWidth: "170px",
      },

      /* =================================
       MONTHS
    ================================= */

      ...monthColumns,
    ];
  }, [viewType, groupedData]);

  // =========================================
  // GRAND TOTAL ROW
  // =========================================
  const renderGrandTotal = () => {
    if (groupedData.length === 0) return null;

    return (
      <div className="compound-grand-total-row">
        <div className="grand-total-label">Grand Total</div>

        {months.map((month) => {
          const monthlyQty = groupedData.reduce(
            (total, polymer) => total + (polymer.months[month.value]?.qty || 0),
            0,
          );

          const monthlyCost = groupedData.reduce(
            (total, polymer) =>
              total + (polymer.months[month.value]?.cost || 0),
            0,
          );

          return (
            <div key={month.value} className="grand-total-value">
              {viewType === "qty"
                ? formatNumber(monthlyQty, 2)
                : formatNumber(monthlyCost, 2)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="compound-report-page">
      {/*  REPORT TITLE */}
      <div className="compound-report-page-header-1">
        <div>
          <h1>Compound Polymer-wise Monthly Report</h1>
        </div>
        <h4 className="text-muted">Financial Year: {financialYear}</h4>
      </div>
      {/* TOOLBAR */}
      <div className="report-toolbar">
        <div className="report-filters">
          {/* FINANCIAL YEAR*/}
          <div className="filter-field">
            <label className="form-label">
              <b>Financial Year</b>
            </label>
            <select
              className="form-control"
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
            >
              {financialYears.map((fy) => (
                <option key={fy.value} value={fy.value}>
                  {fy.label}
                </option>
              ))}
            </select>
          </div>
          {/* VIEW */}
          <div className="filter-field">
            <label className="form-label">
              <b>View</b>
            </label>
            <select
              className="form-control"
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
            >
              <option value="qty">Qty</option>
              <option value="cost">Cost</option>
            </select>
          </div>
        </div>
        {/* REFRESH BUTTON */}
        <div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={fetchReport}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={16}
                  strokeWidth={2}
                  className="compound-loading-icon"
                />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} strokeWidth={2} />
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* TABLE */}
      {/* TABLE */}
      <div className="compound-monthly-wrapper mt-3">
        <DataTable
          columns={columns}
          data={groupedData}
          noDataComponent={
            <div className="compound-no-data">No data found</div>
          }
          responsive={false}
          highlightOnHover={false}
          pointerOnHover={false}
          dense
        />

        {renderGrandTotal()}
      </div>
    </div>
  );
};

export default CompoundPolymerMonthlyReport;
