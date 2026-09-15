import {
    createDraft,
    updateDraft,
    submitFinal
} from "../models/moldingModel.js";

import zbcDB from "../config/zbcDB.js";
import adminDB from "../config/adminDB.js";


// ============================================================
// SAVE DRAFT
// ============================================================

export const saveDraft = async (req, res) => {
    try {
        const {
            formData,
            bops,
            transactionId
        } = req.body;

        let result;

        if (transactionId) {
            result = await updateDraft(
                transactionId,
                formData,
                bops
            );
        } else {
            result = await createDraft(
                formData,
                bops
            );
        }

        res.status(200).json({
            message: "Draft saved successfully",
            ...result
        });

    } catch (error) {
        console.error(
            "Error saving draft:",
            error
        );

        res.status(500).json({
            message: "Failed to save draft",
            error: error.message
        });
    }
};


// ============================================================
// FINAL SUBMIT
// ============================================================

export const finalSubmit = async (req, res) => {
    try {
        const {
            transactionId
        } = req.body;

        if (!transactionId) {
            return res.status(400).json({
                message: "Transaction ID is required"
            });
        }

        const result =
            await submitFinal(transactionId);

        res.status(200).json({
            message:
                "Costing submitted successfully",
            ...result
        });

    } catch (error) {
        console.error(
            "Error submitting costing:",
            error
        );

        res.status(500).json({
            message:
                "Failed to submit costing",
            error: error.message
        });
    }
};


// ============================================================
// GET ALL MOLDING TRANSACTIONS
// ============================================================

export const getMoldingTransactions = async (
    req,
    res
) => {
    try {

        // ====================================================
        // 1. GET TRANSACTION DATA
        // ====================================================

        const [moldingRows] =
            await zbcDB.query(`
                SELECT
                    transaction_id,
                    customer_name,
                    production_unit,
                    billing_unit,
                    sub_category,
                    part_no,
                    part_cost,
                    customer_sales_cost,
                    subtotal_a,
                    monthly_quantity,
                    status
                FROM molding_table
                ORDER BY id DESC
            `);


        // ====================================================
        // NO TRANSACTIONS
        // ====================================================

        if (moldingRows.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }


        // ====================================================
        // 2. CUSTOMER IDS
        // ====================================================

        const customerIds = [
            ...new Set(
                moldingRows
                    .map(
                        row =>
                            row.customer_name
                    )
                    .filter(Boolean)
            )
        ];

        const [customers] =
            customerIds.length
                ? await adminDB.query(`
                    SELECT
                        id,
                        customer_name
                    FROM customer_master
                    WHERE id IN (?)
                `, [customerIds])
                : [[]];

        const customerMap =
            new Map(
                customers.map(row => [
                    String(row.id),
                    row.customer_name
                ])
            );


        // ====================================================
        // 3. PRODUCTION UNIT IDS
        // ====================================================

        const productionUnitIds = [
            ...new Set(
                moldingRows
                    .map(
                        row =>
                            row.production_unit
                    )
                    .filter(Boolean)
            )
        ];

        const [productionUnits] =
            productionUnitIds.length
                ? await adminDB.query(`
                    SELECT
                        id,
                        unit
                    FROM unit_master
                    WHERE id IN (?)
                `, [productionUnitIds])
                : [[]];

        const productionUnitMap =
            new Map(
                productionUnits.map(row => [
                    String(row.id),
                    row.unit
                ])
            );


        // ====================================================
        // 4. BILLING UNIT IDS
        // ====================================================

        const billingUnitIds = [
            ...new Set(
                moldingRows
                    .map(
                        row =>
                            row.billing_unit
                    )
                    .filter(Boolean)
            )
        ];

        const [billingUnits] =
            billingUnitIds.length
                ? await adminDB.query(`
                    SELECT
                        id,
                        unit
                    FROM unit_master
                    WHERE id IN (?)
                `, [billingUnitIds])
                : [[]];

        const billingUnitMap =
            new Map(
                billingUnits.map(row => [
                    String(row.id),
                    row.unit
                ])
            );


        // ====================================================
        // 5. SUB CATEGORY IDS
        // ====================================================

        const subCategoryIds = [
            ...new Set(
                moldingRows
                    .map(
                        row =>
                            row.sub_category
                    )
                    .filter(Boolean)
            )
        ];

        const [subCategories] =
            subCategoryIds.length
                ? await adminDB.query(`
                    SELECT
                        id,
                        sub_category_name
                    FROM sub_category_master
                    WHERE id IN (?)
                `, [subCategoryIds])
                : [[]];

        const subCategoryMap =
            new Map(
                subCategories.map(row => [
                    String(row.id),
                    row.sub_category_name
                ])
            );


        // ====================================================
        // 6. COMBINE DATA
        // ====================================================

        const transactions =
            moldingRows.map(row => {

                const customerName =
                    customerMap.get(
                        String(
                            row.customer_name
                        )
                    ) ||
                    row.customer_name ||
                    "";

                const productionUnit =
                    productionUnitMap.get(
                        String(
                            row.production_unit
                        )
                    ) ||
                    row.production_unit ||
                    "";

                const billingUnit =
                    billingUnitMap.get(
                        String(
                            row.billing_unit
                        )
                    ) ||
                    row.billing_unit ||
                    "";

                const subCategory =
                    subCategoryMap.get(
                        String(
                            row.sub_category
                        )
                    ) ||
                    row.sub_category ||
                    "";


                return {

                    // ====================================================
                    // TRANSACTION
                    // ====================================================

                    transaction_id:
                        row.transaction_id,


                    // ====================================================
                    // DISPLAY DATA
                    // ====================================================

                    customer_name:
                        customerName,

                    production_unit:
                        productionUnit,

                    billing_unit:
                        billingUnit,

                    sub_category:
                        subCategory,


                    // ====================================================
                    // ORIGINAL IDS
                    // ====================================================

                    customer_id:
                        row.customer_name,

                    production_unit_id:
                        row.production_unit,

                    billing_unit_id:
                        row.billing_unit,

                    sub_category_id:
                        row.sub_category,


                    // ====================================================
                    // MOLDING DATA
                    // ====================================================

                    part_no:
                        row.part_no || "",

                    part_cost:
                        row.part_cost ?? 0,

                    customer_sales_cost:
                        row.customer_sales_cost ?? 0,

                    monthly_quantity:
                        row.monthly_quantity ?? 0,

                    subtotal_a:
                        row.subtotal_a ?? 0,

                    status:
                        row.status || ""
                };
            });


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.json({
            success: true,
            data: transactions
        });

    } catch (error) {

        console.error(
            "Error fetching molding transactions:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch molding transactions",
            error: error.message
        });
    }
};


// ============================================================
// GET SINGLE MOLDING TRANSACTION
// ============================================================

export const getMoldingTransactionById = async (
    req,
    res
) => {

    try {

        const {
            transactionId
        } = req.params;


        // ====================================================
        // GET MOLDING TRANSACTION
        // ====================================================

        const [rows] =
            await zbcDB.query(`
                SELECT *
                FROM molding_table
                WHERE transaction_id = ?
                LIMIT 1
            `, [
                transactionId
            ]);


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Transaction not found"
            });
        }


        const molding =
            rows[0];


        // ====================================================
        // GET BOP DATA
        //
        // IMPORTANT:
        // BOP DATA NOW COMES FROM
        // bop_part_details
        //
        // molding_bop_table IS NO LONGER USED
        // ====================================================

        const [bops] =
            await zbcDB.query(`
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
                        AS bop_assembly_qty,

                    financial_year,
                    bop_month,
                    bop_rate,
                    bop_cost

                FROM bop_part_details

                WHERE part_no = ?

                ORDER BY id ASC
            `, [
                molding.part_no
            ]);


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.json({
            success: true,

            data: {
                ...molding,
                bops
            }
        });

    } catch (error) {

        console.error(
            "Error fetching transaction:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch transaction",
            error: error.message
        });
    }
};


// ============================================================
// EXPORT MOLDING DATA
// ============================================================

export const exportMoldingData = async (
    req,
    res
) => {

    try {

        // ====================================================
        // 1. GET ALL MOLDING DATA
        // ====================================================

        const [moldingRows] =
            await zbcDB.query(`
                SELECT *
                FROM molding_table
                ORDER BY id DESC
            `);


        // ====================================================
        // 2. GET BOP MASTER DATA
        //
        // BOP DATA IS NOW STORED IN
        // bop_part_details
        // ====================================================

        const [bopRows] =
            await zbcDB.query(`
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
                        AS bop_assembly_qty,

                    financial_year,
                    bop_month,
                    bop_rate,
                    bop_cost

                FROM bop_part_details

                ORDER BY id ASC
            `);


        // ====================================================
        // 3. MASTER DATA MAPS
        // ====================================================

        const customerIds = [
            ...new Set(
                moldingRows
                    .map(
                        row =>
                            row.customer_name
                    )
                    .filter(Boolean)
            )
        ];

        const [customers] =
            customerIds.length
                ? await adminDB.query(`
                    SELECT
                        id,
                        customer_name
                    FROM customer_master
                    WHERE id IN (?)
                `, [customerIds])
                : [[]];

        const customerMap =
            new Map(
                customers.map(row => [
                    String(row.id),
                    row.customer_name
                ])
            );


        // ====================================================
        // PRODUCTION UNIT
        // ====================================================

        const productionUnitIds = [
            ...new Set(
                moldingRows
                    .map(
                        row =>
                            row.production_unit
                    )
                    .filter(Boolean)
            )
        ];

        const [productionUnits] =
            productionUnitIds.length
                ? await adminDB.query(`
                    SELECT
                        id,
                        unit
                    FROM unit_master
                    WHERE id IN (?)
                `, [productionUnitIds])
                : [[]];

        const productionUnitMap =
            new Map(
                productionUnits.map(row => [
                    String(row.id),
                    row.unit
                ])
            );


        // ====================================================
        // BILLING UNIT
        // ====================================================

        const billingUnitIds = [
            ...new Set(
                moldingRows
                    .map(
                        row =>
                            row.billing_unit
                    )
                    .filter(Boolean)
            )
        ];

        const [billingUnits] =
            billingUnitIds.length
                ? await adminDB.query(`
                    SELECT
                        id,
                        unit
                    FROM unit_master
                    WHERE id IN (?)
                `, [billingUnitIds])
                : [[]];

        const billingUnitMap =
            new Map(
                billingUnits.map(row => [
                    String(row.id),
                    row.unit
                ])
            );


        // ====================================================
        // SUB DEPARTMENT
        // ====================================================

        const subDepartmentIds = [
            ...new Set(
                moldingRows
                    .map(
                        row =>
                            row.sub_department
                    )
                    .filter(Boolean)
            )
        ];

        const [subDepartments] =
            subDepartmentIds.length
                ? await adminDB.query(`
                    SELECT
                        id,
                        sub_department_name
                    FROM sub_department_master
                    WHERE id IN (?)
                `, [subDepartmentIds])
                : [[]];

        const subDepartmentMap =
            new Map(
                subDepartments.map(row => [
                    String(row.id),
                    row.sub_department_name
                ])
            );


        // ====================================================
        // SUB CATEGORY
        // ====================================================

        const subCategoryIds = [
            ...new Set(
                moldingRows
                    .map(
                        row =>
                            row.sub_category
                    )
                    .filter(Boolean)
            )
        ];

        const [subCategories] =
            subCategoryIds.length
                ? await adminDB.query(`
                    SELECT
                        id,
                        sub_category_name
                    FROM sub_category_master
                    WHERE id IN (?)
                `, [subCategoryIds])
                : [[]];

        const subCategoryMap =
            new Map(
                subCategories.map(row => [
                    String(row.id),
                    row.sub_category_name
                ])
            );


        // ====================================================
        // 4. MONTH NAMES
        // ====================================================

        const monthNames = {

            1: "January",
            2: "February",
            3: "March",
            4: "April",
            5: "May",
            6: "June",

            7: "July",
            8: "August",
            9: "September",

            10: "October",
            11: "November",
            12: "December"
        };


        // ====================================================
        // 5. DATE FORMAT
        // ====================================================

        const formatDate = (
            value
        ) => {

            if (!value) {
                return "";
            }

            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return value;
            }

            const day =
                String(
                    date.getDate()
                ).padStart(
                    2,
                    "0"
                );

            const month =
                String(
                    date.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );

            const year =
                date.getFullYear();

            return `${day}-${month}-${year}`;
        };


        // ====================================================
        // 6. FORMAT MOLDING ROWS
        // ====================================================

        const formattedRows =
            moldingRows.map(
                row => {

                    const formatted = {
                        ...row
                    };


                    // ------------------------------------------------
                    // CUSTOMER
                    // ------------------------------------------------

                    if (
                        row.customer_name !==
                        null &&
                        row.customer_name !==
                        undefined
                    ) {

                        formatted.customer_name =
                            customerMap.get(
                                String(
                                    row.customer_name
                                )
                            ) ??
                            row.customer_name;
                    }


                    // ------------------------------------------------
                    // PRODUCTION UNIT
                    // ------------------------------------------------

                    if (
                        row.production_unit !==
                        null &&
                        row.production_unit !==
                        undefined
                    ) {

                        formatted.production_unit =
                            productionUnitMap.get(
                                String(
                                    row.production_unit
                                )
                            ) ??
                            row.production_unit;
                    }


                    // ------------------------------------------------
                    // BILLING UNIT
                    // ------------------------------------------------

                    if (
                        row.billing_unit !==
                        null &&
                        row.billing_unit !==
                        undefined
                    ) {

                        formatted.billing_unit =
                            billingUnitMap.get(
                                String(
                                    row.billing_unit
                                )
                            ) ??
                            row.billing_unit;
                    }


                    // ------------------------------------------------
                    // SUB DEPARTMENT
                    // ------------------------------------------------

                    if (
                        row.sub_department !==
                        null &&
                        row.sub_department !==
                        undefined
                    ) {

                        formatted.sub_department =
                            subDepartmentMap.get(
                                String(
                                    row.sub_department
                                )
                            ) ??
                            row.sub_department;
                    }


                    // ------------------------------------------------
                    // SUB CATEGORY
                    // ------------------------------------------------

                    if (
                        row.sub_category !==
                        null &&
                        row.sub_category !==
                        undefined
                    ) {

                        formatted.sub_category =
                            subCategoryMap.get(
                                String(
                                    row.sub_category
                                )
                            ) ??
                            row.sub_category;
                    }


                    // ------------------------------------------------
                    // MONTH
                    // ------------------------------------------------

                    if (
                        row.month !==
                        null &&
                        row.month !==
                        undefined
                    ) {

                        formatted.month =
                            monthNames[
                            Number(
                                row.month
                            )
                            ] ??
                            row.month;
                    }


                    // ------------------------------------------------
                    // COMPONENT MONTH
                    // ------------------------------------------------

                    if (
                        row.comp_month !==
                        null &&
                        row.comp_month !==
                        undefined
                    ) {

                        formatted.comp_month =
                            monthNames[
                            Number(
                                row.comp_month
                            )
                            ] ??
                            row.comp_month;
                    }


                    // ------------------------------------------------
                    // DATES
                    // ------------------------------------------------

                    if (
                        row.effective_date
                    ) {

                        formatted.effective_date =
                            formatDate(
                                row.effective_date
                            );
                    }

                    if (
                        row.created_at
                    ) {

                        formatted.created_at =
                            formatDate(
                                row.created_at
                            );
                    }

                    if (
                        row.updated_at
                    ) {

                        formatted.updated_at =
                            formatDate(
                                row.updated_at
                            );
                    }


                    return formatted;
                }
            );


        // ====================================================
        // 7. RESPONSE
        // ====================================================

        return res.status(200).json({

            success: true,

            data: formattedRows,

            bops: bopRows

        });


    } catch (error) {

        console.error(
            "Error exporting molding data:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to export molding data",

            error:
                error.message
        });
    }
};


// ============================================================
// GET MOLDING DATA WITH PAGINATION / SEARCH
// ============================================================

export const getAllMoldingData = async (
    req,
    res
) => {

    try {

        const page =
            Math.max(
                Number(
                    req.query.page
                ) || 1,
                1
            );

        const limit =
            Math.max(
                Number(
                    req.query.limit
                ) || 10,
                1
            );

        const offset =
            (page - 1) *
            limit;


        const {
            search,
            financialYear,
            month,
            status,
            subCategoryFilter
        } = req.query;


        // ====================================================
        // WHERE CONDITIONS
        // ====================================================

        const whereParts = [];
        const whereParams = [];
        // ====================================================
        // MTRB / MOLDING FILTER
        // ====================================================
        // MTRB    = only MTRB transactions
        // MOLDING = all transactions except MTRB

        let mtrbSubCategoryIds = [];

        if (
            subCategoryFilter === "MTRB" ||
            subCategoryFilter === "MOLDING"
        ) {
            try {
                const [mtrbCategories] =
                    await adminDB.query(`
                SELECT id
                FROM sub_category_master
                WHERE UPPER(TRIM(sub_category_name)) = 'MTRB'
            `);

                mtrbSubCategoryIds =
                    mtrbCategories.map(
                        item => item.id
                    );

            } catch (error) {
                console.warn(
                    "MTRB sub category lookup failed:",
                    error.message
                );
            }
        }


        // ====================================================
        // APPLY MTRB / MOLDING FILTER
        // ====================================================

        if (subCategoryFilter === "MTRB") {

            // Show ONLY MTRB
            if (mtrbSubCategoryIds.length > 0) {

                const placeholders =
                    mtrbSubCategoryIds
                        .map(() => "?")
                        .join(", ");

                whereParts.push(
                    `m.sub_category IN (${placeholders})`
                );

                whereParams.push(
                    ...mtrbSubCategoryIds
                );

            } else {

                // No MTRB category exists
                whereParts.push("1 = 0");
            }

        } else if (subCategoryFilter === "MOLDING") {

            // Show EVERYTHING EXCEPT MTRB
            if (mtrbSubCategoryIds.length > 0) {

                const placeholders =
                    mtrbSubCategoryIds
                        .map(() => "?")
                        .join(", ");

                whereParts.push(
                    `(m.sub_category NOT IN (${placeholders}) OR m.sub_category IS NULL)`
                );

                whereParams.push(
                    ...mtrbSubCategoryIds
                );
            }
        }


        // ====================================================
        // FINANCIAL YEAR
        // ====================================================

        if (
            financialYear !==
            undefined &&
            financialYear !== ""
        ) {

            whereParts.push(
                "m.financial_year = ?"
            );

            whereParams.push(
                financialYear
            );
        }


        // ====================================================
        // MONTH
        // ====================================================

        if (
            month !==
            undefined &&
            month !== ""
        ) {

            whereParts.push(
                "m.month = ?"
            );

            whereParams.push(
                month
            );
        }


        // ====================================================
        // STATUS
        // ====================================================

        if (
            status !==
            undefined &&
            status !== ""
        ) {

            whereParts.push(
                "m.status = ?"
            );

            whereParams.push(
                status
            );
        }


        // ====================================================
        // SEARCH
        // ====================================================

        if (
            search &&
            String(search).trim()
        ) {

            const searchPattern =
                `%${String(
                    search
                ).trim()}%`;

            const searchConditions = [];
            const searchParams = [];


            // ------------------------------------------------
            // PART / TRANSACTION SEARCH
            // ------------------------------------------------

            searchConditions.push(
                `
                (
                    m.transaction_id LIKE ?
                    OR m.part_no LIKE ?
                    OR m.part_name LIKE ?
                    OR m.fg_code LIKE ?
                    OR m.im_code LIKE ?
                )
                `
            );

            searchParams.push(
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern
            );


            // ------------------------------------------------
            // CUSTOMER SEARCH
            // ------------------------------------------------

            try {

                const [
                    matchingCustomers
                ] =
                    await adminDB.query(`
                        SELECT id
                        FROM customer_master
                        WHERE customer_name LIKE ?
                    `, [
                        searchPattern
                    ]);


                if (
                    matchingCustomers.length >
                    0
                ) {

                    const ids =
                        matchingCustomers.map(
                            item => item.id
                        );

                    const placeholders =
                        ids
                            .map(
                                () => "?"
                            )
                            .join(", ");


                    searchConditions.push(
                        `
                        m.customer_name IN
                        (${placeholders})
                        `
                    );

                    searchParams.push(
                        ...ids
                    );
                }

            } catch (error) {

                console.warn(
                    "Customer search failed:",
                    error.message
                );
            }


            // ------------------------------------------------
            // PRODUCTION / BILLING UNIT SEARCH
            // ------------------------------------------------

            try {

                const [
                    matchingUnits
                ] =
                    await adminDB.query(`
                        SELECT id
                        FROM unit_master
                        WHERE unit LIKE ?
                    `, [
                        searchPattern
                    ]);


                if (
                    matchingUnits.length >
                    0
                ) {

                    const ids =
                        matchingUnits.map(
                            item => item.id
                        );

                    const placeholders =
                        ids
                            .map(
                                () => "?"
                            )
                            .join(", ");


                    searchConditions.push(
                        `
                        (
                            m.production_unit IN
                            (${placeholders})

                            OR

                            m.billing_unit IN
                            (${placeholders})
                        )
                        `
                    );

                    searchParams.push(
                        ...ids,
                        ...ids
                    );
                }

            } catch (error) {

                console.warn(
                    "Unit search failed:",
                    error.message
                );
            }


            // ------------------------------------------------
            // SUB DEPARTMENT SEARCH
            // ------------------------------------------------

            try {

                const [
                    matchingDepartments
                ] =
                    await adminDB.query(`
                        SELECT id
                        FROM sub_department_master
                        WHERE sub_department_name LIKE ?
                    `, [
                        searchPattern
                    ]);


                if (
                    matchingDepartments.length >
                    0
                ) {

                    const ids =
                        matchingDepartments.map(
                            item => item.id
                        );

                    const placeholders =
                        ids
                            .map(
                                () => "?"
                            )
                            .join(", ");


                    searchConditions.push(
                        `
                        m.sub_department IN
                        (${placeholders})
                        `
                    );

                    searchParams.push(
                        ...ids
                    );
                }

            } catch (error) {

                console.warn(
                    "Sub department search failed:",
                    error.message
                );
            }


            // ------------------------------------------------
            // SUB CATEGORY SEARCH
            // ------------------------------------------------

            try {

                const [
                    matchingCategories
                ] =
                    await adminDB.query(`
                        SELECT id
                        FROM sub_category_master
                        WHERE sub_category_name LIKE ?
                    `, [
                        searchPattern
                    ]);


                if (
                    matchingCategories.length >
                    0
                ) {

                    const ids =
                        matchingCategories.map(
                            item => item.id
                        );

                    const placeholders =
                        ids
                            .map(
                                () => "?"
                            )
                            .join(", ");


                    searchConditions.push(
                        `
                        m.sub_category IN
                        (${placeholders})
                        `
                    );

                    searchParams.push(
                        ...ids
                    );
                }

            } catch (error) {

                console.warn(
                    "Sub category search failed:",
                    error.message
                );
            }


            // ------------------------------------------------
            // APPLY GLOBAL SEARCH
            // ------------------------------------------------

            if (
                searchConditions.length >
                0
            ) {

                whereParts.push(`
                    (
                        ${searchConditions.join(
                    " OR "
                )}
                    )
                `);

                whereParams.push(
                    ...searchParams
                );
            }
        }


        // ====================================================
        // WHERE CLAUSE
        // ====================================================

        const whereClause =
            whereParts.length > 0
                ? `WHERE ${whereParts.join(
                    " AND "
                )}`
                : "";


        // ====================================================
        // COUNT
        // ====================================================

        const [
            [countResult]
        ] =
            await zbcDB.query(`
                SELECT
                    COUNT(*) AS total

                FROM molding_table m

                ${whereClause}
            `, whereParams);


        const totalRecords =
            Number(
                countResult?.total ||
                0
            );

        const totalPages =
            totalRecords > 0
                ? Math.ceil(
                    totalRecords /
                    limit
                )
                : 0;


        // ====================================================
        // GET PAGINATED DATA
        // ====================================================

        const [rows] =
            await zbcDB.query(`
                  SELECT
                    m.*,

                    (
                        SELECT COUNT(*)
                        FROM bop_part_details b
                        WHERE
                            TRIM(b.part_no) COLLATE utf8mb4_general_ci
                            =
                            TRIM(m.part_no) COLLATE utf8mb4_general_ci
                    ) AS bop_count

                FROM molding_table m

                ${whereClause}

                ORDER BY m.id ASC

                LIMIT ?
                OFFSET ?
            `, [
                ...whereParams,
                limit,
                offset
            ]);


        // ====================================================
        // MASTER DATA MAPS
        // ====================================================

        // ----------------------------------------------------
        // CUSTOMER
        // ----------------------------------------------------

        const customerMap =
            new Map();

        try {

            const [customers] =
                await adminDB.query(`
                    SELECT
                        id,
                        customer_name
                    FROM customer_master
                `);

            customers.forEach(
                item => {

                    customerMap.set(
                        String(item.id),
                        item.customer_name
                    );
                }
            );

        } catch (error) {

            console.warn(
                "Customer master lookup failed:",
                error.message
            );
        }


        // ----------------------------------------------------
        // UNIT
        // ----------------------------------------------------

        const unitMap =
            new Map();

        try {

            const [units] =
                await adminDB.query(`
                    SELECT
                        id,
                        unit
                    FROM unit_master
                `);

            units.forEach(
                item => {

                    unitMap.set(
                        String(item.id),
                        item.unit
                    );
                }
            );

        } catch (error) {

            console.warn(
                "Unit master lookup failed:",
                error.message
            );
        }


        // ----------------------------------------------------
        // SUB DEPARTMENT
        // ----------------------------------------------------

        const subDepartmentMap =
            new Map();

        try {

            const [departments] =
                await adminDB.query(`
                    SELECT
                        id,
                        sub_department_name
                    FROM sub_department_master
                `);

            departments.forEach(
                item => {

                    subDepartmentMap.set(
                        String(item.id),
                        item.sub_department_name
                    );
                }
            );

        } catch (error) {

            console.warn(
                "Sub department master lookup failed:",
                error.message
            );
        }


        // ----------------------------------------------------
        // SUB CATEGORY
        // ----------------------------------------------------

        const subCategoryMap =
            new Map();

        try {

            const [categories] =
                await adminDB.query(`
                    SELECT
                        id,
                        sub_category_name
                    FROM sub_category_master
                `);

            categories.forEach(
                item => {

                    subCategoryMap.set(
                        String(item.id),
                        item.sub_category_name
                    );
                }
            );

        } catch (error) {

            console.warn(
                "Sub category master lookup failed:",
                error.message
            );
        }


        // ====================================================
        // MONTH NAMES
        // ====================================================

        const monthNames = {

            1: "January",
            2: "February",
            3: "March",
            4: "April",
            5: "May",
            6: "June",

            7: "July",
            8: "August",
            9: "September",

            10: "October",
            11: "November",
            12: "December"
        };


        // ====================================================
        // DATE FORMAT
        // ====================================================

        const formatDate = (
            value
        ) => {

            if (!value) {
                return "";
            }

            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return value;
            }

            const day =
                String(
                    date.getDate()
                ).padStart(
                    2,
                    "0"
                );

            const month =
                String(
                    date.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );

            const year =
                date.getFullYear();

            return `${day}-${month}-${year}`;
        };


        // ====================================================
        // FORMAT RESPONSE ROWS
        // ====================================================

        const formattedRows =
            rows.map(
                row => {

                    const formatted = {
                        ...row
                    };


                    // ------------------------------------------------
                    // CUSTOMER
                    // ------------------------------------------------

                    if (
                        row.customer_name !==
                        null &&
                        row.customer_name !==
                        undefined
                    ) {

                        formatted.customer_name =
                            customerMap.get(
                                String(
                                    row.customer_name
                                )
                            ) ??
                            row.customer_name;
                    }


                    // ------------------------------------------------
                    // PRODUCTION UNIT
                    // ------------------------------------------------

                    if (
                        row.production_unit !==
                        null &&
                        row.production_unit !==
                        undefined
                    ) {

                        formatted.production_unit =
                            unitMap.get(
                                String(
                                    row.production_unit
                                )
                            ) ??
                            row.production_unit;
                    }


                    // ------------------------------------------------
                    // BILLING UNIT
                    // ------------------------------------------------

                    if (
                        row.billing_unit !==
                        null &&
                        row.billing_unit !==
                        undefined
                    ) {

                        formatted.billing_unit =
                            unitMap.get(
                                String(
                                    row.billing_unit
                                )
                            ) ??
                            row.billing_unit;
                    }


                    // ------------------------------------------------
                    // SUB DEPARTMENT
                    // ------------------------------------------------

                    if (
                        row.sub_department !==
                        null &&
                        row.sub_department !==
                        undefined
                    ) {

                        formatted.sub_department =
                            subDepartmentMap.get(
                                String(
                                    row.sub_department
                                )
                            ) ??
                            row.sub_department;
                    }


                    // ------------------------------------------------
                    // SUB CATEGORY
                    // ------------------------------------------------

                    if (
                        row.sub_category !==
                        null &&
                        row.sub_category !==
                        undefined
                    ) {

                        formatted.sub_category =
                            subCategoryMap.get(
                                String(
                                    row.sub_category
                                )
                            ) ??
                            row.sub_category;
                    }


                    // ------------------------------------------------
                    // MONTH
                    // ------------------------------------------------

                    if (
                        row.month !==
                        null &&
                        row.month !==
                        undefined
                    ) {

                        formatted.month =
                            monthNames[
                            Number(
                                row.month
                            )
                            ] ??
                            row.month;
                    }


                    // ------------------------------------------------
                    // COMPONENT MONTH
                    // ------------------------------------------------

                    if (
                        row.comp_month !==
                        null &&
                        row.comp_month !==
                        undefined
                    ) {

                        formatted.comp_month =
                            monthNames[
                            Number(
                                row.comp_month
                            )
                            ] ??
                            row.comp_month;
                    }


                    // ------------------------------------------------
                    // DATES
                    // ------------------------------------------------

                    if (
                        row.effective_date
                    ) {

                        formatted.effective_date =
                            formatDate(
                                row.effective_date
                            );
                    }

                    if (
                        row.created_at
                    ) {

                        formatted.created_at =
                            formatDate(
                                row.created_at
                            );
                    }

                    if (
                        row.updated_at
                    ) {

                        formatted.updated_at =
                            formatDate(
                                row.updated_at
                            );
                    }


                    return formatted;
                }
            );


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.status(200).json({

            success: true,

            data: formattedRows,

            pagination: {

                page,

                limit,

                totalRecords,

                totalPages,

                hasNextPage:
                    page < totalPages,

                hasPreviousPage:
                    page > 1
            }
        });

    } catch (error) {

        console.error(
            "Error fetching all molding data:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch molding data",

            error:
                error.message
        });
    }
};