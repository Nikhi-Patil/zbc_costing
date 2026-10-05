import zbcDB from "../config/zbcDB.js";
import adminDB from "../config/adminDB.js";

/* HELPERS */
const n = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number)
        ? number
        : fallback;
};

const text = (value) => {
    return String(value ?? "").trim();
};
const round2 = (value) => {
    return Number(n(value).toFixed(2));
};

/* MASTER LOOKUP */
const resolveMaster = async (table, nameField, value, label) => {
    const raw = text(value);
    if (!raw) {
        throw new Error(`${label} is required.`);
    }
    /* First try ID */
    if (/^\d+$/.test(raw)) {
        const [idRows] = await adminDB.query(`
            SELECT id
            FROM ${table}
            WHERE id = ?
            LIMIT 1 `,
            [Number(raw)]
        );
        if (idRows.length) {
            return Number(idRows[0].id);
        }
    }

    /* Then try name */
    const [rows] = await adminDB.query(`
        SELECT id
        FROM ${table}
        WHERE LOWER(TRIM(${nameField}))
              = LOWER(TRIM(?))
        LIMIT 1 `,
        [raw]
    );

    if (!rows.length) {
        throw new Error(`${label} '${raw}' was not found in ${table}.`);
    }
    return Number(rows[0].id);
};


/* PART MASTER */
const getPart = async (partNo) => {
    const value = text(partNo);
    const [rows] = await adminDB.query(`
        SELECT id, part_no, part_name, fg_code, im_code, sub_department_id
        FROM part_master
        WHERE LOWER(TRIM(part_no))
              = LOWER(TRIM(?))
        LIMIT 1 `,
        [value]
    );
    if (!rows.length) {
        throw new Error(`Part No '${value}' was not found in Part Master.`);
    }
    return rows[0];
};


/* COMPOUND + MONTHLY RATE */
const getCompound = async ({ partImCode, unitId, financialYear, month }) => {
    if (!partImCode) {
        throw new Error("Part Master IM Code is missing.");
    }
    const [compoundRows] =
        await adminDB.query(`
            SELECT
                id,
                compound_code,
                polymer,
                im_code
            FROM compound_master
            WHERE LOWER(TRIM(im_code))
                  = LOWER(TRIM(?))
            ORDER BY id DESC
            LIMIT 1 `,
            [text(partImCode)]
        );
    if (!compoundRows.length) {
        throw new Error(`No Compound Master found for IM Code '${text(partImCode)}'.`);
    }

    const compound = compoundRows[0];
    const [rateRows] =
        await zbcDB.query(`
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
            WHERE LOWER(TRIM(compound_code))
                  = LOWER(TRIM(?))
              AND LOWER(TRIM(polymer_name))
                  =  LOWER(TRIM(?))
              AND LOWER(TRIM(im_code))
                  = LOWER(TRIM(?))
              AND unit_id = ?
              AND TRIM(financial_year)
                  = TRIM(?)
              AND month = ?
            ORDER BY id DESC
            LIMIT 1 `,
            [
                compound.compound_code,
                compound.polymer,
                compound.im_code,
                Number(unitId),
                text(financialYear),
                Number(month)
            ]
        );

    if (!rateRows.length) {
        return {
            compoundId: Number(compound.id),
            compoundCode: compound.compound_code || "",
            polymerName: compound.polymer || "",
            rmImCode: compound.im_code || partImCode,
            compoundRate: 0
        };
    }

    return {
        compoundId: Number(compound.id),
        compoundCode: compound.compound_code || "",
        polymerName: compound.polymer || "",
        rmImCode: compound.im_code || partImCode,
        compoundRate: n(rateRows[0].rate)
    };
};

/* BOP DATA */
const getBopsForPart = async ({ partNo, financialYear, month }) => {
    const [rows] = await zbcDB.query(`
        SELECT
            id,
            part_no,
            part_id,
            part_name,
            fg_code,
            bop_id,
            bop_fg_code,
            bop_part_no,
            bop_part_name,
            commodity,
            supplier_id,
            supplier_name,
            assembly_qty
        FROM bop_part_details
        WHERE LOWER(TRIM(part_no))
              = LOWER(TRIM(?))
        ORDER BY id ASC `,
        [text(partNo)]
    );

    const result = [];
    for (const bop of rows) {
        const assemblyQty = n(bop.assembly_qty);
        const erpCode = text(bop.bop_fg_code);
        if (!erpCode) {
            throw new Error(`BOP ERP Code is missing for BOP ID '${bop.bop_id}'.`);
        }

        if (!bop.supplier_id) {
            throw new Error(`Supplier is missing for BOP '${erpCode}'.`);
        }

        const [rateRows] =
            await zbcDB.query(`
                SELECT rate
                FROM bop_monthly_report
                WHERE TRIM(bop_erp_code)
                      = TRIM(?)
                  AND supplier_id = ?
                  AND TRIM(financial_year)
                      = TRIM(?)
                  AND month = ?
                ORDER BY id DESC
                LIMIT 1 `,
                [
                    erpCode,
                    Number(bop.supplier_id),
                    text(financialYear),
                    Number(month)
                ]
            );

        const rate = rateRows.length
            ? n(rateRows[0].rate)
            : 0;

        const bopCost = round2(assemblyQty * rate);

        result.push({
            ...bop,
            bopAssemblyQty: assemblyQty,
            bopRate: rate,
            bopCost: bopCost
        });
    }
    return result;
};

/* SALES MONTHLY */
const getSalesMonthly = async ({ partNo, billingUnitId, financialYear, month }) => {
    const [rows] =
        await zbcDB.query(`
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
            WHERE LOWER(TRIM(part_no))
                  =  LOWER(TRIM(?))
              AND unit_id = ?
              AND TRIM(financial_year)
                  = TRIM(?)
              AND month = ?
            ORDER BY id DESC
            LIMIT 1 `,
            [
                text(partNo),
                Number(billingUnitId),
                text(financialYear),
                Number(month)
            ]
        );

    if (!rows.length) {
        return {
            monthlyQuantity: 0,
            customerSalesCost: 0
        };
    }

    return {
        monthlyQuantity: n(rows[0].qty),
        customerSalesCost: n(rows[0].sell_rate)
    };
};


/* MACHINE MASTER */

const getMachine = async ({ processType, machineTonnage }) => {
    const [rows] =
        await adminDB.query(`
            SELECT  id, machine_list, shift_rate,  molding_process
            FROM molding_machine_master
            WHERE LOWER(TRIM(molding_process))
                  =  LOWER(TRIM(?))
              AND LOWER(TRIM(machine_list))
                  = LOWER(TRIM(?))
            LIMIT 1  `,
            [
                text(processType),
                text(machineTonnage)
            ]
        );
    if (!rows.length) {
        throw new Error(
            `Machine '${text(machineTonnage)}' ` +
            `for Process Type '${text(processType)}' ` +
            `was not found in Molding Machine Master.`
        );
    }
    return rows[0];
};

/* CALCULATE ONE EXCEL ROW */
export const buildCalculatedRow = async (entry) => {
    const financialYear = text(entry.financialYear);
    const month = Number(entry.startMonth);
    const partNo = text(entry.partNo);

    /* BASIC VALIDATION */
    if (!financialYear) {
        throw new Error("Financial Year is required.");
    }

    if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
    ) {

        throw new Error(
            "Month must be between 1 and 12."
        );
    }


    if (!partNo) {

        throw new Error(
            "Part No is required."
        );
    }


    /*
     * PART
     */

    const part =
        await getPart(partNo);


    /*
     * UNITS
     */

    const productionUnit =
        await resolveMaster(
            "unit_master",
            "unit",
            entry.productionUnit,
            "Production Unit"
        );


    const billingUnit =
        await resolveMaster(
            "unit_master",
            "unit",
            entry.billingUnit,
            "Billing Unit"
        );


    /*
     * SUB DEPARTMENT
     */

    let subDepartment;

    if (entry.subDepartment) {

        subDepartment =
            await resolveMaster(
                "sub_department_master",
                "sub_department_name",
                entry.subDepartment,
                "Sub Department"
            );

    } else {

        subDepartment =
            Number(part.sub_department_id) ||
            null;
    }


    /*
     * SUB CATEGORY
     */

    const subCategory =
        await resolveMaster(
            "sub_category_master",
            "sub_category_name",
            entry.subCategory,
            "Sub Category"
        );


    /*
     * CUSTOMER
     */

    const customer =
        await resolveMaster(
            "customer_master",
            "customer_name",
            entry.customer,
            "Customer"
        );


    /*
     * COMPOUND
     */

    const compound =
        await getCompound({
            partImCode:
                part.im_code,

            unitId:
                productionUnit,

            financialYear,

            month
        });


    /*
     * BOP
     */

    const bops =
        await getBopsForPart({
            partNo,

            financialYear,

            month
        });


    const totalAssemblyQty =
        bops.reduce(
            (sum, bop) =>
                sum + n(bop.bopAssemblyQty),
            0
        );


    const totalBopCost =
        bops.reduce(
            (sum, bop) =>
                sum + n(bop.bopCost),
            0
        );


    /*
     * MACHINE
     */

    const machine =
        await getMachine({
            processType:
                entry.processType,

            machineTonnage:
                entry.machineTonnage
        });


    const shiftRate =
        n(machine.shift_rate);


    /*
     * BASIC WEIGHT
     */

    const grossWeight =
        n(entry.grossWeight);

    const netWeight =
        n(entry.netWeight);


    const loadingPer =
        netWeight !== 0
            ? round2(
                (
                    (grossWeight - netWeight)
                    /
                    netWeight
                ) * 100
            )
            : 0;


    /*
     * RM COST
     *
     * Gross Weight × Compound Rate / 1000
     */

    const totalRmCost =
        round2(
            (
                grossWeight
                *
                n(compound.compoundRate)
            ) / 1000
        );


    /*
     * PROCESS CALCULATION
     */

    const shiftTimeEfficiency =
        n(entry.shiftTimeEfficiency);

    const cycleTime =
        n(entry.cycleTime);

    const runningCavity =
        n(entry.runningCavity);


    const efficiency =
        round2(
            60 *
            8 *
            (
                shiftTimeEfficiency / 100
            )
        );


    const totalShots =
        cycleTime > 0
            ? round2(
                efficiency /
                cycleTime
            )
            : 0;


    const totalProductionPerShift =
        round2(
            runningCavity *
            totalShots
        );


    const processCostA =
        totalShots > 0 &&
            runningCavity > 0

            ? round2(
                shiftRate /
                totalShots /
                runningCavity
            )

            : 0;


    /*
     * BOP / ASSEMBLY
     */

    const hasBop =
        bops.length > 0
            ? "Yes"
            : "No";


    const assemblyPerCost =
        hasBop === "Yes"
            ? n(entry.assemblyPerCost)
            : 0;


    const totalAssemblyCost =
        round2(
            totalAssemblyQty *
            assemblyPerCost
        );


    /*
     * PROCESS COST B
     */

    const processCostB =
        round2(

            n(entry.postCuring) +

            n(entry.finishing) +

            n(entry.inspection) +

            n(entry.shotBlasting) +

            n(entry.vapourDegreasing) +

            n(entry.chromating) +

            n(entry.phospating) +

            n(entry.adhesive) +

            n(entry.painting) +

            n(entry.cylindricalGrinding)

        );


    /*
     * CONVERSION COST
     */

    const conversionCost =
        round2(
            processCostA +
            totalAssemblyCost +
            processCostB
        );


    /*
     * FINAL RM
     */

    const finalRmCost =
        round2(
            totalRmCost +
            totalBopCost
        );


    /*
     * SUBTOTAL A
     */

    const subtotalA =
        round2(
            finalRmCost +
            conversionCost
        );


    /*
     * BOTTOM LINE %
     */

    const iccOnRm =
        n(entry.icc);

    const rejOnSubtotal =
        n(entry.rejection);

    const ohOnSubtotal =
        n(entry.oh);

    const profitOnSubtotal =
        n(entry.profit);

    const packagingOnSubtotal =
        n(entry.packaging);

    const transportOnSubtotal =
        n(entry.transport);


    /*
     * BOTTOM LINE COST
     */

    const iccOnRmCost =
        round2(
            (
                finalRmCost *
                iccOnRm
            ) / 100
        );


    const rejOnSubtotalCost =
        round2(
            (
                subtotalA *
                rejOnSubtotal
            ) / 100
        );


    const ohOnSubtotalCost =
        round2(
            (
                subtotalA *
                ohOnSubtotal
            ) / 100
        );


    const profitOnSubtotalCost =
        round2(
            (
                subtotalA *
                profitOnSubtotal
            ) / 100
        );


    const packagingOnSubtotalCost =
        round2(
            (
                subtotalA *
                packagingOnSubtotal
            ) / 100
        );


    const transportOnSubtotalCost =
        round2(
            (
                subtotalA *
                transportOnSubtotal
            ) / 100
        );


    /*
     * SUBTOTAL B
     */

    const subtotalB =
        round2(

            iccOnRmCost +

            rejOnSubtotalCost +

            ohOnSubtotalCost +

            profitOnSubtotalCost +

            packagingOnSubtotalCost +

            transportOnSubtotalCost

        );


    /*
     * PART COST
     */

    const partCost =
        round2(
            subtotalA +
            subtotalB
        );


    /*
     * SALES MONTHLY
     */

    const sales =
        await getSalesMonthly({

            partNo,

            billingUnitId:
                billingUnit,

            financialYear,

            month

        });


    const customerSalesCost =
        round2(
            sales.customerSalesCost
        );


    const monthlyQuantity =
        round2(
            sales.monthlyQuantity
        );


    /*
     * SALES PROFIT / LOSS
     */

    const salesProfitLoss =
        round2(
            customerSalesCost -
            partCost
        );


    const monthlyProfitLoss =
        round2(
            salesProfitLoss *
            monthlyQuantity
        );


    /*
     * BUYING
     */

    const buyingCost =
        n(entry.buyingCost);


    const buyingProfitLoss =
        round2(
            customerSalesCost -
            partCost -
            buyingCost
        );


    /*
     * RETURN COMPLETE ROW
     */

    return {
        transactionId: null,
        status: "DRAFT",
        financialYear,
        month,
        effectiveDate: entry.effectiveDate || null,
        customerName: customer,
        productionUnit,
        billingUnit,
        subDepartment,
        subCategory,
        partNo: part.part_no,
        partName: part.part_name || "",
        fgcode: part.fg_code || "",
        /*
         * User-uploaded Production IM Code
         */
        imcode: text(entry.productionImCode),
        grossWeight,
        netWeight,
        loadingper: loadingPer,
        hasBop,
        polymerName: compound.polymerName,
        compoundCode: compound.compoundCode,
        rmImCode: compound.rmImCode,
        compMonth: month,
        compoundRate: compound.compoundRate,
        totalRmCost,
        processType: machine.molding_process || text(entry.processType),
        machineTonnage: machine.machine_list || text(entry.machineTonnage),
        shiftRate,
        totalCavity: n(entry.totalCavity),
        runningCavity,
        cycleTime,
        shiftTimeEfficiency,
        efficiency,
        totalShots,
        totalProductionPerShift,
        PlattenSize: text(entry.plattenSize),
        toolSize: text(entry.toolSize),
        processCostA,
        postCuring: n(entry.postCuring),
        finishing: n(entry.finishing),
        inspection: n(entry.inspection),
        shotBlasting: n(entry.shotBlasting),
        vapourDegreasing: n(entry.vapourDegreasing),
        chromating: n(entry.chromating),
        phospating: n(entry.phospating),
        adhesive: n(entry.adhesive),
        painting: n(entry.painting),
        cylindricalGrinding: n(entry.cylindricalGrinding),
        assemblyQty: totalAssemblyQty,
        assemblyPerCost,
        totalAssemblyCost,
        processCostB,
        conversionCost,
        subtotalA,
        subtotalB,
        partCost,
        iccOnRm,
        rejOnSubtotal,
        ohOnSubtotal,
        profitOnSubtotal,
        packagingOnSubtotal,
        transportOnSubtotal,
        totalBopCost,
        finalRmCost,
        iccOnRmCost,
        rejOnSubtotalCost,
        ohOnSubtotalCost,
        profitOnSubtotalCost,
        packagingOnSubtotalCost,
        transportOnSubtotalCost,
        customerSalesCost,
        salesProfitLoss,
        buyingCost,
        buyingProfitLoss,
        monthlyQuantity,
        monthlyProfitLoss,
        bops
    };
};


/* TRANSACTION ID */
const generateNextTransactionId =
    async (connection) => {

        const [rows] =
            await connection.query(
                `
                SELECT transaction_id
                FROM molding_table

                WHERE transaction_id LIKE 'ML%'

                ORDER BY id DESC
                LIMIT 1
                `
            );


        let nextNumber = 1;


        if (rows.length) {

            const lastNumber =
                parseInt(
                    String(
                        rows[0].transaction_id
                    ).replace(
                        /^ML/i,
                        ""
                    ),
                    10
                );


            if (
                !Number.isNaN(
                    lastNumber
                )
            ) {

                nextNumber =
                    lastNumber + 1;
            }
        }


        return (
            "ML" +
            String(nextNumber)
                .padStart(3, "0")
        );
    };


/*
|--------------------------------------------------------------------------
| INSERT
|--------------------------------------------------------------------------
*/

const insertCalculatedRow =
    async (
        connection,
        row
    ) => {

        const transactionId =
            await generateNextTransactionId(
                connection
            );


        const values = [

            transactionId,

            "DRAFT",

            row.financialYear,

            row.month,

            row.effectiveDate,

            row.customerName,

            row.productionUnit,

            row.billingUnit,

            row.subDepartment,

            row.subCategory,

            row.partNo,

            row.partName,

            row.fgcode,

            row.imcode,

            row.grossWeight,

            row.netWeight,

            row.loadingper,

            row.hasBop,

            row.polymerName,

            row.compoundCode,

            row.rmImCode,

            row.compMonth,

            row.compoundRate,

            row.totalRmCost,

            row.processType,

            row.machineTonnage,

            row.shiftRate,

            row.totalCavity,

            row.runningCavity,

            row.cycleTime,

            row.shiftTimeEfficiency,

            row.efficiency,

            row.totalShots,

            row.totalProductionPerShift,

            row.PlattenSize,

            row.toolSize,

            row.processCostA,

            row.postCuring,

            row.finishing,

            row.inspection,

            row.shotBlasting,

            row.vapourDegreasing,

            row.chromating,

            row.phospating,

            row.adhesive,

            row.painting,

            row.cylindricalGrinding,

            row.assemblyQty,

            row.assemblyPerCost,

            row.totalAssemblyCost,

            row.processCostB,

            row.conversionCost,

            row.subtotalA,

            row.subtotalB,

            row.partCost,


            row.iccOnRm,

            row.rejOnSubtotal,

            row.ohOnSubtotal,

            row.profitOnSubtotal,

            row.packagingOnSubtotal,

            row.transportOnSubtotal,

            row.totalBopCost,

            row.finalRmCost,

            row.iccOnRmCost,

            row.rejOnSubtotalCost,

            row.ohOnSubtotalCost,

            row.profitOnSubtotalCost,

            row.packagingOnSubtotalCost,

            row.transportOnSubtotalCost,

            row.customerSalesCost,

            row.salesProfitLoss,

            row.buyingCost,

            row.buyingProfitLoss,

            row.monthlyQuantity,

            row.monthlyProfitLoss

        ];


        const placeholders =
            new Array(
                values.length
            )
                .fill("?")
                .join(", ");


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
                    ${placeholders}
                )
                `,

                values
            );


        /*
         * Update BOP master/detail
         * with the selected FY/month/rate/cost.
         */

        for (
            const bop of row.bops
        ) {

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
                    row.financialYear,

                    row.month,

                    bop.bopRate,

                    bop.bopCost,

                    bop.id
                ]
            );
        }


        return {

            id:
                result.insertId,

            transactionId

        };
    };


/*
|--------------------------------------------------------------------------
| BULK CREATE
|--------------------------------------------------------------------------
*/
export const calculateMoldingBulk = async (entries) => {
    if (!Array.isArray(entries) || !entries.length) {
        throw new Error("At least one Excel row is required.");
    }

    if (entries.length > 5000) {
        throw new Error("Maximum 5000 rows can be uploaded at once.");
    }

    const calculatedRows = [];
    const errors = [];

    for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];

        try {
            const calculatedRow = await buildCalculatedRow(entry);

            calculatedRows.push({
                excelRow: Number(entry?.excelRow) || index + 2,
                ...calculatedRow,
            });
        } catch (error) {
            errors.push({
                row: Number(entry?.excelRow) || index + 2,
                message: error.message,
            });
        }
    }

    return {
        success: errors.length === 0,
        calculated: calculatedRows.length,
        totalRows: entries.length,
        errors,
        rows: calculatedRows,
    };
};

export const bulkCreateMolding =
    async (entries) => {

        if (
            !Array.isArray(entries) ||
            !entries.length
        ) {

            throw new Error(
                "At least one Excel row is required."
            );
        }


        if (
            entries.length > 5000
        ) {

            throw new Error(
                "Maximum 5000 rows can be uploaded at once."
            );
        }


        /*
         * IMPORTANT:
         *
         * Calculate every row FIRST.
         *
         * We do not begin DB write transaction
         * until every row is valid.
         */

        const calculatedRows = [];

        const errors = [];


        for (
            let index = 0;
            index < entries.length;
            index++
        ) {

            const entry =
                entries[index];


            try {

                const calculated =
                    await buildCalculatedRow(
                        entry
                    );


                calculatedRows.push(
                    calculated
                );

            } catch (error) {

                errors.push({

                    row:
                        Number(
                            entry?.excelRow
                        ) ||
                        index + 2,

                    partNo:
                        text(
                            entry?.partNo
                        ),

                    message:
                        error.message

                });
            }
        }


        /*
         * DO NOT SAVE IF ANY ERROR
         */

        if (errors.length) {

            return {

                success: false,

                errors,

                count: 0,

                transactions: []

            };
        }


        /*
         * DATABASE TRANSACTION
         */

        const connection =
            await zbcDB.getConnection();


        try {

            await connection.beginTransaction();


            const transactions = [];


            for (
                const row
                of calculatedRows
            ) {

                const saved =
                    await insertCalculatedRow(
                        connection,
                        row
                    );


                transactions.push(
                    saved
                );
            }


            await connection.commit();


            return {

                success: true,

                count:
                    transactions.length,

                transactions

            };


        } catch (error) {

            await connection.rollback();

            throw error;


        } finally {

            connection.release();
        }
    };