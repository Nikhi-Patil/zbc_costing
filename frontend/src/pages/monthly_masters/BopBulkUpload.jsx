import React, { useState } from "react";
import * as XLSX from "xlsx";
import API_BASE_URL from "../../config/api";

const BopBulkUpload = ({ onClose, onSaved }) => {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  // Download Excel Template
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
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BOP Monthly Rate");
    XLSX.writeFile(workbook, "BOP_Monthly_Rate_Template.xlsx");
  };
  // Excel File Selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError("");
    setRows([]);
    setFile(null);
    if (!selectedFile) {
      return;
    }
    const extension = selectedFile.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(extension)) {
      setError("Please select an Excel file (.xlsx or .xls)");
      return;
    }
    setFile(selectedFile);
    readExcelFile(selectedFile);
  };
  // Read Excel
  const readExcelFile = (selectedFile) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, {
          type: "array",
        });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const excelRows = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
        });
        if (!excelRows.length) {
          setError("Excel file is empty.");
          return;
        }
        // Normalize Excel column names
        const normalizedRows = excelRows.map((row) => {
          const normalizedRow = {};
          Object.entries(row).forEach(([key, value]) => {
            const normalizedKey = String(key)
              .trim()
              .toLowerCase()
              .replace(/\s+/g, " ");
            normalizedRow[normalizedKey] = value;
          });
          return normalizedRow;
        });
        // Check required columns
        const firstRow = normalizedRows[0];
        const requiredColumns = [
          "bop erp code",
          "supplier name",
          "financial year",
          "month",
          "qty",
          "rate",
        ];
        const missingColumns = requiredColumns.filter(
          (column) => !Object.prototype.hasOwnProperty.call(firstRow, column),
        );
        if (missingColumns.length > 0) {
          setError(`Missing Excel columns: ${missingColumns.join(", ")}`);
          return;
        }
        // Prepare rows
        const preparedRows = normalizedRows.map((row, index) => {
          const excelRowNumber = index + 2;
          const preparedRow = {
            rowNumber: excelRowNumber,
            bopErpCode: String(row["bop erp code"] || "").trim(),
            supplierName: String(row["supplier name"] || "").trim(),
            financialYear: String(row["financial year"] || "").trim(),
            month: row["month"],
            qty: row["qty"],
            rate: row["rate"],
            errors: [],
          };
          // Validation
          if (!preparedRow.bopErpCode) {
            preparedRow.errors.push("BOP ERP Code is required");
          }
          if (!preparedRow.supplierName) {
            preparedRow.errors.push("Supplier Name is required");
          }
          if (!preparedRow.financialYear) {
            preparedRow.errors.push("Financial Year is required");
          }
          const month = Number(preparedRow.month);
          if (!preparedRow.month || month < 1 || month > 12) {
            preparedRow.errors.push("Month must be between 1 and 12");
          }
          if (
            preparedRow.qty === "" ||
            preparedRow.qty === null ||
            preparedRow.qty === undefined ||
            isNaN(Number(preparedRow.qty))
          ) {
            preparedRow.errors.push("Qty must be a number");
          }
          if (
            preparedRow.rate === "" ||
            preparedRow.rate === null ||
            preparedRow.rate === undefined ||
            isNaN(Number(preparedRow.rate))
          ) {
            preparedRow.errors.push("Rate must be a number");
          }
          return preparedRow;
        });
        setRows(preparedRows);
      } catch (error) {
        console.error("Excel read error:", error);
        setError("Unable to read the Excel file.");
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };
  // Upload
  const handleUpload = async () => {
    setError("");
    if (!file) {
      setError("Please select an Excel file.");
      return;
    }
    if (!rows.length) {
      setError("No valid rows found in Excel file.");
      return;
    }
    // Validate rows
    const invalidRows = rows.filter(
      (row) => row.errors && row.errors.length > 0,
    );
    if (invalidRows.length > 0) {
      setError(
        `Please fix ${invalidRows.length} invalid row(s) before uploading.`,
      );
      return;
    }
    // Validate Supplier Name
    const missingSupplier = rows.find(
      (row) => !row.supplierName || !String(row.supplierName).trim(),
    );
    if (missingSupplier) {
      setError(
        `Excel row ${missingSupplier.rowNumber}: Supplier Name is required`,
      );
      return;
    }
    try {
      setLoading(true);
      setUploadProgress(0);
      // Prepare data for backend
      const uploadData = rows.map((row) => ({
        bopErpCode: String(row.bopErpCode).trim(),
        supplierName: String(row.supplierName).trim(),
        financial_year: String(row.financialYear).trim(),
        month: Number(row.month),
        qty: Number(row.qty),
        rate: Number(row.rate),
      }));
      // API request
      const response = await fetch(
        `${API_BASE_URL}/monthly-bop-rate/bulk`,
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
        throw new Error(result.message || "Bulk upload failed");
      }
      setUploadProgress(100);
      alert(
        `Successfully uploaded ${
          result.insertedCount || rows.length
        } record(s).`,
      );
      onSaved?.();
      onClose?.();
    } catch (error) {
      console.error("Bulk upload error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  // Remove Selected File
  const handleRemoveFile = () => {
    setFile(null);
    setRows([]);
    setError("");
    setUploadProgress(0);
    const fileInput = document.getElementById("bopExcelFile");
    if (fileInput) {
      fileInput.value = "";
    }
  };
  const invalidCount = rows.filter((row) => row.errors.length > 0).length;
  return (
    <div className="card mt-4">
      {/* Header */}
      <div className="bop-monthly-header">
        <h5 className="mb-0">
          <b>BOP Monthly Rate - Bulk Upload</b>
        </h5>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={onClose}
          title="Close"
          disabled={loading}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="card-body">
        {/* Instructions */}
        <div className="alert alert-info">
          <b>Excel Format</b>
          <p className="mb-0 mt-2">Month should be a number from 1 to 12.</p>
        </div>
        {/* Template */}
        <div className="mb-3">
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={downloadTemplate}
          >
            <i className="fas fa-file-excel me-2"></i>
            Download Excel Template
          </button>
        </div>
        {/* File Upload */}
        <div className="mb-3">
          <label htmlFor="bopExcelFile" className="form-label">
            <b>Select Excel File</b>
          </label>
          <input
            id="bopExcelFile"
            type="file"
            className="form-control"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>
        {/* Selected File */}
        {file && (
          <div className="alert alert-secondary d-flex justify-content-between align-items-center">
            <div>
              <i className="fas fa-file-excel me-2"></i>
              <b>{file.name}</b>
              <span className="ms-2">({rows.length} rows)</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={handleRemoveFile}
              disabled={loading}
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        )}
        {/* Error */}
        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
        {/* Preview */}
        {rows.length > 0 && (
          <div className="mt-4">
            <div className="d-flex justify-content-between mb-2">
              <h6>
                <b>Preview</b>
              </h6>
              <div>
                <span className="badge bg-success me-2">
                  Valid: {rows.length - invalidCount}
                </span>
                <span className="badge bg-danger">Invalid: {invalidCount}</span>
              </div>
            </div>
            <div
              className="table-responsive"
              style={{
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>BOP ERP Code</th>
                    <th>Supplier Name</th>
                    <th>Financial Year</th>
                    <th>Month</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.errors.length > 0 ? "table-danger" : ""}
                    >
                      <td>{row.rowNumber}</td>
                      <td>{row.bopErpCode}</td>
                      <td>{row.supplierName}</td>
                      <td>{row.financialYear}</td>
                      <td>{row.month}</td>
                      <td>{row.qty}</td>
                      <td>{row.rate}</td>
                      <td>
                        {row.errors.length > 0 ? (
                          <span
                            className="text-danger"
                            title={row.errors.join(", ")}
                          >
                            <i className="fas fa-times-circle me-1"></i>
                            {row.errors.join(", ")}
                          </span>
                        ) : (
                          <span className="text-success">
                            <i className="fas fa-check-circle me-1"></i>
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Progress */}
        {loading && (
          <div className="mt-3">
            <div className="progress">
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{
                  width: `${uploadProgress}%`,
                }}
              >
                {uploadProgress}%
              </div>
            </div>
          </div>
        )}
        {/* Buttons */}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={handleUpload}
            disabled={loading || !file || !rows.length || invalidCount > 0}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                Uploading...
              </>
            ) : (
              <>
                <i className="fas fa-upload me-2"></i>
                Upload {rows.length} Records
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BopBulkUpload;
