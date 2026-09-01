import React, { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { months, generateFinancialYears } from "../../utils/costingUtils";

import API_BASE_URL from "../../config/api";

const BopMonthlyMaster = () => {
  const navigate = useNavigate();

  // =====================================================
  // Financial Years
  // =====================================================

  const financialYears = generateFinancialYears();

  const currentFinancialYear =
    financialYears.find((fy) => fy.selected)?.value ||
    financialYears[0]?.value ||
    "";

  // =====================================================
  // State
  // =====================================================

  const [financialYear, setFinancialYear] = useState(currentFinancialYear);

  const [viewType, setViewType] = useState("qty");

  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(false);

  // =====================================================
  // Pagination
  // =====================================================

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  // =====================================================
  // Fetch Report
  // =====================================================

  useEffect(() => {
    fetchReport();
  }, [financialYear]);

  // =====================================================
  // Reset Page
  // =====================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [financialYear, rowsPerPage]);

  // =====================================================
  // Fetch BOP Monthly Report
  // =====================================================

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

      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching BOP report:", error);

      setData([]);

      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // Group Data
  //
  // Keep the existing grouping:
  //
  // BOP + Supplier + Financial Year
  //
  // This gives one row with Jan-Dec columns.
  // =====================================================

  const groupedData = useMemo(
    () =>
      Object.values(
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
      ),
    [data],
  );

  // =====================================================
  // Pagination
  // =====================================================

  const totalEntries = groupedData.length;

  const totalPages = Math.max(1, Math.ceil(totalEntries / rowsPerPage));

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;

    return groupedData.slice(startIndex, startIndex + rowsPerPage);
  }, [groupedData, currentPage, rowsPerPage]);

  // =====================================================
  // Pagination Handlers
  // =====================================================

  const handleRowsPerPageChange = (e) => {
    const value = Number(e.target.value);

    setRowsPerPage(value);
    setCurrentPage(1);
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="bop-report-page">
      {/* =================================================
          Toolbar
      ================================================= */}

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

        {/* Buttons */}

        <div className="d-flex gap-2">
          {/* Add Rate */}

          <button
            type="button"
            className="btn btn-success add-rate-btn"
            onClick={() => navigate("/monthly-master/bop/add-rate")}
          >
            <i className="fas fa-plus me-2"></i>
            Add Rate
          </button>

          {/* Bulk Upload */}

          <button
            type="button"
            className="btn btn-primary add-rate-btn"
            onClick={() => navigate("/monthly-master/bop/bulk-upload")}
          >
            <i className="fas fa-file-excel me-2"></i>
            Bulk Upload
          </button>
        </div>
      </div>

      {/* =================================================
          TABLE CONTAINER
      ================================================= */}

      <div className="bop-report-container mt-3">
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <>
            {/* =================================================
                TABLE SCROLL AREA
            ================================================= */}

            <div className="bop-table-scroll">
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
                    paginatedData.map((bop, index) => {
                      const serialNumber =
                        (currentPage - 1) * rowsPerPage + index + 1;

                      return (
                        <tr
                          key={`${bop.bop_id}-${bop.supplier_id}-${bop.financial_year}`}
                        >
                          {/* Sr No */}

                          <td>{serialNumber}</td>

                          {/* Part No */}

                          <td>{bop.part_no || "-"}</td>

                          {/* FG Code */}

                          <td>{bop.fg_code || "-"}</td>

                          {/* BOP Part Name */}

                          <td>{bop.bop_part_name || "-"}</td>

                          {/* BOP Part No */}

                          <td>{bop.bop_part_no || "-"}</td>

                          {/* BOP ERP Code */}

                          <td>{bop.bop_erp_code || "-"}</td>

                          {/* Supplier */}

                          <td>{bop.supplier_name || "-"}</td>

                          {/* Months */}

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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* =================================================
                PAGINATION
                IMPORTANT:
                This is OUTSIDE the scroll container.
            ================================================= */}

            {groupedData.length > 0 && (
              <div className="bop-pagination">
                <div className="bop-pagination-left">
                  <span>Show</span>

                  <select
                    className="form-select"
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                  >
                    <option value={10}>10</option>

                    <option value={25}>25</option>

                    <option value={50}>50</option>

                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="bop-pagination-right">
                  {/* First */}

                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    disabled={currentPage === 1}
                    onClick={goToFirstPage}
                    title="First Page"
                  >
                    <i className="fas fa-angle-double-left"></i>
                  </button>

                  {/* Previous */}

                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    disabled={currentPage === 1}
                    onClick={goToPreviousPage}
                    title="Previous Page"
                  >
                    <i className="fas fa-angle-left"></i>
                  </button>

                  {/* Page */}

                  <span className="bop-page-info">
                    Page {currentPage} of {totalPages}
                  </span>

                  {/* Next */}

                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    disabled={currentPage === totalPages}
                    onClick={goToNextPage}
                    title="Next Page"
                  >
                    <i className="fas fa-angle-right"></i>
                  </button>

                  {/* Last */}

                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    disabled={currentPage === totalPages}
                    onClick={goToLastPage}
                    title="Last Page"
                  >
                    <i className="fas fa-angle-double-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BopMonthlyMaster;
