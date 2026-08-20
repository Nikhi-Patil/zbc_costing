import React, { useEffect, useState } from "react";
import BopMonthlyRateForm from "./BopMonthlyRateForm";
import BopBulkUpload from "./BopBulkUpload";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";

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
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [financialYear]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/monthly-bop-rate?financial_year=${encodeURIComponent(
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
        <div className="d-flex gap-2">
          {/* Add Rate */}
          <button
            type="button"
            className="btn btn-success add-rate-btn "
            onClick={() => setShowRateForm(true)}
          >
            <i className="fas fa-plus me-2"></i>
            Add Rate
          </button>
          {/* bulk upload Rate */}
          <button
            type="button"
            className="btn btn-primary add-rate-btn"
            onClick={() => setShowBulkUpload(true)}
          >
            <i className="fas fa-file-excel me-2"></i>
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Add Rate Form */}
      {showRateForm && (
        <BopMonthlyRateForm
          onClose={() => setShowRateForm(false)}
          onSaved={handleRateSaved}
        />
      )}
      {/* Bulk Upload Form */}

      {showBulkUpload && (
        <BopBulkUpload
          onClose={() => setShowBulkUpload(false)}
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
                  <th key={month.value}>
                    {month.label} {viewType === "qty" ? "Qty" : "Rate"}
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
                      const monthData = bop.months[month.value] || {
                        qty: null,
                        rate: null,
                      };
                      return (
                        <td
                          key={month.value}
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
