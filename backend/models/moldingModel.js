import zbcDB from "../config/zbcDB.js";

const getBopMonthlyRate = async ({
    bopErpCode,
    supplierId,
    financialYear,
    month,
}) => {
    if (
        !bopErpCode ||
        !supplierId ||
        !financialYear ||
        !month
    ) {
        return null;
    }

    const [rows] = await zbcDB.query(
        `
        SELECT rate
        FROM bop_monthly_report
        WHERE TRIM(bop_erp_code) = TRIM(?)
          AND supplier_id = ?
          AND financial_year = ?
          AND month = ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [
            String(bopErpCode).trim(),
            Number(supplierId),
            financialYear,
            Number(month),
        ],
    );

    return rows.length > 0 && rows[0].rate !== null
        ? Number(rows[0].rate)
        : null;
};

const generateTransactionId = async () => {
    const [rows] = await zbcDB.query(`
        SELECT transaction_id
        FROM molding_table
        WHERE transaction_id LIKE 'ML%'
        ORDER BY id DESC
        LIMIT 1
    `);

    let nextNumber = 1;

    if (rows.length > 0) {
        const lastTransactionId = rows[0].transaction_id;

        const lastNumber = parseInt(
            lastTransactionId.replace("ML", ""),
            10,
        );

        if (!Number.isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    return `ML${String(nextNumber).padStart(3, "0")}`;
};

export const createDraft = async (
    formData,
    bops,
) => {
    const connection =
        await zbcDB.getConnection();

    try {
        await connection.beginTransaction();

        const transactionId =
            await generateTransactionId();

        const [result] =
            await connection.query(
                `
                INSERT INTO molding_table (
                    transaction_id,
                    status,
                    financial_year,
                    month,
                    effective_date,
                    customer_name,
                    production_unit,
                    billing_unit,
                    sub_department,
                    sub_category,
                    part_no,
                    part_name,
                    fg_code,
                    im_code,
                    gross_weight,
                    net_weight,
                    loading_per,
                    has_bop,
                    polymer_name,
                    compound_code,
                    rm_im_code,
                    comp_month,
                    compound_rate,
                    total_rm_cost,
                    process_type,
                    machine_tonnage,
                    shift_rate,
                    total_cavity,
                    running_cavity,
                    cycle_time,
                    shift_time_efficiency,
                    efficiency,
                    total_shots,
                    total_production_per_shift,
                    platten_size,
                    tool_size,
                    process_cost_a,
                    post_curing,
                    finishing,
                    inspection,
                    shot_blasting,
                    vapour_degreasing,
                    chromating,
                    phospating,
                    adhesive,
                    painting,
                    cylindrical_grinding,
                    assembly_qty,
                    assembly_per_cost,
                    total_assembly_cost,
                    process_cost_b,
                    conversion_cost,
                    subtotal_a,
                    subtotal_b,
                    part_cost,
                    sell_cost,
                    icc_on_rm,
                    rej_on_subtotal,
                    oh_on_subtotal,
                    profit_on_subtotal,
                    packaging_on_subtotal,
                    transport_on_subtotal,
                    total_bop_cost,
                    final_rm_cost,
                    icc_on_rm_cost,
                    rej_on_subtotal_cost,
                    oh_on_subtotal_cost,
                    profit_on_subtotal_cost,
                    packaging_on_subtotal_cost,
                    transport_on_subtotal_cost,
                    customer_sales_cost,
                    sales_profit_loss,
                    buying_cost,
                    buying_profit_loss,
                    monthly_quantity,
                    monthly_profit_loss
                )
                VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                `,
                [

                    transactionId,
                    "DRAFT",
                    formData.financialYear,
                    formData.month,
                    formData.effectiveDate,
                    formData.customerName,
                    formData.productionUnit,
                    formData.billingUnit,
                    formData.subDepartment,
                    formData.subCategory,
                    formData.partNo,
                    formData.partName,
                    formData.fgcode,
                    formData.imCode,
                    formData.grossWeight,
                    formData.netWeight,
                    formData.loadingper,
                    formData.hasBop,
                    formData.polymerName,
                    formData.compoundCode,
                    formData.imCode,
                    formData.compMonth,
                    formData.compoundRate,
                    formData.totalRmCost,
                    formData.processType,
                    formData.machineTonnage,
                    formData.shiftRate,
                    formData.totalCavity,
                    formData.runningCavity,
                    formData.cycleTime,
                    formData.shiftTimeEfficiency,
                    formData.efficiency,
                    formData.totalShots,
                    formData.totalProductionPerShift,
                    formData.PlattenSize,
                    formData.toolSize,
                    formData.processCostA,
                    formData.postCuring,
                    formData.finishing,
                    formData.inspection,
                    formData.shotBlasting,
                    formData.vapourDegreasing,
                    formData.chromating,
                    formData.phospating,
                    formData.adhesive,
                    formData.painting,
                    formData.cylindricalGrinding,
                    formData.assemblyQty,
                    formData.assemblyPerCost,
                    formData.totalAssemblyCost,
                    formData.processCostB,
                    formData.conversionCost,
                    formData.subtotalA,
                    formData.subtotalB,
                    formData.partCost,

                    // sell_cost is NOT NULL in molding_table
                    formData.sellCost ?? formData.customerSalesCost ?? 0,

                    formData.iccOnRm,
                    formData.rejOnSubtotal,
                    formData.ohOnSubtotal,
                    formData.profitOnSubtotal,
                    formData.packagingOnSubtotal,
                    formData.transportOnSubtotal,
                    formData.totalBopCost,
                    formData.finalRmCost,
                    formData.iccOnRmCost,
                    formData.rejOnSubtotalCost,
                    formData.ohOnSubtotalCost,
                    formData.profitOnSubtotalCost,
                    formData.packagingOnSubtotalCost,
                    formData.transportOnSubtotalCost,
                    formData.customerSalesCost,
                    formData.salesProfitLoss,
                    formData.buyingCost,
                    formData.buyingProfitLoss,
                    formData.monthlyQuantity,
                    formData.monthlyProfitLoss
                ],
            );

        const moldingId =
            result.insertId;

        /*
        ========================================================
        SAVE BOP COSTING
        ========================================================

        BOP configuration itself is already stored in:

            bop_part_details

        Here we only update the latest costing values:

            financial_year
            bop_month
            bop_rate
            bop_cost

        Rate comes from:

            bop_monthly_report

        Formula:

            BOP Cost =
            Assembly Qty × Monthly Rate
        ========================================================
        */

        if (
            bops &&
            bops.length > 0
        ) {
            for (const bop of bops) {
                /*
                ------------------------------------------------
                BOP DETAIL ID IS REQUIRED
                ------------------------------------------------
                */
                if (!bop.id) {
                    continue;
                }

                const bopMonth =
                    bop.bopmonth || null;

                const bopAssemblyQty =
                    Number(
                        bop.bopAssemblyQty ??
                        bop.assembly_qty ??
                        bop.assemblyQty ??
                        0,
                    );

                /*
                ------------------------------------------------
                GET RATE FROM MONTHLY BOP REPORT
                ------------------------------------------------
                */
                const bopRate =
                    await getBopMonthlyRate({
                        bopErpCode:
                            bop.bopFgCode,

                        supplierId:
                            bop.supplierId,

                        financialYear:
                            formData.financialYear,

                        month:
                            bopMonth,
                    });

                /*
                ------------------------------------------------
                CALCULATE BOP COST
                ------------------------------------------------
                */
                const bopCost =
                    bopRate === null
                        ? null
                        : bopAssemblyQty *
                        bopRate;

                /*
                ------------------------------------------------
                UPDATE PERMANENT BOP DETAIL
                ------------------------------------------------
                */
                await connection.query(
                    `
                    UPDATE bop_part_details
                    SET
                        financial_year = ?,
                        bop_month = ?,
                        bop_rate = ?,
                        bop_cost = ?,
                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE id = ?
                    `,
                    [
                        formData.financialYear ||
                        null,

                        bopMonth,

                        bopRate,

                        bopCost,

                        bop.id,
                    ],
                );
            }
        }

        await connection.commit();

        return {
            id: moldingId,
            transactionId,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const updateDraft = async (
    transactionId,
    formData,
    bops,
) => {
    const connection =
        await zbcDB.getConnection();

    try {
        await connection.beginTransaction();

        const [result] =
            await connection.query(
                `
                UPDATE molding_table
                SET
                    financial_year = ?,
                    month = ?,
                    effective_date = ?,
                    customer_name = ?,
                    production_unit = ?,
                    billing_unit = ?,
                    sub_department = ?,
                    sub_category = ?,

                    part_no = ?,
                    part_name = ?,
                    fg_code = ?,
                    im_code = ?,

                    gross_weight = ?,
                    net_weight = ?,
                    loading_per = ?,

                    has_bop = ?,

                    polymer_name = ?,
                    compound_code = ?,
                    rm_im_code = ?,
                    comp_month = ?,
                    compound_rate = ?,
                    total_rm_cost = ?,

                    process_type = ?,
                    machine_tonnage = ?,
                    shift_rate = ?,
                    total_cavity = ?,
                    running_cavity = ?,
                    cycle_time = ?,
                    shift_time_efficiency = ?,
                    efficiency = ?,
                    total_shots = ?,
                    total_production_per_shift = ?,
                    platten_size = ?,
                    tool_size = ?,
                    process_cost_a = ?,

                    post_curing = ?,
                    finishing = ?,
                    inspection = ?,
                    assembly_qty = ?,
                    assembly_per_cost = ?,
                    total_assembly_cost = ?,
                    process_cost_b = ?,
                    conversion_cost = ?,
                    total_bop_cost = ?,
                    final_rm_cost = ?,

                    subtotal_a = ?,
                    subtotal_b = ?,

                    icc_on_rm = ?,
                    rej_on_subtotal = ?,
                    oh_on_subtotal = ?,
                    profit_on_subtotal = ?,
                    packaging_on_subtotal = ?,
                    transport_on_subtotal = ?,

                    icc_on_rm_cost = ?,
                    rej_on_subtotal_cost = ?,
                    oh_on_subtotal_cost = ?,
                    profit_on_subtotal_cost = ?,
                    packaging_on_subtotal_cost = ?,
                    transport_on_subtotal_cost = ?,

                    part_cost = ?,
                    customer_sales_cost = ?,
                    sales_profit_loss = ?,
                    buying_cost = ?,
                    buying_profit_loss = ?,
                    monthly_quantity = ?,
                    monthly_profit_loss = ?,

                    shot_blasting = ?,
                    vapour_degreasing = ?,
                    chromating = ?,
                    phospating = ?,
                    adhesive = ?,
                    painting = ?,
                    cylindrical_grinding = ?

                WHERE transaction_id = ?
                AND status = 'DRAFT'
                `,
                [
                    formData.financialYear,
                    formData.month,
                    formData.effectiveDate,
                    formData.customerName,
                    formData.productionUnit,
                    formData.billingUnit,
                    formData.subDepartment,
                    formData.subCategory,

                    formData.partNo,
                    formData.partName,
                    formData.fgcode,
                    formData.imcode,

                    formData.grossWeight,
                    formData.netWeight,
                    formData.loadingper,

                    formData.hasBop,

                    formData.polymerName,
                    formData.compoundCode,
                    formData.imCode,
                    formData.compMonth,
                    formData.compoundRate,
                    formData.totalRmCost,

                    formData.processType,
                    formData.machineTonnage,
                    formData.shiftRate,
                    formData.totalCavity,
                    formData.runningCavity,
                    formData.cycleTime,
                    formData.shiftTimeEfficiency,
                    formData.efficiency,
                    formData.totalShots,
                    formData.totalProductionPerShift,
                    formData.PlattenSize,
                    formData.toolSize,
                    formData.processCostA,

                    formData.postCuring,
                    formData.finishing,
                    formData.inspection,
                    formData.assemblyQty,
                    formData.assemblyPerCost,
                    formData.totalAssemblyCost,
                    formData.processCostB,
                    formData.conversionCost,
                    formData.totalBopCost,
                    formData.finalRmCost,

                    formData.subtotalA,
                    formData.subtotalB,

                    formData.iccOnRm,
                    formData.rejOnSubtotal,
                    formData.ohOnSubtotal,
                    formData.profitOnSubtotal,
                    formData.packagingOnSubtotal,
                    formData.transportOnSubtotal,

                    formData.iccOnRmCost,
                    formData.rejOnSubtotalCost,
                    formData.ohOnSubtotalCost,
                    formData.profitOnSubtotalCost,
                    formData.packagingOnSubtotalCost,
                    formData.transportOnSubtotalCost,

                    formData.partCost,
                    formData.customerSalesCost,
                    formData.salesProfitLoss,
                    formData.buyingCost,
                    formData.buyingProfitLoss,
                    formData.monthlyQuantity,
                    formData.monthlyProfitLoss,

                    formData.shotBlasting,
                    formData.vapourDegreasing,
                    formData.chromating,
                    formData.phospating,
                    formData.adhesive,
                    formData.painting,
                    formData.cylindricalGrinding,

                    transactionId,
                ],
            );

        if (result.affectedRows === 0) {
            throw new Error(
                "Draft not found or already submitted",
            );
        }

        /*
        ========================================================
        UPDATE BOP COSTING
        ========================================================

        We DO NOT delete or insert into
        molding_bop_table anymore.

        The permanent BOP mapping remains in
        bop_part_details.

        Only the latest costing values are updated.
        ========================================================
        */

        if (
            bops &&
            bops.length > 0
        ) {
            for (const bop of bops) {
                if (!bop.id) {
                    continue;
                }

                const bopMonth =
                    bop.bopmonth || null;

                const bopAssemblyQty =
                    Number(
                        bop.bopAssemblyQty ??
                        bop.assembly_qty ??
                        bop.assemblyQty ??
                        0,
                    );

                /*
                ------------------------------------------------
                GET MONTHLY RATE
                ------------------------------------------------
                */
                const bopRate =
                    await getBopMonthlyRate({
                        bopErpCode:
                            bop.bopFgCode,

                        supplierId:
                            bop.supplierId,

                        financialYear:
                            formData.financialYear,

                        month:
                            bopMonth,
                    });

                /*
                ------------------------------------------------
                CALCULATE COST
                ------------------------------------------------
                */
                const bopCost =
                    bopRate === null
                        ? null
                        : bopAssemblyQty *
                        bopRate;

                /*
                ------------------------------------------------
                UPDATE BOP MASTER MAPPING
                ------------------------------------------------
                */
                await connection.query(
                    `
                    UPDATE bop_part_details
                    SET
                        financial_year = ?,
                        bop_month = ?,
                        bop_rate = ?,
                        bop_cost = ?,
                        updated_at =
                            CURRENT_TIMESTAMP

                    WHERE id = ?
                    `,
                    [
                        formData.financialYear ||
                        null,

                        bopMonth,

                        bopRate,

                        bopCost,

                        bop.id,
                    ],
                );
            }
        }

        await connection.commit();

        return {
            transactionId,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const submitFinal = async (
    transactionId,
) => {
    const [result] =
        await zbcDB.query(
            `
            UPDATE molding_table
            SET status = 'FINAL'

            WHERE transaction_id = ?
            AND status = 'DRAFT'
            `,
            [transactionId],
        );

    if (result.affectedRows === 0) {
        throw new Error(
            "Draft not found or already submitted",
        );
    }

    return {
        transactionId,
        status: "FINAL",
    };
};