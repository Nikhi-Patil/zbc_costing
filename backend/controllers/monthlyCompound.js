import zbcDB from "../config/zbcDB.js";

export const getCompoundMonthlyReport = async (req, res) => {
  try {
    const { year } = req.query;

    const [rows] = await zbcDB.query(
      `
      SELECT
        compound_id,
        compound_code,
        polymer_name,
        im_code,
        year,
        month,
        qty,
        rate
      FROM compound_monthly_report
      WHERE year = ?
      ORDER BY compound_code, month
      `,
      [year]
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
      year,
      month,
      qty,
      rate,
    } = req.body;

    if (!compoundId || !year || !month) {
      return res.status(400).json({
        success: false,
        message: "Compound, year and month are required",
      });
    }

    await zbcDB.query(
      `
      INSERT INTO compound_monthly_report (
        compound_id,
        compound_code,
        polymer_name,
        im_code,
        year,
        month,
        qty,
        rate
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        year,
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
    console.error("Error saving compound monthly rate:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save compound monthly rate",
      error: error.message,
    });
  }
};