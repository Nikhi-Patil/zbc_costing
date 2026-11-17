import zbcDB from "../config/zbcDB.js";

export const getMoldingDashboardTransactions = async (filters) => {
    const {
        financialYear,
        fromMonth,
        toMonth,
        productionUnit,
        billingUnit,
        customerName,
        status,
        userName,
        isAdmin,
    } = filters;

    let sql = `
            SELECT
                mm.id AS monthlyReportId,
                mm.molding_id AS moldingId,
                mm.transaction_id AS trId,
                mm.financial_year AS financialYear,
                mm.month AS month,
                mm.month_name AS monthName,
                m.status AS status,
                mm.customer_name AS customerName,
                mm.production_unit AS prodUnit,
                mm.billing_unit AS billingUnit,
                mm.part_no AS partNo,
                m.part_name AS partName,
                mm.sub_category AS subcategory,
                mm.fg_code AS fgCode,
                COALESCE(mm.monthly_quantity, 0) AS monthlyQty,
                COALESCE(mm.customer_sales_cost, 0) AS saleCost,
                COALESCE(mm.part_cost, 0) AS mfgWithMargin,
                COALESCE(mm.subtotal_a, 0) AS subtotalA,
                (
                    COALESCE(mm.customer_sales_cost, 0) -
                    COALESCE(mm.part_cost, 0)
                ) AS plVsMfgCost,
                (
                    (
                        COALESCE(mm.customer_sales_cost, 0) -
                        COALESCE(mm.part_cost, 0)
                    ) * COALESCE(mm.monthly_quantity, 0)
                ) AS totalMfgPL
            FROM molding_monthly_report mm
            INNER JOIN molding_table m
                ON m.id = mm.molding_id
            WHERE 1 = 1
        `;
    const params = [];

    // Restrict non-admin users to their own transactions.
    // This follows the access rule in your existing monthly report controller.
    if (!isAdmin) {
        sql += `AND LOWER(TRIM(m.created_by)) = LOWER(TRIM(?))`;
        params.push(userName);
    }

    if (financialYear) {
        sql += ` AND mm.financial_year = ?`;
        params.push(financialYear);
    }

    // Financial-year month range: April to March.
    if (fromMonth && toMonth) {
        sql += `AND (CASE
                        WHEN mm.month >= 4 THEN mm.month - 4
                        ELSE mm.month + 8
                    END) BETWEEN ? AND ?`;

        const fiscalIndex = (month) =>
            Number(month) >= 4
                ? Number(month) - 4
                : Number(month) + 8;
        params.push(fiscalIndex(fromMonth), fiscalIndex(toMonth));
    }

    if (productionUnit && productionUnit !== "ALL") {
        sql += ` AND mm.production_unit = ?`;
        params.push(productionUnit);
    }

    if (billingUnit && billingUnit !== "ALL") {
        sql += ` AND mm.billing_unit = ?`;
        params.push(billingUnit);
    }

    if (customerName && customerName !== "ALL") {
        sql += ` AND mm.customer_name = ?`;
        params.push(customerName);
    }

    if (status && status !== "ALL") {
        sql += ` AND m.status = ?`;
        params.push(status);
    }
    
    // Extract only the WHERE conditions added above.
    const whereStart = sql.indexOf("WHERE 1 = 1") + "WHERE 1 = 1".length;
    const whereConditions = sql.slice(whereStart);

    const countSql = `
    SELECT COUNT(DISTINCT m.id) AS totalTransactions
    FROM molding_monthly_report mm
    INNER JOIN molding_table m
        ON m.id = mm.molding_id
    WHERE 1 = 1
    ${whereConditions}`;

    const [countRows] = await zbcDB.query(countSql, params);

    const totalTransactions = Number(
        countRows[0]?.totalTransactions || 0
    );

    sql += `
            ORDER BY
                mm.financial_year DESC,
                CASE
                    WHEN mm.month >= 4 THEN mm.month - 4
                    ELSE mm.month + 8
                END ASC,
                mm.id DESC
        `;

    const [rows] = await zbcDB.query(sql, params);

    return {
        rows,
        totalTransactions,
    }
};