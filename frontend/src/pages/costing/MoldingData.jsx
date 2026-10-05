import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Search, X, Pencil } from "lucide-react";
import API_BASE_URL from "../../config/api";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import "../../assets/css/MoldingData.css";

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" || !isNaN(Number(value))) {
    return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }
  return String(value);
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function getMonthName(month) {
  const monthNumber = Number(month);
  const found = months.find(
    (item) => Number(item.value ?? item.month ?? item.id) === monthNumber,
  );
  return found?.label ?? found?.name ?? "—";
}
const getFinancialMonthLabel = (month, financialYear) => {
  const monthNumber = Number(month);

  if (!monthNumber || !financialYear) return "—";

  const startYear = Number(String(financialYear).slice(0, 4));

  // April-Dec = financial year's starting year
  // Jan-Mar   = financial year's ending year
  const calendarYear = monthNumber >= 4 ? startYear : startYear + 1;

  const date = new Date(calendarYear, monthNumber - 1, 1);

  return date
    .toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    })
    .replace(" ", "-");
};

const TABLE_COLUMNS = [
  {
    name: "Sr. NO",
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
    width: "60px",
    center: true,
  },
  {
    name: "Customer",
    selector: (row) => row.customer_name,
    cell: (row) => formatValue(row.customer_name),
    sortable: true,
    width: "180px",
  },
  {
    name: "Part No.",
    selector: (row) => row.part_no,
    cell: (row) => formatValue(row.part_no),
    sortable: true,
    width: "180px",
    style: {
      position: "sticky",
      left: "0px",
      zIndex: 3,
    },
  },
  // {
  //   name: "Part Name",
  //   selector: (row) => row.part_name,
  //   cell: (row) => formatValue(row.part_name),
  //   sortable: true,
  //   width: "100px",
  //   style: {
  //     position: "sticky",
  //     left: "100px",
  //     zIndex: 3,
  //     backgroundColor: "#fff",
  //   },
  // },
  {
    name: "FG Code",
    selector: (row) => row.fg_code,
    cell: (row) => formatValue(row.fg_code),
    sortable: true,
    width: "85px",
    style: {
      position: "sticky",
      left: "200px",
      zIndex: 3,
    },
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
    width: "90px",
    center: true,
  },
  // {
  //   name: "Production IM Code",
  //   selector: (row) => row.im_code,
  //   cell: (row) => formatValue(row.im_code),
  //   sortable: true,
  //   width: "80px",
  //   center: true,
  // },

  {
    name: "RM IM Code",
    selector: (row) => row.rm_im_code,
    cell: (row) => formatValue(row.rm_im_code),
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "Polymer Name",
    selector: (row) => row.polymer_name,
    cell: (row) => formatValue(row.polymer_name),
    sortable: true,
    width: "70px",
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
    name: "Comp Month",
    selector: (row) => row.comp_month,
    cell: (row) =>
      getFinancialMonthLabel(row.comp_month, row.historical_financial_year),
    sortable: true,
    width: "70px",
    center: true,
  },
  {
    name: "Comp Rate",
    selector: (row) => row.compound_rate,
    cell: (row) => formatNumber(row.compound_rate, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Net Wt",
    selector: (row) => row.net_weight,
    cell: (row) => formatNumber(row.net_weight, 0),
    sortable: true,
    width: "60px",
    center: true,
  },
  {
    name: "Gross Wt",
    selector: (row) => row.gross_weight,
    cell: (row) => formatNumber(row.gross_weight, 0),
    sortable: true,
    width: "60px",
    center: true,
  },
  {
    name: "Loading %",
    selector: (row) => row.loading_per,
    cell: (row) => {
      const value = row.loading_per;

      if (value === null || value === undefined || value === "") {
        return "—";
      }

      return `${formatNumber(value, 0)} %`;
    },
    sortable: true,
    width: "65px",
    center: true,
  },
  {
    name: "Total RM Cost",
    selector: (row) => row.total_rm_cost,
    cell: (row) => formatNumber(row.total_rm_cost, 0),
    sortable: true,
    width: "70px",
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
    cell: (row) => formatNumber(row.total_bop_cost, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Final RM Cost",
    selector: (row) => row.final_rm_cost,
    cell: (row) => formatNumber(row.final_rm_cost, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Process Type",
    selector: (row) => row.process_type,
    cell: (row) => formatValue(row.process_type),
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "Machine T",
    selector: (row) => row.machine_tonnage,
    cell: (row) => formatValue(row.machine_tonnage),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Shift Rate",
    selector: (row) => row.shift_rate,
    cell: (row) => formatNumber(row.shift_rate, 0),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Total Cavity",
    selector: (row) => row.total_cavity,
    cell: (row) => formatNumber(row.total_cavity, 0),
    sortable: true,
    width: "65px",
    center: true,
  },
  {
    name: "Running Cavity",
    selector: (row) => row.running_cavity,
    cell: (row) => formatNumber(row.running_cavity, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Cycle Time",
    selector: (row) => row.cycle_time,
    cell: (row) => formatNumber(row.cycle_time, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Shift Time Effic %",
    selector: (row) => row.shift_time_efficiency,
    cell: (row) => {
      const value = row.shift_time_efficiency;

      if (value === null || value === undefined || value === "") {
        return "—";
      }

      return `${formatNumber(value, 0)} %`;
    },
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Efficiency",
    selector: (row) => row.efficiency,
    cell: (row) => formatNumber(row.efficiency, 0),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Total Shots",
    selector: (row) => row.total_shots,
    cell: (row) => formatNumber(row.total_shots, 0),
    sortable: true,
    width: "60px",
    center: true,
  },
  {
    name: "Prod / Shift",
    selector: (row) => row.total_production_per_shift,
    cell: (row) => formatNumber(row.total_production_per_shift, 0),
    sortable: true,
    width: "70px",
    center: true,
  },
  // {
  //   name: "Platten Size",
  //   selector: (row) => row.platten_size,
  //   cell: (row) => formatValue(row.platten_size),
  //   sortable: true,
  //   width: "95px",
  //   center: true,
  // },
  // {
  //   name: "Tool Size",
  //   selector: (row) => row.tool_size,
  //   cell: (row) => formatValue(row.tool_size),
  //   sortable: true,
  //   width: "90px",
  //   center: true,
  // },
  {
    name: "Process Cost A",
    selector: (row) => row.process_cost_a,
    cell: (row) => formatNumber(row.process_cost_a, 0),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Post Curing",
    selector: (row) => row.post_curing,
    cell: (row) => formatNumber(row.post_curing, 0),
    sortable: true,
    width: "65px",
    center: true,
  },
  {
    name: "Finishing",
    selector: (row) => row.finishing,
    cell: (row) => formatNumber(row.finishing, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Inspection",
    selector: (row) => row.inspection,
    cell: (row) => formatNumber(row.inspection, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Shot Blasting",
    selector: (row) => row.shot_blasting,
    cell: (row) => formatNumber(row.shot_blasting, 0),
    sortable: true,
    width: "65px",
    center: true,
  },
  {
    name: "Vapour Degreasing",
    selector: (row) => row.vapour_degreasing,
    cell: (row) => formatNumber(row.vapour_degreasing, 0),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Chromating",
    selector: (row) => row.chromating,
    cell: (row) => formatNumber(row.chromating, 0),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Phospating",
    selector: (row) => row.phospating,
    cell: (row) => formatNumber(row.phospating, 0),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Adhesive",
    selector: (row) => row.adhesive,
    cell: (row) => formatNumber(row.adhesive, 0),
    sortable: true,
    center: true,
    width: "65px",
  },
  {
    name: "Painting",
    selector: (row) => row.painting,
    cell: (row) => formatNumber(row.painting, 0),
    sortable: true,
    center: true,
    width: "65px",
  },
  {
    name: "Cylindrical Grinding",
    selector: (row) => row.cylindrical_grinding,
    cell: (row) => formatNumber(row.cylindrical_grinding, 0),
    sortable: true,
    center: true,
    width: "85px",
  },
  {
    name: "Assembly Qty",
    selector: (row) => row.assembly_qty,
    cell: (row) => formatNumber(row.assembly_qty, 0),
    sortable: true,
    center: true,
    width: "75px",
  },
  {
    name: "Assembly / Cost",
    selector: (row) => row.assembly_per_cost,
    cell: (row) => formatNumber(row.assembly_per_cost, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Total Assembly Cost",
    selector: (row) => row.total_assembly_cost,
    cell: (row) => formatNumber(row.total_assembly_cost, 0),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "Process Cost B",
    selector: (row) => row.process_cost_b,
    cell: (row) => formatNumber(row.process_cost_b, 0),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Conversion Cost",
    selector: (row) => row.conversion_cost,
    cell: (row) => formatNumber(row.conversion_cost, 0),
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Mfg w/o Margin",
    selector: (row) => row.subtotal_a,
    cell: (row) => formatNumber(row.subtotal_a, 0),
    sortable: true,
    width: "85px",
    center: true,
  },
  {
    name: "ICC",
    selector: (row) => row.icc_on_rm_cost,
    cell: (row) => formatNumber(row.icc_on_rm_cost, 0),
    sortable: true,
    width: "55px",
    center: true,
  },
  {
    name: "Rejection",
    selector: (row) => row.rej_on_subtotal_cost,
    cell: (row) => formatNumber(row.rej_on_subtotal_cost, 0),
    sortable: true,
    width: "70px",
    center: true,
  },
  {
    name: "O/H",
    selector: (row) => row.oh_on_subtotal_cost,
    cell: (row) => formatNumber(row.oh_on_subtotal_cost, 0),
    sortable: true,
    width: "55px",
    center: true,
  },
  {
    name: "Profit",
    selector: (row) => row.profit_on_subtotal_cost,
    cell: (row) => formatNumber(row.profit_on_subtotal_cost, 0),
    sortable: true,
    width: "55px",
    center: true,
  },
  {
    name: "Packaging",
    selector: (row) => row.packaging_on_subtotal_cost,
    cell: (row) => formatNumber(row.packaging_on_subtotal_cost, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Transport",
    selector: (row) => row.transport_on_subtotal_cost,
    cell: (row) => formatNumber(row.transport_on_subtotal_cost, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Margin",
    selector: (row) => row.subtotal_b,
    cell: (row) => formatNumber(row.subtotal_b, 0),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Total Part Cost",
    selector: (row) => row.part_cost,
    cell: (row) => formatNumber(row.part_cost, 2),
    sortable: true,
    width: "100px",
    center: true,
  },
  {
    name: "Sales Cost",
    selector: (row) => row.sell_cost,
    cell: (row) => formatNumber(row.sell_cost, 2),
    sortable: true,
    width: "75px",
    center: true,
  },
  {
    name: "Sales P/L",
    selector: (row) => Number(row.sales_profit_loss || 0),
    cell: (row) => {
      const value = Number(row.sales_profit_loss || 0);

      return (
        <span className={value >= 0 ? "profit" : "loss"}>
          {value >= 0 ? "+" : "-"}
          {formatNumber(Math.abs(value), 0)}
        </span>
      );
    },
    sortable: true,
    width: "80px",
    center: true,
  },
  {
    name: "Monthly Qty",
    selector: (row) => row.monthly_quantity,
    cell: (row) => formatNumber(row.monthly_quantity, 0),
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "Monthly P/L",
    selector: (row) => Number(row.monthly_profit_loss || 0),
    cell: (row) => {
      const value = Number(row.monthly_profit_loss || 0);

      return (
        <span className={value >= 0 ? "profit" : "loss"}>
          {value >= 0 ? "+" : "-"}
          {formatNumber(Math.abs(value), 0)}
        </span>
      );
    },
    sortable: true,
    width: "90px",
    center: true,
  },
  {
    name: "Prod Unit",
    selector: (row) => row.production_unit,
    cell: (row) => formatValue(row.production_unit),
    sortable: true,
    width: "60px",
    center: true,
  },
  {
    name: "Inv. Unit",
    selector: (row) => row.billing_unit,
    cell: (row) => formatValue(row.billing_unit),
    sortable: true,
    width: "60px",
    center: true,
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
    name: "Updated At",
    selector: (row) => row.updated_at,
    cell: (row) => formatValue(row.updated_at),
    sortable: true,
    width: "75px",
    center: true,
  },
];

const customStyles = {
  table: {
    style: {
      minWidth: "100%",
    },
  },

  headRow: {
    style: {
      minHeight: "55px",
      backgroundColor: "#19244a",
      borderBottom: "1px solid #cbd8e8",
    },
  },

  headCells: {
    style: {
      paddingLeft: "5px",
      paddingRight: "5px",
      color: "#fff",
      fontSize: "13px",
      fontWeight: 700,
      whiteSpace: "normal",
      overflowWrap: "break-word",
      wordBreak: "normal",
      lineHeight: "1.2",
      textAlign: "center",
      borderRight: "1px solid #dce5f0",
    },
  },

  rows: {
    style: {
      minHeight: "35px",
      fontSize: "12px",
      color: "#475569",
      borderBottom: "1px solid #cdcbcb",
    },

    highlightOnHoverStyle: {
      backgroundColor: "#f5f9ff",
      outline: "none",
    },
  },

  cells: {
    style: {
      paddingLeft: "5px",
      paddingRight: "5px",
      color: "#000000",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",

      // Vertical + horizontal grid lines
      borderRight: "1px solid #cdcbcb",
    },
  },

  pagination: {
    style: {
      minHeight: "30px",
      // borderTop: "1px solid #e7ebf0",
      color: "#64748b",
      fontSize: "12px",
    },
  },
};
const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getHistoricalCompoundRate = async ({
  compoundCode,
  polymerName,
  imCode,
  unitId,
  financialYear,
  month,
}) => {
  try {
    const params = new URLSearchParams({
      compoundCode: String(compoundCode ?? "").trim(),
      polymerName: String(polymerName ?? "").trim(),
      imCode: String(imCode ?? "").trim(),
      unitId: String(unitId ?? "").trim(),
      financial_year: String(financialYear ?? "").trim(),
      month: String(month ?? "").trim(),
    });

    console.log(
      "Historical Compound Rate Request:",
      `${API_BASE_URL}/historical-compound-rate?${params.toString()}`,
    );

    const response = await fetch(
      `${API_BASE_URL}/historical-compound-rate?${params.toString()}`,
    );
    const result = await response.json();
    console.log("Historical Compound Rate Response:", result);
    if (!response.ok) {
      return null;
    }
    return result?.found ? Number(result.rate || 0) : null;
  } catch (error) {
    console.error("Historical compound rate error:", error);
    return null;
  }
};

const getHistoricalBopRate = async ({ bop, financialYear, month }) => {
  if (!bop?.bop_fg_code || !bop?.supplier_id) {
    return 0;
  }
  try {
    const params = new URLSearchParams({
      bopErpCode: bop.bop_fg_code || "",
      supplierId: String(bop.supplier_id),
      financial_year: financialYear,
      month: String(month),
    });
    const response = await fetch(
      `${API_BASE_URL}/bop-rate-for-costing?${params.toString()}`,
    );
    if (!response.ok) {
      return 0;
    }
    const result = await response.json();
    return toNumber(result?.rate);
  } catch (error) {
    console.error("Historical BOP rate error:", bop?.bop_fg_code, error);
    return 0;
  }
};

const saveHistoricalMonthlyReport = async ({
  calculatedRows,
  financialYear,
  month,
}) => {
  if (!Array.isArray(calculatedRows) || calculatedRows.length === 0) {
    return;
  }

  // Save only the four calculated monthly values.
  const records = calculatedRows
    .filter((row) => row?.id != null && row?.transaction_id)
    .map((row) => ({
      molding_id: Number(row.id),
      transaction_id: row.transaction_id,
      part_no: row.part_no ?? null,
      fg_code: row.fg_code ?? null,
      customer_name: row.customer_name ?? null,
      production_unit: row.production_unit ?? null,
      billing_unit: row.billing_unit ?? null,
      sub_category: row.sub_category ?? null,
      financial_year: financialYear,
      month: Number(month),
      month_name: getMonthName(month),
      month_index: Number(month),
      subtotal_a: toNumber(row.subtotal_a),
      part_cost: toNumber(row.part_cost),
      customer_sales_cost: toNumber(row.customer_sales_cost),
      monthly_quantity: toNumber(row.monthly_quantity),
    }));

  if (!records.length) return;

  const response = await fetch(`${API_BASE_URL}/molding-monthly-report/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      `Monthly report save failed (${response.status})${
        message ? `: ${message}` : ""
      }`,
    );
  }

  const result = await response.json().catch(() => null);

  if (result && result.success === false) {
    throw new Error(result.message || "Monthly report save failed");
  }

  return result;
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
  // Keep this separate from the row-level Sub Category filter below.
  const [subCategoryFilter, setSubCategoryFilter] = useState("MOLDING");

  // ROW-LEVEL TABLE FILTERS
  // Selections are kept separate from applied values so the table changes
  // only after the user clicks Apply.
  const [selectedCustomer, setSelectedCustomer] = useState("All");
  const [selectedPartNo, setSelectedPartNo] = useState("All");
  const [selectedTableSubCategory, setSelectedTableSubCategory] =
    useState("All");
  const [selectedSalesPL, setSelectedSalesPL] = useState("All");

  const [customerFilter, setCustomerFilter] = useState("All");
  const [partNoFilter, setPartNoFilter] = useState("All");
  const [tableSubCategoryFilter, setTableSubCategoryFilter] = useState("All");
  const [salesPLFilter, setSalesPLFilter] = useState("All");

  // HISTORICAL REPORT
  const financialYears = useMemo(() => generateFinancialYears(), []);

  const [historicalFinancialYear, setHistoricalFinancialYear] = useState(() => {
    const years = generateFinancialYears();
    return (
      years.find((fy) => fy.selected)?.value ||
      years[years.length - 1]?.value ||
      ""
    );
  });
  const [historicalMonth, setHistoricalMonth] = useState(
    new Date().getMonth() + 1,
  );
  // Pending year/month selections are applied together with the row filters.
  const [selectedHistoricalFinancialYear, setSelectedHistoricalFinancialYear] =
    useState(historicalFinancialYear);
  const [selectedHistoricalMonth, setSelectedHistoricalMonth] =
    useState(historicalMonth);

  const [historicalRows, setHistoricalRows] = useState([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalSaveLoading, setHistoricalSaveLoading] = useState(false);
  const [salesMonthlyEntries, setSalesMonthlyEntries] = useState([]);
  const [salesMonthlyLoading, setSalesMonthlyLoading] = useState(false);

  const loadData = async (
    requestedSearch = search,
    requestedSubCategory = subCategoryFilter,
  ) => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
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

  const loadHistoricalSalesMonthly = async (financialYear) => {
    try {
      setSalesMonthlyLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/sales-monthly?financialYear=${encodeURIComponent(
          financialYear,
        )}`,
      );
      if (!response.ok) {
        throw new Error(`Sales monthly server returned ${response.status}`);
      }

      const result = await response.json();
      const entries = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      setSalesMonthlyEntries(entries);
    } catch (error) {
      console.error("Historical sales monthly error:", error);
      setSalesMonthlyEntries([]);
    } finally {
      setSalesMonthlyLoading(false);
    }
  };

  const buildHistoricalRows = async ({ sourceRows, financialYear, month }) => {
    if (!Array.isArray(sourceRows) || sourceRows.length === 0) {
      return [];
    }
    const salesMap = new Map();

    salesMonthlyEntries.forEach((entry) => {
      const entryFY = entry?.financialYear ?? entry?.financial_year ?? "";
      const entryMonth = Number(entry?.month);

      if (
        String(entryFY) !== String(financialYear) ||
        entryMonth !== Number(month)
      ) {
        return;
      }

      const partNo = normalizeKey(entry?.partNo ?? entry?.part_no);

      if (!partNo) return;

      const qty = toNumber(entry?.qty);
      const sellRate = toNumber(entry?.sellRate ?? entry?.sell_rate);

      // Keep only the entry having the MAX quantity
      const existing = salesMap.get(partNo);

      if (!existing || qty > existing.qty) {
        salesMap.set(partNo, {
          qty,
          sellRate,
        });
      }
    });

    const results = await Promise.all(
      sourceRows.map(async (row) => {
        try {
          // 1. HISTORICAL COMPOUND RATE
          const historicalCompoundRate = await getHistoricalCompoundRate({
            compoundCode: row.compound_code,
            polymerName: row.polymer_name,
            imCode: row.rm_im_code,
            unitId: row.production_unit,
            financialYear,
            month,
          });
          const grossWeight = toNumber(row.gross_weight);
          const historicalTotalRmCost =
            (grossWeight * historicalCompoundRate) / 1000;

          // 2. HISTORICAL BOP COST
          let historicalTotalBopCost = 0;
          let historicalBops = [];
          if (toNumber(row.bop_count) > 0) {
            try {
              const bopResponse = await fetch(
                `${API_BASE_URL}/molding/${encodeURIComponent(
                  row.transaction_id,
                )}`,
              );

              const bopResult = await bopResponse.json();
              historicalBops = Array.isArray(bopResult?.data?.bops)
                ? bopResult.data.bops
                : [];
            } catch (error) {
              console.error(
                "Historical BOP details error:",
                row.transaction_id,
                error,
              );
            }
          }

          if (historicalBops.length > 0) {
            const historicalBopResults = await Promise.all(
              historicalBops.map(async (bop) => {
                const rate = await getHistoricalBopRate({
                  bop,
                  financialYear,
                  month,
                });

                const assemblyQty = toNumber(
                  bop.bop_assembly_qty ??
                    bop.assembly_qty ??
                    bop.bopAssemblyQty,
                );

                return {
                  ...bop,
                  historical_rate: rate,
                  historical_cost: assemblyQty * rate,
                };
              }),
            );

            historicalTotalBopCost = historicalBopResults.reduce(
              (total, bop) => total + toNumber(bop.historical_cost),
              0,
            );

            historicalBops = historicalBopResults;
          }

          // 3. FINAL RM COST
          const historicalFinalRmCost =
            historicalTotalRmCost + historicalTotalBopCost;

          // 4. CONVERSION COST
          const conversionCost = toNumber(row.conversion_cost);

          // 5. SUBTOTAL A
          const historicalSubtotalA = historicalFinalRmCost + conversionCost;

          // 6. BOTTOM LINE PERCENTAGES
          const iccPercent = toNumber(row.icc_on_rm);
          const rejectionPercent = toNumber(row.rej_on_subtotal);
          const ohPercent = toNumber(row.oh_on_subtotal);
          const profitPercent = toNumber(row.profit_on_subtotal);
          const packagingPercent = toNumber(row.packaging_on_subtotal);
          const transportPercent = toNumber(row.transport_on_subtotal);

          // 7. HISTORICAL BOTTOM LINE COSTS
          const iccOnRmCost = (historicalFinalRmCost * iccPercent) / 100;
          const rejectionCost = (historicalSubtotalA * rejectionPercent) / 100;
          const ohCost = (historicalSubtotalA * ohPercent) / 100;
          const profitCost = (historicalSubtotalA * profitPercent) / 100;
          const packagingCost = (historicalSubtotalA * packagingPercent) / 100;
          const transportCost = (historicalSubtotalA * transportPercent) / 100;

          // 8. SUBTOTAL B
          const historicalSubtotalB =
            iccOnRmCost +
            rejectionCost +
            ohCost +
            profitCost +
            packagingCost +
            transportCost;

          // 9. TOTAL PART COST
          const historicalPartCost = historicalSubtotalA + historicalSubtotalB;

          // 10. MONTHLY QTY + CUSTOMER SALES RATE
          const salesKey = normalizeKey(row.part_no);
          const salesData = salesMap.get(salesKey);
          const monthlyQuantity = salesData ? toNumber(salesData.qty) : 0;
          const customerSalesCost = salesData
            ? toNumber(salesData.sellRate)
            : 0;

          // 11. SALES P/L
          const salesProfitLoss = customerSalesCost - historicalPartCost;

          // 12. MONTHLY P/L
          const monthlyProfitLoss = salesProfitLoss * monthlyQuantity;

          // 13. BUYING
          const buyingCost = toNumber(row.buying_cost);
          const buyingProfitLoss =
            customerSalesCost - historicalPartCost - buyingCost;

          // Return only display values.
          return {
            ...row,
            historical_report: true,
            historical_financial_year: financialYear,
            historical_month: Number(month),
            compound_rate: historicalCompoundRate,
            comp_month: Number(month),
            total_rm_cost: historicalTotalRmCost,
            total_bop_cost: historicalTotalBopCost,
            final_rm_cost: historicalFinalRmCost,
            subtotal_a: historicalSubtotalA,
            icc_on_rm_cost: iccOnRmCost,
            rej_on_subtotal_cost: rejectionCost,
            oh_on_subtotal_cost: ohCost,
            profit_on_subtotal_cost: profitCost,
            packaging_on_subtotal_cost: packagingCost,
            transport_on_subtotal_cost: transportCost,
            subtotal_b: historicalSubtotalB,
            part_cost: historicalPartCost,
            customer_sales_cost: customerSalesCost,
            sell_cost: customerSalesCost,
            sales_profit_loss: salesProfitLoss,
            monthly_quantity: monthlyQuantity,
            monthly_profit_loss: monthlyProfitLoss,
            buying_profit_loss: buyingProfitLoss,
            bop_count: row.bop_count,
            __historicalBops: historicalBops,
          };
        } catch (error) {
          console.error(
            "Historical calculation failed:",
            row?.transaction_id,
            error,
          );
          return {
            ...row,
            historical_report: true,
            historical_financial_year: financialYear,
            historical_month: Number(month),
          };
        }
      }),
    );
    return results;
  };

  useEffect(() => {
    const timer = setTimeout(
      () => {
        loadData(search, subCategoryFilter);
      },
      search.trim() ? 300 : 0,
    );

    return () => clearTimeout(timer);
  }, [search, subCategoryFilter]);

  useEffect(() => {
    let cancelled = false;

    const loadHistoricalReport = async () => {
      try {
        setHistoricalLoading(true);
        await loadHistoricalSalesMonthly(historicalFinancialYear);
        if (cancelled) return;
      } catch (error) {
        console.error("Historical report loading error:", error);
      } finally {
        if (!cancelled) {
          setHistoricalLoading(false);
        }
      }
    };

    loadHistoricalReport();

    return () => {
      cancelled = true;
    };
  }, [historicalFinancialYear]);

  useEffect(() => {
    let cancelled = false;

    const calculateHistoricalReport = async () => {
      // rows now contains ALL transactions
      if (!Array.isArray(rows) || rows.length === 0) {
        setHistoricalRows([]);
        return;
      }

      try {
        setHistoricalLoading(true);

        console.log(
          `[Historical Calculation] Starting calculation for ${rows.length} transactions`,
        );

        // ============================================================
        // 1. CALCULATE ALL TRANSACTIONS
        // ============================================================
        const calculated = await buildHistoricalRows({
          sourceRows: rows,
          financialYear: historicalFinancialYear,
          month: historicalMonth,
        });

        if (cancelled) return;

        console.log(
          `[Historical Calculation] Completed: ${calculated.length} transactions`,
        );

        // ============================================================
        // 2. SHOW CALCULATED DATA
        // ============================================================
        setHistoricalRows(calculated);

        // ============================================================
        // 3. SAVE THE SAME CALCULATED DATA
        // ============================================================
        if (calculated.length > 0) {
          try {
            setHistoricalSaveLoading(true);

            console.log(
              `[Historical Save] Saving ${calculated.length} transactions`,
            );

            await saveHistoricalMonthlyReport({
              calculatedRows: calculated,
              financialYear: historicalFinancialYear,
              month: historicalMonth,
            });

            console.log(
              `[Historical Save] Successfully saved ${calculated.length} transactions`,
            );
          } catch (saveError) {
            console.error("[Historical Save] Error:", saveError);
          } finally {
            if (!cancelled) {
              setHistoricalSaveLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("[Historical Calculation] Error:", error);

        if (!cancelled) {
          setHistoricalRows([]);
        }
      } finally {
        if (!cancelled) {
          setHistoricalLoading(false);
        }
      }
    };

    calculateHistoricalReport();

    return () => {
      cancelled = true;
    };
  }, [rows, salesMonthlyEntries, historicalFinancialYear, historicalMonth]);

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

      if (row?.historical_report && Array.isArray(row.__historicalBops)) {
        setBopDetails(row.__historicalBops);
      } else {
        setBopDetails(Array.isArray(result.data?.bops) ? result.data.bops : []);
      }
    } catch (err) {
      console.error("Error loading BOP details:", err);
      setError(err.message || "Unable to load BOP details");
      setSelectedBopRow(null);
    } finally {
      setBopLoading(false);
    }
  };

  const tableSourceRows = historicalRows.length ? historicalRows : rows;

  const customerOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        tableSourceRows
          .map((row) => String(row?.customer_name ?? "").trim())
          .filter(Boolean),
      ),
    );
    return ["All", ...values.sort((a, b) => a.localeCompare(b))];
  }, [historicalRows, rows]);

  const partNoOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        tableSourceRows
          .map((row) => String(row?.part_no ?? "").trim())
          .filter(Boolean),
      ),
    );
    return ["All", ...values.sort((a, b) => a.localeCompare(b))];
  }, [historicalRows, rows]);

  const tableSubCategoryOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        tableSourceRows
          .map((row) => String(row?.sub_category ?? "").trim())
          .filter(Boolean),
      ),
    );
    return ["All", ...values.sort((a, b) => a.localeCompare(b))];
  }, [historicalRows, rows]);

  const filteredTableRows = useMemo(() => {
    return tableSourceRows.filter((row) => {
      if (
        customerFilter !== "All" &&
        normalizeKey(row?.customer_name) !== normalizeKey(customerFilter)
      ) {
        return false;
      }

      if (
        partNoFilter !== "All" &&
        normalizeKey(row?.part_no) !== normalizeKey(partNoFilter)
      ) {
        return false;
      }

      if (
        tableSubCategoryFilter !== "All" &&
        normalizeKey(row?.sub_category) !== normalizeKey(tableSubCategoryFilter)
      ) {
        return false;
      }

      const salesPL = toNumber(row?.sales_profit_loss);

      if (salesPLFilter === "Profit" && salesPL < 0) {
        return false;
      }

      if (salesPLFilter === "Loss" && salesPL >= 0) {
        return false;
      }

      return true;
    });
  }, [
    tableSourceRows,
    customerFilter,
    partNoFilter,
    tableSubCategoryFilter,
    salesPLFilter,
  ]);

  const handleApplyTableFilters = () => {
    setCustomerFilter(selectedCustomer);
    setPartNoFilter(selectedPartNo);
    setTableSubCategoryFilter(selectedTableSubCategory);
    setSalesPLFilter(selectedSalesPL);

    // Year and month are now applied with the same Apply button.
    // Existing historical calculation logic remains unchanged.
    setHistoricalFinancialYear(selectedHistoricalFinancialYear);
    setHistoricalMonth(Number(selectedHistoricalMonth));

    setPage(1);
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
      name: "Edit",
      cell: (row) => (
        <button
          type="button"
          className="molding-open-transaction-btn"
          onClick={(event) => {
            event.stopPropagation();

            if (row.transaction_id) {
              navigate(
                `/molding/costing-wizard/${encodeURIComponent(
                  row.transaction_id,
                )}`,
              );
            }
          }}
          disabled={!row.transaction_id}
          title="Edit transaction"
          aria-label="Edit transaction"
        >
          <Pencil size={15} strokeWidth={2} />
        </button>
      ),
      width: "50px",
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
          <div className="molding-history-label">
            Report:
            <strong>
              {" "}
              {historicalFinancialYear} - {getMonthName(historicalMonth)}
            </strong>
            {historicalSaveLoading && (
              <span style={{ marginLeft: "8px", fontSize: "11px" }}>
                Saving...
              </span>
            )}
          </div>
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
              onClick={() =>
                setShowProcessAssemblyColumns((current) => !current)
              }
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
      </div>

      <div className="mdata-filters">
        <div className="mdata-filter-group">
          <label htmlFor="mdata-filter-financial-year">Financial Year</label>
          <select
            id="mdata-filter-financial-year"
            value={selectedHistoricalFinancialYear}
            onChange={(event) =>
              setSelectedHistoricalFinancialYear(event.target.value)
            }
          >
            {financialYears.map((fy) => (
              <option key={fy.value} value={fy.value}>
                {fy.label ?? fy.value}
              </option>
            ))}
          </select>
        </div>

        <div className="mdata-filter-group">
          <label htmlFor="mdata-filter-month">Month</label>
          <select
            id="mdata-filter-month"
            value={selectedHistoricalMonth}
            onChange={(event) =>
              setSelectedHistoricalMonth(Number(event.target.value))
            }
          >
            {months.map((month) => (
              <option
                key={month.value ?? month.month ?? month.id}
                value={month.value ?? month.month ?? month.id}
              >
                {month.label ?? month.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mdata-filter-group">
          <label htmlFor="mdata-filter-customer">Customer</label>
          <select
            id="mdata-filter-customer"
            value={selectedCustomer}
            onChange={(event) => setSelectedCustomer(event.target.value)}
          >
            {customerOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="mdata-filter-group">
          <label htmlFor="mdata-filter-part-no">Part No.</label>
          <select
            id="mdata-filter-part-no"
            value={selectedPartNo}
            onChange={(event) => setSelectedPartNo(event.target.value)}
          >
            {partNoOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="mdata-filter-group">
          <label htmlFor="mdata-filter-sub-category">Sub Category</label>
          <select
            id="mdata-filter-sub-category"
            value={selectedTableSubCategory}
            onChange={(event) =>
              setSelectedTableSubCategory(event.target.value)
            }
          >
            {tableSubCategoryOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="mdata-filter-group">
          <label htmlFor="mdata-filter-sales-pl">Sales P/L</label>
          <select
            id="mdata-filter-sales-pl"
            value={selectedSalesPL}
            onChange={(event) => setSelectedSalesPL(event.target.value)}
          >
            <option value="All">All</option>
            <option value="Profit">Profit</option>
            <option value="Loss">Loss</option>
          </select>
        </div>

        <button
          type="button"
          className="mdata-apply-btn molding-refresh-btn"
          onClick={handleApplyTableFilters}
          aria-label="Data loading status"
          disabled={historicalLoading || historicalSaveLoading}
        >
          <RefreshCw
            size={16}
            className={historicalLoading || historicalSaveLoading ? "spin" : ""}
          />
          Apply
        </button>
      </div>

      {error && <div className="molding-data-error">{error}</div>}

      <div className="molding-data-card">
        <div className="molding-datatable-wrapper">
          <DataTable
            columns={visibleColumns}
            data={filteredTableRows}
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
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 50, 100]}
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
                          <td>
                            {getFinancialMonthLabel(
                              selectedBopRow?.historical_report
                                ? historicalMonth
                                : bop.bop_month,
                              selectedBopRow?.historical_financial_year,
                            )}
                          </td>
                          <td>
                            {Number(
                              selectedBopRow?.historical_report
                                ? (bop.historical_rate ?? 0)
                                : (bop.bop_rate ?? 0),
                            ).toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          <td>
                            {Number(
                              selectedBopRow?.historical_report
                                ? (bop.historical_cost ?? 0)
                                : (bop.bop_cost ?? 0),
                            ).toLocaleString("en-IN", {
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
