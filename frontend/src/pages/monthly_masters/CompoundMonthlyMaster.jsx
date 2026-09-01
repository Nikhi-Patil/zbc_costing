import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";

const CompoundMonthlyMaster = () => {
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

  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(false);

  const [viewType, setViewType] = useState("qty");

  const [units, setUnits] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  // =====================================================
  // Load Report + Units
  // =====================================================

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [financialYear]);

  // =====================================================
  // Reset pagination when filters change
  // =====================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [financialYear, rowsPerPage]);

  // =====================================================
  // Fetch Units
  // =====================================================

  const fetchUnits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/units`);

      if (!response.ok) {
        throw new Error("Failed to fetch units");
      }

      const result = await response.json();

      setUnits(result.data || result);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  // =====================================================
  // Fetch Compound Monthly Report
  // =====================================================

  const fetchReport = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/monthly-compound-rate?financial_year=${encodeURIComponent(
          financialYear,
        )}`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch report");
      }

      setData(result.data || []);

      // Always return to first page after
      // loading a new financial year
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching report:", error);

      setData([]);

      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // Group Data
  //
  // IMPORTANT:
  // Keep the existing grouping.
  //
  // Multiple monthly records belonging to the same
  // Compound + Unit + Financial Year are displayed
  // as ONE row with Jan-Dec columns.
  // =====================================================

  const groupedData = useMemo(
    () =>
      Object.values(
        data.reduce((acc, row) => {
          const key = `${row.compound_id}-${row.unit_id}-${row.financial_year}`;

          if (!acc[key]) {
            acc[key] = {
              compound_id: row.compound_id,
              compound_code: row.compound_code,
              polymer_name: row.polymer_name,
              im_code: row.im_code,
              unit_id: row.unit_id || null,
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
  // Unit Map
  // =====================================================

  const unitMap = useMemo(
    () => new Map(units.map((unit) => [String(unit.id), unit.unit])),
    [units],
  );

  // =====================================================
  // Pagination
  //
  // Pagination is applied to groupedData,
  // NOT to the original data.
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
    const newRowsPerPage = Number(e.target.value);

    setRowsPerPage(newRowsPerPage);

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
    <div className="compound-report-page">
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
            onClick={() => navigate("/monthly-master/compound/add-rate")}
          >
            <i className="fas fa-plus me-2"></i>
            Add Rate
          </button>

          {/* Bulk Upload */}

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/monthly-master/compound/bulk-upload")}
          >
            <i className="fas fa-file-excel me-2"></i>
            Bulk Upload
          </button>
        </div>
      </div>

      {/* =================================================
          Report
      ================================================= */}

      <div className="compound-report-container mt-3">
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <>
            {/* ================================
          TABLE + HORIZONTAL SCROLLER
          ================================ */}
            <div className="compound-table-scroll">
              <table className="table table-bordered compound-report-table">
                <thead>
                  <tr>
                    <th>Sr. No.</th>
                    <th>Compound Code</th>
                    <th>Polymer Name</th>
                    <th>IM Code</th>
                    <th>Unit</th>

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
                        colSpan={5 + months.length}
                        className="text-center text-muted"
                      >
                        No data found
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((compound, index) => {
                      const serialNumber =
                        (currentPage - 1) * rowsPerPage + index + 1;

                      return (
                        <tr
                          key={`${compound.compound_id}-${compound.unit_id}-${compound.financial_year}`}
                        >
                          <td>{serialNumber}</td>

                          <td>{compound.compound_code || "-"}</td>

                          <td>{compound.polymer_name || "-"}</td>

                          <td>{compound.im_code || "-"}</td>

                          <td>
                            {unitMap.get(String(compound.unit_id)) || "-"}
                          </td>

                          {months.map((month) => {
                            const monthData = compound.months[month.value] || {
                              qty: null,
                              rate: null,
                            };

                            return (
                              <td
                                key={month.value}
                                style={{ textAlign: "center" }}
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

            {/* ================================
          PAGINATION - BELOW SCROLLER
          ================================ */}
            {groupedData.length > 0 && (
              <div className="compound-pagination">
                <div className="pagination-left">
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

                <div className="pagination-right">
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    disabled={currentPage === 1}
                    onClick={goToFirstPage}
                    title="First Page"
                  >
                    <i className="fas fa-angle-double-left"></i>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    disabled={currentPage === 1}
                    onClick={goToPreviousPage}
                    title="Previous Page"
                  >
                    <i className="fas fa-angle-left"></i>
                  </button>

                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    disabled={currentPage === totalPages}
                    onClick={goToNextPage}
                    title="Next Page"
                  >
                    <i className="fas fa-angle-right"></i>
                  </button>

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

export default CompoundMonthlyMaster;
