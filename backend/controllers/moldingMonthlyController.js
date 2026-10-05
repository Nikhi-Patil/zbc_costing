
import zbcDB from "../config/zbcDB.js";

/* Create or update a monthly molding report record */
export const saveMoldingMonthlyReport = async (req, res) => {
    try {
        const {
            molding_id,
            transaction_id,

            part_no,
            fg_code,
            customer_name,
            production_unit,
            billing_unit,
            sub_category,

            financial_year,
            month,
            month_name,
            month_index,

            subtotal_a,
            part_cost,
            customer_sales_cost,
            monthly_quantity,
        } = req.body;

        // ------------------------------------
        // Required field validation
        // ------------------------------------
        if (
            molding_id === undefined ||
            molding_id === null ||
            molding_id === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "molding_id is required",
            });
        }

        if (!transaction_id) {
            return res.status(400).json({
                success: false,
                message: "transaction_id is required",
            });
        }

        if (!financial_year) {
            return res.status(400).json({
                success: false,
                message: "financial_year is required",
            });
        }

        if (
            month === undefined ||
            month === null ||
            month === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "month is required",
            });
        }

        // ------------------------------------
        // Insert / Update
        // ------------------------------------
        const sql = `
      INSERT INTO molding_monthly_report (
        molding_id,
        transaction_id,

        part_no,
        fg_code,
        customer_name,
        production_unit,
        billing_unit,
        sub_category,

        financial_year,
        month,
        month_name,
        month_index,

        subtotal_a,
        part_cost,
        customer_sales_cost,
        monthly_quantity
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

      ON DUPLICATE KEY UPDATE

        transaction_id = VALUES(transaction_id),

        part_no = VALUES(part_no),
        fg_code = VALUES(fg_code),
        customer_name = VALUES(customer_name),
        production_unit = VALUES(production_unit),
        billing_unit = VALUES(billing_unit),
        sub_category = VALUES(sub_category),

        month_name = VALUES(month_name),
        month_index = VALUES(month_index),

        subtotal_a = VALUES(subtotal_a),
        part_cost = VALUES(part_cost),
        customer_sales_cost = VALUES(customer_sales_cost),
        monthly_quantity = VALUES(monthly_quantity),

        updated_at = CURRENT_TIMESTAMP
    `;

        const values = [
            molding_id,
            transaction_id,

            part_no ?? null,
            fg_code ?? null,
            customer_name ?? null,
            production_unit ?? null,
            billing_unit ?? null,
            sub_category ?? null,

            financial_year,
            month,
            month_name ?? null,
            month_index ?? null,

            subtotal_a ?? null,
            part_cost ?? null,
            customer_sales_cost ?? null,
            monthly_quantity ?? 0,
        ];

        const [result] = await zbcDB.query(sql, values);

        return res.status(200).json({
            success: true,
            message: "Monthly molding report saved successfully",
            id: result.insertId || null,
            affectedRows: result.affectedRows,
        });
    } catch (error) {
        console.error(
            "Error saving molding monthly report:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to save molding monthly report",
            error: error.message,
        });
    }
};

/* Get monthly molding reports. */
export const getMoldingMonthlyReport = async (req, res) => {
    try {
        const {
            financialYear,
            month,
            transactionId,
            moldingId,
        } = req.query;

        let sql = `
      SELECT
        id,

        molding_id,
        transaction_id,

        part_no,
        fg_code,
        customer_name,
        production_unit,
        billing_unit,
        sub_category,

        financial_year,
        month,
        month_name,
        month_index,

        subtotal_a,
        part_cost,
        customer_sales_cost,
        monthly_quantity,

        created_at,
        updated_at

      FROM molding_monthly_report
      WHERE 1 = 1
    `;

        const params = [];

        // ------------------------------------
        // Financial Year filter
        // ------------------------------------
        if (financialYear) {
            sql += ` AND financial_year = ?`;
            params.push(financialYear);
        }

        // ------------------------------------
        // Month filter
        // ------------------------------------
        if (
            month !== undefined &&
            month !== null &&
            month !== ""
        ) {
            sql += ` AND month = ?`;
            params.push(month);
        }

        // ------------------------------------
        // Transaction ID filter
        // ------------------------------------
        if (transactionId) {
            sql += ` AND transaction_id = ?`;
            params.push(transactionId);
        }

        // ------------------------------------
        // Molding ID filter
        // ------------------------------------
        if (moldingId) {
            sql += ` AND molding_id = ?`;
            params.push(moldingId);
        }

        // ------------------------------------
        // Fiscal month ordering
        // ------------------------------------
        sql += `
      ORDER BY
        month_index ASC,
        id ASC
    `;

        const [rows] = await zbcDB.query(sql, params);

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
        });
    } catch (error) {
        console.error(
            "Error fetching molding monthly report:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch molding monthly report",
            error: error.message,
        });
    }
};

/* Get all monthly report records for one molding transaction */
export const getMoldingMonthlyReportByMolding = async (
    req,
    res
) => {
    try {
        const { moldingId } = req.params;

        if (!moldingId) {
            return res.status(400).json({
                success: false,
                message: "moldingId is required",
            });
        }

        const sql = `
      SELECT
        id,

        molding_id,
        transaction_id,

        part_no,
        fg_code,
        customer_name,
        production_unit,
        billing_unit,
        sub_category,

        financial_year,
        month,
        month_name,
        month_index,

        subtotal_a,
        part_cost,
        customer_sales_cost,
        monthly_quantity,

        created_at,
        updated_at

      FROM molding_monthly_report

      WHERE molding_id = ?

      ORDER BY
        financial_year ASC,
        month_index ASC,
        id ASC
    `;

        const [rows] = await zbcDB.query(sql, [moldingId]);

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
        });
    } catch (error) {
        console.error(
            "Error fetching molding monthly report by molding:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch molding monthly report",
            error: error.message,
        });
    }
};

/* Delete one monthly report record. */
export const deleteMoldingMonthlyReport = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Report id is required",
            });
        }

        const sql = `
      DELETE FROM molding_monthly_report
      WHERE id = ?
    `;

        const [result] = await zbcDB.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Monthly report record not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Monthly report deleted successfully",
        });
    } catch (error) {
        console.error(
            "Error deleting molding monthly report:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete molding monthly report",
            error: error.message,
        });
    }
};

export const saveMoldingMonthlyReportBulk = async (req, res) => {
    const connection = await zbcDB.getConnection();

    try {
        const { records } = req.body;

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: "records array is required and cannot be empty",
            });
        }

        // Validate all records before inserting anything
        const errors = [];

        records.forEach((record, index) => {
            if (
                record.molding_id === undefined ||
                record.molding_id === null ||
                record.molding_id === ""
            ) {
                errors.push(`Record ${index + 1}: molding_id is required`);
            }

            if (!record.transaction_id) {
                errors.push(`Record ${index + 1}: transaction_id is required`);
            }

            if (!record.financial_year) {
                errors.push(`Record ${index + 1}: financial_year is required`);
            }

            if (
                record.month === undefined ||
                record.month === null ||
                record.month === ""
            ) {
                errors.push(`Record ${index + 1}: month is required`);
            }
        });

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        await connection.beginTransaction();

        const sql = `
            INSERT INTO molding_monthly_report (
                molding_id,
                transaction_id,

                part_no,
                fg_code,
                customer_name,
                production_unit,
                billing_unit,
                sub_category,

                financial_year,
                month,
                month_name,
                month_index,

                subtotal_a,
                part_cost,
                customer_sales_cost,
                monthly_quantity
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            ON DUPLICATE KEY UPDATE

                transaction_id = VALUES(transaction_id),

                part_no = VALUES(part_no),
                fg_code = VALUES(fg_code),
                customer_name = VALUES(customer_name),
                production_unit = VALUES(production_unit),
                billing_unit = VALUES(billing_unit),
                sub_category = VALUES(sub_category),

                month_name = VALUES(month_name),
                month_index = VALUES(month_index),

                subtotal_a = VALUES(subtotal_a),
                part_cost = VALUES(part_cost),
                customer_sales_cost = VALUES(customer_sales_cost),
                monthly_quantity = VALUES(monthly_quantity),

                updated_at = CURRENT_TIMESTAMP
        `;

        let inserted = 0;
        let updated = 0;

        for (const record of records) {
            const values = [
                record.molding_id,
                record.transaction_id,

                record.part_no ?? null,
                record.fg_code ?? null,
                record.customer_name ?? null,
                record.production_unit ?? null,
                record.billing_unit ?? null,
                record.sub_category ?? null,

                record.financial_year,
                record.month,
                record.month_name ?? null,
                record.month_index ?? null,

                record.subtotal_a ?? null,
                record.part_cost ?? null,
                record.customer_sales_cost ?? null,
                record.monthly_quantity ?? 0,
            ];

            const [result] = await connection.query(sql, values);

            if (result.affectedRows === 1) {
                inserted++;
            } else if (result.affectedRows === 2) {
                updated++;
            }
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Monthly molding report saved successfully",
            totalRecords: records.length,
            inserted,
            updated,
        });

    } catch (error) {
        await connection.rollback();

        console.error(
            "Error saving bulk molding monthly report:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to save bulk molding monthly report",
            error: error.message,
        });

    } finally {
        connection.release();
    }
};