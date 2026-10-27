import zbcDB from "../config/zbcDB.js";
import adminDB from "../config/adminDB.js";

const getBopMonthlyRate = async ({ bopErpCode, supplierId, financialYear, month }) => {
    if (!bopErpCode || !supplierId || !financialYear || !month) return null;

    const [rows] = await zbcDB.query(
        `SELECT rate
         FROM bop_monthly_report
         WHERE TRIM(bop_erp_code) = TRIM(?)
           AND supplier_id = ?
           AND financial_year = ?
           AND month = ?
         ORDER BY id ASC
         LIMIT 1`,
        [String(bopErpCode).trim(), Number(supplierId), financialYear, Number(month)]
    );
    return rows.length > 0 && rows[0].rate !== null ? Number(rows[0].rate) : null;
};

const generateTransactionId = async () => {
    const [rows] = await zbcDB.query(`
        SELECT transaction_id
        FROM molding_table
        WHERE transaction_id REGEXP '^ML[0-9]+$'
        ORDER BY CAST(SUBSTRING(transaction_id, 3) AS UNSIGNED) DESC
        LIMIT 1
    `);
    const lastNumber = rows.length ? Number.parseInt(rows[0].transaction_id.substring(2), 10) : 0;
    return `ML${String((Number.isNaN(lastNumber) ? 0 : lastNumber) + 1).padStart(3, "0")}`;
};

const FORM_COLUMN_MAP = {
    financialYear: "financial_year",
    month: "month",
    effectiveDate: "effective_date",
    customerName: "customer_name",
    productionUnit: "production_unit",
    billingUnit: "billing_unit",
    subDepartment: "sub_department",
    subCategory: "sub_category",
    partNo: "part_no",
    partName: "part_name",
    fgcode: "fg_code",
    imcode: "im_code",
    imCode: "rm_im_code",
    grossWeight: "gross_weight",
    netWeight: "net_weight",
    loadingper: "loading_per",
    hasBop: "has_bop",
    polymerName: "polymer_name",
    compoundCode: "compound_code",
    compMonth: "comp_month",
    compoundRate: "compound_rate",
    totalRmCost: "total_rm_cost",
    processType: "process_type",
    machineTonnage: "machine_tonnage",
    shiftRate: "shift_rate",
    totalCavity: "total_cavity",
    runningCavity: "running_cavity",
    cycleTime: "cycle_time",
    shiftTimeEfficiency: "shift_time_efficiency",
    efficiency: "efficiency",
    totalShots: "total_shots",
    totalProductionPerShift: "total_production_per_shift",
    PlattenSize: "platten_size",
    toolSize: "tool_size",
    processCostA: "process_cost_a",
    postCuring: "post_curing",
    finishing: "finishing",
    inspection: "inspection",
    shotBlasting: "shot_blasting",
    vapourDegreasing: "vapour_degreasing",
    chromating: "chromating",
    phospating: "phospating",
    adhesive: "adhesive",
    painting: "painting",
    plating: "plating",
    cylindricalGrinding: "cylindrical_grinding",
    postCuringRequired: "post_curing_required",
    finishingRequired: "finishing_required",
    inspectionRequired: "inspection_required",
    shotBlastingRequired: "shot_blasting_required",
    vapourDegreasingRequired: "vapour_degreasing_required",
    chromatingRequired: "chromating_required",
    phospatingRequired: "phospating_required",
    adhesiveRequired: "adhesive_required",
    paintingRequired: "painting_required",
    platingRequired: "plating_required",
    cylindricalGrindingRequired: "cylindrical_grinding_required",
    bopWeight: "bop_weight",
    bopArea: "bop_area",
    paintArea: "paint_area",
    paintPerLit: "paint_per_lit",
    finishedPartWeight: "finished_part_weight",
    metalPartArea: "metal_part_area",
    assemblyQty: "assembly_qty",
    assemblyPerCost: "assembly_per_cost",
    totalAssemblyCost: "total_assembly_cost",
    processCostB: "process_cost_b",
    conversionCost: "conversion_cost",
    subtotalA: "subtotal_a",
    subtotalB: "subtotal_b",
    partCost: "part_cost",
    iccOnRm: "icc_on_rm",
    rejOnSubtotal: "rej_on_subtotal",
    ohOnSubtotal: "oh_on_subtotal",
    profitOnSubtotal: "profit_on_subtotal",
    packagingOnSubtotal: "packaging_on_subtotal",
    transportOnSubtotal: "transport_on_subtotal",
    totalBopCost: "total_bop_cost",
    finalRmCost: "final_rm_cost",
    iccOnRmCost: "icc_on_rm_cost",
    rejOnSubtotalCost: "rej_on_subtotal_cost",
    ohOnSubtotalCost: "oh_on_subtotal_cost",
    profitOnSubtotalCost: "profit_on_subtotal_cost",
    packagingOnSubtotalCost: "packaging_on_subtotal_cost",
    transportOnSubtotalCost: "transport_on_subtotal_cost",
    customerSalesCost: "customer_sales_cost",
    salesProfitLoss: "sales_profit_loss",
    buyingType: "buying_type",
    vendorName: "vendor_name",
    buyingCost: "buying_cost",
    buyingProfitLoss: "buying_profit_loss",
    monthlyQuantity: "monthly_quantity",
    monthlyProfitLoss: "monthly_profit_loss",
};

const toDbValue = (value) => value === undefined ? null : value;

const saveBopCosting = async (connection, formData, bops) => {
    if (!Array.isArray(bops) || bops.length === 0) return;
    for (const bop of bops) {
        if (!bop.id || String(bop.id).startsWith("saved-bop-")) continue;
        const bopMonth = bop.bopmonth || null;
        const qty = Number(bop.bopAssemblyQty ?? bop.assembly_qty ?? bop.assemblyQty ?? 0);
        const rate = await getBopMonthlyRate({
            bopErpCode: bop.bopFgCode,
            supplierId: bop.supplierId,
            financialYear: formData.financialYear,
            month: bopMonth,
        });
        await connection.query(
            `UPDATE bop_part_details
             SET financial_year = ?, bop_month = ?, bop_rate = ?, bop_cost = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [formData.financialYear || null, bopMonth, rate, rate === null ? null : qty * rate, bop.id]
        );
    }
};

export const createDraft = async (formData, bops, userName) => {
    const connection = await zbcDB.getConnection();
    try {
        await connection.beginTransaction();
        const transactionId = await generateTransactionId();
        const entries = Object.entries(FORM_COLUMN_MAP);
        const columns = ["transaction_id", "status", ...entries.map(([, column]) => column), "created_by", "updated_by"];
        const values = [transactionId, "DRAFT", ...entries.map(([key]) => toDbValue(formData[key])), userName, userName];
        const placeholders = columns.map(() => "?").join(", ");
        const [result] = await connection.query(
            `INSERT INTO molding_table (${columns.join(", ")}) VALUES (${placeholders})`,
            values
        );
        await saveBopCosting(connection, formData, bops);
        await connection.commit();
        return { id: result.insertId, transactionId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const updateDraft = async (transactionId, formData, bops, userName) => {
    const connection = await zbcDB.getConnection();
    try {
        await connection.beginTransaction();
        const entries = Object.entries(FORM_COLUMN_MAP);
        const assignments = [...entries.map(([, column]) => `${column} = ?`), "updated_by = ?"];
        const values = [...entries.map(([key]) => toDbValue(formData[key])), userName, transactionId];
        const [result] = await connection.query(
            `UPDATE molding_table
             SET ${assignments.join(", ")}
             WHERE transaction_id = ? AND status = 'DRAFT'`,
            values
        );
        if (result.affectedRows === 0) {
            throw new Error("Draft not found or already submitted");
        }
        await saveBopCosting(connection, formData, bops);
        await connection.commit();
        return { transactionId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const submitFinal = async (transactionId, userName) => {
    const [result] = await zbcDB.query(
        `
        UPDATE molding_table
        SET
            status = 'FINAL',
            updated_by = ?
        WHERE transaction_id = ?
          AND status = 'DRAFT'
        `,
        [userName, transactionId]
    );

    if (result.affectedRows === 0) {
        throw new Error("Draft not found or already submitted");
    }

    return {
        transactionId,
        status: "FINAL"
    };
};

export const updateAllMoldingMargins = async (updatedBy = null) => {
    const connection = await zbcDB.getConnection();

    try {
        await connection.beginTransaction();

        // 1. GET CURRENT MARGIN MASTER FROM adminDB
        const [marginRows] = await adminDB.query(`
            SELECT id, margin_type, percentage
            FROM margin_master
            ORDER BY id ASC
        `);

        if (!marginRows || marginRows.length === 0) {
            throw new Error(
                "No margin percentages found in Margin Master"
            );
        }

        // 2. CREATE MARGIN MAP
        const marginMap = {};
        marginRows.forEach((row) => {
            const key = String(row.margin_type || "")
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");
            marginMap[key] = Number(row.percentage || 0);
        });

        // 3. GET CURRENT VALUES FROM MARGIN MASTER
        const icc = marginMap.icc ?? 0;
        const rejection = marginMap.rejection ?? 0;
        const overhead = marginMap.overhead ?? marginMap.overheadoh ?? 0;
        const profit = marginMap.profit ?? 0;
        const transport = marginMap.transport ?? 0;
        const packaging = marginMap.packaging ?? 0;

        // 4. UPDATE ALL MOLDING TRANSACTIONS
        const [updateResult] = await connection.query(
            `
            UPDATE molding_table
            SET
                icc_on_rm = ?,
                rej_on_subtotal = ?,
                oh_on_subtotal = ?,
                profit_on_subtotal = ?,
                packaging_on_subtotal = ?,
                transport_on_subtotal = ?,
                
                icc_on_rm_cost =
                    COALESCE(final_rm_cost, 0) * ? / 100,

                rej_on_subtotal_cost =
                    COALESCE(subtotal_a, 0) * ? / 100,

                oh_on_subtotal_cost =
                    COALESCE(subtotal_a, 0) * ? / 100,

                profit_on_subtotal_cost =
                    COALESCE(subtotal_a, 0) * ? / 100,

                packaging_on_subtotal_cost =
                    COALESCE(subtotal_a, 0) * ? / 100,

                transport_on_subtotal_cost =
                    COALESCE(subtotal_a, 0) * ? / 100,

                subtotal_b =
                    (COALESCE(final_rm_cost, 0) * ? / 100) +
                    (COALESCE(subtotal_a, 0) * ? / 100) +
                    (COALESCE(subtotal_a, 0) * ? / 100) +
                    (COALESCE(subtotal_a, 0) * ? / 100) +
                    (COALESCE(subtotal_a, 0) * ? / 100) +
                    (COALESCE(subtotal_a, 0) * ? / 100),

                part_cost = COALESCE(subtotal_a, 0)+
                    (
                        (COALESCE(final_rm_cost, 0) * ? / 100) +
                        (COALESCE(subtotal_a, 0) * ? / 100) +
                        (COALESCE(subtotal_a, 0) * ? / 100) +
                        (COALESCE(subtotal_a, 0) * ? / 100) +
                        (COALESCE(subtotal_a, 0) * ? / 100) +
                        (COALESCE(subtotal_a, 0) * ? / 100)
                    ),

                sales_profit_loss = COALESCE(customer_sales_cost, 0) -
                    (
                        COALESCE(subtotal_a, 0) +
                        (
                            (COALESCE(final_rm_cost, 0) * ? / 100) +
                            (COALESCE(subtotal_a, 0) * ? / 100) +
                            (COALESCE(subtotal_a, 0) * ? / 100) +
                            (COALESCE(subtotal_a, 0) * ? / 100) +
                            (COALESCE(subtotal_a, 0) * ? / 100) +
                            (COALESCE(subtotal_a, 0) * ? / 100)
                        )
                    ),

                monthly_profit_loss =(
                        COALESCE(customer_sales_cost, 0)-
                        (
                            COALESCE(subtotal_a, 0) +
                            (
                                (COALESCE(final_rm_cost, 0) * ? / 100) +
                                (COALESCE(subtotal_a, 0) * ? / 100) +
                                (COALESCE(subtotal_a, 0) * ? / 100) +
                                (COALESCE(subtotal_a, 0) * ? / 100) +
                                (COALESCE(subtotal_a, 0) * ? / 100) +
                                (COALESCE(subtotal_a, 0) * ? / 100)
                            )
                        )
                    )
                    *
                    COALESCE(monthly_quantity, 0),

                buying_profit_loss = COALESCE(customer_sales_cost, 0) -
                    (
                        COALESCE(subtotal_a, 0)+
                        (
                            (COALESCE(final_rm_cost, 0) * ? / 100) +
                            (COALESCE(subtotal_a, 0) * ? / 100) +
                            (COALESCE(subtotal_a, 0) * ? / 100) +
                            (COALESCE(subtotal_a, 0) * ? / 100) +
                            (COALESCE(subtotal_a, 0) * ? / 100) +
                            (COALESCE(subtotal_a, 0) * ? / 100)
                        )
                    ) -
                    COALESCE(buying_cost, 0)
            `,
            [
                // Margin percentages
                icc,
                rejection,
                overhead,
                profit,
                packaging,
                transport,

                // Individual margin costs
                icc,
                rejection,
                overhead,
                profit,
                packaging,
                transport,

                // Subtotal B
                icc,
                rejection,
                overhead,
                profit,
                packaging,
                transport,

                // Part Cost
                icc,
                rejection,
                overhead,
                profit,
                packaging,
                transport,

                // Sales P/L
                icc,
                rejection,
                overhead,
                profit,
                packaging,
                transport,

                // Monthly P/L
                icc,
                rejection,
                overhead,
                profit,
                packaging,
                transport,

                // Buying P/L
                icc,
                rejection,
                overhead,
                profit,
                packaging,
                transport,
            ]
        );


        // 6. COMMIT
        await connection.commit();
        return {
            recordsUpdated: updateResult.affectedRows,
            margins: {
                icc,
                rejection,
                overhead,
                profit,
                packaging,
                transport,
            },
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
