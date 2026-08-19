import React, { useEffect, useState } from "react";
import BopMonthlyRateForm from "./BopMonthlyRateForm";

const months = [
  { id: 1, name: "January" },
  { id: 2, name: "February" },
  { id: 3, name: "March" },
  { id: 4, name: "April" },
  { id: 5, name: "May" },
  { id: 6, name: "June" },
  { id: 7, name: "July" },
  { id: 8, name: "August" },
  { id: 9, name: "September" },
  { id: 10, name: "October" },
  { id: 11, name: "November" },
  { id: 12, name: "December" },
];

const generateFinancialYears = () => {
  const startYear = 2026;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  let currentFY;
  let endYear;

  if (currentMonth >= 4) {
    currentFY = `${currentYear}-${String(currentYear + 1).slice(-2)}`;
    endYear = currentYear + 1;
  } else {
    currentFY = `${currentYear - 1}-${String(currentYear).slice(-2)}`;
    endYear = currentYear;
  }

  const financialYears = [];

  for (let year = startYear; year <= endYear; year++) {
    const next = String(year + 1).slice(-2);
    const fy = `${year}-${next}`;

    financialYears.push({
      value: fy,
      label: fy,
      selected: fy === currentFY,
    });
  }

  return financialYears;
};

const BopMonthlyReport = () => {
  const financialYears = generateFinancialYears();

  const currentFinancialYear =
    financialYears.find((fy) => fy.selected)?.value ||
    financialYears[0]?.value ||
    "";

  const [financialYear, setFinancialYear] = useState(currentFinancialYear);

  const [viewType, setViewType] = useState("qty");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [financialYear]);

  const fetchReport = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/monthly-bop-rate?financial_year=${encodeURIComponent(
          financialYear,
        )}`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch report");
      }

      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching BOP report:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const groupedData = Object.values(
    data.reduce((acc, row) => {
      const key = `${row.bop_id}-${row.supplier_id}-${row.financial_year}`;

      if (!acc[key]) {
        acc[key] = {
          bop_id: row.bop_id,
          part_no: row.part_no,
          fg_code: row.fg_code,
          bop_part_name: row.bop_part_name,
          bop_part_no: row.bop_part_no,
          bop_erp_code: row.bop_erp_code,
          supplier_id: row.supplier_id,
          supplier_name: row.supplier_name,
          financial_year: row.financial_year,
          months: {},
        };
      }

      acc[key].months[row.month] = {
        qty: Number(row.qty) || 0,
        rate: Number(row.rate) || 0,
      };

      return acc;
    }, {}),
  );

  const handleRateSaved = () => {
    setShowRateForm(false);
    fetchReport();
  };

  return (
    <div className="bop-report-page">
      {/* Toolbar */}
      <div className="report-toolbar">
        <div className="report-filters">
          {/* Financial Year */}
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

          {/* View */}
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
              <option value="rate">Rate</option>
            </select>
          </div>
        </div>

        {/* Add Rate */}
        <button
          type="button"
          className="btn btn-success add-rate-btn"
          onClick={() => setShowRateForm(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add Rate
        </button>
      </div>

      {/* Form */}
      {showRateForm && (
        <BopMonthlyRateForm
          onClose={() => setShowRateForm(false)}
          onSaved={handleRateSaved}
        />
      )}

      {/* Table */}
      <div className="table-responsive mt-3">
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <table className="table table-bordered bop-report-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Part No</th>
                <th>FG Code</th>
                <th>BOP Part Name</th>
                <th>BOP Part No</th>
                <th>BOP ERP Code</th>
                <th>Supplier Name</th>

                {months.map((month) => (
                  <th key={month.id}>
                    {month.name} {viewType === "qty" ? "Qty" : "Rate"}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {groupedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7 + months.length}
                    className="text-center text-muted"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                groupedData.map((bop, index) => (
                  <tr
                    key={`${bop.bop_id}-${bop.supplier_id}-${bop.financial_year}`}
                  >
                    <td>{index + 1}</td>

                    <td>{bop.part_no || "-"}</td>

                    <td>{bop.fg_code || "-"}</td>

                    <td>{bop.bop_part_name || "-"}</td>

                    <td>{bop.bop_part_no || "-"}</td>

                    <td>{bop.bop_erp_code || "-"}</td>

                    <td>{bop.supplier_name || "-"}</td>

                    {months.map((month) => {
                      const monthData = bop.months[month.id] || {
                        qty: null,
                        rate: null,
                      };

                      return (
                        <td
                          key={month.id}
                          style={{
                            textAlign: "center",
                          }}
                        >
                          {viewType === "qty"
                            ? monthData.qty === null
                              ? "-"
                              : monthData.qty.toLocaleString("en-IN")
                            : monthData.rate === null
                              ? "-"
                              : monthData.rate.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BopMonthlyReport;
