import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import "../../assets/css/SalesMonthly.css";
import { generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";

const PARTS_API = `${API_BASE_URL}/parts`;
const UNITS_API = `${API_BASE_URL}/units`;
const SALES_MONTHLY_API = `${API_BASE_URL}/sales-monthly`;

const financialYearOptions = generateFinancialYears(2026);
const defaultFinancialYear =
  financialYearOptions.find((item) => item.selected)?.value ||
  financialYearOptions[financialYearOptions.length - 1]?.value ||
  "";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();
const normalizeHeader = (value) => normalize(value).replace(/\s+/g, " ");

const extractArray = (response) => {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  const keys = [
    "data",
    "parts",
    "units",
    "results",
    "items",
    "records",
    "entries",
  ];
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key];
  }

  return [];
};

const getPartNo = (part) =>
  part?.part_no ??
  part?.partNo ??
  part?.partNumber ??
  part?.part_code ??
  part?.partCode ??
  "";

const getPartName = (part) =>
  part?.part_name ?? part?.partName ?? part?.name ?? part?.description ?? "";

const getUnitName = (unit) => {
  if (typeof unit === "string") return unit;
  return (
    unit?.unit ??
    unit?.unitName ??
    unit?.unit_name ??
    unit?.name ??
    unit?.code ??
    ""
  );
};

const getId = (item) =>
  item?.id ?? item?._id ?? item?.partId ?? item?.unitId ?? null;

const parseNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const parseMonth = (value) => {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getMonth() + 1;
  }

  const text = String(value).trim();
  const numeric = Number(text);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12)
    return numeric;

  const normalized = normalize(text).replace(/\.$/, "");
  const fullIndex = MONTHS.map(normalize).indexOf(normalized);
  if (fullIndex >= 0) return fullIndex + 1;

  const shortIndex = MONTHS.map((month) =>
    normalize(month.slice(0, 3)),
  ).indexOf(normalized);
  if (shortIndex >= 0) return shortIndex + 1;

  return null;
};

const monthName = (month) => MONTHS[Number(month) - 1] || "-";

function validateUploadedRows(rows, parts, units) {
  const partMap = new Map();
  const unitMap = new Map();

  parts.forEach((part) => {
    const partNo = getPartNo(part);
    if (String(partNo).trim()) partMap.set(normalize(partNo), part);
  });

  units.forEach((unit) => {
    const unitName = getUnitName(unit);
    if (String(unitName).trim()) unitMap.set(normalize(unitName), unit);
  });

  const duplicateMap = new Map();
  rows.forEach((row) => {
    if (row.partNo && row.unit && row.month) {
      const key = `${normalize(row.partNo)}||${normalize(row.unit)}||${row.month}`;
      duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1);
    }
  });

  return rows.map((row) => {
    const errors = [];
    const partNo = String(row.partNo ?? "").trim();
    const partName = String(row.partName ?? "").trim();
    const unitName = String(row.unit ?? "").trim();
    const month = Number(row.month);
    const qty =
      row.qty === "" || row.qty === null || row.qty === undefined
        ? null
        : Number(row.qty);
    const sellRate =
      row.sellRate === "" || row.sellRate === null || row.sellRate === undefined
        ? null
        : Number(row.sellRate);

    const matchedPart = partNo ? partMap.get(normalize(partNo)) : null;
    const matchedUnit = unitName ? unitMap.get(normalize(unitName)) : null;

    if (!partNo) {
      errors.push("Part No. is required.");
    } else if (!matchedPart) {
      errors.push(`Part No. '${partNo}' was not found in Part Master.`);
    }

    if (!partName) {
      errors.push("Part Name is required.");
    } else if (matchedPart) {
      const masterName = String(getPartName(matchedPart)).trim();
      if (masterName && normalize(partName) !== normalize(masterName)) {
        errors.push(
          `Part Name does not match Part Master. Expected '${masterName}'.`,
        );
      }
    }

    if (!unitName) {
      errors.push("Unit is required.");
    } else if (!matchedUnit) {
      errors.push(`Unit '${unitName}' was not found in Unit Master.`);
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      errors.push("Month must be between January and December.");
    }

    if (
      row.qty !== null &&
      row.qty !== undefined &&
      (!Number.isFinite(qty) || qty < 0)
    ) {
      errors.push("Qty must be a valid non-negative number.");
    }

    if (
      row.sellRate !== null &&
      row.sellRate !== undefined &&
      (!Number.isFinite(sellRate) || sellRate < 0)
    ) {
      errors.push("Sells Rate must be a valid non-negative number.");
    }

    if (qty === null && sellRate === null) {
      errors.push("Either Qty or Sells Rate is required.");
    }

    if (partNo && unitName && Number.isInteger(month)) {
      const duplicateKey = `${normalize(partNo)}||${normalize(unitName)}||${month}`;
      if (duplicateMap.get(duplicateKey) > 1) {
        errors.push(`Duplicate Part + Unit + ${monthName(month)} in Excel.`);
      }
    }

    return {
      ...row,
      errors,
      partId: getId(matchedPart),
      masterPartName: getPartName(matchedPart),
      unitId: getId(matchedUnit),
      masterUnit: getUnitName(matchedUnit),
    };
  });
}

const SalesMonthlyBulk = () => {
  const navigate = useNavigate();
  const [financialYear, setFinancialYear] = useState(defaultFinancialYear);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [masterLoading, setMasterLoading] = useState(false);
  const [partMaster, setPartMaster] = useState([]);
  const [unitMaster, setUnitMaster] = useState([]);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    window.setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3500,
    );
  };

  const loadMasterData = async () => {
    try {
      setMasterLoading(true);
      const [partsResponse, unitsResponse] = await Promise.all([
        fetch(PARTS_API),
        fetch(UNITS_API),
      ]);

      if (!partsResponse.ok)
        throw new Error(
          `Unable to load Part Master. Status: ${partsResponse.status}`,
        );
      if (!unitsResponse.ok)
        throw new Error(
          `Unable to load Unit Master. Status: ${unitsResponse.status}`,
        );

      const [partsResult, unitsResult] = await Promise.all([
        partsResponse.json(),
        unitsResponse.json(),
      ]);

      const parts = extractArray(partsResult);
      const units = extractArray(unitsResult);
      setPartMaster(parts);
      setUnitMaster(units);
      return { parts, units };
    } finally {
      setMasterLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Part No.",
      "Part Name",
      "Unit",
      "Month",
      "Qty",
      "Sells Rate",
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 14 },
      { wch: 15 },
    ];
    worksheet["!autofilter"] = { ref: "A1:F1" };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Monthly");
    XLSX.writeFile(workbook, `Sales_Monthly_Template_${financialYear}.xlsx`);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (![".xlsx", ".xls"].includes(extension)) {
      showToast("Please upload an Excel file (.xlsx or .xls).", "error");
      event.target.value = "";
      return;
    }

    try {
      setLoading(true);
      setFileName(file.name);

      let masters = { parts: partMaster, units: unitMaster };
      if (!masters.parts.length || !masters.units.length) {
        masters = await loadMasterData();
      }

      const data = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(data, { type: "array", cellDates: true });

      if (!workbook.SheetNames.length)
        throw new Error("No worksheet found in the Excel file.");

      const sheetName = workbook.SheetNames.includes("Sales Monthly")
        ? "Sales Monthly"
        : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: true,
      });
      if (!sheetRows.length) throw new Error("The Excel file is empty.");

      const requiredHeaders = [
        "Part No.",
        "Part Name",
        "Unit",
        "Month",
        "Qty",
        "Sells Rate",
      ];
      const actualHeaders = sheetRows[0].map(normalizeHeader);
      const missingHeaders = requiredHeaders.filter(
        (header) => !actualHeaders.includes(normalizeHeader(header)),
      );
      if (missingHeaders.length) {
        throw new Error(
          `Invalid template. Missing: ${missingHeaders.join(", ")}`,
        );
      }

      const headerIndex = new Map();
      sheetRows[0].forEach((header, index) =>
        headerIndex.set(normalizeHeader(header), index),
      );

      const getCell = (row, header) =>
        row[headerIndex.get(normalizeHeader(header))] ?? "";

      const convertedRows = sheetRows
        .slice(1)
        .map((excelRow, index) => {
          const partNo = getCell(excelRow, "Part No.");
          const partName = getCell(excelRow, "Part Name");
          const unit = getCell(excelRow, "Unit");
          const monthValue = getCell(excelRow, "Month");
          const qtyValue = getCell(excelRow, "Qty");
          const sellRateValue = getCell(excelRow, "Sells Rate");

          return {
            id: `${Date.now()}-${index}`,
            excelRow: index + 2,
            partNo: String(partNo ?? "").trim(),
            partName: String(partName ?? "").trim(),
            unit: String(unit ?? "").trim(),
            month: parseMonth(monthValue),
            qty: parseNumber(qtyValue),
            sellRate: parseNumber(sellRateValue),
          };
        })
        .filter(
          (row) =>
            row.partNo ||
            row.partName ||
            row.unit ||
            row.month ||
            row.qty !== null ||
            row.sellRate !== null,
        );

      if (!convertedRows.length)
        throw new Error("No data rows found in the Excel file.");

      const validated = validateUploadedRows(
        convertedRows,
        masters.parts,
        masters.units,
      );
      setRows(validated);

      const invalidCount = validated.filter(
        (row) => row.errors.length > 0,
      ).length;
      if (invalidCount) {
        showToast(`${invalidCount} row(s) contain validation errors.`, "error");
      } else {
        showToast(
          `${validated.length} row(s) validated successfully.`,
          "success",
        );
      }
    } catch (error) {
      console.error("Excel processing error:", error);
      setRows([]);
      showToast(error.message || "Unable to process the Excel file.", "error");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleRowChange = (index, field, value) => {
    let finalValue = value;
    if (field === "qty" || field === "sellRate")
      finalValue = value === "" ? null : parseNumber(value);
    if (field === "month") finalValue = parseMonth(value);

    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: finalValue } : row,
      ),
    );
  };

  const validatedRows = useMemo(
    () => validateUploadedRows(rows, partMaster, unitMaster),
    [rows, partMaster, unitMaster],
  );

  const validRows = useMemo(
    () => validatedRows.filter((row) => row.errors.length === 0),
    [validatedRows],
  );

  const invalidRows = useMemo(
    () => validatedRows.filter((row) => row.errors.length > 0),
    [validatedRows],
  );

  const handleSave = async () => {
    if (!financialYear)
      return showToast("Financial Year is required.", "error");
    if (!rows.length)
      return showToast("Please upload an Excel file first.", "error");
    if (invalidRows.length)
      return showToast(
        `Please fix ${invalidRows.length} invalid row(s) before saving.`,
        "error",
      );

    const entries = validRows.map((row) => ({
      excelRow: row.excelRow,
      partNo: row.partNo,
      partName: row.masterPartName || row.partName,
      unit: row.masterUnit || row.unit,
      month: row.month,
      qty: row.qty,
      sellRate: row.sellRate,
    }));

    try {
      setLoading(true);
      const response = await fetch(`${SALES_MONTHLY_API}/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financialYear, entries }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (Array.isArray(result?.errors)) {
          const message = result.errors
            .slice(0, 10)
            .map((item) => `Excel Row ${item.row}: ${item.message}`)
            .join("\n");
          throw new Error(message || result.message || "Bulk save failed.");
        }
        throw new Error(result?.message || "Bulk save failed.");
      }

      showToast(
        result?.message || `${entries.length} records saved successfully.`,
        "success",
      );
      window.setTimeout(() => navigate("/sales-monthly"), 1000);
    } catch (error) {
      console.error("Bulk Sales Monthly save error:", error);
      showToast(error.message || "Unable to save bulk entries.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setRows([]);
    setFileName("");
  };

  const handleRemoveRow = (index) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <div className="sales-bulk-page">
      {toast.show && (
        <div className={`sales-bulk-toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <span style={{ whiteSpace: "pre-line" }}>{toast.message}</span>
          <button
            type="button"
            onClick={() =>
              setToast({ show: false, message: "", type: "success" })
            }
          >
            ×
          </button>
        </div>
      )}

      <div className="sales-bulk-header">
        <div>
          <h2>Bulk Sales Monthly Entry</h2>
          <p>Upload monthly Qty and Sells Rate for multiple parts.</p>
        </div>
        <button
          type="button"
          className="bulk-back-btn"
          onClick={() => navigate("/sales-monthly")}
        >
          ← Back
        </button>
      </div>

      <div className="sales-bulk-control-card">
        <div className="bulk-control-group">
          <label>Financial Year</label>
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            disabled={loading}
          >
            {financialYearOptions.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bulk-control-actions">
          <button
            type="button"
            className="download-template-btn"
            onClick={handleDownloadTemplate}
            disabled={loading}
          >
            ↓ Download Template
          </button>
          <label className="choose-file-btn">
            ⇧ Choose Excel File
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={loading || masterLoading}
            />
          </label>
          {fileName && <span className="selected-file">{fileName}</span>}
        </div>
      </div>

      <div className="sales-bulk-info">
        <strong>Excel format:</strong>
        <span>Part No. | Part Name | Unit | Month | Qty | Sells Rate</span>
      </div>

      {rows.length > 0 && (
        <div className="bulk-summary">
          <div className="summary-box">
            <span>Excel Rows</span>
            <strong>{rows.length}</strong>
          </div>
          <div className="summary-box valid">
            <span>Valid Rows</span>
            <strong>{validRows.length}</strong>
          </div>
          <div className="summary-box invalid">
            <span>Invalid Rows</span>
            <strong>{invalidRows.length}</strong>
          </div>
          <div className="summary-box">
            <span>Monthly Records</span>
            <strong>{validRows.length}</strong>
          </div>
        </div>
      )}

      <div className="sales-bulk-table-card">
        <div className="bulk-table-header">
          <div>
            <h3>Upload Preview</h3>
            <span>
              {rows.length
                ? `${rows.length} rows loaded`
                : "Upload an Excel file to preview data"}
            </span>
          </div>
          {rows.length > 0 && (
            <button
              type="button"
              className="clear-bulk-btn"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </button>
          )}
        </div>

        <div className="bulk-table-scroll">
          {rows.length > 0 ? (
            <table className="sales-bulk-table">
              <thead>
                <tr>
                  <th className="bulk-sr">#</th>
                  <th>Part No.</th>
                  <th>Part Name</th>
                  <th>Unit</th>
                  <th>Month</th>
                  <th>Qty</th>
                  <th>Sells Rate</th>
                  <th className="bulk-error-col">Validation</th>
                  <th className="bulk-action-col">Action</th>
                </tr>
              </thead>
              <tbody>
                {validatedRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={row.errors.length ? "bulk-invalid-row" : ""}
                  >
                    <td className="bulk-sr">{row.excelRow}</td>
                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.partNo}
                        onChange={(e) =>
                          handleRowChange(index, "partNo", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.partName}
                        onChange={(e) =>
                          handleRowChange(index, "partName", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.unit}
                        onChange={(e) =>
                          handleRowChange(index, "unit", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <select
                        className="bulk-month-select"
                        value={row.month || ""}
                        onChange={(e) =>
                          handleRowChange(index, "month", e.target.value)
                        }
                        disabled={loading}
                      >
                        <option value="">Select</option>
                        {MONTHS.map((month, monthIndex) => (
                          <option key={month} value={monthIndex + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="bulk-edit-input"
                        value={row.qty ?? ""}
                        min="0"
                        step="0.01"
                        onChange={(e) =>
                          handleRowChange(index, "qty", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="bulk-edit-input"
                        value={row.sellRate ?? ""}
                        min="0"
                        step="0.01"
                        onChange={(e) =>
                          handleRowChange(index, "sellRate", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>
                    <td className="bulk-error-cell">
                      {row.errors.length > 0 ? (
                        <div className="bulk-errors">
                          {row.errors.map((error, errorIndex) => (
                            <span key={errorIndex}>• {error}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="valid-badge">✓ Valid</span>
                      )}
                    </td>
                    <td className="bulk-action-cell">
                      <button
                        type="button"
                        className="remove-row-btn"
                        onClick={() => handleRemoveRow(index)}
                        disabled={loading}
                        title="Remove row"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="bulk-empty-state">
              <div className="bulk-empty-icon">⇧</div>
              <h4>No Excel File Uploaded</h4>
              <p>
                Download the template, enter your monthly records and upload the
                Excel file here.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="sales-bulk-footer">
        <button
          type="button"
          className="bulk-cancel-btn"
          onClick={() => navigate("/sales-monthly")}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="bulk-save-btn"
          onClick={handleSave}
          disabled={loading || rows.length === 0 || invalidRows.length > 0}
        >
          {loading ? "Saving..." : `Save ${validRows.length} Records`}
        </button>
      </div>
    </div>
  );
};

export default SalesMonthlyBulk;
