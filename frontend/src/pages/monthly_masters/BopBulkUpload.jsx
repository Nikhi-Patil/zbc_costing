import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  Download,
  Upload,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";
import "../../assets/css/SalesMonthly.css";
import API_BASE_URL from "../../config/api";
import { months } from "../../utils/costingUtils";

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const normalizeHeader = (value) => normalize(value).replace(/\s+/g, " ");
const parseNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const parseFinancialYear = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "";
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4})\s*-\s*(\d{2}|\d{4})$/);

  if (!match) return text;

  const start = Number(match[1]);
  const end = match[2].length === 2 ? match[2] : String(start + 1);

  return `${start}-${end}`;
};
const isValidFinancialYear = (value) =>
  /^\d{4}-\d{2}$/.test(String(value || "").trim());
const parseMonth = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getMonth() + 1;
  }
  const text = String(value).trim();
  const numeric = Number(text);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
    return numeric;
  }
  const normalized = normalize(text).replace(/\.$/, "");
  const fullMonth = months.find(
    (month) => normalize(month.label) === normalized,
  );
  if (fullMonth) {
    return Number(fullMonth.value);
  }
  const shortMonth = months.find(
    (month) => normalize(month.label.slice(0, 3)) === normalized,
  );
  if (shortMonth) {
    return Number(shortMonth.value);
  }
  return null;
};
const monthName = (month) =>
  months.find((item) => Number(item.value) === Number(month))?.label || "-";

function validateRows(rows, bops = []) {
  const duplicateMap = new Map();
  const bopMap = new Map(bops.map((bop) => [normalize(bop.bop_erp_code), bop]));

  // Build duplicate map
  rows.forEach((row) => {
    const bopErpCode = normalize(row.bopErpCode);
    const supplierName = normalize(row.supplierName);
    const financialYear = parseFinancialYear(row.financialYear);
    const month = Number(row.month);
    const bop = bopMap.get(bopErpCode);
    if (bop && financialYear && Number.isInteger(month)) {
      const supplierId = getSupplierIdFromBop(bop, supplierName);
      if (supplierId) {
        const duplicateKey = `${bop.id}||${supplierId}||${financialYear}||${month}`;
        duplicateMap.set(
          duplicateKey,
          (duplicateMap.get(duplicateKey) || 0) + 1,
        );
      }
    }
  });

  return rows.map((row) => {
    const errors = [];
    const bopErpCode = String(row.bopErpCode ?? "").trim();
    const supplierName = String(row.supplierName ?? "").trim();
    const financialYear = parseFinancialYear(row.financialYear);
    const month = parseMonth(row.month);
    const qty = parseNumber(row.qty);
    const rate = parseNumber(row.rate);
    const bop = bopMap.get(normalize(bopErpCode));

    /* BOP ERP CODE */
    if (!bopErpCode) {
      errors.push("BOP ERP Code is required.");
    } else if (!bop) {
      errors.push(`BOP ERP Code '${bopErpCode}' was not found in BOP Master.`);
    }

    /* SUPPLIER */
    let supplierId = null;
    if (!supplierName) {
      errors.push("Supplier Name is required.");
    } else if (bop) {
      supplierId = getSupplierIdFromBop(bop, supplierName);
      if (!supplierId) {
        errors.push(
          `Supplier '${supplierName}' is not assigned to BOP '${bopErpCode}'.`,
        );
      }
    }

    /* FINANCIAL YEAR */
    if (!financialYear) {
      errors.push("Financial Year is required.");
    } else if (!isValidFinancialYear(financialYear)) {
      errors.push("Financial Year must be in YYYY-YY format, e.g. 2026-27.");
    }

    /* MONTH */
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      errors.push("Month must be between January and December.");
    }

    /* QTY*/
    if (
      row.qty === null ||
      row.qty === undefined ||
      String(row.qty).trim() === ""
    ) {
      errors.push("Qty is required.");
    } else if (!Number.isFinite(qty) || qty < 0) {
      errors.push("Qty must be a valid non-negative number.");
    }

    /* RATE */
    if (
      row.rate === null ||
      row.rate === undefined ||
      String(row.rate).trim() === ""
    ) {
      errors.push("Rate is required.");
    } else if (!Number.isFinite(rate) || rate < 0) {
      errors.push("Rate must be a valid non-negative number.");
    }

    /* DUPLICATE */
    if (bop && supplierId && financialYear && Number.isInteger(month)) {
      const duplicateKey = `${bop.id}||${supplierId}||${financialYear}||${month}`;
      if (duplicateMap.get(duplicateKey) > 1) {
        errors.push(
          `Duplicate BOP + Supplier + Financial Year + ${monthName(month)} found in Excel.`,
        );
      }
    }
    return {
      ...row,
      financialYear,
      month,
      qty,
      rate,
      errors,
    };
  });
}

const getSupplierIdFromBop = (bop, supplierName) => {
  if (!bop || !supplierName) {
    return null;
  }

  const enteredSupplier = normalize(supplierName);

  const supplierNames = String(bop.supplier_name ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const supplierIds = String(bop.supplier_id ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const index = supplierNames.findIndex(
    (name) => normalize(name) === enteredSupplier,
  );

  if (index === -1) {
    return null;
  }

  return supplierIds[index] || null;
};

const BopBulkUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [masterLoading, setMasterLoading] = useState(false);
  const [currentInvalidIndex, setCurrentInvalidIndex] = useState(-1);
  const [bopMaster, setBopMaster] = useState([]);
  const [supplierMaster, setSupplierMaster] = useState([]);
  const invalidRowRefs = useRef({});
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") => {
    setToast({
      show: true,
      message,
      type,
    });

    window.setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 3500);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "BOP ERP Code": "BOP001",
        "Supplier Name": "ANTECH INDUSTRIES",
        "Financial Year": "2026-27",
        Month: 4,
        Qty: 1000,
        Rate: 25.5,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 28 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
    ];

    worksheet["!autofilter"] = {
      ref: "A1:F2",
    };

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "BOP Monthly Rate");

    XLSX.writeFile(workbook, "BOP_Monthly_Rate_Template.xlsx");
  };

  const loadMasters = async () => {
    setMasterLoading(true);
    try {
      const bopResponse = await fetch(`${API_BASE_URL}/bops`);
      if (!bopResponse.ok) {
        throw new Error(
          `Unable to load BOP Master. Status: ${bopResponse.status}`,
        );
      }
      const bopData = await bopResponse.json();
      const bops = Array.isArray(bopData)
        ? bopData
        : Array.isArray(bopData?.data)
          ? bopData.data
          : [];
      if (!bops.length) {
        throw new Error("BOP Master is empty.");
      }
      setBopMaster(bops);
      return {
        bops,
      };
    } catch (error) {
      console.error("Master loading error:", error);
      throw error;
    } finally {
      setMasterLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    const extension = selectedFile.name
      .substring(selectedFile.name.lastIndexOf("."))
      .toLowerCase();
    if (![".xlsx", ".xls"].includes(extension)) {
      showToast("Please select an Excel file (.xlsx or .xls).", "error");
      event.target.value = "";
      return;
    }

    try {
      setLoading(true);
      setFile(selectedFile);
      let masters = {
        bops: bopMaster,
        suppliers: supplierMaster,
      };
      if (!masters.bops.length) {
        masters = await loadMasters();
      }
      setRows([]);
      setCurrentInvalidIndex(-1);
      const data = new Uint8Array(await selectedFile.arrayBuffer());
      const workbook = XLSX.read(data, {
        type: "array",
        cellDates: true,
      });
      if (!workbook.SheetNames.length) {
        throw new Error("No worksheet found in the Excel file.");
      }
      const sheetName = workbook.SheetNames.includes("BOP Monthly Rate")
        ? "BOP Monthly Rate"
        : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: true,
      });
      if (!sheetRows.length) {
        throw new Error("The Excel file is empty.");
      }
      const requiredHeaders = [
        "BOP ERP Code",
        "Supplier Name",
        "Financial Year",
        "Month",
        "Qty",
        "Rate",
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
      sheetRows[0].forEach((header, index) => {
        headerIndex.set(normalizeHeader(header), index);
      });

      const getCell = (row, header) =>
        row[headerIndex.get(normalizeHeader(header))] ?? "";
      const convertedRows = sheetRows
        .slice(1)
        .map((excelRow, index) => ({
          id: `${Date.now()}-${index}`,
          excelRow: index + 2,
          bopErpCode: String(getCell(excelRow, "BOP ERP Code") ?? "").trim(),
          supplierName: String(getCell(excelRow, "Supplier Name") ?? "").trim(),
          financialYear: parseFinancialYear(
            getCell(excelRow, "Financial Year"),
          ),
          month: parseMonth(getCell(excelRow, "Month")),
          qty: parseNumber(getCell(excelRow, "Qty")),
          rate: parseNumber(getCell(excelRow, "Rate")),
        }))
        .filter(
          (row) =>
            row.bopErpCode ||
            row.supplierName ||
            row.financialYear ||
            row.month ||
            row.qty !== null ||
            row.rate !== null,
        );

      if (!convertedRows.length) {
        throw new Error("No data rows found in the Excel file.");
      }

      const validated = validateRows(
        convertedRows,
        masters.bops,
        masters.suppliers,
      );

      setRows(validated);
      const invalidCount = validated.filter(
        (row) => row.errors.length > 0,
      ).length;
      if (invalidCount > 0) {
        showToast(`${invalidCount} row(s) contain validation errors.`, "error");
      } else {
        showToast(
          `${validated.length} row(s) validated successfully.`,
          "success",
        );
      }
    } catch (error) {
      console.error("BOP Excel processing error:", error);
      setFile(null);
      setRows([]);
      showToast(error.message || "Unable to process the Excel file.", "error");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleRowChange = (index, field, value) => {
    let finalValue = value;

    if (field === "qty" || field === "rate") {
      finalValue = value === "" ? null : parseNumber(value);
    }

    if (field === "month") {
      finalValue = parseMonth(value);
    }

    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: finalValue,
            }
          : row,
      ),
    );
  };

  const validatedRows = useMemo(
    () => validateRows(rows, bopMaster),
    [rows, bopMaster],
  );

  const validRows = useMemo(
    () => validatedRows.filter((row) => row.errors.length === 0),
    [validatedRows],
  );

  const invalidRows = useMemo(
    () => validatedRows.filter((row) => row.errors.length > 0),
    [validatedRows],
  );

  const handleUpload = async () => {
    if (!file) {
      showToast("Please select an Excel file first.", "error");
      return;
    }
    if (!rows.length) {
      showToast("Please upload an Excel file first.", "error");
      return;
    }
    if (invalidRows.length > 0) {
      showToast(
        `Please fix ${invalidRows.length} invalid row(s) before uploading.`,
        "error",
      );
      return;
    }
    const uploadData = validRows.map((row) => ({
      bopErpCode: String(row.bopErpCode).trim(),
      supplierName: String(row.supplierName).trim(),
      financial_year: String(row.financialYear).trim(),
      month: Number(row.month),
      qty: Number(row.qty),
      rate: Number(row.rate),
    }));
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/monthly-bop-rate/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: uploadData,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        if (Array.isArray(result?.errors)) {
          const message = result.errors
            .slice(0, 10)
            .map(
              (item) =>
                `Excel Row ${item.row ?? item.excelRow ?? "-"}: ${
                  item.message ?? item.error ?? "Validation error"
                }`,
            )
            .join("\n");
          throw new Error(message || result.message || "Bulk upload failed.");
        }
        throw new Error(result.message || "Bulk upload failed.");
      }
      showToast(
        result.message || `${uploadData.length} records uploaded successfully.`,
        "success",
      );
      window.setTimeout(() => navigate("/monthly-master/bop"), 1000);
    } catch (error) {
      console.error("BOP bulk upload error:", error);
      showToast(
        error.message || "Unable to upload BOP monthly rates.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setRows([]);
    setCurrentInvalidIndex(-1);
    setToast({
      show: false,
      message: "",
      type: "success",
    });

    const fileInput = document.getElementById("bopExcelFile");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleRemoveRow = (index) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setCurrentInvalidIndex(-1);
  };

  const goToNextInvalidRow = () => {
    if (!invalidRows.length) return;
    const nextIndex =
      currentInvalidIndex >= invalidRows.length - 1
        ? 0
        : currentInvalidIndex + 1;

    setCurrentInvalidIndex(nextIndex);
    const row = invalidRows[nextIndex];
    setTimeout(() => {
      invalidRowRefs.current[row.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  };

  return (
    <div className="sales-bulk-page">
      {toast.show && (
        <div className={`sales-bulk-toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
          </span>
          <span style={{ whiteSpace: "pre-line" }}>{toast.message}</span>
          <button
            type="button"
            onClick={() =>
              setToast({ show: false, message: "", type: "success" })
            }
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="sales-bulk-header">
        <div>
          <h2>BOP Monthly Rate - Bulk Upload</h2>
          <p>Upload monthly Qty and Rate for multiple BOP records.</p>
        </div>
        <button
          type="button"
          className="bulk-back-btn"
          onClick={() => navigate("/monthly-master/bop")}
          disabled={loading || masterLoading}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="sales-bulk-control-card">
        <div className="bulk-control-actions">
          <button
            type="button"
            className="download-template-btn"
            onClick={downloadTemplate}
            disabled={loading}
          >
            <Download size={16} />
            Download Template
          </button>
          <label className="choose-file-btn">
            <Upload size={16} />
            Choose Excel File
            <input
              id="bopExcelFile"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>
          {file && <span className="selected-file">{file.name}</span>}
        </div>
      </div>

      <div className="sales-bulk-info">
        <strong>Excel format:</strong>
        <span>
          BOP ERP Code | Supplier Name | Financial Year | Month | Qty | Rate
        </span>
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
          <div
            className="summary-box invalid"
            onClick={invalidRows.length ? goToNextInvalidRow : undefined}
            style={{
              cursor: invalidRows.length ? "pointer" : "default",
            }}
          >
            <span>Invalid Rows</span>
            <strong>{invalidRows.length}</strong>
            {invalidRows.length > 0 && (
              <small>
                {currentInvalidIndex >= 0
                  ? `Error ${currentInvalidIndex + 1} of ${invalidRows.length}`
                  : "Click to find errors"}
              </small>
            )}
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
                  <th>BOP ERP Code</th>
                  <th>Supplier Name</th>
                  <th>Financial Year</th>
                  <th>Month</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th className="bulk-error-col">Validation</th>
                  <th className="bulk-action-col">Action</th>
                </tr>
              </thead>

              <tbody>
                {validatedRows.map((row, index) => (
                  <tr
                    key={row.id}
                    ref={(element) => {
                      if (row.errors?.length > 0) {
                        invalidRowRefs.current[row.id] = element;
                      }
                    }}
                    className={
                      row.errors?.length > 0 &&
                      invalidRows[currentInvalidIndex]?.id === row.id
                        ? "bulk-invalid-row selected-invalid-row"
                        : row.errors?.length > 0
                          ? "bulk-invalid-row"
                          : ""
                    }
                  >
                    <td className="bulk-sr">{row.excelRow}</td>
                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.bopErpCode}
                        onChange={(event) =>
                          handleRowChange(
                            index,
                            "bopErpCode",
                            event.target.value,
                          )
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.supplierName}
                        onChange={(event) =>
                          handleRowChange(
                            index,
                            "supplierName",
                            event.target.value,
                          )
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.financialYear || ""}
                        onChange={(event) =>
                          handleRowChange(
                            index,
                            "financialYear",
                            event.target.value,
                          )
                        }
                        disabled={loading}
                        placeholder="2026-27"
                      />
                    </td>

                    <td>
                      <select
                        className="bulk-month-select"
                        value={row.month || ""}
                        onChange={(event) =>
                          handleRowChange(index, "month", event.target.value)
                        }
                        disabled={loading}
                      >
                        <option value="">Select</option>
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
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
                        onChange={(event) =>
                          handleRowChange(index, "qty", event.target.value)
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        className="bulk-edit-input"
                        value={row.rate ?? ""}
                        min="0"
                        step="0.01"
                        onChange={(event) =>
                          handleRowChange(index, "rate", event.target.value)
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
                        <span className="valid-badge">
                          <CheckCircle2 size={14} />
                          Valid
                        </span>
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
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="bulk-empty-state">
              <div className="bulk-empty-icon">
                <Upload size={32} />
              </div>
              <h4>No Excel File Uploaded</h4>
              <p>
                Download the template, enter your BOP monthly rates and upload
                the Excel file here.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="sales-bulk-footer">
        <button
          type="button"
          className="bulk-cancel-btn"
          onClick={() => navigate("/monthly-master/bop")}
          disabled={loading}
        >
          <X size={16} />
          Cancel
        </button>

        <button
          type="button"
          className="bulk-save-btn"
          onClick={handleUpload}
          disabled={loading || rows.length === 0 || invalidRows.length > 0}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="sales-loading-icon" />
              Uploading...
            </>
          ) : (
            <>
              <Save size={16} />
              Upload {validRows.length} Records
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BopBulkUpload;
