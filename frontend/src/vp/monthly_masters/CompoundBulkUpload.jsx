import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import API_BASE_URL from "../../config/api";
import "../../assets/css/monthlyMaster/SalesMonthly.css";
import { months } from "../../utils/costingUtils";

const CompoundBulkUpload = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [compoundMaster, setCompoundMaster] = useState([]);
  const [unitMaster, setUnitMaster] = useState([]);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [currentInvalidIndex, setCurrentInvalidIndex] = useState(-1);
  const invalidRowRefs = useRef({});

  // TOAST
  const showToast = (message, type = "success") => {
    setToast({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 4000);
  };

  // LOAD MASTER DATA
  useEffect(() => {
    loadMasterData();
  }, []);

  const extractArray = (result) => {
    if (Array.isArray(result)) return result;

    if (Array.isArray(result?.data)) {
      return result.data;
    }

    if (Array.isArray(result?.rows)) {
      return result.rows;
    }

    if (Array.isArray(result?.result)) {
      return result.result;
    }

    return [];
  };

  const loadMasterData = async () => {
    try {
      const [compoundResponse, unitResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/compounds`),
        fetch(`${API_BASE_URL}/units`),
      ]);

      if (!compoundResponse.ok) {
        throw new Error("Failed to load Compound Master");
      }

      if (!unitResponse.ok) {
        throw new Error("Failed to load Unit Master");
      }

      const compoundResult = await compoundResponse.json();
      const unitResult = await unitResponse.json();

      setCompoundMaster(extractArray(compoundResult));
      setUnitMaster(extractArray(unitResult));
    } catch (error) {
      console.error("Master loading error:", error);

      showToast(error.message || "Failed to load master data", "error");
    }
  };

  // NORMALIZE
  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const normalizeHeader = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  // FIND COMPOUND
  const findCompound = (imCode) => {
    const search = normalize(imCode);

    return compoundMaster.find((item) => {
      return (
        normalize(item.im_code) === search || normalize(item.imCode) === search
      );
    });
  };

  // FIND UNIT
  const findUnit = (unit) => {
    const search = normalize(unit);

    return unitMaster.find((item) => {
      return normalize(item.unit) === search;
    });
  };

  // VALIDATE ROWS
  const validateRow = (row, index) => {
    const errors = [];

    const imCode = String(row.imCode ?? "").trim();
    const productionUnit = String(row.productionUnit ?? "").trim();

    const financialYear = String(row.financialYear ?? "").trim();

    const month = Number(row.month);
    const qty = Number(row.qty);
    const rate = Number(row.rate);

    // IM CODE
    if (!imCode) {
      errors.push("IM Code is required");
    } else if (!findCompound(imCode)) {
      errors.push(`IM Code "${imCode}" not found in Compound Master`);
    }

    // UNIT
    if (!productionUnit) {
      errors.push("Production Unit is required");
    } else if (!findUnit(productionUnit)) {
      errors.push(
        `Production Unit "${productionUnit}" not found in Unit Master`,
      );
    }

    // FINANCIAL YEAR
    if (!financialYear) {
      errors.push("Financial Year is required");
    } else if (!/^\d{4}-\d{2}$/.test(financialYear)) {
      errors.push("Financial Year must be in YYYY-YY format");
    }

    // MONTH
    if (
      row.month === "" ||
      row.month === null ||
      row.month === undefined ||
      Number.isNaN(month)
    ) {
      errors.push("Month is required");
    } else if (month < 1 || month > 12) {
      errors.push("Month must be between 1 and 12");
    }

    // QTY
    if (row.qty === "" || row.qty === null || row.qty === undefined) {
      errors.push("Qty is required");
    } else if (!Number.isFinite(qty)) {
      errors.push("Qty must be numeric");
    } else if (qty < 0) {
      errors.push("Qty cannot be negative");
    }

    // RATE
    if (row.rate === "" || row.rate === null || row.rate === undefined) {
      errors.push("Rate is required");
    } else if (!Number.isFinite(rate)) {
      errors.push("Rate must be numeric");
    } else if (rate < 0) {
      errors.push("Rate cannot be negative");
    }

    return {
      ...row,
      errors,
      isValid: errors.length === 0,
    };
  };

  // DUPLICATE VALIDATION
  const validatedRows = useMemo(() => {
    const result = rows.map((row, index) => validateRow(row, index));

    const duplicateMap = new Map();

    result.forEach((row, index) => {
      if (!row.isValid) return;

      const key = [
        normalize(row.imCode),
        normalize(row.productionUnit),
        normalize(row.financialYear),
        Number(row.month),
      ].join("|");

      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }

      duplicateMap.get(key).push(index);
    });

    duplicateMap.forEach((indexes) => {
      if (indexes.length > 1) {
        indexes.forEach((index) => {
          result[index] = {
            ...result[index],
            errors: [
              ...result[index].errors,
              "Duplicate entry for same IM Code, Production Unit, Financial Year and Month",
            ],
            isValid: false,
          };
        });
      }
    });

    return result;
  }, [rows, compoundMaster, unitMaster]);

  const validRows = useMemo(
    () => validatedRows.filter((row) => row.isValid),
    [validatedRows],
  );

  const invalidRows = useMemo(
    () => validatedRows.filter((row) => !row.isValid),
    [validatedRows],
  );

  // DOWNLOAD TEMPLATE
  const handleDownloadTemplate = () => {
    const template = [
      {
        "IM Code": "",
        "Production Unit": "",
        "Financial Year": "",
        Month: "",
        Qty: "",
        Rate: "",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Compound Monthly Rate");

    XLSX.writeFile(workbook, "Compound_Monthly_Rate_Template.xlsx");
  };

  // PARSE EXCEL
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setCurrentInvalidIndex(-1);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
        });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const rawRows = XLSX.utils.sheet_to_json(firstSheet, {
          defval: "",
          raw: false,
        });

        if (!rawRows.length) {
          showToast("Excel file is empty", "error");
          return;
        }

        const firstRow = rawRows[0];

        const headers = Object.keys(firstRow).map(normalizeHeader);

        const requiredHeaders = [
          "im code",
          "production unit",
          "financial year",
          "month",
          "qty",
          "rate",
        ];

        const missingHeaders = requiredHeaders.filter(
          (header) => !headers.includes(header),
        );

        if (missingHeaders.length > 0) {
          showToast(
            `Missing Excel columns:\n${missingHeaders.join("\n")}`,
            "error",
          );

          return;
        }

        const parsedRows = rawRows.map((excelRow, index) => {
          const values = {};

          Object.keys(excelRow).forEach((key) => {
            values[normalizeHeader(key)] = excelRow[key];
          });

          return {
            id: `${Date.now()}-${index}`,
            rowNumber: index + 2,

            imCode: String(values["im code"] ?? "").trim(),

            productionUnit: String(values["production unit"] ?? "").trim(),

            financialYear: String(values["financial year"] ?? "").trim(),

            month: values["month"] ?? "",

            qty: values["qty"] ?? "",

            rate: values["rate"] ?? "",
          };
        });

        setRows(parsedRows);

        showToast(
          `${parsedRows.length} row(s) loaded successfully.`,
          "success",
        );
      } catch (error) {
        console.error("Excel parsing error:", error);

        showToast("Failed to read Excel file", "error");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // NEXT INVALID ROW
  const goToNextInvalidRow = () => {
    if (!invalidRows.length) return;

    const nextIndex =
      currentInvalidIndex >= invalidRows.length - 1
        ? 0
        : currentInvalidIndex + 1;

    setCurrentInvalidIndex(nextIndex);

    const invalidRow = invalidRows[nextIndex];

    if (!invalidRow) return;

    const actualIndex = validatedRows.findIndex(
      (row) => row.id === invalidRow.id,
    );

    setTimeout(() => {
      invalidRowRefs.current[invalidRow.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);

    console.log("Invalid row:", actualIndex);
  };

  // REMOVE ROW
  const handleRemoveRow = (index) => {
    setRows((previous) => previous.filter((_, rowIndex) => rowIndex !== index));

    setCurrentInvalidIndex(-1);
  };

  // CLEAR
  const handleClear = () => {
    setRows([]);
    setFileName("");
    setCurrentInvalidIndex(-1);

    const input = document.getElementById("compoundExcelFile");

    if (input) {
      input.value = "";
    }
  };

  const handleRowChange = (index, field, value) => {
    let finalValue = value;

    if (field === "qty" || field === "rate") {
      finalValue = value === "" ? "" : Number(value);
    }

    if (field === "month") {
      finalValue = value === "" ? "" : Number(value);
    }

    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: finalValue } : row,
      ),
    );
  };

  // UPLOAD
  const handleSave = async () => {
    if (!rows.length) {
      showToast("Please upload an Excel file first.", "error");

      return;
    }

    if (invalidRows.length > 0) {
      showToast(
        `Cannot upload.\n${invalidRows.length} row(s) have validation errors.`,
        "error",
      );

      setCurrentInvalidIndex(-1);

      setTimeout(() => {
        goToNextInvalidRow();
      }, 100);

      return;
    }

    try {
      setLoading(true);

      const uploadData = validRows.map((row) => ({
        rowNumber: row.rowNumber,

        imCode: String(row.imCode).trim(),

        productionUnit: String(row.productionUnit).trim(),

        financial_year: String(row.financialYear).trim(),

        month: Number(row.month),

        qty: Number(row.qty),

        rate: Number(row.rate),
      }));

      const response = await fetch(
        `${API_BASE_URL}/monthly-compound-rate/bulk`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            rows: uploadData,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Compound bulk upload failed");
      }

      showToast(
        result.message ||
          `${uploadData.length} record(s) uploaded successfully.`,
        "success",
      );

      setTimeout(() => {
        navigate("/monthly-master/compound");
      }, 1200);
    } catch (error) {
      console.error("Compound bulk upload error:", error);

      showToast(error.message || "Compound bulk upload failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
    <div className="sales-bulk-page">
      {/* TOAST */}
      {toast.show && (
        <div className={`sales-bulk-toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? (
              <CheckCircle2 size={17} />
            ) : (
              <AlertCircle size={17} />
            )}
          </span>
          <span style={{ whiteSpace: "pre-line" }}>{toast.message}</span>
          <button
            type="button"
            onClick={() =>
              setToast({
                show: false,
                message: "",
                type: "success",
              })
            }
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="sales-bulk-header">
        <div>
          <h2>Compound Monthly Rate - Bulk Upload</h2>
          <p>Upload monthly Qty and Rate for multiple compounds.</p>
        </div>

        <button
          type="button"
          className="bulk-back-btn"
          onClick={() => navigate("/monthly-master/compound")}
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>

      {/* CONTROL CARD */}
      <div className="sales-bulk-control-card">
        <div className="bulk-control-actions">
          <button
            type="button"
            className="download-template-btn"
            onClick={handleDownloadTemplate}
          >
            <Download size={15} />
            Download Template
          </button>
          <label className="choose-file-btn">
            <Upload size={15} />
            Choose Excel File
            <input
              id="compoundExcelFile"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </label>
          {fileName && (
            <span className="selected-file" title={fileName}>
              {fileName}
            </span>
          )}
        </div>
      </div>

      {/* INFO */}
      <div className="sales-bulk-info">
        <strong>Excel format:</strong>
        <span>
          IM Code | Production Unit | Financial Year | Month | Qty | Rate
        </span>
      </div>

      {/* SUMMARY */}
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
            onClick={invalidRows.length > 0 ? goToNextInvalidRow : undefined}
            style={{
              cursor: invalidRows.length > 0 ? "pointer" : "default",
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

      {/* TABLE */}
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
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>

        <div className="bulk-table-scroll">
          {rows.length > 0 ? (
            <table className="sales-bulk-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>IM Code</th>
                  <th>Production Unit</th>
                  <th>Financial Year</th>
                  <th>Month</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Validation</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {validatedRows.map((row, index) => (
                  <tr
                    key={row.id}
                    ref={(el) => {
                      if (row.errors?.length > 0) {
                        invalidRowRefs.current[row.id] = el;
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
                    {/* SR NO */}
                    <td className="bulk-sr">{row.rowNumber}</td>

                    {/* IM CODE */}
                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.imCode || ""}
                        onChange={(e) =>
                          handleRowChange(index, "imCode", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>

                    {/* PRODUCTION UNIT */}
                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.productionUnit || ""}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            "productionUnit",
                            e.target.value,
                          )
                        }
                        disabled={loading}
                      />
                    </td>

                    {/* FINANCIAL YEAR */}
                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.financialYear || ""}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            "financialYear",
                            e.target.value,
                          )
                        }
                        disabled={loading}
                        placeholder="2026-27"
                      />
                    </td>

                    {/* MONTH */}
                    <td>
                      <select
                        className="bulk-month-select"
                        value={row.month || ""}
                        onChange={(e) =>
                          handleRowChange(index, "month", e.target.value)
                        }
                      >
                        <option value="">Select Month</option>
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* QTY */}
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

                    {/* RATE */}
                    <td>
                      <input
                        type="number"
                        className="bulk-edit-input"
                        value={row.rate ?? ""}
                        min="0"
                        step="0.01"
                        onChange={(e) =>
                          handleRowChange(index, "rate", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>

                    {/* VALIDATION */}
                    <td className="bulk-error-cell">
                      {row.errors?.length > 0 ? (
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

                    {/* ACTION */}
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
              <Upload size={30} />
              <strong>No Excel file selected</strong>
              <span>
                Upload an Excel file to preview Compound Monthly Rate records.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="sales-bulk-footer">
        <button
          type="button"
          className="bulk-cancel-btn"
          onClick={() => navigate("/monthly-master/compound")}
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
          {loading ? "Uploading..." : "Save Monthly Rates"}
        </button>
      </div>
    </div>
  );
};

export default CompoundBulkUpload;
