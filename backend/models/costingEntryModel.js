import zbcDB from "../config/zbcDB.js";

/**
 * Generate Employee Costing Entry ID
 *
 * Example:
 * CE000001
 * CE000002
 * CE000003
 */
const generateEntryId = async () => {
    const [rows] = await zbcDB.query(
        `
        SELECT entry_id
        FROM costing_entry_table
        WHERE entry_id LIKE 'CE%'
        ORDER BY id DESC
        LIMIT 1
        `
    );

    let nextNumber = 1;

    if (rows.length > 0 && rows[0].entry_id) {
        const lastEntryId = rows[0].entry_id;

        const lastNumber = parseInt(
            lastEntryId.replace("CE", ""),
            10
        );

        if (!Number.isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
        }
    }

    return `CE${String(nextNumber).padStart(6, "0")}`;
};


/**
 * Create new Costing Entry
 */
export const createCostingEntry = async (formData) => {

    const connection = await zbcDB.getConnection();

    try {

        await connection.beginTransaction();

        // Generate Entry ID
        const entryId = await generateEntryId();

        const [result] = await connection.query(
            `
            INSERT INTO costing_entry_table (

                entry_id,

                financial_year,
                month,
                effective_date,

                customer_name,
                production_unit,
                billing_unit,
                sub_department,
                sub_category,

                part_no,
                net_weight,
                gross_weight,
                has_bop,
                comp_month,

                process_type,
                machine_tonnage,
                total_cavity,
                running_cavity,
                cycle_time,
                platten_size,
                tool_size,

                monthly_quantity

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

                ?
            )
            `,
            [

                entryId,

                formData.financialYear,
                formData.month,
                formData.effectiveDate,

                formData.customerName,
                formData.productionUnit,
                formData.billingUnit,
                formData.subDepartment,
                formData.subCategory,

                formData.partNo,
                formData.netWeight,
                formData.grossWeight,
                formData.hasBop,
                formData.compMonth,

                formData.processType,
                formData.machineTonnage,
                formData.totalCavity,
                formData.runningCavity,
                formData.cycleTime,
                formData.PlattenSize,
                formData.toolSize,

                formData.monthlyQuantity

            ]
        );

        await connection.commit();

        return {
            id: result.insertId,
            entryId
        };

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }
};


/**
 * Get all Costing Entries
 */
export const getCostingEntries = async () => {

    const [rows] = await zbcDB.query(
        `
        SELECT
            id,
            entry_id,

            financial_year,
            month,
            effective_date,

            customer_name,
            production_unit,
            billing_unit,
            sub_department,
            sub_category,

            part_no,
            net_weight,
            gross_weight,
            has_bop,
            comp_month,

            process_type,
            machine_tonnage,
            total_cavity,
            running_cavity,
            cycle_time,
            platten_size,
            tool_size,

            monthly_quantity,

            created_at,
            updated_at

        FROM costing_entry_table

        ORDER BY id DESC
        `
    );

    return rows;
};


/**
 * Get Costing Entry by Entry ID
 */
export const getCostingEntryById = async (entryId) => {

    const [rows] = await zbcDB.query(
        `
        SELECT
            *
        FROM costing_entry_table
        WHERE entry_id = ?
        LIMIT 1
        `,
        [entryId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
};


/**
 * Update Costing Entry
 */
export const updateCostingEntry = async (
    entryId,
    formData
) => {

    const [result] = await zbcDB.query(
        `
        UPDATE costing_entry_table
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
            net_weight = ?,
            gross_weight = ?,
            has_bop = ?,
            comp_month = ?,

            process_type = ?,
            machine_tonnage = ?,
            total_cavity = ?,
            running_cavity = ?,
            cycle_time = ?,
            platten_size = ?,
            tool_size = ?,

            monthly_quantity = ?

        WHERE entry_id = ?
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
            formData.netWeight,
            formData.grossWeight,
            formData.hasBop,
            formData.compMonth,

            formData.processType,
            formData.machineTonnage,
            formData.totalCavity,
            formData.runningCavity,
            formData.cycleTime,
            formData.PlattenSize,
            formData.toolSize,

            formData.monthlyQuantity,

            entryId

        ]
    );

    if (result.affectedRows === 0) {
        throw new Error(
            "Costing entry not found"
        );
    }

    return {
        entryId
    };
};


/**
 * Delete Costing Entry
 */
export const deleteCostingEntry = async (entryId) => {

    const [result] = await zbcDB.query(
        `
        DELETE FROM costing_entry_table
        WHERE entry_id = ?
        `,
        [entryId]
    );

    if (result.affectedRows === 0) {
        throw new Error(
            "Costing entry not found"
        );
    }

    return {
        entryId
    };
};