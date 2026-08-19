import zbcDB from "../config/zbcDB.js";
import adminDB from "../config/adminDB.js";

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