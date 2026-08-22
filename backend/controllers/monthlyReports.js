import zbcDB from "../config/zbcDB.js";
import adminDB from "../config/adminDB.js";

//Get Compound Monthly Report
export const getCompoundMonthlyReport = async (req, res) => {
  try {
    const { financial_year } = req.query;

    const [rows] = await zbcDB.query(
      `
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
  ORDER BY compound_code, month
  `,
      [financial_year]
    );

    res.json({
      success: true,
      data: rows,
    });
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
        message:
          "Compound, unit, financial_year and month are required",
      });
    }

    await zbcDB.query(
      `
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
        updated_at = CURRENT_TIMESTAMP
      `,
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
      "Error saving compound monthly rate:",
      error
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
    const [rows] = await zbcDB.query(
      `
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
      ORDER BY bop_erp_code, supplier_id, month
      `,
      [financial_year]
    );
    // Get supplier IDs used in this report
    const supplierIds = [
      ...new Set(
        rows
          .map((row) => Number(row.supplier_id))
          .filter((id) => id > 0)
      ),
    ];
    let supplierMap = new Map();
    if (supplierIds.length > 0) {
      const placeholders = supplierIds
        .map(() => "?")
        .join(",");
      const [supplierRows] = await adminDB.query(
        `
        SELECT
          id,
          supplier_name
        FROM supplier_master
        WHERE id IN (${placeholders})
        `,
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
      ...row,
      supplier_name:
        supplierMap.get(String(row.supplier_id)) || "-",
    }));
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Error fetching BOP monthly report:",
      error
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

    await zbcDB.query(
      `
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
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  ?)

      ON DUPLICATE KEY UPDATE

        part_no = VALUES(part_no),
        fg_code = VALUES(fg_code),
        bop_part_name = VALUES(bop_part_name),
        bop_part_no = VALUES(bop_part_no),
        bop_erp_code = VALUES(bop_erp_code),
        qty = VALUES(qty),
        rate = VALUES(rate),
        updated_at = CURRENT_TIMESTAMP
      `,
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
        message:
          "Compound Code, Polymer, IM Code, Production Unit, Year and Month are required",
      });
    }

    const [rows] = await zbcDB.query(
      `
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
  LIMIT 1
  `,
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
      supplierId,
      financial_year,
      month,
    } = req.query;

    console.log("BOP RATE REQUEST:", {
      bopId,
      supplierId,
      financial_year,
      month,
    });

    const [rows] = await zbcDB.query(
      `
      SELECT
        id,
        bop_id,
        supplier_id,
        financial_year,
        month,
        qty,
        rate
      FROM bop_monthly_report
      WHERE bop_id = ?
        AND supplier_id = ?
        AND financial_year = ?
        AND month = ?
      LIMIT 1
      `,
      [
        Number(bopId),
        Number(supplierId),
        String(financial_year),
        Number(month),
      ]
    );

    console.log("BOP RATE DB RESULT:", rows);

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
      rate: Number(rows[0].rate),
      data: rows[0],
    });

  } catch (error) {
    console.error("BOP RATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch BOP rate",
      error: error.message,
    });
  }
};
// Create Bulk Bop Monthly Rate
export const createBulkBopMonthlyRate = async (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Excel records received",
      });
    }

    let insertedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const excelRow = i + 2;

      // -----------------------------------------
      // Validation
      // -----------------------------------------

      if (!row.bopErpCode) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: BOP ERP Code is required`,
        });
      }

      if (!row.supplierName || !String(row.supplierName).trim()) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: Supplier Name is required`,
        });
      }

      if (!row.financial_year) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: Financial Year is required`,
        });
      }

      const month = Number(row.month);

      if (!month || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: Invalid month`,
        });
      }

      if (
        row.qty === undefined ||
        row.qty === null ||
        row.qty === "" ||
        isNaN(Number(row.qty))
      ) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: Invalid Qty`,
        });
      }

      if (
        row.rate === undefined ||
        row.rate === null ||
        row.rate === "" ||
        isNaN(Number(row.rate))
      ) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: Invalid Rate`,
        });
      }

      // -----------------------------------------
      // Find BOP from ADMIN DB
      // -----------------------------------------

      const [bopRows] = await adminDB.query(
        `
        SELECT
          p.id,
          p.bop_part_name,
          p.bop_part_no,
          p.bop_quantity,
          p.umo,
          p.supplier_id,
          p.part_id,
          sd.part_no,
          sd.fg_code,
          p.bop_erp_code
        FROM bop_master p
        LEFT JOIN part_master sd
          ON p.part_id = sd.id
        WHERE p.bop_erp_code = ?
        LIMIT 1
        `,
        [String(row.bopErpCode).trim()]
      );

      if (bopRows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            `Excel row ${excelRow}: BOP ERP Code '${row.bopErpCode}' not found`,
        });
      }

      const bop = bopRows[0];

      // -----------------------------------------
      // Find Supplier from ADMIN DB
      // -----------------------------------------

      const [supplierRows] = await adminDB.query(
        `
        SELECT
          id,
          supplier_name
        FROM supplier_master
        WHERE LOWER(TRIM(supplier_name)) =
              LOWER(TRIM(?))
        LIMIT 1
        `,
        [String(row.supplierName).trim()]
      );

      if (supplierRows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            `Excel row ${excelRow}: Supplier '${row.supplierName}' not found`,
        });
      }

      const supplier = supplierRows[0];
      const supplierId = supplier.id;

      // -----------------------------------------
      // Validate supplier belongs to BOP
      // -----------------------------------------

      const bopSupplierIds = String(
        bop.supplier_id || ""
      )
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (
        !bopSupplierIds.includes(
          String(supplierId)
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Excel row ${excelRow}: Supplier '${row.supplierName}' is not assigned to BOP '${row.bopErpCode}'`,
        });
      }

      // -----------------------------------------
      // Insert / Update
      // -----------------------------------------

      await zbcDB.query(
        `
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE
          part_no = VALUES(part_no),
          fg_code = VALUES(fg_code),
          bop_part_name = VALUES(bop_part_name),
          bop_part_no = VALUES(bop_part_no),
          bop_erp_code = VALUES(bop_erp_code),
          qty = VALUES(qty),
          rate = VALUES(rate),
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          bop.id,
          bop.part_no || null,
          bop.fg_code || null,
          bop.bop_part_name || null,
          bop.bop_part_no || null,
          bop.bop_erp_code || null,
          Number(supplierId),
          String(row.financial_year).trim(),
          month,
          Number(row.qty),
          Number(row.rate),
        ]
      );

      insertedCount++;
    }

    // -----------------------------------------
    // Success
    // -----------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "BOP monthly rates uploaded successfully",
      insertedCount,
    });
  } catch (error) {
    console.error(
      "Bulk BOP upload error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to upload BOP monthly rates",
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
    });
  }
};
//Create Bulk Compound Monthly Rate
export const createBulkCompoundMonthlyRate = async (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No Excel records received",
      });
    }

    let insertedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const excelRow = i + 2;

      // -----------------------------------------
      // Validation
      // -----------------------------------------

      if (!row.imCode || !String(row.imCode).trim()) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: IM Code is required`,
        });
      }

      if (
        !row.productionUnit ||
        !String(row.productionUnit).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: Production Unit is required`,
        });
      }

      if (!row.financial_year) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: Financial Year is required`,
        });
      }

      const month = Number(row.month);

      if (!month || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: Invalid month`,
        });
      }

      if (
        row.qty === undefined ||
        row.qty === null ||
        row.qty === "" ||
        isNaN(Number(row.qty))
      ) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: Invalid Qty`,
        });
      }

      if (
        row.rate === undefined ||
        row.rate === null ||
        row.rate === "" ||
        isNaN(Number(row.rate))
      ) {
        return res.status(400).json({
          success: false,
          message: `Excel row ${excelRow}: Invalid Rate`,
        });
      }

      // -----------------------------------------
      // Find Compound using IM Code
      // -----------------------------------------

      const [compoundRows] = await adminDB.query(
        `
        SELECT
          id,
          polymer,
          compound_code,
          im_code
        FROM compound_master
        WHERE LOWER(TRIM(im_code)) =
              LOWER(TRIM(?))
        LIMIT 1
        `,
        [String(row.imCode).trim()]
      );

      if (compoundRows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            `Excel row ${excelRow}: IM Code '${row.imCode}' not found in compound master`,
        });
      }

      const compound = compoundRows[0];

      // -----------------------------------------
      // Find Production Unit
      // -----------------------------------------

      const [unitRows] = await adminDB.query(
        `
        SELECT
          id,
          unit
        FROM unit_master
        WHERE LOWER(TRIM(unit)) =
              LOWER(TRIM(?))
        LIMIT 1
        `,
        [String(row.productionUnit).trim()]
      );

      if (unitRows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            `Excel row ${excelRow}: Production Unit '${row.productionUnit}' not found`,
        });
      }

      const unit = unitRows[0];

      // -----------------------------------------
      // Insert / Update
      // -----------------------------------------

      await zbcDB.query(
        `
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE
          compound_code = VALUES(compound_code),
          polymer_name = VALUES(polymer_name),
          im_code = VALUES(im_code),
          qty = VALUES(qty),
          rate = VALUES(rate),
          updated_at = CURRENT_TIMESTAMP
        `,
        [
          compound.id,
          compound.compound_code || null,
          compound.polymer || null,
          compound.im_code || null,
          unit.id,
          String(row.financial_year).trim(),
          month,
          Number(row.qty),
          Number(row.rate),
        ]
      );

      insertedCount++;
    }

    return res.status(201).json({
      success: true,
      message:
        "Compound monthly rates uploaded successfully",
      insertedCount,
    });
  } catch (error) {
    console.error(
      "Bulk compound upload error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to upload compound monthly rates",
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

    const [rows] = await zbcDB.query(
      `
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
      ORDER BY polymer_name, month
      `,
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