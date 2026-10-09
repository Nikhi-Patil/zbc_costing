import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { Search, X, Plus, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";
import "../../assets/css/CompoundMonthlyMaster.css";
import CompoundMonthlyRateForm from "./CompoundMonthlyRateForm";

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

const CompoundMonthlyMaster = () => {
  const navigate = useNavigate();

  // Financial Years
  const financialYears = generateFinancialYears();

  const currentFinancialYear =
    financialYears.find((fy) => fy.selected)?.value ||
    financialYears[0]?.value ||
    "";

  // State
  const [financialYear, setFinancialYear] = useState(currentFinancialYear);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState("qty");
  const [searchText, setSearchText] = useState("");
  const [units, setUnits] = useState([]);
  const [showAddRateForm, setShowAddRateForm] = useState(false);

  // Load Report + Units
  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [financialYear]);

  // Fetch Units
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

  // Fetch Compound Monthly Report
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
    } catch (error) {
      console.error("Error fetching report:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Group Data
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

  // Unit Map
  const unitMap = useMemo(
    () => new Map(units.map((unit) => [String(unit.id), unit.unit])),
    [units],
  );

  const filteredData = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) {
      return groupedData;
    }

    return groupedData.filter((compound) => {
      const searchableText = [
        compound.compound_code,
        compound.polymer_name,
        compound.im_code,
        unitMap.get(String(compound.unit_id)),
        compound.financial_year,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");

      return searchableText.includes(search);
    });
  }, [groupedData, searchText, unitMap]);

  const compoundColumns = useMemo(() => {
    return [
      {
        name: "Sr. No.",
        width: "65px",
        center: true,
        sortable: false,
        cell: (row, index) => index + 1,
      },

      {
        name: "Compound Code",
        selector: (row) => row.compound_code || "",
        sortable: true,
        minWidth: "130px",
        cell: (row) => row.compound_code || "-",
      },

      {
        name: "Polymer Name",
        selector: (row) => row.polymer_name || "",
        sortable: true,
        minWidth: "90px",
        cell: (row) => row.polymer_name || "-",
      },

      {
        name: "IM Code",
        selector: (row) => row.im_code || "",
        sortable: true,
        minWidth: "80px",
        cell: (row) => row.im_code || "-",
      },

      {
        name: "Unit",
        selector: (row) => unitMap.get(String(row.unit_id)) || "",
        sortable: true,
        minWidth: "70px",
        center: true,
        cell: (row) => unitMap.get(String(row.unit_id)) || "-",
      },

      ...months.map((month) => ({
        name: getMonthYearLabel(month.value, financialYear),
        selector: (row) => {
          const monthData = row.months[month.value];

          if (!monthData) return 0;

          return viewType === "qty"
            ? Number(monthData.qty || 0)
            : Number(monthData.rate || 0);
        },
        sortable: true,
        minWidth: "70px",
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
      })),
    ];
  }, [financialYear, viewType, unitMap]);

  const compoundDataTableStyles = {
    table: {
      style: {
        width: "100%",
        minWidth: "0",
        maxWidth: "100%",
      },
    },

    headRow: {
      style: {
        fontSize: "11px",
        minHeight: "45px",
        backgroundColor: "#19224a",
        borderBottom: "1px solid #cbd8e8",
      },
    },

    headCells: {
      style: {
        paddingLeft: "8px",
        paddingRight: "8px",
        color: "#ffffff",
        fontSize: "11px",
        fontWeight: 700,
        whiteSpace: "normal",
        wordBreak: "normal",
        overflowWrap: "break-word",
        lineHeight: "1.15",
        textAlign: "center",
        borderRight: "1px solid #dce5f0",
      },
    },

    rows: {
      style: {
        minHeight: "35px",
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

  // Render
  return (
    <div className="compound-report-page">
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

        {/* Buttons */}

        <div className="d-flex gap-2">
          {/* Add Rate */}

          <button
            type="button"
            className="add-rate-btn"
            onClick={() => navigate("/monthly-master/compound/add-rate")}
          >
            <Plus size={16} />
            <span>Add Rate</span>
          </button>
          {/* Bulk Upload */}
          <button
            type="button"
            className="bulk-upload-btn"
            onClick={() => navigate("/monthly-master/compound/bulk-upload")}
          >
            <FileSpreadsheet size={16} />
            <span>Bulk Upload</span>
          </button>
        </div>
      </div>

      {/* Report */}
      <div className="compound-report-container mt-3">
        <div className="compound-table-header">
          <div className="compound-table-header-left">
            <h3>Compound Monthly Report</h3>

            <div className="compound-search-box">
              <Search size={16} className="compound-search-icon" />

              <input
                type="text"
                placeholder="Search compound..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              {searchText && (
                <button
                  type="button"
                  className="compound-search-clear"
                  onClick={() => setSearchText("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="compound-table-count">
            {filteredData.length} Compounds
          </div>
        </div>

        <div className="compound-table-scroll">
          <DataTable
            className="compound-data-table"
            columns={compoundColumns}
            data={filteredData}
            customStyles={compoundDataTableStyles}
            progressPending={loading}
            progressComponent={
              <div className="compound-loading">Loading compound data...</div>
            }
            noDataComponent={
              <div className="compound-no-data">No compound data found</div>
            }
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            paginationComponentOptions={{
              rowsPerPageText: "Rows:",
              rangeSeparatorText: "of",
              noRowsPerPage: false,
              selectAllRowsItem: false,
            }}
            persistTableHead
            highlightOnHover
            responsive={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CompoundMonthlyMaster;
