import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import { Plus, FileSpreadsheet, Search, X } from "lucide-react";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";
import "../../assets/css/monthlyMaster/BopMonthlyMaster.css";

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

  return `${monthNames[monthNumber - 1]} ${String(year).slice(-2)}`;
};

const BopMonthlyMaster = () => {
  const navigate = useNavigate();

  /* FINANCIAL YEARS */
  const financialYears = generateFinancialYears();
  const currentFinancialYear =
    financialYears.find((fy) => fy.selected)?.value ||
    financialYears[0]?.value ||
    "";
  /* STATE */
  const [financialYear, setFinancialYear] = useState(currentFinancialYear);
  const [viewType, setViewType] = useState("qty");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

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

  /* GROUP DATA */
  const groupedData = useMemo(() => {
    const grouped = data.reduce((acc, row) => {
      const key = `${row.bop_id}-${row.supplier_id}-${row.financial_year}`;

      if (!acc[key]) {
        acc[key] = {
          rowKey: key,

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
    }, {});

    return Object.values(grouped);
  }, [data]);

  /* SEARCH */
  const filteredData = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) {
      return groupedData;
    }

    return groupedData.filter((row) => {
      return [
        row.part_no,
        row.fg_code,
        row.bop_part_name,
        row.bop_part_no,
        row.bop_erp_code,
        row.supplier_name,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search),
      );
    });
  }, [groupedData, searchText]);

  /* TABLE COLUMNS */
  const columns = useMemo(() => {
    const baseColumns = [
      {
        name: "Sr. No.",
        width: "50px",
        center: true,
        cell: (_, index) => index + 1,
      },
      {
        name: "Part No",
        selector: (row) => row.part_no || "",
        sortable: true,
        width: "120px",
        cell: (row) => (
          <div className="bop-wrap-cell">{row.part_no || "-"}</div>
        ),
      },
      {
        name: "FG Code",
        selector: (row) => row.fg_code || "",
        sortable: true,
        width: "75px",
        wrap: true,
        cell: (row) => row.fg_code || "-",
      },
      {
        name: "BOP Part Name",
        selector: (row) => row.bop_part_name || "",
        sortable: true,
        width: "120px",
        cell: (row) => (
          <div className="bop-wrap-cell">{row.bop_part_name || "-"}</div>
        ),
      },

      {
        name: "BOP Part No",
        selector: (row) => row.bop_part_no || "",
        sortable: true,
        width: "90px",
        cell: (row) => (
          <div className="bop-wrap-cell">{row.bop_part_no || "-"}</div>
        ),
      },
      {
        name: "BOP ERP Code",
        selector: (row) => row.bop_erp_code || "",
        sortable: true,
        width: "70px",
        cell: (row) => row.bop_erp_code || "-",
      },
      {
        name: "Supplier Name",
        selector: (row) => row.supplier_name || "",
        sortable: true,
        width: "120px",
        cell: (row) => (
          <div className="bop-wrap-cell">{row.supplier_name || "-"}</div>
        ),
      },
    ];

    /* MONTH COLUMNS */
    const monthColumns = months.map((month) => ({
      name: getMonthYearLabel(month.value, financialYear),
      selector: (row) => {
        const monthData = row.months[month.value];
        if (!monthData) {
          return 0;
        }
        return viewType === "qty"
          ? Number(monthData.qty) || 0
          : Number(monthData.rate) || 0;
      },
      sortable: true,
      width: "55px",
      center: true,
      cell: (row) => {
        const monthData = row.months[month.value] || {
          qty: null,
          rate: null,
        };

        if (viewType === "qty") {
          return monthData.qty === null
            ? "-"
            : Number(monthData.qty).toLocaleString("en-IN");
        }
        return monthData.rate === null
          ? "-"
          : Number(monthData.rate).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
      },
    }));

    return [...baseColumns, ...monthColumns];
  }, [financialYear, viewType]);

  /* TABLE STYLES */
  const customStyles = {
    table: {
      style: {
        width: "100%",
      },
    },

    headRow: {
      style: {
        minHeight: "44px",
        backgroundColor: "#19224a",
        borderBottom: "1px solid #d9dee5",
      },
    },

    headCells: {
      style: {
        fontSize: "11px",
        fontWeight: "700",
        color: "#ffffff",
        paddingLeft: "4px",
        paddingRight: "4px",
        textAlign: "center",
        whiteSpace: "normal",
        wordBreak: "normal",
        overflowWrap: "break-word",
        lineHeight: "1.15",
      },
    },

    rows: {
      style: {
        minHeight: "38px",
        fontSize: "12px",
        borderBottom: "1px solid #d9dee5",
      },

      highlightOnHoverStyle: {
        backgroundColor: "#f5f8fc",
        transitionDuration: "0.15s",
      },
    },

    cells: {
      style: {
        paddingLeft: "4px",
        paddingRight: "4px",
      },
    },

    pagination: {
      style: {
        minHeight: "40px",
        borderTop: "1px solid #d9dee5",
        fontSize: "11px",
      },
    },
  };

  /* RENDER */
  return (
    <div className="bop-report-page">
      {/* TOOLBAR */}
      <div className="report-toolbar">
        {/* FILTERS */}
        <div className="report-filters">
          {/* FINANCIAL YEAR */}
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
              <option value="rate">Rate</option>
            </select>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="bop-monthly-actions">
          <button
            type="button"
            className="bop-add-rate-btn"
            onClick={() => navigate("/monthly-master/bop/add-rate")}
          >
            <Plus size={16} strokeWidth={2} />
            <span>Add Rate</span>
          </button>

          <button
            type="button"
            className="bop-bulk-upload-btn"
            onClick={() => navigate("/monthly-master/bop/bulk-upload")}
          >
            <FileSpreadsheet size={16} strokeWidth={2} />
            <span>Bulk Upload</span>
          </button>
        </div>
      </div>

      {/* REPORT */}
      <div className="bop-report-container">
        {/* TABLE HEADER */}
        <div className="bop-table-header">
          <div className="bop-table-header-left">
            <h3>BOP Monthly Report</h3>

            {/* SEARCH */}
            <div className="bop-search-box">
              <Search size={16} className="bop-search-icon" />
              <input
                type="text"
                placeholder="Search BOP..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              {searchText && (
                <button
                  type="button"
                  className="bop-search-clear"
                  onClick={() => setSearchText("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* COUNT */}
          <div className="bop-table-count">{filteredData.length} BOPs</div>
        </div>

        {/* TABLE */}
        <div className="bop-table-scroll">
          <DataTable
            className="bop-data-table"
            columns={columns}
            data={filteredData}
            keyField="rowKey"
            customStyles={customStyles}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            paginationComponentOptions={{
              rowsPerPageText: "Rows:",
              rangeSeparatorText: "of",
              noRowsPerPage: false,
              selectAllRowsItem: false,
            }}
            highlightOnHover
            persistTableHead
            responsive={false}
            progressPending={loading}
            progressComponent={
              <div className="bop-loading">Loading BOP data...</div>
            }
            noDataComponent={
              <div className="bop-no-data">
                {searchText
                  ? "No matching BOP records found"
                  : "No BOP data found"}
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default BopMonthlyMaster;
