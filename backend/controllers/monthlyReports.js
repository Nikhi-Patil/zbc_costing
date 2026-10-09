import zbcDB from "../config/zbcDB.js";
import adminDB from "../config/adminDB.js";

//Get Compound Monthly Report
export const getCompoundMonthlyReport = async (req, res) => {
  try {
    const { financial_year } = req.query;
    const [rows] = await zbcDB.query(`
      SELECT
        compound_id,
        compound_code,
        polymer_name,
        im_code,
        unit_id,
        financial_year,
        month,
        qty,
        rate
      FROM compound_monthly_report
      WHERE financial_year = ?
      ORDER BY compound_code, month`,
      [financial_year]
    );
    res.json({ success: true, data: rows, });
  } catch (error) {
    console.error("Error fetching compound monthly report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch compound monthly report",
      error: error.message,
    });
  }
};

//Create Compound Monthly Rate
export const createCompoundMonthlyRate = async (req, res) => {
  try {
    const {
      compoundId,
      compoundCode,
      polymer,
      imCode,
      unitId,
      financial_year,
      month,
      qty,
      rate,
    } = req.body;
    if (!compoundId || !unitId || !financial_year || !month) {
      return res.status(400).json({
        success: false,
        message: "Compound, unit, financial_year and month are required",
      });
    }
    await zbcDB.query(`
      INSERT INTO compound_monthly_report (
        compound_id,
        compound_code,
        polymer_name,
        im_code,
        unit_id,
        financial_year,
        month,
        qty,
        rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        qty = VALUES(qty),
        rate = VALUES(rate),
        updated_at = CURRENT_TIMESTAMP `,
      [
        compoundId,
        compoundCode,
        polymer,
        imCode,
        unitId,
        financial_year,
        month,
        qty || 0,
        rate || 0,
      ]
    );
    res.status(201).json({
      success: true,
      message: "Compound monthly rate saved successfully",
    });
  } catch (error) {
    console.error(
      "Error saving compound monthly rate:", error
    );
    res.status(500).json({
      success: false,
      message: "Failed to save compound monthly rate",
      error: error.message,
    });
  }
};

//Get Bop Monthly Report
export const getBopMonthlyReport = async (req, res) => {
  try {
    const { financial_year } = req.query;
    if (!financial_year) {
      return res.status(400).json({
        success: false,
        message: "Year is required",
      });
    }

    // Get monthly BOP data
    const [rows] = await zbcDB.query(`
      SELECT
        bop_id,
        part_no,
        fg_code,
        bop_part_name,
        bop_part_no,
        bop_erp_code,
        supplier_id,
        financial_year,
        month,
        qty,
        rate
      FROM bop_monthly_report
      WHERE financial_year = ?
      ORDER BY bop_erp_code, supplier_id, month`,
      [financial_year]
    );

    // Get supplier IDs used in this report
    const supplierIds = [
      ...new Set(rows
        .map((row) => Number(row.supplier_id))
        .filter((id) => id > 0)
      ),
    ];
    let supplierMap = new Map();
    if (supplierIds.length > 0) {
      const placeholders = supplierIds
        .map(() => "?")
        .join(",");
      const [supplierRows] = await adminDB.query(`
        SELECT id,  supplier_name
        FROM supplier_master
        WHERE id IN (${placeholders})`,
        supplierIds
      );
      supplierMap = new Map(
        supplierRows.map((supplier) => [
          String(supplier.id),
          supplier.supplier_name,
        ])
      );
    }

    // Add supplier name to each monthly row
    const result = rows.map((row) => ({
      ...row, supplier_name: supplierMap.get(String(row.supplier_id)) || "-",
    }));
    res.json({ success: true, data: result, });
  } catch (error) {
    console.error(
      "Error fetching BOP monthly report:", error
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch BOP monthly report",
      error: error.message,
    });
  }
};

//Create Bop Monthly Rate
export const createBopMonthlyRate = async (req, res) => {
  try {
    const {
      bopId,
      partNo,
      fgCode,
      bopPartName,
      bopPartNo,
      bopErpCode,
      supplierId,
      financial_year,
      month,
      qty,
      rate,
    } = req.body;
    if (!bopId) {
      return res.status(400).json({
        success: false,
        message: "BOP is required",
      });
    }
    if (!supplierId || Number(supplierId) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Supplier is required",
      });
    }
    if (!financial_year) {
      return res.status(400).json({
        success: false,
        message: "Year is required",
      });
    }
    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month is required",
      });
    }
    await zbcDB.query(`
      INSERT INTO bop_monthly_report (
        bop_id,
        part_no,
        fg_code,
        bop_part_name,
        bop_part_no,
        bop_erp_code,
        supplier_id,
        financial_year,
        month,
        qty,
        rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  ?)
      ON DUPLICATE KEY UPDATE
        part_no = VALUES(part_no),
        fg_code = VALUES(fg_code),
        bop_part_name = VALUES(bop_part_name),
        bop_part_no = VALUES(bop_part_no),
        bop_erp_code = VALUES(bop_erp_code),
        qty = VALUES(qty),
        rate = VALUES(rate),
        updated_at = CURRENT_TIMESTAMP`,
      [
        bopId,
        partNo || null,
        fgCode || null,
        bopPartName || null,
        bopPartNo || null,
        bopErpCode || null,
        Number(supplierId),
        financial_year,
        Number(month),
        qty || 0,
        rate || 0,
      ]
    );
    res.status(201).json({
      success: true,
      message: "BOP monthly rate saved successfully",
    });
  } catch (error) {
    console.error(
      "Error saving BOP monthly rate:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to save BOP monthly rate",
      error: error.message,
    });
  }
};

//Get Compound Rate For Costing
export const getCompoundRateForCosting = async (req, res) => {
  try {
    const {
      compoundCode,
      polymerName,
      imCode,
      unitId,
      financial_year,
      month,
    } = req.query;
    if (
      !compoundCode ||
      !polymerName ||
      !imCode ||
      !unitId ||
      !financial_year ||
      !month
    ) {
      return res.status(400).json({
        success: false,
        message: "Compound Code, Polymer, IM Code, Production Unit, Year and Month are required",
      });
    }
    const [rows] = await zbcDB.query(`
      SELECT
        id,
        compound_id,
        compound_code,
        polymer_name,
        im_code,
        unit_id,
        financial_year,
        month,
        qty,
        rate
      FROM compound_monthly_report
      WHERE compound_code = ?
        AND polymer_name = ?
        AND im_code = ?
        AND unit_id = ?
        AND financial_year = ?
        AND month = ?
      LIMIT 1`,
      [
        compoundCode,
        polymerName,
        imCode,
        Number(unitId),
        String(financial_year),
        Number(month),
      ]
    );
    if (rows.length === 0) {
      return res.json({
        success: true,
        found: false,
        rate: null,
        data: null,
      });
    }
    res.json({
      success: true,
      found: true,
      rate: Number(rows[0].rate) || 0,
      data: rows[0],
    });
  } catch (error) {
    console.error(
      "Error fetching compound costing rate:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch compound rate",
      error: error.message,
    });
  }
};

//Get Bop Rate For Costing
export const getBopRateForCosting = async (req, res) => {
  try {
    const {
      bopId,
      bopErpCode,
      supplierId,
      financial_year,
      month,
    } = req.query;
    if (
      !supplierId ||
      !financial_year ||
      !month ||
      (!bopId && !bopErpCode)
    ) {
      return res.status(400).json({
        success: false,
        found: false,
        message: "BOP, Supplier, Financial Year and Month are required",
      });
    }
    const [rows] = await zbcDB.query(`
      SELECT
        id,
        bop_id,
        bop_erp_code,
        supplier_id,
        financial_year,
        month,
        qty,
        rate
      FROM bop_monthly_report
      WHERE
        (bop_id = ?
          OR LOWER(TRIM(bop_erp_code)) =
             LOWER(TRIM(?)))
        AND supplier_id = ?
        AND TRIM(financial_year) = TRIM(?)
        AND month = ?
      LIMIT 1`,
      [
        Number(bopId) || 0,
        String(bopErpCode || "").trim(),
        Number(supplierId),
        String(financial_year || "").trim(),
        Number(month),
      ],
    );
    if (rows.length === 0) {
      return res.json({
        success: true,
        found: false,
        rate: null,
        data: null,
      });
    }

    return res.json({
      success: true,
      found: true,
      rate: Number(rows[0].rate) || 0,
      data: rows[0],
    });

  } catch (error) {
    console.error("BOP RATE ERROR:", error);

    return res.status(500).json({
      success: false,
      found: false,
      message: "Failed to fetch BOP rate",
      error: error.message,
    });
  }
};

// Create Bulk Bop Monthly Rate
export const createBulkBopMonthlyRate = async (req, res) => {
  try {
    const { rows } = req.body;
    /* BASIC REQUEST VALIDATION */

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Excel records received",
      });
    }

    if (rows.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5000 records can be uploaded at once.",
      });
    }

    const errors = [];
    const validRows = [];

    /* STEP 1: BASIC VALIDATION FOR ALL EXCEL ROWS */
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const excelRow = Number(row.rowNumber) || i + 2;
      const rowErrors = [];
      const bopErpCode = String(row.bopErpCode ?? "").trim();
      const supplierName = String(row.supplierName ?? "").trim();
      const financialYear = String(row.financial_year ?? "").trim();
      const month =
        row.month === undefined ||
          row.month === null ||
          row.month === ""
          ? NaN
          : Number(row.month);
      const qty =
        row.qty === undefined ||
          row.qty === null ||
          row.qty === ""
          ? null
          : Number(row.qty);
      const rate =
        row.rate === undefined ||
          row.rate === null ||
          row.rate === ""
          ? null
          : Number(row.rate);

      // BOP ERP Code
      if (!bopErpCode) {
        rowErrors.push("BOP ERP Code is required");
      }

      // Supplier Name
      if (!supplierName) {
        rowErrors.push("Supplier Name is required");
      }

      // Financial Year
      if (!financialYear) {
        rowErrors.push("Financial Year is required");
      } else if (!/^\d{4}-\d{2}$/.test(financialYear)) {
        rowErrors.push(
          `Invalid Financial Year '${financialYear}'. Expected format YYYY-YY.`
        );
      }

      // Month
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        rowErrors.push("Month must be between 1 and 12");
      }

      // Qty
      if (
        qty === null ||
        !Number.isFinite(qty) ||
        qty < 0
      ) {
        rowErrors.push("Qty must be a valid non-negative number");
      }

      // Rate
      if (
        rate === null ||
        !Number.isFinite(rate) ||
        rate < 0
      ) {
        rowErrors.push("Rate must be a valid non-negative number");
      }

      if (rowErrors.length > 0) {
        errors.push({
          rowNumber: excelRow,
          bopErpCode,
          supplierName,
          financial_year: financialYear,
          month: Number.isFinite(month) ? month : row.month ?? "",
          qty: row.qty ?? "",
          rate: row.rate ?? "",
          errors: rowErrors,
        });
        continue;
      }
      validRows.push({
        ...row,
        rowNumber: excelRow,
        bopErpCode,
        supplierName,
        financial_year: financialYear,
        month,
        qty,
        rate,
      });
    }

    /* STEP 2: GET UNIQUE MASTER VALUES */
    const bopErpCodes = [
      ...new Set(
        validRows
          .map((row) => row.bopErpCode.toLowerCase())
          .filter(Boolean)
      ),
    ];

    const supplierNames = [
      ...new Set(
        validRows
          .map((row) => row.supplierName.toLowerCase())
          .filter(Boolean)
      ),
    ];

    /* STEP 3: LOAD BOP MASTER */
    let bopMap = new Map();
    if (bopErpCodes.length > 0) {
      const placeholders = bopErpCodes.map(() => "?").join(",");
      const [bopRows] = await adminDB.query(`
        SELECT
          p.id,
          p.bop_part_name,
          p.bop_part_no,
          p.supplier_id,
          p.part_id,
          sd.part_no,
          sd.fg_code,
          p.bop_erp_code
        FROM bop_master p
        LEFT JOIN part_master sd
          ON p.part_id = sd.id
        WHERE LOWER(TRIM(p.bop_erp_code))
          IN (${placeholders})`,
        bopErpCodes
      );
      bopMap = new Map(
        bopRows.map((bop) => [String(bop.bop_erp_code).trim().toLowerCase(), bop])
      );
    }

    /* STEP 4: LOAD SUPPLIER MASTER */
    let supplierMap = new Map();
    if (supplierNames.length > 0) {
      const placeholders = supplierNames.map(() => "?").join(",");
      const [supplierRows] = await adminDB.query(`
        SELECT id,supplier_name
        FROM supplier_master
        WHERE LOWER(TRIM(supplier_name))
          IN (${placeholders})`,
        supplierNames
      );

      supplierMap = new Map(
        supplierRows.map((supplier) => [String(supplier.supplier_name).trim().toLowerCase(), supplier])
      );
    }

    /* STEP 5: MASTER VALIDATION */
    const rowsReadyForInsert = [];
    const duplicateMap = new Map();
    for (const row of validRows) {
      const excelRow = row.rowNumber;
      const bopErpCode = row.bopErpCode;
      const supplierName = row.supplierName;
      const bop = bopMap.get(bopErpCode.toLowerCase());
      const supplier = supplierMap.get(supplierName.toLowerCase());
      const rowErrors = [];

      // BOP Master
      if (!bop) {
        rowErrors.push(
          `BOP ERP Code '${bopErpCode}' not found in BOP master`
        );
      }

      // Supplier Master
      if (!supplier) {
        rowErrors.push(
          `Supplier '${supplierName}' not found in supplier master`
        );
      }

      // Supplier assigned to BOP
      if (bop && supplier) {
        const bopSupplierIds = String(bop.supplier_id || "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);

        if (!bopSupplierIds.includes(String(supplier.id))) {
          rowErrors.push(
            `Supplier '${supplierName}' is not assigned to BOP '${bopErpCode}'`
          );
        }
      }

      /* DUPLICATE CHECK */
      if (bop && supplier) {
        const duplicateKey = `${bop.id}||${supplier.id}||${row.financial_year}||${row.month}`;
        if (duplicateMap.has(duplicateKey)) {
          rowErrors.push(
            "Duplicate BOP + Supplier + Financial Year + Month found in upload"
          );
        } else {
          duplicateMap.set(duplicateKey, true);
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          rowNumber: excelRow,
          bopErpCode,
          supplierName,
          financial_year: row.financial_year,
          month: row.month,
          qty: row.qty,
          rate: row.rate,
          errors: rowErrors,
        });
        continue;
      }
      rowsReadyForInsert.push({
        ...row,
        bop,
        supplier,
      });
    }

    /* DO NOT SAVE ANYTHING IF ANY ROW IS INVALID */
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Bulk upload contains invalid records.",
        totalRows: rows.length,
        validRows: rowsReadyForInsert.length,
        invalidRows: errors.length,
        errors,
        totalErrors: errors.length,
      });
    }

    /* STEP 6: INSERT ONLY WHEN ALL ROWS ARE VALID */
    let insertedCount = 0;
    for (const row of rowsReadyForInsert) {
      const bop = row.bop;
      const supplier = row.supplier;
      await zbcDB.query(`
        INSERT INTO bop_monthly_report (
          bop_id,
          part_no,
          fg_code,
          bop_part_name,
          bop_part_no,
          bop_erp_code,
          supplier_id,
          financial_year,
          month,
          qty,
          rate
        )VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          part_no = VALUES(part_no),
          fg_code = VALUES(fg_code),
          bop_part_name = VALUES(bop_part_name),
          bop_part_no = VALUES(bop_part_no),
          bop_erp_code = VALUES(bop_erp_code),
          qty = VALUES(qty),
          rate = VALUES(rate),
        updated_at = CURRENT_TIMESTAMP`,
        [
          bop.id,
          bop.part_no || null,
          bop.fg_code || null,
          bop.bop_part_name || null,
          bop.bop_part_no || null,
          bop.bop_erp_code || null,
          Number(supplier.id),
          String(row.financial_year).trim(),
          Number(row.month),
          Number(row.qty),
          Number(row.rate),
        ]
      );
      insertedCount++;
    }

    /* SUCCESS */
    return res.status(201).json({
      success: true,
      message: `${insertedCount} BOP monthly records saved successfully.`,
      totalRows: rows.length,
      insertedCount,
      errorCount: 0,
      errors: [],
    });
  } catch (error) {
    console.error("Bulk BOP upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload BOP monthly rates",
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
    });
  }
};

// Create Bulk Compound Monthly Rate
export const createBulkCompoundMonthlyRate = async (req, res) => {
  try {
    const { rows } = req.body;

    /* BASIC REQUEST VALIDATION */
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Excel records received",
      });
    }
    if (rows.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5000 records can be uploaded at once.",
      });
    }

    const errors = [];
    const validRows = [];

    /* STEP 1: BASIC VALIDATION */
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const excelRow = Number(row.rowNumber) || i + 2;
      const rowErrors = [];
      const imCode = String(row.imCode ?? "").trim();
      const productionUnit = String(row.productionUnit ?? "").trim();
      const financialYear = String(row.financial_year ?? "").trim();
      const month =
        row.month === undefined ||
          row.month === null ||
          row.month === ""
          ? NaN
          : Number(row.month);
      const qty =
        row.qty === undefined ||
          row.qty === null ||
          row.qty === ""
          ? null
          : Number(row.qty);
      const rate =
        row.rate === undefined ||
          row.rate === null ||
          row.rate === ""
          ? null
          : Number(row.rate);

      /* IM CODE */
      if (!imCode) {
        rowErrors.push(
          "IM Code is required."
        );
      }

      /* PRODUCTION UNIT */
      if (!productionUnit) {
        rowErrors.push(
          "Production Unit is required."
        );
      }

      /* FINANCIAL YEAR */
      if (!financialYear) {
        rowErrors.push(
          "Financial Year is required."
        );
      } else if (
        !/^\d{4}-\d{2}$/.test(financialYear)
      ) {
        rowErrors.push(
          `Invalid Financial Year '${financialYear}'. Expected format YYYY-YY.`
        );
      }

      /* MONTH */
      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        rowErrors.push(
          "Month must be between 1 and 12."
        );
      }

      /* QTY */
      if (
        qty === null ||
        !Number.isFinite(qty) ||
        qty < 0
      ) {
        rowErrors.push(
          "Qty must be a valid non-negative number."
        );
      }

      /* RATE */
      if (
        rate === null ||
        !Number.isFinite(rate) ||
        rate < 0
      ) {
        rowErrors.push(
          "Rate must be a valid non-negative number."
        );
      }

      /* BASIC VALIDATION FAILED */
      if (rowErrors.length > 0) {
        errors.push({
          rowNumber: excelRow,
          imCode,
          productionUnit,
          financial_year: financialYear,
          month: Number.isFinite(month)
            ? month
            : row.month ?? "",
          qty: row.qty ?? "",
          rate: row.rate ?? "",
          errors: rowErrors,
        });
        continue;
      }
      validRows.push({
        ...row,
        rowNumber: excelRow,
        imCode,
        productionUnit,
        financial_year: financialYear,
        month,
        qty,
        rate,
      });
    }

    /* STEP 2: GET UNIQUE MASTER VALUES */
    const imCodes = [
      ...new Set(validRows
        .map((row) => String(row.imCode).trim().toLowerCase())
        .filter(Boolean)
      ),
    ];

    const productionUnits = [
      ...new Set(validRows
        .map((row) => String(row.productionUnit).trim().toLowerCase())
        .filter(Boolean)
      ),
    ];

    /* STEP 3: LOAD COMPOUND MASTER */
    let compoundMap = new Map();
    if (imCodes.length > 0) {
      const placeholders = imCodes
        .map(() => "?")
        .join(",");
      const [compoundRows] = await adminDB.query(`
          SELECT id,polymer,compound_code,im_code
          FROM compound_master
          WHERE LOWER(TRIM(im_code))
            IN (${placeholders})`,
        imCodes
      );
      compoundMap = new Map(
        compoundRows.map((compound) => [
          String(compound.im_code)
            .trim()
            .toLowerCase(),
          compound,
        ])
      );
    }

    /* STEP 4: LOAD UNIT MASTER */
    let unitMap = new Map();
    if (productionUnits.length > 0) {
      const placeholders = productionUnits
        .map(() => "?")
        .join(",");
      const [unitRows] = await adminDB.query(`
          SELECT id,unit
          FROM unit_master
          WHERE LOWER(TRIM(unit))
            IN (${placeholders})`,
        productionUnits
      );

      unitMap = new Map(
        unitRows.map((unit) => [
          String(unit.unit)
            .trim()
            .toLowerCase(),
          unit,
        ])
      );
    }

    /* STEP 5: MASTER VALIDATION + DUPLICATE VALIDATION */
    const rowsReadyForInsert = [];
    const duplicateMap = new Map();
    for (const row of validRows) {
      const excelRow = row.rowNumber;
      const imCode = String(
        row.imCode
      ).trim();
      const productionUnit = String(
        row.productionUnit
      ).trim();
      const financialYear = String(
        row.financial_year
      ).trim();
      const month = Number(row.month);
      const compound =
        compoundMap.get(
          imCode.toLowerCase()
        );
      const unit =
        unitMap.get(
          productionUnit.toLowerCase()
        );
      const rowErrors = [];

      /* COMPOUND MASTER */
      if (!compound) {
        rowErrors.push(
          `IM Code '${imCode}' not found in Compound Master.`
        );
      }

      /* UNIT MASTER */
      if (!unit) {
        rowErrors.push(
          `Production Unit '${productionUnit}' not found in Unit Master.`
        );
      }

      /* DUPLICATE */
      if (compound && unit) {
        const duplicateKey =
          `${compound.id}||${unit.id}||${financialYear}||${month}`;
        if (duplicateMap.has(duplicateKey)) {
          rowErrors.push(
            "Duplicate IM Code + Production Unit + Financial Year + Month found in upload."
          );
        } else {
          duplicateMap.set(
            duplicateKey,
            true
          );
        }
      }

      /* STORE ERRORS */
      if (rowErrors.length > 0) {
        errors.push({
          rowNumber: excelRow,
          imCode,
          productionUnit,
          financial_year: financialYear,
          month,
          qty: row.qty,
          rate: row.rate,
          errors: rowErrors,
        });
        continue;
      }

      /* COMPLETELY VALID ROW */
      rowsReadyForInsert.push({
        ...row,
        compound,
        unit,
      });
    }

    /* STEP 6: DO NOT SAVE ANYTHING IF ANY ROW IS INVALID */
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Bulk upload contains invalid records.",
        totalRows: rows.length,
        validRows: rowsReadyForInsert.length,
        invalidRows: errors.length,
        errors,
        totalErrors: errors.length,
      });
    }

    /* STEP 7: INSERT ONLY IF ALL ROWS ARE VALID */
    let insertedCount = 0;
    for (const row of rowsReadyForInsert) {
      const compound = row.compound;
      const unit = row.unit;
      await zbcDB.query(`
        INSERT INTO compound_monthly_report (
          compound_id,
          compound_code,
          polymer_name,
          im_code,
          unit_id,
          financial_year,
          month,
          qty,
          rate
        )VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          compound_code = VALUES(compound_code),
          polymer_name = VALUES(polymer_name),
          im_code = VALUES(im_code),
          qty = VALUES(qty),
          rate = VALUES(rate),
          updated_at = CURRENT_TIMESTAMP`,
        [
          compound.id,
          compound.compound_code || null,
          compound.polymer || null,
          compound.im_code || null,
          unit.id,
          String(row.financial_year).trim(),
          Number(row.month),
          Number(row.qty),
          Number(row.rate),
        ]
      );
      insertedCount++;
    }

    /* STEP 8: SUCCESS */
    return res.status(201).json({
      success: true,
      message: "Compound monthly rates uploaded successfully.",
      totalRows: rows.length,
      validRows: rowsReadyForInsert.length,
      invalidRows: 0,
      insertedCount,
      errorCount: 0,
      errors: [],
    });

  } catch (error) {
    console.error(
      "Bulk compound upload error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to upload compound monthly rates.",
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
    });
  }
};

// GET COMPOUND POLYMER-WISE MONTHLY REPORT
export const getCompoundPolymerMonthlyReport = async (req, res) => {
  try {
    const { financial_year } = req.query;

    if (!financial_year) {
      return res.status(400).json({
        success: false,
        message: "Financial year is required",
      });
    }

    const [rows] = await zbcDB.query(`
      SELECT
        polymer_name,
        month,
        SUM(qty) AS total_qty,
        SUM(qty * rate) AS total_cost
      FROM compound_monthly_report
      WHERE financial_year = ?
        AND polymer_name IS NOT NULL
        AND TRIM(polymer_name) <> ''
      GROUP BY polymer_name, month
      ORDER BY polymer_name, month`,
      [financial_year]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Error fetching compound polymer monthly report:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch compound polymer monthly report",
      error: error.message,
    });
  }
};

// HISTORICAL COMPOUND RATE
export const getHistoricalCompoundRate = async (req, res) => {
  try {
    const {
      compoundCode,
      polymerName,
      imCode,
      unitId,
      financial_year,
      month,
    } = req.query;

    if (
      !compoundCode ||
      !polymerName ||
      !imCode ||
      !unitId ||
      !financial_year ||
      !month
    ) {
      return res.status(400).json({
        success: false,
        found: false,
        message: "Compound Code, Polymer, IM Code, Production Unit, Year and Month are required",
      });
    }

    // Resolve production unit
    let resolvedUnitId = null;

    if (
      Number.isInteger(Number(unitId)) &&
      Number(unitId) > 0
    ) {
      resolvedUnitId = Number(unitId);
    } else {
      const [unitRows] = await adminDB.query(`
        SELECT id
        FROM unit_master
        WHERE LOWER(TRIM(unit)) = LOWER(TRIM(?))
        LIMIT 1`,
        [String(unitId).trim()]
      );

      if (unitRows.length > 0) {
        resolvedUnitId = Number(unitRows[0].id);
      }
    }

    if (!resolvedUnitId) {
      return res.json({
        success: true,
        found: false,
        rate: null,
        data: null,
      });
    }

    // Get historical compound rate
    const [rows] = await zbcDB.query(`
      SELECT
        id,
        compound_id,
        compound_code,
        polymer_name,
        im_code,
        unit_id,
        financial_year,
        month,
        qty,
        rate
      FROM compound_monthly_report
      WHERE LOWER(TRIM(compound_code))
            = LOWER(TRIM(?))
        AND LOWER(TRIM(polymer_name))
            = LOWER(TRIM(?))
        AND LOWER(TRIM(im_code))
            = LOWER(TRIM(?))
        AND unit_id = ?
        AND TRIM(financial_year) = TRIM(?)
        AND month = ?
      ORDER BY id DESC
      LIMIT 1`,
      [
        String(compoundCode).trim(),
        String(polymerName).trim(),
        String(imCode).trim(),
        resolvedUnitId,
        String(financial_year).trim(),
        Number(month),
      ]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        found: false,
        rate: null,
        data: null,
      });
    }

    return res.json({
      success: true,
      found: true,
      rate: Number(rows[0].rate) || 0,
      data: rows[0],
    });
  } catch (error) {
    console.error(
      "Historical compound rate error:",
      error
    );

    return res.status(500).json({
      success: false,
      found: false,
      message: "Failed to fetch historical compound rate",
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
    });
  }
};