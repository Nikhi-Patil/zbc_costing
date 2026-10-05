import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import "../../assets/css/MoldingBulk.css";
import API_BASE_URL from "../../config/api";
import { generateFinancialYears } from "../../utils/costingUtils";

const MOLDING_API = `${API_BASE_URL}/molding`;

const financialYearOptions = generateFinancialYears();

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

/* EXCEL COLUMNS */
const EXCEL_HEADERS = [
  "Effective Date",
  "Financial Year",
  "Month",
  "Customer",
  "Production Unit",
  "Billing Unit",
  "Sub Department",
  "Sub Category",
  "Part No",
  "Production IM Code",
  "Gross Weight",
  "Net Weight",
  "Process Type",
  "Machine Tonnage",
  "Total Cavity",
  "Running Cavity",
  "Cycle Time",
  "Shift Time Efficiency",
  "Platten Size",
  "Tool Size",
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
  "Assembly Per Cost",
  "ICC %",
  "Rejection %",
  "OH %",
  "Profit %",
  "Packaging %",
  "Transport %",
  "Buying Type",
  "Buying Cost",
];

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

  const fullIndex = MONTHS.map(normalize).indexOf(normalized);

  if (fullIndex >= 0) {
    return fullIndex + 1;
  }

  const shortIndex = MONTHS.map((month) =>
    normalize(month.slice(0, 3)),
  ).indexOf(normalized);

  if (shortIndex >= 0) {
    return shortIndex + 1;
  }

  return null;
};

const monthName = (month) => MONTHS[Number(month) - 1] || "-";

const parseDate = (value) => {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = value.getFullYear();

    return `${year}-${month}-${day}`;
  }

  const text = String(value).trim();

  /*
   * Excel may contain:
   * DD-MM-YYYY
   * DD/MM/YYYY
   * YYYY-MM-DD
   */

  const match = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

  if (match) {
    const day = String(match[1]).padStart(2, "0");
    const month = String(match[2]).padStart(2, "0");
    const year = match[3];

    return `${year}-${month}-${day}`;
  }

  return text;
};

const createEmptyRow = (excelRow) => ({
  id: `${Date.now()}-${excelRow}-${Math.random()}`,

  excelRow,

  effectiveDate: "",
  financialYear: defaultFinancialYear,
  startMonth: null,

  customer: "",
  productionUnit: "",
  billingUnit: "",
  subDepartment: "",
  subCategory: "",

  partNo: "",
  productionImCode: "",

  grossWeight: null,
  netWeight: null,

  processType: "",
  machineTonnage: "",
  totalCavity: null,
  runningCavity: null,
  cycleTime: null,
  shiftTimeEfficiency: null,

  plattenSize: "",
  toolSize: "",

  postCuring: null,
  finishing: null,
  inspection: null,
  shotBlasting: null,
  vapourDegreasing: null,
  chromating: null,
  phospating: null,
  adhesive: null,
  painting: null,
  cylindricalGrinding: null,

  assemblyPerCost: null,

  icc: 1,
  rejection: 3,
  oh: 10,
  profit: 10,
  packaging: 2,
  transport: 2,

  buyingType: "",
  buyingCost: null,

  errors: [],
});

const validateRows = (rows) => {
  return rows.map((row) => {
    const errors = [];

    if (!String(row.effectiveDate || "").trim()) {
      errors.push("Effective Date is required.");
    }

    if (!String(row.financialYear || "").trim()) {
      errors.push("Financial Year is required.");
    }

    if (
      !Number.isInteger(Number(row.startMonth)) ||
      Number(row.startMonth) < 1 ||
      Number(row.startMonth) > 12
    ) {
      errors.push("Month is required.");
    }

    if (!String(row.customer || "").trim()) {
      errors.push("Customer is required.");
    }

    if (!String(row.productionUnit || "").trim()) {
      errors.push("Production Unit is required.");
    }

    if (!String(row.billingUnit || "").trim()) {
      errors.push("Billing Unit is required.");
    }

    if (!String(row.subDepartment || "").trim()) {
      errors.push("Sub Department is required.");
    }

    if (!String(row.subCategory || "").trim()) {
      errors.push("Sub Category is required.");
    }

    if (!String(row.partNo || "").trim()) {
      errors.push("Part No is required.");
    }

    if (!String(row.productionImCode || "").trim()) {
      errors.push("Production IM Code is required.");
    }

    if (
      row.grossWeight === null ||
      !Number.isFinite(Number(row.grossWeight)) ||
      Number(row.grossWeight) <= 0
    ) {
      errors.push("Gross Weight must be greater than 0.");
    }

    if (
      row.netWeight === null ||
      !Number.isFinite(Number(row.netWeight)) ||
      Number(row.netWeight) <= 0
    ) {
      errors.push("Net Weight must be greater than 0.");
    }

    if (
      Number(row.grossWeight) > 0 &&
      Number(row.netWeight) > 0 &&
      Number(row.grossWeight) < Number(row.netWeight)
    ) {
      errors.push("Gross Weight cannot be less than Net Weight.");
    }

    if (!String(row.processType || "").trim()) {
      errors.push("Process Type is required.");
    }

    if (!String(row.machineTonnage || "").trim()) {
      errors.push("Machine Tonnage is required.");
    }

    if (
      row.totalCavity === null ||
      !Number.isFinite(Number(row.totalCavity)) ||
      Number(row.totalCavity) <= 0
    ) {
      errors.push("Total Cavity must be greater than 0.");
    }

    if (
      row.runningCavity === null ||
      !Number.isFinite(Number(row.runningCavity)) ||
      Number(row.runningCavity) <= 0
    ) {
      errors.push("Running Cavity must be greater than 0.");
    }

    if (Number(row.runningCavity) > Number(row.totalCavity)) {
      errors.push("Running Cavity cannot be greater than Total Cavity.");
    }

    if (
      row.cycleTime === null ||
      !Number.isFinite(Number(row.cycleTime)) ||
      Number(row.cycleTime) <= 0
    ) {
      errors.push("Cycle Time must be greater than 0.");
    }

    if (
      row.shiftTimeEfficiency === null ||
      !Number.isFinite(Number(row.shiftTimeEfficiency)) ||
      Number(row.shiftTimeEfficiency) <= 0
    ) {
      errors.push("Shift Time Efficiency must be greater than 0.");
    }

    const percentageFields = [
      ["ICC %", row.icc],
      ["Rejection %", row.rejection],
      ["OH %", row.oh],
      ["Profit %", row.profit],
      ["Packaging %", row.packaging],
      ["Transport %", row.transport],
    ];

    percentageFields.forEach(([label, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        (!Number.isFinite(Number(value)) || Number(value) < 0)
      ) {
        errors.push(`${label} must be a valid non-negative number.`);
      }
    });

    if (
      row.buyingCost !== null &&
      row.buyingCost !== undefined &&
      row.buyingCost !== "" &&
      (!Number.isFinite(Number(row.buyingCost)) || Number(row.buyingCost) < 0)
    ) {
      errors.push("Buying Cost must be a valid non-negative number.");
    }

    return {
      ...row,
      errors,
    };
  });
};

const MoldingBulk = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculatedRows, setCalculatedRows] = useState([]);
  const [calculationDone, setCalculationDone] = useState(false);
  const [calculationLoading, setCalculationLoading] = useState(false);

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
    }, 4500);
  };

  /* DOWNLOAD TEMPLATE */
  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS]);

    worksheet["!cols"] = EXCEL_HEADERS.map((header) => {
      let width = 18;

      if (
        [
          "Customer",
          "Production Unit",
          "Billing Unit",
          "Sub Department",
          "Sub Category",
          "Part No",
          "Production IM Code",
          "Process Type",
          "Machine Tonnage",
          "Platten Size",
          "Tool Size",
        ].includes(header)
      ) {
        width = 22;
      }

      if (header === "Effective Date") {
        width = 16;
      }

      if (header === "Financial Year") {
        width = 16;
      }

      if (header === "Month") {
        width = 15;
      }

      return { wch: width };
    });

    worksheet["!autofilter"] = {
      ref: `A1:${XLSX.utils.encode_col(EXCEL_HEADERS.length - 1)}1`,
    };

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Molding Bulk");

    XLSX.writeFile(
      workbook,
      `Molding_Bulk_Template_${defaultFinancialYear}.xlsx`,
    );
  };

  /* READ EXCEL */
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

      const data = new Uint8Array(await file.arrayBuffer());

      const workbook = XLSX.read(data, {
        type: "array",
        cellDates: true,
      });

      if (!workbook.SheetNames.length) {
        throw new Error("No worksheet found in the Excel file.");
      }

      const sheetName = workbook.SheetNames.includes("Molding Bulk")
        ? "Molding Bulk"
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

      /* HEADER VALIDATION */
      const actualHeaders = sheetRows[0].map(normalizeHeader);
      const missingHeaders = EXCEL_HEADERS.filter(
        (header) => !actualHeaders.includes(normalizeHeader(header)),
      );
      if (missingHeaders.length > 0) {
        throw new Error(
          `Invalid Molding template. Missing columns: ${missingHeaders.join(
            ", ",
          )}`,
        );
      }

      /* HEADER INDEX */
      const headerIndex = new Map();
      sheetRows[0].forEach((header, index) => {
        headerIndex.set(normalizeHeader(header), index);
      });

      const getCell = (excelRow, header) => {
        const index = headerIndex.get(normalizeHeader(header));
        return index === undefined ? "" : (excelRow[index] ?? "");
      };

      /* CONVERT ROWS */
      const convertedRows = sheetRows
        .slice(1)
        .map((excelRow, index) => {
          const row = createEmptyRow(index + 2);
          row.effectiveDate = parseDate(getCell(excelRow, "Effective Date"));
          row.financialYear = String(
            getCell(excelRow, "Financial Year") || defaultFinancialYear,
          ).trim();
          row.startMonth = parseMonth(getCell(excelRow, "Month"));
          row.customer = String(getCell(excelRow, "Customer")).trim();
          row.productionUnit = String(
            getCell(excelRow, "Production Unit"),
          ).trim();
          row.billingUnit = String(getCell(excelRow, "Billing Unit")).trim();
          row.subDepartment = String(
            getCell(excelRow, "Sub Department"),
          ).trim();
          row.subCategory = String(getCell(excelRow, "Sub Category")).trim();
          row.partNo = String(getCell(excelRow, "Part No")).trim();
          row.productionImCode = String(
            getCell(excelRow, "Production IM Code"),
          ).trim();
          row.grossWeight = parseNumber(getCell(excelRow, "Gross Weight"));
          row.netWeight = parseNumber(getCell(excelRow, "Net Weight"));
          row.processType = String(getCell(excelRow, "Process Type")).trim();
          row.machineTonnage = String(
            getCell(excelRow, "Machine Tonnage"),
          ).trim();
          row.totalCavity = parseNumber(getCell(excelRow, "Total Cavity"));
          row.runningCavity = parseNumber(getCell(excelRow, "Running Cavity"));
          row.cycleTime = parseNumber(getCell(excelRow, "Cycle Time"));
          row.shiftTimeEfficiency = parseNumber(
            getCell(excelRow, "Shift Time Efficiency"),
          );
          row.plattenSize = String(getCell(excelRow, "Platten Size")).trim();
          row.toolSize = String(getCell(excelRow, "Tool Size")).trim();
          row.postCuring = parseNumber(getCell(excelRow, "Post Curing"));
          row.finishing = parseNumber(getCell(excelRow, "Finishing"));
          row.inspection = parseNumber(getCell(excelRow, "Inspection"));
          row.shotBlasting = parseNumber(getCell(excelRow, "Shot Blasting"));
          row.vapourDegreasing = parseNumber(
            getCell(excelRow, "Vapour Degreasing"),
          );
          row.chromating = parseNumber(getCell(excelRow, "Chromating"));
          row.phospating = parseNumber(getCell(excelRow, "Phospating"));
          row.adhesive = parseNumber(getCell(excelRow, "Adhesive"));
          row.painting = parseNumber(getCell(excelRow, "Painting"));
          row.cylindricalGrinding = parseNumber(
            getCell(excelRow, "Cylindrical Grinding"),
          );
          row.assemblyPerCost = parseNumber(
            getCell(excelRow, "Assembly Per Cost"),
          );

          const icc = parseNumber(getCell(excelRow, "ICC %"));
          const rejection = parseNumber(getCell(excelRow, "Rejection %"));
          const oh = parseNumber(getCell(excelRow, "OH %"));
          const profit = parseNumber(getCell(excelRow, "Profit %"));
          const packaging = parseNumber(getCell(excelRow, "Packaging %"));
          const transport = parseNumber(getCell(excelRow, "Transport %"));

          row.icc = icc === null ? 1 : icc;
          row.rejection = rejection === null ? 3 : rejection;
          row.oh = oh === null ? 10 : oh;
          row.profit = profit === null ? 10 : profit;
          row.packaging = packaging === null ? 2 : packaging;
          row.transport = transport === null ? 2 : transport;
          row.buyingType = String(getCell(excelRow, "Buying Type")).trim();
          row.buyingCost = parseNumber(getCell(excelRow, "Buying Cost"));
          return row;
        })
        .filter((row) => {
          return EXCEL_HEADERS.some((header) => {
            const fieldMap = {
              "Effective Date": row.effectiveDate,
              "Financial Year": row.financialYear,
              Month: row.startMonth,
              Customer: row.customer,
              "Production Unit": row.productionUnit,
              "Billing Unit": row.billingUnit,
              "Sub Department": row.subDepartment,
              "Sub Category": row.subCategory,
              "Part No": row.partNo,
              "Production IM Code": row.productionImCode,
              "Gross Weight": row.grossWeight,
              "Net Weight": row.netWeight,
              "Process Type": row.processType,
              "Machine Tonnage": row.machineTonnage,
            };

            const value = fieldMap[header];

            return value !== undefined && value !== null && value !== "";
          });
        });

      if (!convertedRows.length) {
        throw new Error("No data rows found in the Excel file.");
      }

      /* VALIDATE */

      setRows(
        convertedRows.map((row) => ({
          ...row,
          errors: [],
        })),
      );

      setCalculatedRows([]);
      setCalculationDone(false);

      showToast(
        `${convertedRows.length} row(s) loaded. Click "Calculate & Validate" to continue.`,
        "success",
      );
    } catch (error) {
      console.error("Molding bulk Excel processing error:", error);

      setRows([]);
      setFileName("");

      showToast(error.message || "Unable to process the Excel file.", "error");
    } finally {
      setLoading(false);

      event.target.value = "";
    }
  };

  /* EDIT ROW */
  const handleRowChange = (index, field, value) => {
    setCalculationDone(false);
    setCalculatedRows([]);
    let finalValue = value;

    const numericFields = [
      "grossWeight",
      "netWeight",
      "totalCavity",
      "runningCavity",
      "cycleTime",
      "shiftTimeEfficiency",
      "postCuring",
      "finishing",
      "inspection",
      "shotBlasting",
      "vapourDegreasing",
      "chromating",
      "phospating",
      "adhesive",
      "painting",
      "cylindricalGrinding",
      "assemblyPerCost",
      "icc",
      "rejection",
      "oh",
      "profit",
      "packaging",
      "transport",
      "buyingCost",
    ];

    if (numericFields.includes(field)) {
      finalValue = value === "" ? null : parseNumber(value);
    }

    if (field === "startMonth") {
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

  /* VALIDATED ROWS */
  const validatedRows = useMemo(() => {
    if (!calculationDone) {
      return rows.map((row) => ({
        ...row,
        errors: [],
      }));
    }

    /*
     * IMPORTANT:
     * After Calculate & Validate, the backend errors stored in `rows`
     * must be preserved. Do NOT call validateRows(rows) here because
     * that would replace the backend calculation/validation errors with
     * only the frontend field validation errors.
     */
    return rows.map((row) => ({
      ...row,
      errors: Array.isArray(row.errors) ? row.errors : [],
    }));
  }, [rows, calculationDone]);

  const validRows = useMemo(
    () =>
      calculationDone
        ? validatedRows.filter((row) => row.errors.length === 0)
        : [],
    [validatedRows, calculationDone],
  );

  const invalidRows = useMemo(
    () =>
      calculationDone
        ? validatedRows.filter((row) => row.errors.length > 0)
        : [],
    [validatedRows, calculationDone],
  );
  // Calculate & Validate function
  const handleCalculateAndValidate = async () => {
    if (!rows.length) {
      showToast("Please upload an Excel file first.", "error");
      return;
    }

    try {
      setCalculationLoading(true);

      setCalculatedRows([]);
      setCalculationDone(false);

      const entries = rows.map((row) => ({
        excelRow: row.excelRow,

        effectiveDate: row.effectiveDate,
        financialYear: row.financialYear,
        startMonth: row.startMonth,

        customer: row.customer,
        productionUnit: row.productionUnit,
        billingUnit: row.billingUnit,
        subDepartment: row.subDepartment,
        subCategory: row.subCategory,

        partNo: row.partNo,
        productionImCode: row.productionImCode,

        grossWeight: row.grossWeight,
        netWeight: row.netWeight,

        processType: row.processType,
        machineTonnage: row.machineTonnage,

        totalCavity: row.totalCavity,
        runningCavity: row.runningCavity,
        cycleTime: row.cycleTime,
        shiftTimeEfficiency: row.shiftTimeEfficiency,

        plattenSize: row.plattenSize,
        toolSize: row.toolSize,

        postCuring: row.postCuring ?? 0,
        finishing: row.finishing ?? 0,
        inspection: row.inspection ?? 0,
        shotBlasting: row.shotBlasting ?? 0,
        vapourDegreasing: row.vapourDegreasing ?? 0,
        chromating: row.chromating ?? 0,
        phospating: row.phospating ?? 0,
        adhesive: row.adhesive ?? 0,
        painting: row.painting ?? 0,
        cylindricalGrinding: row.cylindricalGrinding ?? 0,

        assemblyPerCost: row.assemblyPerCost ?? 0,

        icc: row.icc,
        rejection: row.rejection,
        oh: row.oh,
        profit: row.profit,
        packaging: row.packaging,
        transport: row.transport,

        buyingType: row.buyingType,
        buyingCost: row.buyingCost ?? 0,
      }));

      const response = await fetch(`${MOLDING_API}/bulk/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entries,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Molding calculation failed.");
      }

      const backendErrors = Array.isArray(result?.errors) ? result.errors : [];

      const errorMap = new Map();

      backendErrors.forEach((error) => {
        // Backend may return row, excelRow, or excel_row.
        const rowNumber = Number(
          error?.row ?? error?.excelRow ?? error?.excel_row,
        );

        if (!Number.isFinite(rowNumber)) {
          return;
        }

        if (!errorMap.has(rowNumber)) {
          errorMap.set(rowNumber, []);
        }

        errorMap
          .get(rowNumber)
          .push(error?.message || error?.error || "Validation error");
      });

      const rowsWithErrors = rows.map((row) => ({
        ...row,
        errors: errorMap.get(Number(row.excelRow)) || [],
      }));

      setRows(rowsWithErrors);

      setCalculatedRows(Array.isArray(result?.rows) ? result.rows : []);

      setCalculationDone(true);

      const totalErrors = backendErrors.length;

      if (totalErrors > 0) {
        showToast(
          `${totalErrors} validation error(s) found. Please fix them and calculate again.`,
          "error",
        );
      } else {
        showToast(
          `${rows.length} row(s) calculated and validated successfully.`,
          "success",
        );
      }
    } catch (error) {
      console.error("Molding bulk calculate error:", error);

      setCalculatedRows([]);
      setCalculationDone(false);

      showToast(
        error.message || "Unable to calculate Molding bulk data.",
        "error",
      );
    } finally {
      setCalculationLoading(false);
    }
  };

  /* SAVE */
  const handleSave = async () => {
    if (!rows.length) {
      showToast("Please upload an Excel file first.", "error");
      return;
    }

    if (invalidRows.length > 0) {
      showToast(
        `Please fix ${invalidRows.length} invalid row(s) before saving.`,
        "error",
      );
      return;
    }

    const entries = validRows.map((row) => ({
      excelRow: row.excelRow,
      effectiveDate: row.effectiveDate,
      financialYear: row.financialYear || defaultFinancialYear,
      startMonth: row.startMonth,
      customer: row.customer,
      productionUnit: row.productionUnit,
      billingUnit: row.billingUnit,
      subDepartment: row.subDepartment,
      subCategory: row.subCategory,
      partNo: row.partNo,
      productionImCode: row.productionImCode,
      grossWeight: row.grossWeight,
      netWeight: row.netWeight,
      processType: row.processType,
      machineTonnage: row.machineTonnage,
      totalCavity: row.totalCavity,
      runningCavity: row.runningCavity,
      cycleTime: row.cycleTime,
      shiftTimeEfficiency: row.shiftTimeEfficiency,
      plattenSize: row.plattenSize,
      toolSize: row.toolSize,
      postCuring: row.postCuring ?? 0,
      finishing: row.finishing ?? 0,
      inspection: row.inspection ?? 0,
      shotBlasting: row.shotBlasting ?? 0,
      vapourDegreasing: row.vapourDegreasing ?? 0,
      chromating: row.chromating ?? 0,
      phospating: row.phospating ?? 0,
      adhesive: row.adhesive ?? 0,
      painting: row.painting ?? 0,
      cylindricalGrinding: row.cylindricalGrinding ?? 0,
      assemblyPerCost: row.assemblyPerCost ?? 0,
      icc: row.icc,
      rejection: row.rejection,
      oh: row.oh,
      profit: row.profit,
      packaging: row.packaging,
      transport: row.transport,
      buyingType: row.buyingType,
      buyingCost: row.buyingCost ?? 0,
    }));

    try {
      setLoading(true);

      const response = await fetch(`${MOLDING_API}/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          financialYear: defaultFinancialYear,
          entries,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (Array.isArray(result?.errors)) {
          const message = result.errors
            .slice(0, 15)
            .map((item) => `Excel Row ${item.row}: ${item.message}`)
            .join("\n");

          throw new Error(
            message || result.message || "Bulk Molding save failed.",
          );
        }

        throw new Error(result?.message || "Bulk Molding save failed.");
      }

      showToast(
        result?.message ||
          `${entries.length} molding records saved successfully.`,
        "success",
      );

      window.setTimeout(() => navigate("/molding"), 1200);
    } catch (error) {
      console.error("Molding bulk save error:", error);

      showToast(
        error.message || "Unable to save Molding bulk entries.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  ========================================================
  CLEAR
  ========================================================
  */
  const handleClear = () => {
    setRows([]);
    setFileName("");
    setCalculatedRows([]);
    setCalculationDone(false);
  };

  const handleRemoveRow = (index) => {
    setCalculationDone(false);
    setCalculatedRows([]);

    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  /*
  ========================================================
  RENDER
  ========================================================
  */

  return (
    <div className="molding-bulk-page">
      {toast.show && (
        <div className={`molding-bulk-toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </span>

          <span
            style={{
              whiteSpace: "pre-line",
            }}
          >
            {toast.message}
          </span>

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
            ×
          </button>
        </div>
      )}

      {/* HEADER */}

      <div className="molding-bulk-header">
        <div>
          <h2>Bulk Molding Costing Entry</h2>
        </div>

        <button
          type="button"
          className="bulk-back-btn"
          onClick={() => navigate("/molding")}
        >
          ← Back
        </button>
      </div>

      {/* CONTROLS */}

      <div className="molding-bulk-control-card">
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
              disabled={loading}
            />
          </label>

          {fileName && <span className="selected-file">{fileName}</span>}
        </div>
      </div>

      {/* MONTH LOGIC INFO */}

      <div className="sales-bulk-info">
        <strong>Important:</strong>

        <span>
          Month controls the Molding Month, Compound Month, all BOP monthly
          rates, Sales Monthly Qty and Customer Sell Rate.
        </span>
      </div>

      {/* SUMMARY */}

      {rows.length > 0 && (
        <div className="molding-bulk-summary">
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
            <span>Molding Records</span>

            <strong>{validRows.length}</strong>
          </div>
        </div>
      )}

      {/* PREVIEW */}

      <div className="molding-bulk-table-card">
        <div className="molding-bulk-table-header">
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

        <div className="molding-bulk-table-scroll">
          {rows.length > 0 ? (
            <table className="molding-bulk-table">
              <thead>
                <tr>
                  <th className="bulk-sr">#</th>

                  <th>Part No</th>

                  <th>Customer</th>

                  <th>Production Unit</th>

                  <th>Billing Unit</th>

                  <th>Sub Department</th>

                  <th>Sub Category</th>

                  <th>FY</th>

                  <th>Month</th>

                  <th>Gross Wt.</th>

                  <th>Net Wt.</th>

                  <th>Process</th>

                  <th>Machine</th>

                  <th>Running Cavity</th>

                  <th>Cycle Time</th>

                  <th>Efficiency</th>

                  <th>Assembly Cost</th>

                  <th>Buying Cost</th>

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
                        value={row.customer}
                        onChange={(e) =>
                          handleRowChange(index, "customer", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.productionUnit}
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

                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.billingUnit}
                        onChange={(e) =>
                          handleRowChange(index, "billingUnit", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.subDepartment}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            "subDepartment",
                            e.target.value,
                          )
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.subCategory}
                        onChange={(e) =>
                          handleRowChange(index, "subCategory", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input"
                        value={row.financialYear}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            "financialYear",
                            e.target.value,
                          )
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <select
                        className="bulk-month-select"
                        value={row.startMonth || ""}
                        onChange={(e) =>
                          handleRowChange(index, "startMonth", e.target.value)
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
                        value={row.grossWeight ?? ""}
                        min="0"
                        step="0.001"
                        onChange={(e) =>
                          handleRowChange(index, "grossWeight", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        className="bulk-edit-input"
                        value={row.netWeight ?? ""}
                        min="0"
                        step="0.001"
                        onChange={(e) =>
                          handleRowChange(index, "netWeight", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.processType}
                        onChange={(e) =>
                          handleRowChange(index, "processType", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        className="bulk-edit-input bulk-text-input"
                        value={row.machineTonnage}
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            "machineTonnage",
                            e.target.value,
                          )
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        className="bulk-edit-input"
                        value={row.runningCavity ?? ""}
                        min="0"
                        step="1"
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            "runningCavity",
                            e.target.value,
                          )
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        className="bulk-edit-input"
                        value={row.cycleTime ?? ""}
                        min="0"
                        step="0.01"
                        onChange={(e) =>
                          handleRowChange(index, "cycleTime", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        className="bulk-edit-input"
                        value={row.shiftTimeEfficiency ?? ""}
                        min="0"
                        step="0.01"
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            "shiftTimeEfficiency",
                            e.target.value,
                          )
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        className="bulk-edit-input"
                        value={row.assemblyPerCost ?? ""}
                        min="0"
                        step="0.01"
                        onChange={(e) =>
                          handleRowChange(
                            index,
                            "assemblyPerCost",
                            e.target.value,
                          )
                        }
                        disabled={loading}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        className="bulk-edit-input"
                        value={row.buyingCost ?? ""}
                        min="0"
                        step="0.01"
                        onChange={(e) =>
                          handleRowChange(index, "buyingCost", e.target.value)
                        }
                        disabled={loading}
                      />
                    </td>

                    <td className="bulk-error-cell">
                      {!calculationDone ? (
                        <span className="validation-pending">
                          Not Calculated
                        </span>
                      ) : row.errors.length > 0 ? (
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
            </div>
          )}
        </div>
      </div>
      {calculationDone && (
        <div className="molding-calculated-card">
          <div className="molding-calculated-header">
            <div>
              <h3>Calculated Molding Costing</h3>
            </div>

            <span
              className={
                invalidRows.length > 0
                  ? "calculation-status error"
                  : "calculation-status success"
              }
            >
              {invalidRows.length > 0
                ? `${invalidRows.length} Row(s) Need Attention`
                : "✓ Calculation Complete"}
            </span>
          </div>

          <div className="molding-calculated-scroll">
            <table className="molding-calculated-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Part No</th>
                  <th>Compound Rate</th>
                  <th>Total RM Cost</th>
                  <th>Total BOP Cost</th>
                  <th>Process Cost A</th>
                  <th>Process Cost B</th>
                  <th>Conversion Cost</th>
                  <th>Subtotal A</th>
                  <th>Subtotal B</th>
                  <th>Part Cost</th>
                  <th>Sales Cost</th>
                  <th>Monthly Qty</th>
                  <th>Sales P/L</th>
                  <th>Monthly P/L</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((inputRow) => {
                  const row = calculatedRows.find(
                    (calculatedRow) =>
                      Number(calculatedRow.excelRow) ===
                      Number(inputRow.excelRow),
                  );

                  const rowHasError = inputRow.errors?.length > 0;

                  return (
                    <tr
                      key={`${inputRow.excelRow}-${inputRow.id}`}
                      className={rowHasError ? "calculated-invalid-row" : ""}
                    >
                      <td>{inputRow.excelRow}</td>

                      <td>{row?.partNo ?? inputRow.partNo}</td>

                      <td>
                        {row
                          ? Number(row.compoundRate || 0).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "-"}
                      </td>

                      <td>
                        {row
                          ? Number(row.totalRmCost || 0).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "-"}
                      </td>

                      <td>
                        {row
                          ? Number(row.totalBopCost || 0).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "-"}
                      </td>

                      <td>
                        {row
                          ? Number(row.processCostA || 0).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "-"}
                      </td>

                      <td>
                        {row
                          ? Number(row.processCostB || 0).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "-"}
                      </td>

                      <td>
                        {row
                          ? Number(row.conversionCost || 0).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "-"}
                      </td>

                      <td>
                        {row
                          ? Number(row.subtotalA || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </td>

                      <td>
                        {row
                          ? Number(row.subtotalB || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </td>

                      <td className="calculated-part-cost">
                        {row
                          ? Number(row.partCost || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </td>

                      <td className="calculated-sales-cost">
                        {row
                          ? Number(row.customerSalesCost || 0).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "-"}
                      </td>

                      <td>
                        {row
                          ? Number(row.monthlyQuantity || 0).toLocaleString(
                              "en-IN",
                            )
                          : "-"}
                      </td>

                      <td
                        className={
                          row
                            ? Number(row.salesProfitLoss || 0) >= 0
                              ? "calculated-profit"
                              : "calculated-loss"
                            : ""
                        }
                      >
                        {row
                          ? Number(row.salesProfitLoss || 0).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "-"}
                      </td>

                      <td
                        className={
                          row
                            ? Number(row.monthlyProfitLoss || 0) >= 0
                              ? "calculated-profit"
                              : "calculated-loss"
                            : ""
                        }
                      >
                        {row
                          ? Number(row.monthlyProfitLoss || 0).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOOTER */}

      <div className="molding-bulk-footer">
        <button
          type="button"
          className="bulk-cancel-btn"
          onClick={() => navigate("/molding")}
          disabled={loading}
        >
          Cancel
        </button>

        <div className="bulk-footer-actions">
          <button
            type="button"
            className="bulk-calculate-btn"
            onClick={handleCalculateAndValidate}
            disabled={loading || calculationLoading || rows.length === 0}
          >
            {calculationLoading ? "Calculating..." : "Calculate & Validate"}
          </button>

          <button
            type="button"
            className="bulk-save-btn"
            onClick={handleSave}
            disabled={
              loading ||
              calculationLoading ||
              !calculationDone ||
              rows.length === 0 ||
              invalidRows.length > 0 ||
              calculatedRows.length !== rows.length
            }
          >
            {loading
              ? "Saving..."
              : calculationDone
                ? `Save ${validRows.length} Records`
                : "Save Records"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoldingBulk;
