import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Search, X } from "lucide-react";
import API_BASE_URL from "../../config/api";
import "../../assets/css/MoldingData.css";

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" || !isNaN(Number(value))) {
    return Number(value).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  }
  return String(value);
}
function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || value === "") return "—";

  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: digits,
  });
}

function getMonthName(month) {
  const months = [
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

  const monthNumber = Number(month);

  return months[monthNumber - 1] || "—";
}

// Hard-coded DataTable columns.
// Change `name` to rename a heading.
// Move the whole object to change the column position.
// selector/cell point to the corresponding database/API field.
const TABLE_COLUMNS = [
  {
    name: "ID",
    selector: (row) => row.id,
    cell: (row) => formatValue(row.id),
    sortable: true,
    width: "50px",
    center: true,
  },
  {
    name: "TRANS ID",
    selector: (row) => row.transaction_id,
    cell: (row) => formatValue(row.transaction_id),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Part No.",
    selector: (row) => row.part_no,
    cell: (row) => formatValue(row.part_no),
    sortable: true,
    width: "100px",
    style: {
      position: "sticky",
      left: "0px",
      zIndex: 3,
      backgroundColor: "#fff",
    },
  },
  {
    name: "Part Name",
    selector: (row) => row.part_name,
    cell: (row) => formatValue(row.part_name),
    sortable: true,
    width: "100px",
    style: {
      position: "sticky",
      left: "100px",
      zIndex: 3,
      backgroundColor: "#fff",
    },
  },
  {
    name: "FG Code",
    selector: (row) => row.fg_code,
    cell: (row) => formatValue(row.fg_code),
    sortable: true,
    width: "100px",
    style: {
      position: "sticky",
      left: "200px",
      zIndex: 3,
      backgroundColor: "#fff",
    },
  },
  {
    name: "Status",
    selector: (row) => row.status,
    cell: (row) => formatValue(row.status),
    sortable: true,
    width: "60px",
    center: true,
  },
  {
    name: "Customer",
    selector: (row) => row.customer_name,
    cell: (row) => formatValue(row.customer_name),
    sortable: true,
    width: "140px",
  },
  {
    name: "Prod Unit",
    selector: (row) => row.production_unit,
    cell: (row) => formatValue(row.production_unit),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Inv. Unit",
    selector: (row) => row.billing_unit,
    cell: (row) => formatValue(row.billing_unit),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Sub Dept",
    selector: (row) => row.sub_department,
    cell: (row) => formatValue(row.sub_department),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Sub Category",
    selector: (row) => row.sub_category,
    cell: (row) => formatValue(row.sub_category),
    sortable: true,
    width: "105px",
    center: true,
  },
  {
    name: "IM Code",
    selector: (row) => row.im_code,
    cell: (row) => formatValue(row.im_code),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Polymer Name",
    selector: (row) => row.polymer_name,
    cell: (row) => formatValue(row.polymer_name),
    sortable: true,
    width: "115px",
    center: true,
  },
  {
    name: "Comp Code",
    selector: (row) => row.compound_code,
    cell: (row) => formatValue(row.compound_code),
    sortable: true,
    width: "100px",
    center: true,
    maximumFractionDigits: 0,
  },
  {
    name: "RM IM Code",
    selector: (row) => row.rm_im_code,
    cell: (row) => formatValue(row.rm_im_code),
    sortable: true,
    width: "100px",
    center: true,
  },
  {
    name: "Comp Month",
    selector: (row) => row.comp_month,
    cell: (row) => formatValue(row.comp_month),
    sortable: true,
    width: "105px",
    center: true,
  },
  {
    name: "Comp Rate",
    selector: (row) => row.compound_rate,
    cell: (row) => formatValue(row.compound_rate),
    sortable: true,
    width: "95px",
    center: true,
  },
  {
    name: "Net Wt",
    selector: (row) => row.net_weight,
    cell: (row) => formatValue(row.net_weight),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Gross Wt",
    selector: (row) => row.gross_weight,
    cell: (row) => formatValue(row.gross_weight),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Loading %",
    selector: (row) => row.loading_per,
    cell: (row) => formatValue(row.loading_per),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Total RM Cost",
    selector: (row) => row.total_rm_cost,
    cell: (row) => formatValue(row.total_rm_cost),
    sortable: true,
    width: "110px",
    center: true,
  },
  {
    name: "BOP",
    selector: (row) => Number(row.bop_count || 0),
    cell: (row) => {
      const count = Number(row.bop_count || 0);

      if (!count) return "—";

      return (
        <button
          type="button"
          className="molding-bop-count-btn"
          onClick={(event) => {
            event.stopPropagation();
            row.__openBopDetails?.(row);
          }}
          title="View BOP details"
        >
          {count} {count === 1 ? "BOP" : "BOPs"}
        </button>
      );
    },
    sortable: true,
    width: "80px",
    center: true,
    ignoreRowClick: true,
  },
  {
    name: "Total BOP Cost",
    selector: (row) => row.total_bop_cost,
    cell: (row) => formatValue(row.total_bop_cost),
    sortable: true,
    width: "115px",
    center: true,
  },
  {
    name: "Final RM Cost",
    selector: (row) => row.final_rm_cost,
    cell: (row) => formatValue(row.final_rm_cost),
    sortable: true,
    width: "115px",
    center: true,
  },
  {
    name: "Process Type",
    selector: (row) => row.process_type,
    cell: (row) => formatValue(row.process_type),
    sortable: true,
    width: "100px",
    center: true,
  },
  {
    name: "Machine T",
    selector: (row) => row.machine_tonnage,
    cell: (row) => formatValue(row.machine_tonnage),
    sortable: true,
    width: "100px",
    center: true,
  },
  {
    name: "Shift Rate",
    selector: (row) => row.shift_rate,
    cell: (row) => formatValue(row.shift_rate),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Total Cavity",
    selector: (row) => row.total_cavity,
    cell: (row) => formatValue(row.total_cavity),
    sortable: true,
    width: "95px",
    center: true,
  },
  {
    name: "Running Cavity",
    selector: (row) => row.running_cavity,
    cell: (row) => formatValue(row.running_cavity),
    sortable: true,
    width: "115px",
    center: true,
  },
  {
    name: "Cycle Time",
    selector: (row) => row.cycle_time,
    cell: (row) => formatValue(row.cycle_time),
    sortable: true,
    width: "95px",
    center: true,
  },
  {
    name: "Shift Time Effic",
    selector: (row) => row.shift_time_efficiency,
    cell: (row) => formatValue(row.shift_time_efficiency),
    sortable: true,
    width: "115px",
    center: true,
  },
  {
    name: "Efficiency",
    selector: (row) => row.efficiency,
    cell: (row) => formatValue(row.efficiency),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Total Shots",
    selector: (row) => row.total_shots,
    cell: (row) => formatValue(row.total_shots),
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "Prod/Shift",
    selector: (row) => row.total_production_per_shift,
    cell: (row) => formatValue(row.total_production_per_shift),
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "Platten Size",
    selector: (row) => row.platten_size,
    cell: (row) => formatValue(row.platten_size),
    sortable: true,
    width: "95px",
    center: true,
  },
  {
    name: "Tool Size",
    selector: (row) => row.tool_size,
    cell: (row) => formatValue(row.tool_size),
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "Process Cost A",
    selector: (row) => row.process_cost_a,
    cell: (row) => formatValue(row.process_cost_a),
    sortable: true,
    width: "110px",
    center: true,
  },
  {
    name: "Post Curing",
    selector: (row) => row.post_curing,
    cell: (row) => formatValue(row.post_curing),
    sortable: true,
    width: "95px",
    center: true,
  },
  {
    name: "Finishing",
    selector: (row) => row.finishing,
    cell: (row) => formatValue(row.finishing),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Inspection",
    selector: (row) => row.inspection,
    cell: (row) => formatValue(row.inspection),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Shot Blasting",
    selector: (row) => row.shot_blasting,
    cell: (row) => formatValue(row.shot_blasting),
    sortable: true,
    width: "105px",
    center: true,
  },
  {
    name: "Vapour Degreasing",
    selector: (row) => row.vapour_degreasing,
    cell: (row) => formatValue(row.vapour_degreasing),
    sortable: true,
    width: "140px",
    center: true,
  },
  {
    name: "Chromating",
    selector: (row) => row.chromating,
    cell: (row) => formatValue(row.chromating),
    sortable: true,
    width: "95px",
    center: true,
  },
  {
    name: "Phospating",
    selector: (row) => row.phospating,
    cell: (row) => formatValue(row.phospating),
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "Adhesive",
    selector: (row) => row.adhesive,
    cell: (row) => formatValue(row.adhesive),
    sortable: true,
    center: true,
    width: "80px",
  },
  {
    name: "Painting",
    selector: (row) => row.painting,
    cell: (row) => formatValue(row.painting),
    sortable: true,
    center: true,
    width: "75px",
  },
  {
    name: "Cylindrical Grinding",
    selector: (row) => row.cylindrical_grinding,
    cell: (row) => formatValue(row.cylindrical_grinding),
    sortable: true,
    center: true,
    width: "145px",
  },
  {
    name: "Assembly Qty",
    selector: (row) => row.assembly_qty,
    cell: (row) => formatValue(row.assembly_qty),
    sortable: true,
    center: true,
    width: "105px",
  },
  {
    name: "Assembly / Cost",
    selector: (row) => row.assembly_per_cost,
    cell: (row) => formatValue(row.assembly_per_cost),
    sortable: true,
    width: "120px",
    center: true,
  },
  {
    name: "Total Assembly Cost",
    selector: (row) => row.total_assembly_cost,
    cell: (row) => formatValue(row.total_assembly_cost),
    sortable: true,
    width: "145px",
    center: true,
  },
  {
    name: "Process Cost B",
    selector: (row) => row.process_cost_b,
    cell: (row) => formatValue(row.process_cost_b),
    sortable: true,
    width: "110px",
    center: true,
  },
  {
    name: "Conversion Cost",
    selector: (row) => row.conversion_cost,
    cell: (row) => formatValue(row.conversion_cost),
    sortable: true,
    width: "120px",
    center: true,
  },
  {
    name: "Subtotal A",
    selector: (row) => row.subtotal_a,
    cell: (row) => formatValue(row.subtotal_a),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "ICC",
    selector: (row) => row.icc_on_rm_cost,
    cell: (row) => formatValue(row.icc_on_rm_cost),
    sortable: true,
    width: "65px",
    center: true,
  },
  {
    name: "Rejection",
    selector: (row) => row.rej_on_subtotal_cost,
    cell: (row) => formatValue(row.rej_on_subtotal_cost),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "O/H",
    selector: (row) => row.oh_on_subtotal_cost,
    cell: (row) => formatValue(row.oh_on_subtotal_cost),
    sortable: true,
    width: "65px",
    center: true,
  },
  {
    name: "Profit",
    selector: (row) => row.profit_on_subtotal_cost,
    cell: (row) => formatValue(row.profit_on_subtotal_cost),
    sortable: true,
    width: "65px",
    center: true,
  },
  {
    name: "Packaging",
    selector: (row) => row.packaging_on_subtotal_cost,
    cell: (row) => formatValue(row.packaging_on_subtotal_cost),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Transport",
    selector: (row) => row.transport_on_subtotal_cost,
    cell: (row) => formatValue(row.transport_on_subtotal_cost),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Subtotal B",
    selector: (row) => row.subtotal_b,
    cell: (row) => formatValue(row.subtotal_b),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Part Cost",
    selector: (row) => row.part_cost,
    cell: (row) => formatValue(row.part_cost),
    sortable: true,
    width: "7 5px",
    center: true,
  },
  {
    name: "Sell Cost",
    selector: (row) => row.sell_cost,
    cell: (row) => formatValue(row.sell_cost),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Customer Sales Cost",
    selector: (row) => row.customer_sales_cost,
    cell: (row) => formatValue(row.customer_sales_cost),
    sortable: true,
    width: "145px",
    center: true,
  },
  {
    name: "Sales P/L",
    selector: (row) => row.sales_profit_loss,
    cell: (row) => formatValue(row.sales_profit_loss),
    sortable: true,
    width: "95px",
    center: true,
  },
  {
    name: "Buying Cost",
    selector: (row) => row.buying_cost,
    cell: (row) => formatValue(row.buying_cost),
    sortable: true,
    width: "95px",
    center: true,
  },
  {
    name: "Buying P/L",
    selector: (row) => row.buying_profit_loss,
    cell: (row) => formatValue(row.buying_profit_loss),
    sortable: true,
    width: "95px",
    center: true,
  },
  {
    name: "Created At",
    selector: (row) => row.created_at,
    cell: (row) => formatValue(row.created_at),
    sortable: true,
    width: "95px",
    center: true,
  },
  {
    name: "Updated At",
    selector: (row) => row.updated_at,
    cell: (row) => formatValue(row.updated_at),
    sortable: true,
    width: "95px",
    center: true,
  },
];

const customStyles = {
  table: { style: { minWidth: "100%" } },
  headRow: {
    style: {
      minHeight: "42px",
      backgroundColor: "#eaf2fb",
      borderBottom: "1px solid #cbd8e8",
    },
  },
  headCells: {
    style: {
      paddingLeft: "3px",
      paddingRight: "3px",
      color: "#173d70",
      fontSize: "13px",
      fontWeight: 700,
      whiteSpace: "nowrap",
      borderRight: "1px solid #dce5f0",
    },
  },
  rows: {
    style: {
      minHeight: "38px",
      fontSize: "12px",
      color: "#475569",
    },
    highlightOnHoverStyle: {
      backgroundColor: "#f5f9ff",
      outline: "none",
    },
  },
  cells: {
    style: {
      paddingLeft: "10px",
      paddingRight: "10px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      borderRight: "1px solid #edf1f5",
    },
  },
  pagination: {
    style: {
      minHeight: "30px",
      borderTop: "1px solid #e7ebf0",
      color: "#64748b",
      fontSize: "12px",
    },
  },
};

export default function MoldingData() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBopRow, setSelectedBopRow] = useState(null);
  const [bopDetails, setBopDetails] = useState([]);
  const [bopLoading, setBopLoading] = useState(false);
  const [showProcessAssemblyColumns, setShowProcessAssemblyColumns] =
    useState(false);

  // MTRB = only MTRB records. MOLDING = all records except MTRB records.
  const [subCategoryFilter, setSubCategoryFilter] = useState("MOLDING");

  const loadData = async (
    requestedPage = page,
    requestedLimit = limit,
    requestedSearch = search,
    requestedSubCategory = subCategoryFilter,
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(requestedPage),
        limit: String(requestedLimit),
        subCategoryFilter: requestedSubCategory,
      });

      const trimmedSearch = requestedSearch.trim();
      if (trimmedSearch) {
        params.set("search", trimmedSearch);
      }

      const url = `${API_BASE_URL}/molding/all?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to load data");
      }

      const loadedRows = Array.isArray(result.data) ? result.data : [];

      setRows(
        loadedRows.map((row) => ({
          ...row,
          __openBopDetails: openBopDetails,
        })),
      );

      setTotalRecords(
        Number(result.pagination?.totalRecords ?? result.data?.length ?? 0),
      );
    } catch (err) {
      console.error("Error loading molding data:", err);
      setError(err.message || "Unable to load molding data");
      setRows([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // The server applies category + search FIRST, then pagination.
  // This means pagination always represents the filtered/search result set.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        loadData(page, limit, search, subCategoryFilter);
      },
      search.trim() ? 300 : 0,
    );

    return () => clearTimeout(timer);
  }, [page, limit, search, subCategoryFilter]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const openBopDetails = async (row) => {
    if (!row?.transaction_id) return;

    try {
      setSelectedBopRow(row);
      setBopDetails([]);
      setBopLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/molding/${encodeURIComponent(row.transaction_id)}`,
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load BOP details");
      }

      setBopDetails(Array.isArray(result.data?.bops) ? result.data.bops : []);
    } catch (err) {
      console.error("Error loading BOP details:", err);
      setError(err.message || "Unable to load BOP details");
      setSelectedBopRow(null);
    } finally {
      setBopLoading(false);
    }
  };

  const visibleColumns = useMemo(() => {
    // HIDE / VIEW controls the complete 13-column process/assembly group.
    const allProcessAssemblyColumns = new Set([
      "Post Curing",
      "Finishing",
      "Inspection",
      "Shot Blasting",
      "Vapour Degreasing",
      "Chromating",
      "Phospating",
      "Adhesive",
      "Painting",
      "Cylindrical Grinding",
      "Assembly Qty",
      "Assembly / Cost",
      "Total Assembly Cost",
    ]);

    // In MOLDING mode, these six process columns are not applicable/visible
    // in the normal VIEW state. HIDE / VIEW still has its normal behavior:
    // HIDE removes all 13; VIEW restores the normal category-specific view.
    const moldingHiddenProcessColumns = new Set([
      "Shot Blasting",
      "Vapour Degreasing",
      "Chromating",
      "Phospating",
      "Adhesive",
      "Painting",
      "Cylindrical Grinding",
    ]);
    let columns;

    if (!showProcessAssemblyColumns) {
      columns = TABLE_COLUMNS.filter(
        (column) => !allProcessAssemblyColumns.has(column.name),
      );
    } else if (subCategoryFilter === "MOLDING") {
      columns = TABLE_COLUMNS.filter(
        (column) => !moldingHiddenProcessColumns.has(column.name),
      );
    } else {
      columns = TABLE_COLUMNS;
    }

    const openColumn = {
      name: "Open",
      cell: (row) => (
        <button
          type="button"
          className="molding-open-transaction-btn"
          onClick={(event) => {
            event.stopPropagation();
            if (row.transaction_id) {
              navigate(
                `/molding/costing-wizard/${encodeURIComponent(row.transaction_id)}`,
              );
            }
          }}
          disabled={!row.transaction_id}
          title="Open transaction in Costing Wizard"
        >
          Open
        </button>
      ),
      width: "75px",
      center: true,
      ignoreRowClick: true,
    };

    return [...columns, openColumn];
  }, [showProcessAssemblyColumns, subCategoryFilter]);

  return (
    <div className="molding-data-page">
      <div className="molding-data-header">
        <div>
          <h1>Molding Data</h1>
        </div>

        <button
          type="button"
          className="molding-refresh-btn"
          onClick={() => loadData(page, limit, search, subCategoryFilter)}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="molding-data-toolbar">
        <div className="molding-search-box">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search all records..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="molding-clear-search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="filters">
          <select
            className="molding-subcategory-select"
            value={subCategoryFilter}
            onChange={(event) => {
              setSubCategoryFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by sub category"
            title="Filter by sub category"
          >
            <option value="MTRB">MTRB</option>
            <option value="MOLDING">MOLDING</option>
          </select>

          <button
            type="button"
            className={`molding-column-toggle-btn ${
              showProcessAssemblyColumns ? "is-hide" : "is-view"
            }`}
            onClick={() => setShowProcessAssemblyColumns((current) => !current)}
            title={
              showProcessAssemblyColumns
                ? "Hide process and assembly columns"
                : "View process and assembly columns"
            }
          >
            {showProcessAssemblyColumns ? "HIDE" : "VIEW"}
          </button>
        </div>
      </div>

      {error && <div className="molding-data-error">{error}</div>}

      <div className="molding-data-card">
        <div className="molding-datatable-wrapper">
          <DataTable
            columns={visibleColumns}
            data={rows}
            customStyles={customStyles}
            progressPending={loading}
            progressComponent={
              <div className="molding-datatable-message">
                Loading molding data...
              </div>
            }
            noDataComponent={
              <div className="molding-datatable-message">
                No molding records found.
              </div>
            }
            pagination
            paginationServer
            paginationTotalRows={totalRecords}
            paginationDefaultPage={page}
            paginationPerPage={limit}
            paginationRowsPerPageOptions={[10, 20, 50, 100]}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handleRowsPerPageChange}
            highlightOnHover
            dense
            persistTableHead
            fixedHeader
            fixedHeaderScrollHeight="calc(100vh - 235px)"
          />
        </div>
      </div>

      {selectedBopRow && (
        <div
          className="molding-bop-overlay"
          onClick={() => setSelectedBopRow(null)}
        >
          <div
            className="molding-bop-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="molding-bop-modal-header">
              <div>
                <h2>BOP Details</h2>
                <p>
                  Part: <strong>{formatValue(selectedBopRow.part_no)}</strong>
                  <span className="molding-bop-separator">•</span>
                  Transaction:{" "}
                  <strong>{formatValue(selectedBopRow.transaction_id)}</strong>
                </p>
              </div>

              <button
                type="button"
                className="molding-bop-close-btn"
                onClick={() => setSelectedBopRow(null)}
                aria-label="Close BOP details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="molding-bop-modal-body">
              {bopLoading ? (
                <div className="molding-bop-message">
                  Loading BOP details...
                </div>
              ) : bopDetails.length === 0 ? (
                <div className="molding-bop-message">No BOP details found.</div>
              ) : (
                <div className="molding-bop-table-wrapper">
                  <table className="molding-bop-table">
                    <thead>
                      <tr>
                        <th>Sr.</th>
                        <th>BOP FG Code</th>
                        <th>BOP Part No.</th>
                        <th>BOP Part Name</th>
                        <th>Commodity</th>
                        <th>Supplier</th>
                        <th>Assembly Qty</th>
                        <th>Month</th>
                        <th>Rate</th>
                        <th>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bopDetails.map((bop, index) => (
                        <tr key={bop.id ?? index}>
                          <td>{index + 1}</td>
                          <td>{formatValue(bop.bop_fg_code)}</td>
                          <td>{formatValue(bop.bop_part_no)}</td>
                          <td>{formatValue(bop.bop_part_name)}</td>
                          <td>{formatValue(bop.commodity)}</td>
                          <td>
                            {formatValue(bop.supplier_name ?? bop.supplier_id)}
                          </td>
                          <td>
                            {Number(
                              bop.bop_assembly_qty ?? bop.assembly_qty ?? 0,
                            ).toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })}
                          </td>
                          <td>{getMonthName(bop.bop_month)}</td>
                          <td>
                            {Number(bop.bop_rate ?? 0).toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td>
                            {Number(bop.bop_cost ?? 0).toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
