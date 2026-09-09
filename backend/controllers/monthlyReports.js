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
        message:
          "Compound Code, Polymer, IM Code, Production Unit, Year and Month are required",
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

    console.log("========================================");
    console.log("BOP RATE REQUEST");
    console.log("bopId       :", bopId);
    console.log("bopErpCode  :", bopErpCode);
    console.log("supplierId  :", supplierId);
    console.log("financialYr :", financial_year);
    console.log("month       :", month);
    console.log("========================================");

    if (
      !supplierId ||
      !financial_year ||
      !month ||
      (!bopId && !bopErpCode)
    ) {
      return res.status(400).json({
        success: false,
        found: false,
        message:
          "BOP, Supplier, Financial Year and Month are required",
      });
    }

    const [rows] = await zbcDB.query(
      `
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
        (
          bop_id = ?
          OR LOWER(TRIM(bop_erp_code)) =
             LOWER(TRIM(?))
        )
        AND supplier_id = ?
        AND TRIM(financial_year) = TRIM(?)
        AND month = ?
      LIMIT 1
      `,
      [
        Number(bopId) || 0,
        String(bopErpCode || "").trim(),
        Number(supplierId),
        String(financial_year || "").trim(),
        Number(month),
      ],
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
export const createBulkBopMonthlyRate = async (
  req,
  res
) => {
  try {
    const { rows } = req.body;

    // -------------------------------------------------
    // Basic request validation
    // -------------------------------------------------

    if (
      !Array.isArray(rows) ||
      rows.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No Excel records received",
      });
    }

    // -------------------------------------------------
    // Arrays
    // -------------------------------------------------

    const errors = [];

    const validRows = [];

    // =================================================
    // STEP 1
    // Validate basic Excel data for ALL rows
    // =================================================

    for (
      let i = 0;
      i < rows.length;
      i++
    ) {
      const row = rows[i];

      const excelRow =
        row.rowNumber || i + 2;

      const rowErrors = [];

      // -----------------------------------------------
      // BOP ERP Code
      // -----------------------------------------------

      if (
        !row.bopErpCode ||
        !String(
          row.bopErpCode
        ).trim()
      ) {
        rowErrors.push(
          "BOP ERP Code is required"
        );
      }

      // -----------------------------------------------
      // Supplier Name
      // -----------------------------------------------

      if (
        !row.supplierName ||
        !String(
          row.supplierName
        ).trim()
      ) {
        rowErrors.push(
          "Supplier Name is required"
        );
      }

      // -----------------------------------------------
      // Financial Year
      // -----------------------------------------------

      if (
        !row.financial_year ||
        !String(
          row.financial_year
        ).trim()
      ) {
        rowErrors.push(
          "Financial Year is required"
        );
      }

      // -----------------------------------------------
      // Month
      // -----------------------------------------------

      const month =
        Number(row.month);

      if (
        !row.month ||
        month < 1 ||
        month > 12
      ) {
        rowErrors.push(
          "Month must be between 1 and 12"
        );
      }

      // -----------------------------------------------
      // Qty
      // -----------------------------------------------

      if (
        row.qty === undefined ||
        row.qty === null ||
        row.qty === "" ||
        isNaN(
          Number(row.qty)
        )
      ) {
        rowErrors.push(
          "Invalid Qty"
        );
      }

      // -----------------------------------------------
      // Rate
      // -----------------------------------------------

      if (
        row.rate === undefined ||
        row.rate === null ||
        row.rate === "" ||
        isNaN(
          Number(row.rate)
        )
      ) {
        rowErrors.push(
          "Invalid Rate"
        );
      }

      // -----------------------------------------------
      // Basic validation failed
      // -----------------------------------------------

      if (
        rowErrors.length > 0
      ) {
        errors.push({
          rowNumber:
            excelRow,

          bopErpCode:
            row.bopErpCode || "",

          supplierName:
            row.supplierName || "",

          errors:
            rowErrors,
        });

        continue;
      }

      // -----------------------------------------------
      // Valid basic row
      // -----------------------------------------------

      validRows.push({
        ...row,

        rowNumber:
          excelRow,

        bopErpCode:
          String(
            row.bopErpCode
          ).trim(),

        supplierName:
          String(
            row.supplierName
          ).trim(),

        financial_year:
          String(
            row.financial_year
          ).trim(),

        month,

        qty:
          Number(row.qty),

        rate:
          Number(row.rate),
      });
    }

    // =================================================
    // STEP 2
    // Get unique BOP ERP codes
    // =================================================

    const bopErpCodes = [
      ...new Set(
        validRows
          .map((row) =>
            String(
              row.bopErpCode
            )
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      ),
    ];

    // =================================================
    // STEP 3
    // Get unique suppliers
    // =================================================

    const supplierNames = [
      ...new Set(
        validRows
          .map((row) =>
            String(
              row.supplierName
            )
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      ),
    ];

    // =================================================
    // STEP 4
    // Fetch ALL BOP masters
    // =================================================

    let bopMap = new Map();

    if (
      bopErpCodes.length > 0
    ) {
      const placeholders =
        bopErpCodes
          .map(() => "?")
          .join(",");

      const [
        bopRows,
      ] =
        await adminDB.query(
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
          WHERE LOWER(TRIM(p.bop_erp_code))
            IN (${placeholders})
          `,
          bopErpCodes
        );

      bopMap = new Map(
        bopRows.map(
          (bop) => [
            String(
              bop.bop_erp_code
            )
              .trim()
              .toLowerCase(),

            bop,
          ]
        )
      );
    }

    // =================================================
    // STEP 5
    // Fetch ALL suppliers
    // =================================================

    let supplierMap =
      new Map();

    if (
      supplierNames.length > 0
    ) {
      const placeholders =
        supplierNames
          .map(() => "?")
          .join(",");

      const [
        supplierRows,
      ] =
        await adminDB.query(
          `
          SELECT
            id,
            supplier_name
          FROM supplier_master
          WHERE LOWER(TRIM(supplier_name))
            IN (${placeholders})
          `,
          supplierNames
        );

      supplierMap =
        new Map(
          supplierRows.map(
            (supplier) => [
              String(
                supplier.supplier_name
              )
                .trim()
                .toLowerCase(),

              supplier,
            ]
          )
        );
    }

    // =================================================
    // STEP 6
    // Validate BOP + Supplier for EVERY row
    // =================================================

    const rowsReadyForInsert =
      [];

    for (
      const row of validRows
    ) {
      const excelRow =
        row.rowNumber;

      const bopErpCode =
        String(
          row.bopErpCode
        ).trim();

      const supplierName =
        String(
          row.supplierName
        ).trim();

      const bop =
        bopMap.get(
          bopErpCode
            .toLowerCase()
        );

      const supplier =
        supplierMap.get(
          supplierName
            .toLowerCase()
        );

      const rowErrors =
        [];

      // -----------------------------------------------
      // BOP Master
      // -----------------------------------------------

      if (!bop) {
        rowErrors.push(
          `BOP ERP Code '${bopErpCode}' not found in BOP master`
        );
      }

      // -----------------------------------------------
      // Supplier Master
      // -----------------------------------------------

      if (!supplier) {
        rowErrors.push(
          `Supplier '${supplierName}' not found in supplier master`
        );
      }

      // -----------------------------------------------
      // Supplier assigned to BOP
      // -----------------------------------------------

      if (
        bop &&
        supplier
      ) {
        const bopSupplierIds =
          String(
            bop.supplier_id ||
            ""
          )
            .split(",")
            .map((id) =>
              id.trim()
            )
            .filter(Boolean);

        if (
          !bopSupplierIds.includes(
            String(
              supplier.id
            )
          )
        ) {
          rowErrors.push(
            `Supplier '${supplierName}' is not assigned to BOP '${bopErpCode}'`
          );
        }
      }

      // -----------------------------------------------
      // Store ALL errors
      // -----------------------------------------------

      if (
        rowErrors.length > 0
      ) {
        errors.push({
          rowNumber:
            excelRow,

          bopErpCode,

          supplierName,

          errors:
            rowErrors,
        });

        continue;
      }

      // -----------------------------------------------
      // Completely valid
      // -----------------------------------------------

      rowsReadyForInsert.push({
        ...row,

        bop,

        supplier,
      });
    }

    // =================================================
    // STEP 7
    // Insert ONLY valid rows
    // =================================================

    let insertedCount = 0;

    for (
      const row of rowsReadyForInsert
    ) {
      const bop =
        row.bop;

      const supplier =
        row.supplier;

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
          part_no =
            VALUES(part_no),

          fg_code =
            VALUES(fg_code),

          bop_part_name =
            VALUES(bop_part_name),

          bop_part_no =
            VALUES(bop_part_no),

          bop_erp_code =
            VALUES(bop_erp_code),

          qty =
            VALUES(qty),

          rate =
            VALUES(rate),

          updated_at =
            CURRENT_TIMESTAMP
        `,
        [
          bop.id,

          bop.part_no ||
          null,

          bop.fg_code ||
          null,

          bop.bop_part_name ||
          null,

          bop.bop_part_no ||
          null,

          bop.bop_erp_code ||
          null,

          Number(
            supplier.id
          ),

          String(
            row.financial_year
          ).trim(),

          Number(
            row.month
          ),

          Number(
            row.qty
          ),

          Number(
            row.rate
          ),
        ]
      );

      insertedCount++;
    }

    // =================================================
    // STEP 8
    // Return COMPLETE result
    // =================================================

    return res.status(200).json({
      success: true,

      message:
        errors.length > 0
          ? "Bulk upload completed with some invalid rows"
          : "BOP monthly rates uploaded successfully",

      totalRows:
        rows.length,

      insertedCount,

      errorCount:
        errors.length,

      errors,
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

      error:
        error.message,

      code:
        error.code,

      sqlState:
        error.sqlState,
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

    const errors = [];
    const validRows = [];

    // STEP 1: Validate basic Excel data for ALL rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Frontend sends rowNumber, so use it if available
      const excelRow = row.rowNumber || i + 2;
      const rowErrors = [];

      // IM Code
      if (!row.imCode || !String(row.imCode).trim()) {
        rowErrors.push("IM Code is required");
      }

      // Production Unit
      if (
        !row.productionUnit ||
        !String(row.productionUnit).trim()
      ) {
        rowErrors.push("Production Unit is required");
      }

      // Financial Year
      if (
        !row.financial_year ||
        !String(row.financial_year).trim()
      ) {
        rowErrors.push("Financial Year is required");
      }

      // Month
      const month = Number(row.month);
      if (!row.month || month < 1 || month > 12) {
        rowErrors.push("Month must be between 1 and 12");
      }

      // Qty
      if (row.qty === undefined || row.qty === null || row.qty === "" || isNaN(Number(row.qty))) {
        rowErrors.push("Invalid Qty");
      }

      // Rate
      if ( row.rate === undefined || row.rate === null || row.rate === "" || isNaN(Number(row.rate))) {
        rowErrors.push("Invalid Rate");
      }

      // Store basic validation errors
      if (rowErrors.length > 0) {
        errors.push({
          rowNumber: excelRow,
          imCode: row.imCode || "",
          productionUnit: row.productionUnit || "",
          errors: rowErrors,
        });

        continue;
      }

      validRows.push({
        ...row,
        rowNumber: excelRow,
        month,
      });
    }

    // =====================================================
    // STEP 2: Get unique IM Codes and Units
    // =====================================================

    const imCodes = [
      ...new Set(
        validRows
          .map((row) => String(row.imCode).trim())
          .filter(Boolean)
      ),
    ];

    const productionUnits = [
      ...new Set(
        validRows
          .map((row) => String(row.productionUnit).trim())
          .filter(Boolean)
      ),
    ];

    // =====================================================
    // STEP 3: Fetch ALL compounds from master in one query
    // =====================================================

    let compoundMap = new Map();

    if (imCodes.length > 0) {
      const placeholders = imCodes.map(() => "?").join(",");

      const [compoundRows] = await adminDB.query(
        `
        SELECT
          id,
          polymer,
          compound_code,
          im_code
        FROM compound_master
        WHERE LOWER(TRIM(im_code)) IN (${placeholders})
        `,
        imCodes.map((code) => code.toLowerCase())
      );

      compoundMap = new Map(
        compoundRows.map((compound) => [
          String(compound.im_code).trim().toLowerCase(),
          compound,
        ])
      );
    }

    // =====================================================
    // STEP 4: Fetch ALL Units from master in one query
    // =====================================================

    let unitMap = new Map();

    if (productionUnits.length > 0) {
      const placeholders = productionUnits.map(() => "?").join(",");

      const [unitRows] = await adminDB.query(
        `
        SELECT
          id,
          unit
        FROM unit_master
        WHERE LOWER(TRIM(unit)) IN (${placeholders})
        `,
        productionUnits.map((unit) => unit.toLowerCase())
      );

      unitMap = new Map(
        unitRows.map((unit) => [
          String(unit.unit).trim().toLowerCase(),
          unit,
        ])
      );
    }

    // =====================================================
    // STEP 5: Validate master entries for EVERY row
    // =====================================================

    const rowsReadyForInsert = [];

    for (const row of validRows) {
      const excelRow = row.rowNumber;

      const imCode = String(row.imCode).trim();
      const productionUnit = String(row.productionUnit).trim();

      const compound = compoundMap.get(imCode.toLowerCase());
      const unit = unitMap.get(productionUnit.toLowerCase());

      const rowErrors = [];

      // -----------------------------
      // Check Compound Master
      // -----------------------------
      if (!compound) {
        rowErrors.push(
          `IM Code '${imCode}' not found in compound master`
        );
      }

      // -----------------------------
      // Check Unit Master
      // -----------------------------
      if (!unit) {
        rowErrors.push(
          `Production Unit '${productionUnit}' not found`
        );
      }

      // -----------------------------
      // If row has errors
      // -----------------------------
      if (rowErrors.length > 0) {
        errors.push({
          rowNumber: excelRow,
          imCode,
          productionUnit,
          errors: rowErrors,
        });

        continue;
      }

      // -----------------------------
      // Row is completely valid
      // -----------------------------
      rowsReadyForInsert.push({
        ...row,
        compound,
        unit,
      });
    }

    // =====================================================
    // STEP 6: Insert ONLY valid rows
    // =====================================================

    let insertedCount = 0;

    for (const row of rowsReadyForInsert) {
      const compound = row.compound;
      const unit = row.unit;

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
          Number(row.month),
          Number(row.qty),
          Number(row.rate),
        ]
      );

      insertedCount++;
    }

    // =====================================================
    // STEP 7: Return complete result
    // =====================================================

    return res.status(200).json({
      success: true,

      message:
        errors.length > 0
          ? "Bulk upload completed with some invalid rows"
          : "Compound monthly rates uploaded successfully",

      totalRows: rows.length,

      insertedCount,

      errorCount: errors.length,

      errors,
    });

  } catch (error) {
    console.error(
      "Bulk compound upload error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to upload compound monthly rates",
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