import React, { useEffect, useMemo, useState } from "react";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";

const CompoundPolymerMonthlyReport = () => {
  const financialYears = generateFinancialYears();
  const currentFinancialYear =
    financialYears.find((fy) => fy.selected)?.value ||
    financialYears[0]?.value ||
    "";
  const [financialYear, setFinancialYear] = useState(currentFinancialYear);
  const [data, setData] = useState([]);
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
      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching compound polymer report:", error);
      setData([]);
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

  return (
    <div className="compound-report-page">
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
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
        </div>
      </div>
      {/*  REPORT TITLE */}
      <div className="mt-3 mb-3">
        <h5 className="mb-0">
          <b>Compound Polymer-wise Monthly Report</b>
        </h5>
        <small className="text-muted">Financial Year: {financialYear}</small>
      </div>
      {/* TABLE */}
      <div className="table-responsive mt-3">
        {loading ? (
          /* =============================================
             LOADING
          ============================================= */

          <div className="text-center p-4">
            <i className="fas fa-spinner fa-spin me-2"></i>
            Loading...
          </div>
        ) : (
          <table className=" table table-bordered compound-report-table ">
            {/* TABLE HEADER */}
            <thead>
              <tr>
                {/* Sr No */}
                <th>Sr. No.</th>
                {/* Polymer */}
                <th>Polymer Name</th>
                {/* Months */}
                {months.map((month) => (
                  <th key={month.value} className="text-center">
                    {month.label} {viewType === "qty" ? "Qty" : "Cost"}
                  </th>
                ))}
                {/* Total */}
                {/* <th className="text-center">
                  {viewType === "qty" ? "Total Qty" : "Total Cost"}
                </th> */}
              </tr>
            </thead>
            {/* TABLE BODY */}
            <tbody>
              {groupedData.length === 0 ? (
                /* NO DATA */
                <tr>
                  <td
                    colSpan={2 + months.length + 1}
                    className="text-center text-muted"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                /* POLYMER ROWS */
                groupedData.map((polymer, index) => (
                  <tr key={polymer.polymer_name}>
                    {/* Sr No */}
                    <td>{index + 1}</td>
                    {/* Polymer Name */}
                    <td>
                      <b>{polymer.polymer_name}</b>
                    </td>
                    {/*  MONTHLY DATA */}
                    {months.map((month) => {
                      const monthData = polymer.months[month.value];
                      /* No data */
                      if (!monthData) {
                        return (
                          <td key={month.value} className="text-end">
                            -
                          </td>
                        );
                      }
                      /* QTY VIEW */
                      if (viewType === "qty") {
                        return (
                          <td key={month.value} className="text-end">
                            {formatNumber(monthData.qty, 2)}
                          </td>
                        );
                      }
                      /* COST VIEW */
                      return (
                        <td key={month.value} className="text-end">
                          {formatNumber(monthData.cost, 2)}
                        </td>
                      );
                    })}
                    {/*  TOTAL */}
                    {/* <td className="text-end">
                      <b>
                        {viewType === "qty"
                          ? formatNumber(polymer.total_qty, 2)
                          : formatNumber(polymer.total_cost, 2)}
                      </b>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
            {/* GRAND TOTAL */}
            {groupedData.length > 0 && (
              <tfoot>
                <tr>
                  {/* Label */}
                  <th colSpan="2" className="text-end">
                    Grand Total
                  </th>
                  {/* MONTHLY GRAND TOTALS */}
                  {months.map((month) => {
                    /* Monthly Qty */
                    const monthlyQty = groupedData.reduce(
                      (total, polymer) =>
                        total + (polymer.months[month.value]?.qty || 0),
                      0,
                    );
                    /* Monthly Cost */
                    const monthlyCost = groupedData.reduce(
                      (total, polymer) =>
                        total + (polymer.months[month.value]?.cost || 0),
                      0,
                    );
                    /* QTY GRAND TOTAL */
                    if (viewType === "qty") {
                      return (
                        <th key={month.value} className="text-end">
                          {formatNumber(monthlyQty, 2)}
                        </th>
                      );
                    }
                    /* COST GRAND TOTAL */
                    return (
                      <th key={month.value} className="text-end">
                        {formatNumber(monthlyCost, 2)}
                      </th>
                    );
                  })}
                  {/* YEAR TOTAL*/}
                  {/* <th className="text-end">
                    {viewType === "qty"
                      ? formatNumber(grandTotalQty, 2)
                      : formatNumber(grandTotalCost, 2)}
                  </th> */}
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
};

export default CompoundPolymerMonthlyReport;
