import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { ChevronDown, ChevronRight, RefreshCw, Search } from "lucide-react";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";
import "../../assets/css/report/customerReport.css";

const financialYearOptions = generateFinancialYears();

const getDefaultFinancialYear = () =>
  financialYearOptions.find((item) => item.selected)?.value ||
  financialYearOptions[financialYearOptions.length - 1]?.value ||
  "";

const FISCAL_MONTHS = months;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value, digits = 0) =>
  toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const formatCurrency = (value) => formatNumber(value, 0);

const getPartKey = (row) =>
  [row.transaction_id, row.production_unit, row.sub_category, row.part_no]
    .map((value) =>
      String(value ?? "")
        .trim()
        .toLowerCase(),
    )
    .join("|");

const calculatePart = (row) => {
  const quantity = toNumber(row.monthly_quantity);
  const saleRate = toNumber(row.customer_sales_cost);
  const costRate = toNumber(row.part_cost);
  const salesValue = saleRate * quantity;
  const costValue = costRate * quantity;
  const profitLoss = saleRate - costRate;
  const monthlyprofitLoss = salesValue - costValue;

  return {
    ...row,
    monthly_quantity: quantity,
    customer_sales_cost: saleRate,
    part_cost: costRate,
    sales_value: salesValue,
    costing_value: costValue,
    profit_loss_value: profitLoss,
    monthly_profit_loss_value: monthlyprofitLoss,
    monthly_profit_percent: salesValue
      ? (monthlyprofitLoss / salesValue) * 100
      : 0,
  };
};

function CustomerReport() {
  const [financialYear, setFinancialYear] = useState(getDefaultFinancialYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [ranking, setRanking] = useState("top-profit");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!financialYear || !month) return;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        financialYear: String(financialYear),
        month: String(month),
      });
      const response = await fetch(
        `${API_BASE_URL}/molding/customer-wise-report?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload.success === false) {
        throw new Error(
          payload.message || "Unable to load Customer Wise Report.",
        );
      }

      const records = Array.isArray(payload.data) ? payload.data : [];
      setRows(records.map(calculatePart));
      setExpandedCustomers({});
      setSelectedCategory(null);
    } catch (fetchError) {
      setError(fetchError.message || "Unable to load Customer Wise Report.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [financialYear, month]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const customers = useMemo(() => {
    const customerMap = new Map();

    rows.forEach((row) => {
      const customerName = String(row.customer_name || "Unknown Customer");
      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          customer_name: customerName,
          records: [],
        });
      }
      customerMap.get(customerName).records.push(row);
    });

    const summaries = Array.from(customerMap.values()).map((customer) => {
      const distinctParts = new Map();
      customer.records.forEach((row) => {
        const key = getPartKey(row);
        if (!distinctParts.has(key)) distinctParts.set(key, row);
      });

      const parts = Array.from(distinctParts.values());
      const profitParts = parts.filter(
        (part) => part.profit_loss_value > 0,
      ).length;
      const lossParts = parts.filter(
        (part) => part.profit_loss_value < 0,
      ).length;
      const salesValue = parts.reduce((sum, part) => sum + part.sales_value, 0);
      const profitValue = parts.reduce(
        (sum, part) => sum + Math.max(part.monthly_profit_loss_value, 0),
        0,
      );
      const lossValue = parts.reduce(
        (sum, part) => sum + Math.min(part.monthly_profit_loss_value, 0),
        0,
      );
      const costingValue = parts.reduce(
        (sum, part) => sum + part.costing_value,
        0,
      );

      const categoriesMap = new Map();
      customer.records.forEach((row) => {
        const categoryName = String(row.sub_category || "Uncategorized");
        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, {
            sub_category: categoryName,
            records: [],
          });
        }
        categoriesMap.get(categoryName).records.push(row);
      });

      const categories = Array.from(categoriesMap.values())
        .map((category) => {
          const unique = new Map();
          category.records.forEach((row) => {
            const key = getPartKey(row);
            if (!unique.has(key)) unique.set(key, row);
          });
          const categoryParts = Array.from(unique.values());
          return {
            ...category,
            parts: categoryParts,
            totalParts: categoryParts.length,
            profitParts: categoryParts.filter(
              (part) => part.profit_loss_value > 0,
            ).length,
            lossParts: categoryParts.filter(
              (part) => part.profit_loss_value < 0,
            ).length,
            salesValue: categoryParts.reduce(
              (sum, part) => sum + part.sales_value,
              0,
            ),
            profitValue: categoryParts.reduce(
              (sum, part) => sum + Math.max(part.monthly_profit_loss_value, 0),
              0,
            ),
            lossValue: categoryParts.reduce(
              (sum, part) => sum + Math.min(part.monthly_profit_loss_value, 0),
              0,
            ),
            profitPercent: categoryParts.reduce(
              (sum, part) => sum + part.sales_value,
              0,
            )
              ? (categoryParts.reduce(
                  (sum, part) => sum + part.monthly_profit_loss_value,
                  0,
                ) /
                  categoryParts.reduce(
                    (sum, part) => sum + part.sales_value,
                    0,
                  )) *
                100
              : 0,
          };
        })
        .sort(
          (a, b) => b.profitValue + b.lossValue - (a.profitValue + a.lossValue),
        );

      return {
        ...customer,
        parts,
        categories,
        totalParts: parts.length,
        profitParts,
        lossParts,
        salesValue,
        costingValue,
        profitValue,
        lossValue,
        profitPercent: salesValue
          ? ((profitValue + lossValue) / salesValue) * 100
          : 0,
      };
    });

    const searchTerm = search.trim().toLowerCase();
    const filtered = summaries.filter((customer) => {
      if (!searchTerm) return true;
      return (
        customer.customer_name.toLowerCase().includes(searchTerm) ||
        customer.records.some((row) =>
          [
            row.part_no,
            row.part_name,
            row.fg_code,
            row.production_unit,
            row.sub_category,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(searchTerm),
          ),
        )
      );
    });

    if (ranking === "top-profit") {
      return filtered.sort((a, b) => b.profitValue - a.profitValue);
    }
    if (ranking === "top-loss") {
      return filtered.sort((a, b) => a.lossValue - b.lossValue);
    }
    return filtered.sort((a, b) =>
      a.customer_name.localeCompare(b.customer_name),
    );
  }, [rows, ranking, search]);

  const toggleCustomer = (customerName) => {
    setExpandedCustomers((current) => ({
      ...current,
      [customerName]: !current[customerName],
    }));
    setSelectedCategory(null);
  };

  const summaryColumns = [
    {
      name: "Sr. No.",
      width: "50px",
      cell: (row, index) => (
        <button
          type="button"
          className="cr-expand-button"
          onClick={() => toggleCustomer(row.customer_name)}
          aria-label={
            expandedCustomers[row.customer_name]
              ? "Collapse customer"
              : "Expand customer"
          }
        >
          {expandedCustomers[row.customer_name] ? (
            <ChevronDown size={17} />
          ) : (
            <ChevronRight size={17} />
          )}
          {index + 1}
        </button>
      ),
    },
    {
      name: "Customer",
      selector: (row) => row.customer_name,
      grow: 2.2,
      minWidth: "220px",
      sortable: true,
    },
    {
      name: "Total Parts (Nos)",
      selector: (row) => row.totalParts,
      center: true,
      width: "150px",
      sortable: true,
    },
    {
      name: "Profit Parts (Nos)",
      selector: (row) => row.profitParts,
      center: true,
      width: "100px",
      sortable: true,
    },
    {
      name: "Loss Parts (Nos)",
      selector: (row) => row.lossParts,
      center: true,
      width: "100px",
      sortable: true,
    },
    {
      name: "Sales Value (INR)",
      selector: (row) => row.salesValue,
      cell: (row) => formatCurrency(row.salesValue),
      center: true,
      width: "120px",
      sortable: true,
    },
    {
      name: "% Profit",
      selector: (row) => row.profitPercent,
      cell: (row) => `${formatNumber(row.profitPercent, 2)}%`,
      center: true,
      width: "120px",
      sortable: true,
    },
    {
      name: "Profit Value (INR)",
      selector: (row) => row.profitValue,
      width: "150px",
      center: true,
      cell: (row) => (
        <button
          type="button"
          className="cr-value-link cr-profit-link"
          onClick={() =>
            setSelectedCategory({ customer: row.customer_name, category: null })
          }
        >
          {formatCurrency(row.profitValue)} <span aria-hidden="true">↑</span>
        </button>
      ),
      sortable: true,
    },
    {
      name: "Loss Value (INR)",
      selector: (row) => row.lossValue,
      width: "150px",
      center: true,
      cell: (row) => (
        <button
          type="button"
          className="cr-value-link cr-loss-link"
          onClick={() =>
            setSelectedCategory({ customer: row.customer_name, category: null })
          }
        >
          {formatCurrency(row.lossValue)} <span aria-hidden="true">↓</span>
        </button>
      ),
      sortable: true,
    },
  ];

  const detailColumns = [
    {
      name: "Sr No.",
      selector: (row) => row.transaction_id,
      cell: (row, index) => index + 1,
      width: "50px",
      center: true,
    },

    {
      name: "Customer",
      selector: (row) => row.customer_name,
      minWidth: "200px",
      left: true,
      wrap: true,
      sortable: true,
    },
    {
      name: "Part No",
      selector: (row) => row.part_no,
      minWidth: "180px",
      wrap: true,
      left: true,
      sortable: true,
    },
    {
      name: "Sub Category",
      selector: (row) => row.sub_category,
      width: "100px",
      sortable: true,
    },

    {
      name: "Unit",
      selector: (row) => row.production_unit,
      minWidth: "90px",
      center: true,
    },
    {
      name: "Qty",
      selector: (row) => row.monthly_quantity,
      cell: (row) => formatNumber(row.monthly_quantity),
      center: true,
      width: "80px",
      sortable: true,
    },
    {
      name: "Mfg With Margin",
      selector: (row) => row.part_cost,
      cell: (row) => formatNumber(row.part_cost, 2),
      center: true,
      width: "115px",
      sortable: true,
    },
    {
      name: "Sale cost",
      selector: (row) => row.customer_sales_cost,
      cell: (row) => formatNumber(row.customer_sales_cost, 2),
      center: true,
      width: "90px",
      sortable: true,
    },
    {
      name: "Extra P/L",
      selector: (row) => row.customer_sales_cost,
      cell: (row) => formatNumber(row.customer_sales_cost, 2),
      center: true,
      width: "90px",
      sortable: true,
    },
    {
      name: "Sales Value",
      selector: (row) => row.sales_value,
      cell: (row) => formatCurrency(row.sales_value),
      center: true,
      width: "120px",
      sortable: true,
    },
    {
      name: "% Profit",
      selector: (row) => row.profit_percent,
      cell: (row) => `${formatNumber(row.profit_percent, 2)}%`,
      center: true,
      width: "80px",
      sortable: true,
    },
    {
      name: "Profit/Loss Value",
      selector: (row) => row.monthly_profit_loss_value,
      cell: (row) => (
        <span
          className={
            row.monthly_profit_loss_value > 0
              ? "cr-positive"
              : row.monthly_profit_loss_value < 0
                ? "cr-negative"
                : "cr-neutral"
          }
        >
          {formatCurrency(row.monthly_profit_loss_value)}
        </span>
      ),
      right: true,
      minWidth: "145px",
      sortable: true,
    },
  ];

  const detailRows = useMemo(() => {
    if (!selectedCategory) return [];
    const customer = customers.find(
      (item) => item.customer_name === selectedCategory.customer,
    );
    if (!customer) return [];
    const category = selectedCategory.category;
    const list = category
      ? customer.categories.find((item) => item.sub_category === category)
          ?.parts || []
      : customer.parts;
    return [...list].sort(
      (a, b) => b.monthly_profit_loss_value - a.monthly_profit_loss_value,
    );
  }, [customers, selectedCategory]);

  const detailTitle = selectedCategory
    ? `${selectedCategory.customer}${selectedCategory.category ? ` — ${selectedCategory.category}` : " — Part List"}`
    : "";

  const ExpandedCustomer = ({ data: customer }) => (
    <div className="cr-expanded-customer">
      <DataTable
        columns={[
          {
            name: "Sub Category",
            selector: (row) => row.sub_category,
            grow: 2,
            cell: (row) => (
              <button
                type="button"
                className="cr-category-button"
                onClick={() =>
                  setSelectedCategory({
                    customer: customer.customer_name,
                    category: row.sub_category,
                  })
                }
              >
                <ChevronRight size={15} />
                {row.sub_category}
              </button>
            ),
          },
          {
            name: "Total Parts",
            selector: (row) => row.totalParts,
            center: true,
            width: "150px",
          },
          {
            name: "Profit Parts",
            selector: (row) => row.profitParts,
            center: true,
            width: "100px",
          },
          {
            name: "Loss Parts",
            selector: (row) => row.lossParts,
            center: true,
            width: "100px",
          },
          {
            name: "Sales Value",
            selector: (row) => row.salesValue,
            cell: (row) => formatCurrency(row.salesValue),
            center: true,
            width: "120px",
          },
          {
            name: "% Profit",
            selector: (row) => row.profitPercent,
            cell: (row) => `${formatNumber(row.profitPercent, 2)}%`,
            center: true,
            width: "120px",
          },
          {
            name: "Profit Value",
            selector: (row) => row.profitValue,
            cell: (row) => (
              <span className="cr-positive">
                {formatCurrency(row.profitValue)}
              </span>
            ),
            center: true,
            width: "150px",
          },
          {
            name: "Loss Value",
            selector: (row) => row.lossValue,
            cell: (row) => (
              <span className="cr-negative">
                {formatCurrency(row.lossValue)}
              </span>
            ),
            center: true,
            width: "150px",
          },
        ]}
        data={customer.categories}
        keyField="sub_category"
        noHeader
        dense
        customStyles={categoryTableStyles}
        noDataComponent="No subcategories found."
      />
    </div>
  );

  return (
    <section className="customer-report-page">
      <div className="cr-page-heading">
        <div>
          <h1>Customer Wise Report</h1>
        </div>
      </div>

      <div className="cr-filter-panel">
        <label>
          <span>Financial Year</span>
          <select
            value={financialYear}
            onChange={(event) => setFinancialYear(event.target.value)}
          >
            {financialYearOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label || item.value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Month</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {FISCAL_MONTHS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>View</span>
          <select
            value={ranking}
            onChange={(event) => setRanking(event.target.value)}
          >
            <option value="top-profit">Top Profit customers</option>
            <option value="top-loss">Top Loss customers</option>
            <option value="all">All customers</option>
          </select>
        </label>
        <label className="cr-search-label">
          <span>Search</span>
          <div className="cr-search-input">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Customer, part no, unit..."
            />
          </div>
        </label>
        <button
          type="button"
          className="cr-refresh-button"
          onClick={fetchReport}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "cr-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && <div className="cr-error-message">{error}</div>}

      <div className="cr-table-card">
        <div className="cr-card-heading">
          <h2>Customer Wise Details</h2>
          <span>
            {FISCAL_MONTHS.find((item) => item.value === Number(month))?.label}{" "}
            · {financialYear}
          </span>
        </div>
        <DataTable
          columns={summaryColumns}
          data={customers}
          keyField="customer_name"
          customStyles={customerTableStyles}
          progressPending={loading && rows.length === 0}
          progressComponent={
            <div className="cr-loading">Loading customer report…</div>
          }
          noDataComponent={
            <div className="cr-empty-state">
              {loading
                ? "Refreshing report…"
                : "No monthly records found for this financial year and month."}
            </div>
          }
          responsive
          persistTableHead
          expandableRows
          expandableRowsHideExpander
          expandableRowsComponent={ExpandedCustomer}
          expandableRowExpanded={(row) =>
            Boolean(expandedCustomers[row.customer_name])
          }
        />
      </div>

      {selectedCategory && (
        <div
          className="cr-detail-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedCategory(null);
          }}
        >
          <section
            className="cr-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Part List"
          >
            <div className="cr-detail-header">
              <div>
                <h2>Part List</h2>
                <p>{detailTitle}</p>
              </div>
              <button
                type="button"
                className="cr-close-button"
                onClick={() => setSelectedCategory(null)}
                aria-label="Close part list"
              >
                ×
              </button>
            </div>
            <div className="cr-detail-table">
              <DataTable
                columns={detailColumns}
                data={detailRows}
                keyField="transaction_id"
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                customStyles={detailTableStyles}
                noDataComponent="No parts found."
                responsive
                persistTableHead
              />
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

const customerTableStyles = {
  table: { style: { width: "100%" } },
  headRow: {
    style: {
      minHeight: "36px",
      backgroundColor: "#19224a",
      borderBottom: "1px solid #dce5f0",
    },
  },
  headCells: {
    style: {
      color: "#fff",
      fontSize: "12px",
      fontWeight: 700,
      padding: "0px 0px",
      whiteSpace: "normal",
      borderRight: "1px solid #dce5f0",
      textAlign: "center",
    },
  },
  rows: {
    style: {
      minHeight: "36px",
      fontSize: "12px",
      color: "#111827",
      borderBottom: "1px solid #e4e7eb",
    },
    highlightOnHoverStyle: { backgroundColor: "#f1f7f9" },
  },
  cells: { style: { padding: "0px 0px" } },
};
const categoryTableStyles = {
  ...customerTableStyles,
  headRow: { style: { minHeight: "32px", backgroundColor: "#fff" } },
  headCells: {
    style: {
      color: "#14515b",
      fontSize: "11px",
      fontWeight: 700,
      padding: "7px 10px",
    },
  },
  rows: {
    style: {
      minHeight: "34px",
      fontSize: "12px",
      borderBottom: "1px solid #e5e7eb",
      borderRight: "1px solid #dce5f0",
    },
  },
};
const detailTableStyles = {
  ...customerTableStyles,
  tableWrapper: { style: { maxHeight: "calc(100vh - 210px)" } },
  headRow: {
    style: {
      minHeight: "36px",
      backgroundColor: "#19224a",
      position: "sticky",
      top: 0,
      borderBottom: "1px solid #dce5f0",
    },
  },
  cells: {
    style: {
      padding: "8px 10px",
      whiteSpace: "normal",
      borderRight: "1px solid #dce5f0",
    },
  },
};

export default CustomerReport;
