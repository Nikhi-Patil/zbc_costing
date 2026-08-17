import zbcDB from "../config/zbcDB.js";

const generateTransactionId = async () => {
    const [rows] = await zbcDB.query(
        `
        SELECT transaction_id
        FROM molding_table
        WHERE transaction_id LIKE 'ML%'
        ORDER BY id DESC
        LIMIT 1
        `
    );

    let nextNumber = 1;

    if (rows.length > 0) {
        const lastTransactionId = rows[0].transaction_id;

        const lastNumber = parseInt(
            lastTransactionId.replace("ML", ""),
            10
        );

        nextNumber = lastNumber + 1;
    }

    return `ML${String(nextNumber).padStart(6, "0")}`;
};

export const createDraft = async (formData, bops) => {

    const connection = await zbcDB.getConnection();

    try {

        await connection.beginTransaction();

        const transactionId = await generateTransactionId();

        const [result] = await connection.query(
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
    total_bop_cost,
    final_rm_cost,

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
    assembly_qty,
    assembly_per_cost,
    total_assembly_cost,
    process_cost_b,
    conversion_cost,

    icc_on_rm,
    rej_on_subtotal,
    oh_on_subtotal,
    profit_on_subtotal,
    packaging_on_subtotal,
    transport_on_subtotal,

    icc_on_rm_cost,
    rej_on_subtotal_cost,
    oh_on_subtotal_cost,
    profit_on_subtotal_cost,
    packaging_on_subtotal_cost,
    transport_on_subtotal_cost,
    part_cost

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

                formData.totalBopCost,
                formData.finalRmCost,

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
                formData.partCost

            ]
        );

        const moldingId = result.insertId;

        // Save BOPs
        if (bops && bops.length > 0) {

            for (const bop of bops) {

                await connection.query(
                    `INSERT INTO molding_bop_table (
                        molding_id,
                        bop_part_no,
                        bop_part_name,
                        commodity,
                        supplier_id,
                        bop_assembly_qty,
                        bop_fg_code,
                        bop_month,
                        bop_rate,
                        bop_cost
                    )VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        moldingId,
                        bop.bopPartNo || null,
                        bop.bopPartName || null,
                        bop.commodity || null,
                        bop.supplierId
                            ? Number(bop.supplierId)
                            : null,
                        bop.bopAssemblyQty
                            ? Number(bop.bopAssemblyQty)
                            : null,
                        bop.bopFgCode || null,
                        bop.bopmonth || null,
                        bop.bopRate
                            ? Number(bop.bopRate)
                            : null,
                        (
                            (Number(bop.bopAssemblyQty) || 0) *
                            (Number(bop.bopRate) || 0)
                        ).toFixed(2)
                    ]
                );
            }
        }

        await connection.commit();

        return {
            id: moldingId,
            transactionId
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
    bops
) => {

    const connection = await zbcDB.getConnection();

    try {

        await connection.beginTransaction();

        const [result] = await connection.query(
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

                icc_on_rm = ?,
                rej_on_subtotal = ?,
                oh_on_subtotal = ?,
                profit_on_subtotal = ?,
                packaging_on_subtotal = ?,
                transport_on_subtotal = ?,
                icc_on_rm_cost = ?,
                rej_on_subtotal_cost= ?,
                oh_on_subtotal_cost = ?,
                profit_on_subtotal_cost = ?,
                packaging_on_subtotal_cost = ?,
                transport_on_subtotal_cost = ?,
                part_cost=?


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

                transactionId
            ]
        );

        if (result.affectedRows === 0) {
            throw new Error(
                "Draft not found or already submitted"
            );
        }

        // Remove old BOPs
        await connection.query(
            `
            DELETE FROM molding_bop_table
            WHERE molding_id = (
                SELECT id
                FROM molding_table
                WHERE transaction_id = ?
            )
            `,
            [transactionId]
        );

        // Get molding ID
        const [rows] = await connection.query(
            `
            SELECT id
            FROM molding_table
            WHERE transaction_id = ?
            `,
            [transactionId]
        );

        const moldingId = rows[0].id;

        // Insert current BOPs
        if (bops && bops.length > 0) {

            for (const bop of bops) {

                await connection.query(
                    `INSERT INTO molding_bop_table (
                        molding_id,
                        bop_part_no,
                        bop_part_name,
                        commodity,
                        supplier_id,
                        bop_assembly_qty,
                        bop_fg_code,
                        bop_month,
                        bop_rate,
                        bop_cost
                    )VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        moldingId,
                        bop.bopPartNo || null,
                        bop.bopPartName || null,
                        bop.commodity || null,
                        bop.supplierId
                            ? Number(bop.supplierId)
                            : null,
                        bop.bopAssemblyQty
                            ? Number(bop.bopAssemblyQty)
                            : null,
                        bop.bopFgCode || null,
                        bop.bopmonth || null,
                        bop.bopRate
                            ? Number(bop.bopRate)
                            : null,
                        (
                            (Number(bop.bopAssemblyQty) || 0) *
                            (Number(bop.bopRate) || 0)
                        ).toFixed(2)
                    ]
                );
            }
        }

        await connection.commit();

        return {
            transactionId
        };

    } catch (error) {

        await connection.rollback();
        throw error;

    } finally {

        connection.release();
    }
};

export const submitFinal = async (transactionId) => {

    const [result] = await zbcDB.query(
        `
        UPDATE molding_table
        SET status = 'FINAL'
        WHERE transaction_id = ?
        AND status = 'DRAFT'
        `,
        [transactionId]
    );

    if (result.affectedRows === 0) {
        throw new Error(
            "Draft not found or already submitted"
        );
    }

    return {
        transactionId,
        status: "FINAL"
    };
};