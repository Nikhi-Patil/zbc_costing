import zbcDB from "../config/zbcDB.js";
import adminDB from "../config/adminDB.js";

/* GET SALES MONTHLY REPORT */
export const getSalesMonthlyReport = async (req, res) => {
    try {
        const { financialYear, financial_year, partNo } = req.query;
        const selectedFinancialYear =
            financialYear || financial_year;
        if (!selectedFinancialYear) {
            return res.status(400).json({
                success: false,
                message: "Financial Year is required",
            });
        }

        let sql = `
            SELECT
                id,
                part_id,
                part_no,
                part_name,
                unit_id,
                unit,
                financial_year,
                month,
                qty,
                sell_rate
            FROM sales_monthly
            WHERE financial_year = ? `;
        const params = [
            String(selectedFinancialYear).trim(),
        ];

        if (partNo && String(partNo).trim()) {
            sql += `AND LOWER(TRIM(part_no))
                    LIKE LOWER(TRIM(?))`;
            params.push(`%${String(partNo).trim()}%`);
        }

        sql += ` ORDER BY
                part_no ASC,
                month ASC `;

        const [rows] = await zbcDB.query(sql, params);
        return res.json({ success: true, data: rows, });
    } catch (error) {
        console.error("Error fetching Sales Monthly Report:", error);
        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch Sales Monthly Report",
            error: error.message,
        });
    }
};

/* GET ONE SALES MONTHLY RECORD */
export const getSalesMonthlyById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Record ID is required",
            });
        }

        const [rows] = await zbcDB.query(`
            SELECT
                id,
                part_id,
                part_no,
                part_name,
                unit_id,
                unit,
                financial_year,
                month,
                qty,
                sell_rate,
                created_at,
                updated_at
            FROM sales_monthly
            WHERE id = ?
            LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Sales Monthly record not found",
            });
        }
        return res.json({ success: true, data: rows[0], });
    } catch (error) {
        console.error("Error fetching Sales Monthly record:", error);
        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch Sales Monthly record",
            error: error.message,
        });
    }
};

/* CHECK EXISTING RECORD */
export const checkSalesMonthly = async (req, res) => {
    try {
        const {
            partNo,
            part_no,
            month,
            financialYear,
            financial_year,
        } = req.query;
        const selectedPartNo = partNo || part_no;
        const selectedFinancialYear = financialYear || financial_year;
        if (
            !selectedPartNo ||
            !month ||
            !selectedFinancialYear
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Part No, Month and Financial Year are required",
            });
        }
        const monthNumber = Number(month);
        if (
            !Number.isInteger(monthNumber) ||
            monthNumber < 1 ||
            monthNumber > 12
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid Month",
            });
        }
        const [rows] = await zbcDB.query(`
            SELECT
                id,
                part_id,
                part_no,
                part_name,
                unit_id,
                unit,
                financial_year,
                month,
                qty,
                sell_rate,
                created_at,
                updated_at
            FROM sales_monthly
            WHERE LOWER(TRIM(part_no))
                    = LOWER(TRIM(?))
                AND financial_year = ?
                AND month = ?
            LIMIT 1`,
            [
                String(selectedPartNo).trim(),
                String(selectedFinancialYear).trim(),
                monthNumber,
            ]
        );
        if (rows.length === 0) {
            return res.json({
                success: true,
                found: false,
                data: null,
            });
        }
        return res.json({
            success: true,
            found: true,
            data: rows[0],
        });
    } catch (error) {
        console.error("Check Sales Monthly error:", error);
        return res.status(500).json({
            success: false,
            message:
                "Failed to check Sales Monthly record",
            error: error.message,
        });
    }
};

/* CREATE SALES MONTHLY */
export const createSalesMonthly = async (req, res) => {
    try {
        const {
            partNo,
            partName,
            unit,
            financialYear,
            month,
            qty,
            sellRate,
        } = req.body;

        /* BASIC VALIDATION */
        if (!partNo || !String(partNo).trim()) {
            return res.status(400).json({ success: false, message: "Part No. is required", });
        }
        if (!unit || !String(unit).trim()) {
            return res.status(400).json({ success: false, message: "Unit is required", });
        }
        if (!financialYear || !String(financialYear).trim()) {
            return res.status(400).json({ success: false, message: "Financial Year is required", });
        }
        const monthNumber = Number(month);
        if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
            return res.status(400).json({ success: false, message: "Month must be between 1 and 12", });
        }

        /* QTY */
        let finalQty = null;
        if (qty !== undefined && qty !== null && qty !== "") {
            finalQty = Number(qty);
            if (!Number.isFinite(finalQty) || finalQty < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Qty must be a valid non-negative number",
                });
            }
        }

        /* SELL RATE */
        let finalSellRate = null;
        if (sellRate !== undefined && sellRate !== null && sellRate !== "") {
            finalSellRate = Number(sellRate);
            if (!Number.isFinite(finalSellRate) || finalSellRate < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Sell Rate must be a valid non-negative number",
                });
            }
        }
        if (finalQty === null && finalSellRate === null) {
            return res.status(400).json({
                success: false,
                message: "Enter Qty or Sell Rate",
            });
        }


        /* FIND PART FROM PART MASTER */
        const [partRows] = await adminDB.query(`
            SELECT id,part_no,part_name
            FROM part_master
            WHERE LOWER(TRIM(part_no))
                    = LOWER(TRIM(?))
            LIMIT 1`,
            [String(partNo).trim(),]
        );
        if (partRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Part No. '${partNo}' was not found in Part Master`,
            });
        }
        const part = partRows[0];

        /* FIND UNIT FROM UNIT MASTER */
        const [unitRows] = await adminDB.query(`
            SELECT id,unit
            FROM unit_master
            WHERE LOWER(TRIM(unit))
                    = LOWER(TRIM(?))
            LIMIT 1`,
            [String(unit).trim(),]
        );
        if (unitRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Unit '${unit}' was not found in Unit Master`,
            });
        }
        const unitMaster = unitRows[0];

        /* INSERT / UPDATE */
        const [result] = await zbcDB.query(`
            INSERT INTO sales_monthly(
                part_id,
                part_no,
                part_name,
                unit_id,
                unit,
                financial_year,
                month,
                qty,
                sell_rate
            )VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                part_no = VALUES(part_no),
                part_name = VALUES(part_name),
                unit_id = VALUES(unit_id),
                unit = VALUES(unit),
                qty = VALUES(qty),
                sell_rate = VALUES(sell_rate),
                updated_at = CURRENT_TIMESTAMP`,
            [
                part.id,
                part.part_no,
                partName || part.part_name || null,
                unitMaster.id,
                unitMaster.unit,
                String(financialYear).trim(),
                monthNumber,
                finalQty,
                finalSellRate,
            ]
        );

        /* GET SAVED RECORD */
        const [savedRows] = await zbcDB.query(`
            SELECT
                id,
                part_id,
                part_no,
                part_name,
                unit_id,
                unit,
                financial_year,
                month,
                qty,
                sell_rate,
                created_at,
                updated_at
            FROM sales_monthly
            WHERE part_id = ?
                AND financial_year = ?
                AND month = ?
            LIMIT 1`,
            [part.id, String(financialYear).trim(), monthNumber,]
        );
        return res.status(201).json({
            success: true,
            message: "Sales Monthly entry saved successfully",
            id: savedRows[0]?.id ||
                result.insertId ||
                null,
            data: savedRows[0] || null,
        });
    } catch (error) {
        console.error("Error saving Sales Monthly entry:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save Sales Monthly entry",
            error: error.message,
            code: error.code,
            sqlState: error.sqlState,
        });
    }
};

/* BULK CREATE / UPDATE SALES MONTHLY */
export const bulkCreateSalesMonthly = async (req, res) => {
    let connection;

    try {
        const {
            financialYear,
            entries,
        } = req.body;

        /* -------------------------------------------------
           BASIC VALIDATION
        ------------------------------------------------- */

        if (
            !financialYear ||
            !String(financialYear).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Financial Year is required",
            });
        }

        if (
            !Array.isArray(entries) ||
            entries.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "No bulk entries received",
            });
        }

        if (entries.length > 5000) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum 5000 records can be uploaded at once.",
            });
        }

        const selectedFinancialYear =
            String(financialYear).trim();

        /* -------------------------------------------------
           LOAD PART MASTER ONCE
        ------------------------------------------------- */

        const [partRows] =
            await adminDB.query(`
                SELECT
                    id,
                    part_no,
                    part_name
                FROM part_master
            `);

        const partMap = new Map();

        partRows.forEach((part) => {
            partMap.set(
                String(part.part_no)
                    .trim()
                    .toLowerCase(),
                part
            );
        });

        /* -------------------------------------------------
           LOAD UNIT MASTER ONCE
        ------------------------------------------------- */

        const [unitRows] =
            await adminDB.query(`
                SELECT
                    id,
                    unit
                FROM unit_master
            `);

        const unitMap = new Map();

        unitRows.forEach((unit) => {
            unitMap.set(
                String(unit.unit)
                    .trim()
                    .toLowerCase(),
                unit
            );
        });

        /* -------------------------------------------------
           VALIDATE ENTRIES
        ------------------------------------------------- */

        const validatedEntries = [];
        const errors = [];

        /*
         * Duplicate detection inside uploaded
         * Excel file.
         *
         * Your database unique key is:
         *
         * part_id
         * unit_id
         * month
         * financial_year
         */

        const duplicateMap = new Map();

        entries.forEach(
            (entry, index) => {
                const excelRow =
                    Number(entry.excelRow) ||
                    index + 2;

                const partNo =
                    String(
                        entry.partNo ??
                        entry.part_no ??
                        ""
                    ).trim();

                const partName =
                    String(
                        entry.partName ??
                        entry.part_name ??
                        ""
                    ).trim();

                const unit =
                    String(
                        entry.unit ?? ""
                    ).trim();

                const month =
                    Number(entry.month);

                const qty =
                    entry.qty === null ||
                        entry.qty === undefined ||
                        entry.qty === ""
                        ? null
                        : Number(entry.qty);

                const sellRate =
                    entry.sellRate === null ||
                        entry.sellRate === undefined ||
                        entry.sellRate === ""
                        ? null
                        : Number(entry.sellRate);

                /* -----------------------------------------
                   PART NO.
                ----------------------------------------- */

                if (!partNo) {
                    errors.push({
                        row: excelRow,
                        message:
                            "Part No. is required",
                    });

                    return;
                }

                const part =
                    partMap.get(
                        partNo.toLowerCase()
                    );

                if (!part) {
                    errors.push({
                        row: excelRow,
                        partNo,
                        message:
                            `Part No. '${partNo}' was not found in Part Master`,
                    });

                    return;
                }

                /* -----------------------------------------
                   PART NAME
                ----------------------------------------- */

                if (!partName) {
                    errors.push({
                        row: excelRow,
                        partNo,
                        message:
                            "Part Name is required",
                    });

                    return;
                }

                /*
                 * IMPORTANT:
                 *
                 * We use Part Master as the authoritative
                 * source for the saved part name.
                 *
                 * This prevents an incorrect name from
                 * being stored against a valid Part No.
                 */

                const finalPartName =
                    part.part_name ||
                    partName ||
                    null;

                /* -----------------------------------------
                   UNIT
                ----------------------------------------- */

                if (!unit) {
                    errors.push({
                        row: excelRow,
                        partNo,
                        message:
                            "Unit is required",
                    });

                    return;
                }

                const unitMaster =
                    unitMap.get(
                        unit.toLowerCase()
                    );

                if (!unitMaster) {
                    errors.push({
                        row: excelRow,
                        partNo,
                        message:
                            `Unit '${unit}' was not found in Unit Master`,
                    });

                    return;
                }

                /* -----------------------------------------
                   MONTH
                ----------------------------------------- */

                if (
                    !Number.isInteger(month) ||
                    month < 1 ||
                    month > 12
                ) {
                    errors.push({
                        row: excelRow,
                        partNo,
                        message:
                            "Month must be between 1 and 12",
                    });

                    return;
                }

                /* -----------------------------------------
                   QTY
                ----------------------------------------- */

                if (
                    qty !== null &&
                    (
                        !Number.isFinite(qty) ||
                        qty < 0
                    )
                ) {
                    errors.push({
                        row: excelRow,
                        partNo,
                        message:
                            "Qty must be a valid non-negative number",
                    });

                    return;
                }

                /* -----------------------------------------
                   SELLS RATE
                ----------------------------------------- */

                if (
                    sellRate !== null &&
                    (
                        !Number.isFinite(
                            sellRate
                        ) ||
                        sellRate < 0
                    )
                ) {
                    errors.push({
                        row: excelRow,
                        partNo,
                        message:
                            "Sells Rate must be a valid non-negative number",
                    });

                    return;
                }

                /* -----------------------------------------
                   VALUE REQUIRED
                ----------------------------------------- */

                if (
                    qty === null &&
                    sellRate === null
                ) {
                    errors.push({
                        row: excelRow,
                        partNo,
                        message:
                            "Qty or Sells Rate is required",
                    });

                    return;
                }

                /* -----------------------------------------
                   DUPLICATE
                ----------------------------------------- */

                const duplicateKey =
                    `${part.id}||${unitMaster.id}||${month}||${selectedFinancialYear}`;

                if (
                    duplicateMap.has(
                        duplicateKey
                    )
                ) {
                    errors.push({
                        row: excelRow,
                        partNo,
                        message:
                            "Duplicate Part + Unit + Month found in upload",
                    });

                    return;
                }

                duplicateMap.set(
                    duplicateKey,
                    true
                );

                /* -----------------------------------------
                   VALID RECORD
                ----------------------------------------- */

                validatedEntries.push({
                    partId:
                        part.id,

                    partNo:
                        part.part_no,

                    partName:
                        finalPartName,

                    unitId:
                        unitMaster.id,

                    unit:
                        unitMaster.unit,

                    financialYear:
                        selectedFinancialYear,

                    month,

                    qty,

                    sellRate,
                });
            }
        );

        /* -------------------------------------------------
           DO NOT SAVE IF ANY VALIDATION ERROR EXISTS
        ------------------------------------------------- */

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Bulk upload contains invalid records.",
                errors,
                totalErrors:
                    errors.length,
            });
        }

        /* -------------------------------------------------
           DATABASE TRANSACTION
        ------------------------------------------------- */

        connection =
            await zbcDB.getConnection();

        await connection.beginTransaction();

        /* -------------------------------------------------
           INSERT / UPDATE
        ------------------------------------------------- */

        for (
            const entry of validatedEntries
        ) {
            await connection.query(
                `
                INSERT INTO sales_monthly (
                    part_id,
                    part_no,
                    part_name,
                    unit_id,
                    unit,
                    financial_year,
                    month,
                    qty,
                    sell_rate
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

                ON DUPLICATE KEY UPDATE
                    part_no = VALUES(part_no),
                    part_name = VALUES(part_name),
                    unit_id = VALUES(unit_id),
                    unit = VALUES(unit),
                    qty = VALUES(qty),
                    sell_rate = VALUES(sell_rate),
                    updated_at =
                        CURRENT_TIMESTAMP
                `,
                [
                    entry.partId,
                    entry.partNo,
                    entry.partName,
                    entry.unitId,
                    entry.unit,
                    entry.financialYear,
                    entry.month,
                    entry.qty,
                    entry.sellRate,
                ]
            );
        }

        /* -------------------------------------------------
           COMMIT
        ------------------------------------------------- */

        await connection.commit();

        return res.status(201).json({
            success: true,
            message:
                `${validatedEntries.length} Sales Monthly records saved successfully.`,
            totalRecords:
                validatedEntries.length,
        });
    } catch (error) {
        /* -------------------------------------------------
           ROLLBACK
        ------------------------------------------------- */

        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Sales Monthly rollback error:",
                    rollbackError
                );
            }
        }

        console.error(
            "Bulk Sales Monthly error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to save bulk Sales Monthly entries",
            error:
                error.message,
            code:
                error.code,
            sqlState:
                error.sqlState,
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/* UPDATE SALES MONTHLY */
export const updateSalesMonthly = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            partNo,
            partName,
            unit,
            financialYear,
            month,
            qty,
            sellRate,
        } = req.body;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Record ID is required",
            });
        }
        if (!partNo || !String(partNo).trim()) {
            return res.status(400).json({
                success: false,
                message: "Part No. is required",
            });
        }
        if (!unit || !String(unit).trim()) {
            return res.status(400).json({
                success: false,
                message: "Unit is required",
            });
        }
        if (!financialYear || !String(financialYear).trim()) {
            return res.status(400).json({
                success: false,
                message: "Financial Year is required",
            });
        }
        const monthNumber = Number(month);
        if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
            return res.status(400).json({
                success: false,
                message: "Invalid Month",
            });
        }
        let finalQty = null;
        if (qty !== undefined && qty !== null && qty !== "") {
            finalQty = Number(qty);
            if (!Number.isFinite(finalQty) || finalQty < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Qty",
                });
            }
        }
        let finalSellRate = null;
        if (sellRate !== undefined && sellRate !== null && sellRate !== "") {
            finalSellRate = Number(sellRate);
            if (!Number.isFinite(finalSellRate) || finalSellRate < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Sell Rate",
                });
            }
        }
        if (finalQty === null && finalSellRate === null) {
            return res.status(400).json({
                success: false,
                message: "Enter Qty or Sell Rate",
            });
        }

        /* CHECK PART */
        const [partRows] = await adminDB.query(`
            SELECT id, part_no, part_name
            FROM part_master
            WHERE LOWER(TRIM(part_no))
                    = LOWER(TRIM(?))
            LIMIT 1 `,
            [String(partNo).trim(),]
        );
        if (partRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Part No. '${partNo}' was not found in Part Master`,
            });
        }
        const part = partRows[0];

        /* CHECK UNIT */
        const [unitRows] = await adminDB.query(`
            SELECT id, unit
            FROM unit_master
            WHERE LOWER(TRIM(unit))
                    = LOWER(TRIM(?))
            LIMIT 1`,
            [String(unit).trim(),]
        );
        if (unitRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Unit '${unit}' was not found in Unit Master`,
            });
        }
        const unitMaster = unitRows[0];

        /* UPDATE */
        const [result] = await zbcDB.query(`
            UPDATE sales_monthly
            SET
                part_id = ?,
                part_no = ?,
                part_name = ?,
                unit_id = ?,
                unit = ?,
                financial_year = ?,
                month = ?,
                qty = ?,
                sell_rate = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                part.id,
                part.part_no,
                partName || part.part_name || null,
                unitMaster.id,
                unitMaster.unit,
                String(financialYear).trim(),
                monthNumber,
                finalQty,
                finalSellRate,
                id,
            ]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Sales Monthly record not found",
            });
        }

        /* RETURN UPDATED RECORD */
        const [rows] = await zbcDB.query(`
            SELECT
                id,
                part_id,
                part_no,
                part_name,
                unit_id,
                unit,
                financial_year,
                month,
                qty,
                sell_rate,
                created_at,
                updated_at
            FROM sales_monthly
            WHERE id = ?
            LIMIT 1 `,
            [id]
        );
        return res.json({
            success: true,
            message: "Sales Monthly entry updated successfully",
            data: rows[0] || null,
        });

    } catch (error) {
        console.error("Error updating Sales Monthly entry:", error);
        /* Duplicate unique key */
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "A Sales Monthly record already exists for this Part, Month and Financial Year.",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to update Sales Monthly entry",
            error: error.message,
        });
    }
};

/* DELETE SALES MONTHLY */
export const deleteSalesMonthly = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Record ID is required",
            });
        }
        const [result] = await zbcDB.query(`
            DELETE FROM sales_monthly
            WHERE id = ?`,
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Sales Monthly record not found",
            });
        }
        return res.json({
            success: true,
            message: "Sales Monthly entry deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting Sales Monthly entry:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete Sales Monthly entry",
            error: error.message,
        });
    }
};

