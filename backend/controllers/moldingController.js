import {
    createDraft,
    updateDraft,
    submitFinal,
    updateAllMoldingMargins
} from "../models/moldingModel.js";

import { bulkCreateMolding, calculateMoldingBulk } from "../models/moldingBulkModel.js";
import zbcDB from "../config/zbcDB.js";
import adminDB from "../config/adminDB.js";
import ExcelJS from "exceljs";


const getCurrentUserName = (req) => {
    return (
        req.session?.user?.user_name ||
        req.user?.user_name ||
        req.user?.username ||
        req.query?.userName ||
        req.body?.userName ||
        null
    );
};

const getUserRole = (req) => {
    return String(
        req.session?.user?.designation ||
        req.user?.designation ||
        ""
    ).trim().toLowerCase();
};

const isAdminOrVP = (req) => {
    const role = getUserRole(req);

    return [
        "super admin",
        "admin",
        "vp",
        "vice president"
    ].includes(role);
};

// SAVE DRAFT
export const saveDraft = async (req, res) => {
    try {
        const { formData, bops, transactionId, userName } = req.body;

        // Prefer the authenticated server-side user when available.
        const loggedInUser = req.user?.user_name || req.user?.username || userName;
        if (!loggedInUser || !String(loggedInUser).trim()) {
            return res.status(401).json({
                success: false,
                message: "Logged-in username is required to save the costing."
            });
        }

        if (!formData || typeof formData !== "object" || Array.isArray(formData)) {
            return res.status(400).json({
                success: false,
                message: "Valid form data is required."
            });
        }

        // Keep Required selections and costs consistent with ProcessDetailsForm.
        // If a Required flag was not sent by an older client, infer it from its cost.
        const processFields = [
            "postCuring", "finishing", "inspection", "shotBlasting",
            "vapourDegreasing", "chromating", "phospating", "adhesive",
            "painting", "plating", "cylindricalGrinding"
        ];
        const normalizedFormData = { ...formData };
        for (const field of processFields) {
            const requiredKey = `${field}Required`;
            const supplied = normalizedFormData[requiredKey];
            const inferred = Number(normalizedFormData[field] || 0) !== 0 ? "Yes" : "No";
            normalizedFormData[requiredKey] =
                supplied === "Yes" || supplied === "No" ? supplied : inferred;
            if (normalizedFormData[requiredKey] === "No") {
                normalizedFormData[field] = 0;
            }
        }

        let result;
        if (transactionId) {
            result = await updateDraft(transactionId, normalizedFormData, bops, loggedInUser);
        } else {
            result = await createDraft(normalizedFormData, bops, loggedInUser);
        }
        return res.status(200).json({
            success: true,
            message: "Draft saved successfully",
            ...result
        });
    } catch (error) {
        console.error("Error saving draft:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save draft",
            error: error.message
        });
    }
};

// FINAL SUBMIT
export const finalSubmit = async (req, res) => {
    try {
        const { transactionId, userName } = req.body;
        if (!transactionId) {
            return res.status(400).json({
                message: "Transaction ID is required"
            });
        }

        const loggedInUser = req.user?.user_name || req.user?.username || userName;
        if (!loggedInUser || !String(loggedInUser).trim()) {
            return res.status(401).json({
                message: "Logged-in username is required to submit costing."
            });
        }
        const result = await submitFinal(transactionId, loggedInUser);
        return res.status(200).json({
            message: "Costing submitted successfully",
            ...result
        });
    } catch (error) {
        console.error("Error submitting costing:", error);
        return res.status(500).json({
            message: "Failed to submit costing",
            error: error.message
        });
    }
};

// GET ALL MOLDING TRANSACTIONS
export const getMoldingTransactions = async (req, res) => {
    try {

        const currentUser = getCurrentUserName(req);

        const adminOrVP = isAdminOrVP(req);

        if (!adminOrVP && !currentUser) {
            return res.status(401).json({
                message: "Unable to identify the logged-in user",
            });
        }
        // 1. GET TRANSACTION DATA

        const [moldingRows] = await zbcDB.query(`
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
            ${adminOrVP
                ? ""
                : "WHERE LOWER(TRIM(created_by)) = LOWER(TRIM(?))"}
            ORDER BY id ASC`,
            adminOrVP ? [] : [currentUser]
        );
        // NO TRANSACTIONS
        if (moldingRows.length === 0) {
            return res.json({
                success: true, data: []
            });
        }

        // 2. CUSTOMER IDS
        const customerIds = [...new Set(moldingRows.map(row => row.customer_name).filter(Boolean))];
        const [customers] =
            customerIds.length ?
                await adminDB.query(`
                    SELECT id, customer_name
                    FROM customer_master
                    WHERE id IN (?)
                `, [customerIds])
                : [[]];
        const customerMap = new Map(customers.map(row => [String(row.id), row.customer_name]));

        // 3. PRODUCTION UNIT IDS
        const productionUnitIds = [...new Set(moldingRows.map(row => row.production_unit).filter(Boolean))];
        const [productionUnits] =
            productionUnitIds.length
                ? await adminDB.query(`
                     SELECT id,unit
                    FROM unit_master
                    WHERE id IN (?)`,
                    [productionUnitIds])
                : [[]];
        const productionUnitMap = new Map(productionUnits.map(row => [String(row.id), row.unit]));

        // 4. BILLING UNIT IDS
        const billingUnitIds = [...new Set(moldingRows.map(row => row.billing_unit).filter(Boolean))];
        const [billingUnits] =
            billingUnitIds.length
                ? await adminDB.query(`
                    SELECT id,unit
                    FROM unit_master
                    WHERE id IN (?)
                `, [billingUnitIds])
                : [[]];
        const billingUnitMap = new Map(billingUnits.map(row => [String(row.id), row.unit]));

        // 5. SUB CATEGORY IDS
        const subCategoryIds = [...new Set(moldingRows.map(row => row.sub_category).filter(Boolean))];
        const [subCategories] = subCategoryIds.length
            ? await adminDB.query(`
                    SELECT id,sub_category_name
                    FROM sub_category_master
                    WHERE id IN (?)
                `, [subCategoryIds])
            : [[]];
        const subCategoryMap = new Map(subCategories.map(row => [String(row.id), row.sub_category_name]));

        // 6. COMBINE DATA
        const transactions = moldingRows.map(row => {
            const customerName = customerMap.get(String(row.customer_name)) || row.customer_name || "";
            const productionUnit = productionUnitMap.get(String(row.production_unit)) || row.production_unit || "";
            const billingUnit = billingUnitMap.get(String(row.billing_unit)) || row.billing_unit || "";
            const subCategory = subCategoryMap.get(String(row.sub_category)) || row.sub_category || "";

            return {
                transaction_id: row.transaction_id,
                customer_name: customerName,
                production_unit: productionUnit,
                billing_unit: billingUnit,
                sub_category: subCategory,
                customer_id: row.customer_name,
                production_unit_id: row.production_unit,
                billing_unit_id: row.billing_unit,
                sub_category_id: row.sub_category,
                part_no: row.part_no || "",
                part_cost: row.part_cost ?? 0,
                customer_sales_cost: row.customer_sales_cost ?? 0,
                monthly_quantity: row.monthly_quantity ?? 0,
                subtotal_a: row.subtotal_a ?? 0,
                status: row.status || ""
            };
        });

        // RESPONSE
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
            message: "Failed to fetch molding transactions",
            error: error.message
        });
    }
};

// GET SINGLE MOLDING TRANSACTION
export const getMoldingTransactionById = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const currentUser = getCurrentUserName(req);
        const adminOrVP = isAdminOrVP(req);

        if (!adminOrVP && (!currentUser || !String(currentUser).trim())) {
            return res.status(401).json({
                success: false,
                message: "Unable to identify the logged-in user"
            });
        }

        const [rows] = await zbcDB.query(
            `
            SELECT *
            FROM molding_table
            WHERE transaction_id = ?
            ${adminOrVP
                ? ""
                : "AND LOWER(TRIM(created_by)) = LOWER(TRIM(?))"}
            LIMIT 1`,
            adminOrVP
                ? [transactionId]
                : [transactionId, currentUser]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found or you do not have access"
            });
        }

        const molding = rows[0];

        const [bops] = await zbcDB.query(
            `SELECT
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
                assembly_qty AS bop_assembly_qty,
                financial_year,
                bop_month,
                bop_rate,
                bop_cost
             FROM bop_part_details
             WHERE part_no = ?
             ORDER BY id ASC`,
            [molding.part_no]
        );

        return res.json({
            success: true,
            data: { ...molding, bops }
        });

    } catch (error) {
        console.error("Error fetching transaction:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch transaction",
            error: error.message
        });
    }
};

/* EXPORT ALL MOLDING DATA FOR EXCEL */
export const exportMoldingData = async (req, res) => {
    try {
        const currentUser = getCurrentUserName(req);
        const adminOrVP = isAdminOrVP(req);

        if (!adminOrVP && !currentUser) {
            return res.status(401).json({
                message: "Unable to identify the logged-in user",
            });
        }

        // 1. Fetch molding transactions
        const [moldingRows] = await zbcDB.query(`
            SELECT *
            FROM molding_table
            ${adminOrVP
                ? ""
                : "WHERE LOWER(TRIM(created_by)) = LOWER(TRIM(?))"}
            ORDER BY id ASC
        `, adminOrVP ? [] : [currentUser]);

        // 2. Fetch BOP details
        const [bopRows] = await zbcDB.query(`
            SELECT *
            FROM bop_part_details
            ORDER BY id ASC
        `);

        // 3. Get unique master IDs
        const customerIds = [
            ...new Set(
                moldingRows
                    .map(row => row.customer_name)
                    .filter(id => id !== null && id !== undefined && id !== "")
            )
        ];

        const unitIds = [
            ...new Set(
                moldingRows.flatMap(row => [
                    row.production_unit,
                    row.billing_unit
                ]).filter(id => id !== null && id !== undefined && id !== "")
            )
        ];

        const subDepartmentIds = [
            ...new Set(
                moldingRows
                    .map(row => row.sub_department)
                    .filter(id => id !== null && id !== undefined && id !== "")
            )
        ];

        const subCategoryIds = [
            ...new Set(
                moldingRows
                    .map(row => row.sub_category)
                    .filter(id => id !== null && id !== undefined && id !== "")
            )
        ];

        // 4. Fetch master values
        const [
            [customers],
            [units],
            [subDepartments],
            [subCategories]
        ] = await Promise.all([
            customerIds.length
                ? adminDB.query(
                    `SELECT id, customer_name
                     FROM customer_master
                     WHERE id IN (?)`,
                    [customerIds]
                )
                : Promise.resolve([[]]),

            unitIds.length
                ? adminDB.query(
                    `SELECT id, unit
                     FROM unit_master
                     WHERE id IN (?)`,
                    [unitIds]
                )
                : Promise.resolve([[]]),

            subDepartmentIds.length
                ? adminDB.query(
                    `SELECT id, sub_department_name
                     FROM sub_department_master
                     WHERE id IN (?)`,
                    [subDepartmentIds]
                )
                : Promise.resolve([[]]),

            subCategoryIds.length
                ? adminDB.query(
                    `SELECT id, sub_category_name
                     FROM sub_category_master
                     WHERE id IN (?)`,
                    [subCategoryIds]
                )
                : Promise.resolve([[]])
        ]);

        // 5. Create ID-to-value maps
        const customerMap = new Map(
            customers.map(row => [String(row.id), row.customer_name])
        );

        const unitMap = new Map(
            units.map(row => [String(row.id), row.unit])
        );

        const subDepartmentMap = new Map(
            subDepartments.map(row => [String(row.id), row.sub_department_name])
        );

        const subCategoryMap = new Map(
            subCategories.map(row => [String(row.id), row.sub_category_name])
        );

        // 6. Replace IDs with display values in molding export
        const formattedRows = moldingRows.map(row => ({
            ...row,
            customer_name: customerMap.get(String(row.customer_name)) ?? row.customer_name,
            production_unit: unitMap.get(String(row.production_unit)) ?? row.production_unit,
            billing_unit: unitMap.get(String(row.billing_unit)) ?? row.billing_unit,
            sub_department: subDepartmentMap.get(String(row.sub_department)) ?? row.sub_department,
            sub_category: subCategoryMap.get(String(row.sub_category)) ?? row.sub_category
        }));

        // 7. Return Excel data
        return res.status(200).json({
            success: true,
            data: formattedRows,
            bops: bopRows,
            count: formattedRows.length,
            bopCount: bopRows.length
        });

    } catch (error) {
        console.error("Export molding data error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch molding data for export.",
            error: error.message
        });
    }
};

// GET MOLDING DATA WITH PAGINATION / SEARCH
export const getAllMoldingData = async (req, res) => {
    try {
        const {
            search,
            financialYear,
            month,
            status,
            subCategoryFilter
        } = req.query;

        // WHERE CONDITIONS
        const currentUser = getCurrentUserName(req);

        const adminOrVP = isAdminOrVP(req);

        if (!adminOrVP && !currentUser) {
            return res.status(401).json({
                success: false,
                message: "Unable to identify the logged-in user",
            });
        }

        const whereParts = [];
        const whereParams = [];

        if (!adminOrVP) {
            whereParts.push(
                "LOWER(TRIM(m.created_by)) = LOWER(TRIM(?))"
            );
            whereParams.push(currentUser);
        }

        // MTRB / MOLDING FILTER
        let mtrbSubCategoryIds = [];
        if (subCategoryFilter === "MTRB" || subCategoryFilter === "MOLDING") {
            try {
                const [mtrbCategories] =
                    await adminDB.query(`SELECT id
                        FROM sub_category_master
                        WHERE UPPER(TRIM(sub_category_name)) = 'MTRB'`
                    );
                mtrbSubCategoryIds = mtrbCategories.map(item => item.id);
            } catch (error) {
                console.warn(
                    "MTRB sub category lookup failed:",
                    error.message
                );
            }
        }

        // APPLY MTRB / MOLDING FILTER
        if (subCategoryFilter === "MTRB") {

            // Show ONLY MTRB
            if (mtrbSubCategoryIds.length > 0) {
                const placeholders =
                    mtrbSubCategoryIds
                        .map(() => "?")
                        .join(", ");
                whereParts.push(`m.sub_category IN (${placeholders})`);
                whereParams.push(...mtrbSubCategoryIds);
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
                whereParts.push(`(m.sub_category NOT IN (${placeholders}) OR m.sub_category IS NULL)`);
                whereParams.push(...mtrbSubCategoryIds);
            }
        }

        // FINANCIAL YEAR
        if (financialYear !== undefined && financialYear !== "") {
            whereParts.push("m.financial_year = ?");
            whereParams.push(financialYear);
        }

        // MONTH
        if (month !== undefined && month !== "") {
            whereParts.push("m.month = ?");
            whereParams.push(month);
        }

        // STATUS
        if (status !== undefined && status !== "") {
            whereParts.push("m.status = ?");
            whereParams.push(status);
        }

        // SEARCH
        if (search && String(search).trim()) {
            const searchPattern = `%${String(search).trim()}%`;
            const searchConditions = [];
            const searchParams = [];

            // PART / TRANSACTION SEARCH
            searchConditions.push(`(
                    m.transaction_id LIKE ?
                    OR m.part_no LIKE ?
                    OR m.part_name LIKE ?
                    OR m.fg_code LIKE ?
                    OR m.im_code LIKE ?)`
            );
            searchParams.push(
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern,
                searchPattern
            );

            // CUSTOMER SEARCH
            try {
                const [matchingCustomers] =
                    await adminDB.query(`
                        SELECT id
                        FROM customer_master
                        WHERE customer_name LIKE ?
                    `, [searchPattern]);

                if (matchingCustomers.length > 0) {
                    const ids = matchingCustomers.map(item => item.id);
                    const placeholders = ids
                        .map(() => "?")
                        .join(", ");
                    searchConditions.push(`
                        m.customer_name IN
                        (${placeholders}) `);
                    searchParams.push(...ids);
                }

            } catch (error) {
                console.warn("Customer search failed:", error.message);
            }

            // PRODUCTION / BILLING UNIT SEARCH
            try {
                const [matchingUnits] =
                    await adminDB.query(`
                        SELECT id
                        FROM unit_master
                        WHERE unit LIKE ?
                    `, [searchPattern]);
                if (matchingUnits.length > 0) {
                    const ids =
                        matchingUnits.map(item => item.id);
                    const placeholders = ids
                        .map(() => "?")
                        .join(", ");

                    searchConditions.push(`
                        ( m.production_unit IN
                            (${placeholders})
                            OR
                            m.billing_unit IN
                            (${placeholders}) ) `
                    );
                    searchParams.push(...ids, ...ids);
                }
            } catch (error) {
                console.warn("Unit search failed:", error.message);
            }

            // SUB DEPARTMENT SEARCH
            try {
                const [matchingDepartments] =
                    await adminDB.query(`
                        SELECT id
                        FROM sub_department_master
                        WHERE sub_department_name LIKE ?
                    `, [searchPattern]);
                if (matchingDepartments.length > 0) {
                    const ids =
                        matchingDepartments.map(item => item.id);
                    const placeholders = ids
                        .map(() => "?")
                        .join(", ");
                    searchConditions.push(`
                        m.sub_department IN
                        (${placeholders}) `);
                    searchParams.push(...ids);
                }
            } catch (error) {
                console.warn("Sub department search failed:", error.message);
            }

            // SUB CATEGORY SEARCH
            try {
                const [matchingCategories] =
                    await adminDB.query(`
                        SELECT id
                        FROM sub_category_master
                        WHERE sub_category_name LIKE ?
                    `, [searchPattern]);
                if (matchingCategories.length > 0) {
                    const ids = matchingCategories.map(item => item.id);
                    const placeholders = ids
                        .map(() => "?")
                        .join(", ");
                    searchConditions.push(`
                        m.sub_category IN
                        (${placeholders})   `);
                    searchParams.push(...ids);
                }
            } catch (error) {
                console.warn(
                    "Sub category search failed:",
                    error.message
                );
            }

            // APPLY GLOBAL SEARCH
            if (searchConditions.length > 0) {
                whereParts.push(`  ( ${searchConditions.join(" OR ")})`);
                whereParams.push(...searchParams);
            }
        }

        // WHERE CLAUSE
        const whereClause =
            whereParts.length > 0
                ? `WHERE ${whereParts.join(" AND ")}`
                : "";

        // GET ALL DATA - NO BACKEND PAGINATION
        const [rows] =
            await zbcDB.query(`
        SELECT m.*,
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
    `, whereParams);

        // MASTER DATA MAPS
        // CUSTOMER
        const customerMap = new Map();
        try {
            const [customers] =
                await adminDB.query(`
                    SELECT  id, customer_name
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
        // UNIT
        const unitMap = new Map();
        try {
            const [units] =
                await adminDB.query(`
                    SELECT   id,  unit
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

        // SUB DEPARTMENT
        const subDepartmentMap = new Map();
        try {
            const [departments] =
                await adminDB.query(`
                    SELECT id, sub_department_name
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

        // SUB CATEGORY
        const subCategoryMap = new Map();
        try {
            const [categories] =
                await adminDB.query(`
                    SELECT id, sub_category_name
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

        // MONTH NAMES
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

        // DATE FORMAT
        const formatDate = (value) => {
            if (!value) { return ""; }
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return value;
            }

            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };

        // FORMAT RESPONSE ROWS
        const formattedRows =
            rows.map(
                row => {
                    const formatted = { ...row };

                    // CUSTOMER
                    if (row.customer_name !== null && row.customer_name !== undefined) {
                        formatted.customer_name = customerMap.get(String(row.customer_name)) ?? row.customer_name;
                    }

                    // PRODUCTION UNIT
                    if (row.production_unit !== null && row.production_unit !== undefined) {
                        formatted.production_unit = unitMap.get(String(row.production_unit)) ?? row.production_unit;
                    }

                    // BILLING UNIT
                    if (row.billing_unit !== null && row.billing_unit !== undefined) {
                        formatted.billing_unit = unitMap.get(String(row.billing_unit)) ?? row.billing_unit;
                    }

                    // SUB DEPARTMENT
                    if (row.sub_department !== null && row.sub_department !== undefined) {
                        formatted.sub_department = subDepartmentMap.get(String(row.sub_department)) ?? row.sub_department;
                    }

                    // SUB CATEGORY
                    if (row.sub_category !== null && row.sub_category !== undefined) {
                        formatted.sub_category = subCategoryMap.get(String(row.sub_category)) ?? row.sub_category;
                    }

                    // MONTH
                    if (row.month !== null && row.month !== undefined) {
                        formatted.month = monthNames[Number(row.month)] ?? row.month;
                    }

                    // COMPONENT MONTH
                    if (row.comp_month !== null && row.comp_month !== undefined) {
                        formatted.comp_month = monthNames[Number(row.comp_month)] ?? row.comp_month;
                    }

                    // DATES
                    if (row.effective_date) {
                        formatted.effective_date = formatDate(row.effective_date);
                    }
                    if (row.created_at) {
                        formatted.created_at = formatDate(row.created_at);
                    }
                    if (row.updated_at) {
                        formatted.updated_at = formatDate(row.updated_at);
                    }
                    return formatted;
                }
            );

        // RESPONSE
        return res.status(200).json({
            success: true,
            data: formattedRows,
            count: formattedRows.length
        });

    } catch (error) {
        console.error(
            "Error fetching all molding data:", error
        );
        return res.status(500).json({
            success: false,
            message: "Failed to fetch molding data",
            error: error.message
        });
    }
};

export const calculateMoldingBulkController = async (req, res) => {
    try {
        const { entries } = req.body;
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one Excel row is required.",
                errors: [],
                rows: [],
            });
        }

        const result = await calculateMoldingBulk(entries);
        return res.status(200).json({
            success: result.success,
            message: result.success
                ? "Molding bulk calculation and validation completed."
                : "Molding bulk calculation completed with validation errors.",
            totalRows: result.totalRows,
            calculated: result.calculated,
            errors: result.errors,
            rows: result.rows,
        });
    } catch (error) {
        console.error("Molding bulk calculation error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to calculate Molding bulk records.",
            error: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            rows: [],
            errors: [],
        });
    }
};

// POST /api/molding/bulk
export const bulkCreateMoldingController = async (req, res) => {
    try {
        const { entries, userName } = req.body;
        const loggedInUser = req.user?.user_name || req.user?.username || userName;
        if (!loggedInUser || !String(loggedInUser).trim()) {
            return res.status(401).json({
                success: false,
                message: "Logged-in username is required for bulk upload.",
            });
        }


        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one Excel row is required.",
            });
        }

        if (entries.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Maximum 5000 rows can be uploaded at once.",
            });
        }
        const result = await bulkCreateMolding(
            entries,
            String(loggedInUser).trim()
        );
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Molding bulk upload contains invalid records. No records were saved.",
                errors: result.errors || [],
                totalErrors: result.errors?.length || 0,
            });
        }

        return res.status(201).json({
            success: true,
            message: `${result.count} Molding record(s) saved successfully.`,
            count: result.count,
            transactions: result.transactions || [],
        });

    } catch (error) {
        console.error("Molding bulk upload error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save bulk Molding records.",
            error: error.message,
            code: error.code,
            sqlState: error.sqlState,
        });
    }
};

// UPDATE ALL MOLDING TRANSACTIONS MARGINS
export const updateCurrentMoldingMargins = async (req, res) => {
    try {
        const updatedBy =
            req.body?.updatedBy ||
            req.user?.email ||
            req.user?.user_name ||
            null;
        const result = await updateAllMoldingMargins(updatedBy);
        return res.status(200).json({
            success: true,
            message: "Molding margins updated successfully",
            ...result
        });

    } catch (error) {
        console.error("Error updating molding margins:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update molding margins",
            error: error.message
        });
    }
};

// DOWNLOAD INDIVIDUAL MOLDING COSTING AS EXCEL
export const downloadMoldingExcel = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const currentUser = getCurrentUserName(req);
        const adminOrVP = isAdminOrVP(req);

        if (!adminOrVP && !currentUser) {
            return res.status(401).json({
                success: false,
                message: "Unable to identify the logged-in user",
            });
        }
        if (!transactionId) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID is required"
            });
        }

        // 1. GET MOLDING TRANSACTION
        const [rows] = await zbcDB.query(`
            SELECT *
            FROM molding_table
            WHERE transaction_id = ?
            ${adminOrVP
                ? ""
                : "AND LOWER(TRIM(created_by)) = LOWER(TRIM(?))"}
            LIMIT 1`,
            adminOrVP
                ? [transactionId]
                : [transactionId, currentUser]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Molding transaction not found"
            });
        }
        const molding = rows[0];

        // 2. GET BOP DATA
        const [bops] = await zbcDB.query(`
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
                assembly_qty AS bop_assembly_qty,
                financial_year,
                bop_month,
                bop_rate,
                bop_cost
            FROM bop_part_details
            WHERE part_no = ?
            ORDER BY id ASC`,
            [molding.part_no]
        );

        // 3. GET CUSTOMER NAME
        let customerName = molding.customer_name || "";
        if (molding.customer_name) {
            try {
                const [customers] = await adminDB.query(`
                    SELECT customer_name
                    FROM customer_master
                    WHERE id = ?
                    LIMIT 1`,
                    [molding.customer_name]
                );
                if (customers.length > 0) {
                    customerName = customers[0].customer_name;
                }
            } catch (error) {
                console.warn("Customer lookup failed:", error.message);
            }
        }

        // 4. GET PRODUCTION UNIT
        let productionUnit = molding.production_unit || "";
        if (molding.production_unit) {
            try {
                const [units] = await adminDB.query(`
                    SELECT unit
                    FROM unit_master
                    WHERE id = ?
                    LIMIT 1`,
                    [molding.production_unit]
                );
                if (units.length > 0) {
                    productionUnit = units[0].unit;
                }
            } catch (error) {
                console.warn(
                    "Production unit lookup failed:",
                    error.message
                );
            }
        }

        // 5. GET BILLING UNIT
        let billingUnit =
            molding.billing_unit || "";
        if (molding.billing_unit) {
            try {
                const [units] = await adminDB.query(`
                    SELECT unit
                    FROM unit_master
                    WHERE id = ?
                    LIMIT 1`,
                    [molding.billing_unit]
                );
                if (units.length > 0) {
                    billingUnit = units[0].unit;
                }
            } catch (error) {
                console.warn("Billing unit lookup failed:", error.message);
            }
        }

        // 6. CREATE WORKBOOK
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Molding Costing System";
        workbook.lastModifiedBy = "Molding Costing System";
        const worksheet = workbook.addWorksheet("Molding Costing");
        worksheet.showGridLines = false;

        // COLUMN WIDTHS
        worksheet.getColumn("A").width = 31;
        worksheet.getColumn("B").width = 16;
        worksheet.getColumn("C").width = 6;
        worksheet.getColumn("D").width = 12;

        // COLORS
        const YELLOW = "FFFF00";
        const GRAY = "C0C0C0";
        const LIGHT_ORANGE = "FCE4D6";
        const RED = "FF0000";
        const WHITE = "FFFFFF";
        const BLACK = "000000";

        // BORDER
        const thinBorder = {
            top: { style: "thin", color: { argb: BLACK } },
            left: { style: "thin", color: { argb: BLACK } },
            bottom: { style: "thin", color: { argb: BLACK } },
            right: { style: "thin", color: { argb: BLACK } }
        };

        // HELPERS

        const setValue = (cellAddress, value, options = {}) => {
            const cell = worksheet.getCell(cellAddress);
            let finalValue = value;

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {
                finalValue = "";
            } else if (options.numeric) {
                const numberValue = Number(value);

                // Never write NaN or Infinity into an Excel cell
                finalValue = Number.isFinite(numberValue)
                    ? numberValue
                    : "";
            }

            cell.value = finalValue;

            cell.border =
                options.border === false ? undefined : thinBorder;

            cell.font = {
                name: "Aptos Display",
                size: 10,
                bold: options.bold || false,
                color: options.fontColor
                    ? { argb: options.fontColor }
                    : BLACK
            };

            cell.alignment = {
                vertical: "middle",
                horizontal: options.align || "left"
            };

            if (options.fill) {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: options.fill }
                };
            }

            if (options.numFmt) {
                cell.numFmt = options.numFmt;
            }
        };

        const setRowFill = (row, color) => {
            for (let col = 1; col <= 4; col++) {
                worksheet.getCell(row, col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
            }
        };

        // ROW HEIGHT
        for (let i = 1; i <= 40; i++) {
            worksheet.getRow(i).height = 20;
        }

        // GET TRANSACTION MONTH
        const transactionMonth = (() => {
            if (molding.effective_date) {
                const date = new Date(molding.effective_date);
                if (!Number.isNaN(date.getTime())) {
                    return date.toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                    });
                }
            }
            return molding.start_month || molding.month_name || "";
        })();

        // HEADER
        worksheet.mergeCells("A1:D1");
        setValue("A1", `${molding.part_no || ""} | MONTH: ${transactionMonth || "N/A"}`, { align: "center", fontColor: RED });
        worksheet.getCell("A1").font = { name: "Aptos Display", size: 12, bold: true, color: { argb: RED } };

        // RAW MATERIAL
        setValue("A2", "RAW MATERIAL", { bold: true, fill: YELLOW });
        setValue("B2", molding.compound_code || molding.polymer_name || "");
        setValue("C2", "");
        setValue("D2", "EPDM", { bold: true, fill: YELLOW, align: "center" });

        setValue("A3", "RAW MATERIAL RATE");
        setValue("B3", "");
        setValue("C3", "");
        setValue("D3", molding.compound_rate, { numeric: true, numFmt: "0.00", align: "center" });

        setValue("A4", "NET WEIGHT");
        setValue("B4", "GMS.");
        setValue("C4", "");
        setValue("D4", molding.net_weight, { numeric: true, numFmt: "0.00", align: "center" });

        setValue("A5", "GROSS WEIGHT OF RUBBER");
        setValue("B5", "GMS.");
        setValue("C5", "");
        setValue("D5", molding.gross_weight, { numeric: true, numFmt: "0.00", align: "center" });

        setValue("A6", "RAW MATERIAL COST OF RUBBER");
        setValue("B6", "");
        setValue("C6", "");
        setValue("D6", molding.total_rm_cost, { numeric: true, numFmt: "0.00", align: "center" });

        setValue("A7", "TAPE", { fill: LIGHT_ORANGE });
        setValue("B7", "", { fill: LIGHT_ORANGE });
        setValue("C7", "", { fill: LIGHT_ORANGE });
        setValue("D7", "", { fill: LIGHT_ORANGE });

        // TOTAL RAW MATERIAL
        setValue("A8", "TOTAL RAW MATERIAL COST", { bold: true, fill: GRAY });
        setValue("B8", "", { fill: GRAY });
        setValue("C8", "", { fill: GRAY });
        setValue("D8", molding.final_rm_cost, { bold: true, fill: GRAY, numeric: true, numFmt: "0.00", align: "center" });

        // PROCESS
        setValue("A9", "TYPES OF PROCESS", { bold: true });
        setValue("B9", "", { bold: true });
        setValue("C9", "", { bold: true });
        setValue("D9", molding.process_type || "", { bold: true, fill: YELLOW, align: "center" });

        setValue("A10", "NO. OF CAVITY");
        setValue("B10", "NOS.");
        setValue("C10", "");
        setValue("D10", molding.total_cavity, { numeric: true, numFmt: "0", align: "center" });

        setValue("A11", "SHIFT TIME @ 85% EFFICIENCY");
        setValue("B11", "NOS.");
        const shiftEfficiency = Number(molding.shift_time_efficiency);
        setValue("C11", Number.isFinite(shiftEfficiency) ? shiftEfficiency / 100 : "", { numeric: true, numFmt: "0%", align: "center" });
        setValue("D11", molding.efficiency, { numeric: true, numFmt: "0.00", align: "center" });

        setValue("A12", "CYCLE TIME");
        setValue("B12", "");
        setValue("C12", "");
        setValue("D12", molding.cycle_time, { numeric: true, numFmt: "0.00", align: "center" });

        setValue("A13", "TOTAL SHOTS / SHIFT");
        setValue("B13", "NOS.");
        setValue("C13", "");
        setValue("D13", molding.total_shots, { numeric: true, numFmt: "0", align: "center" });

        setValue("A14", "SHIFT RATE");
        setValue("B14", "RS.");
        setValue("C14", molding.machine_tonnage ?? "", {
            numeric: true,
            numFmt: "0.00",
            align: "center"
        });
        setValue("D14", molding.shift_rate, { numeric: true, numFmt: "0.00", align: "center" });

        setValue("A15", "TOTAL PRODUCTION PER SHIFT");
        setValue("B15", "");
        setValue("C15", "");
        setValue("D15", molding.total_production_per_shift, { numeric: true, numFmt: "0", align: "center" });

        // PROCESS COST
        setValue("A16", "PROCESS COST /PART", { bold: true, fill: GRAY });
        setValue("B16", "RS.", { bold: true, fill: GRAY });
        setValue("C16", "", { fill: GRAY });
        setValue("D16", molding.process_cost_a, { bold: true, fill: GRAY, numeric: true, numFmt: "0.00", align: "center" });

        // PROCESS COST DETAILS
        setValue("A17", "Post curing");
        setValue("B17", "");
        setValue("C17", "");
        setValue("D17", molding.post_curing, { numeric: true, numFmt: "0.00", align: "center" });

        setValue("A18", "FINISHING");
        setValue("B18", "");
        setValue("C18", "");
        setValue("D18", molding.finishing, { numeric: true, numFmt: "0.00", align: "center" });

        setValue("A19", "ASSY COST");
        setValue("B19", "");
        setValue("C19", "");
        setValue("D19", molding.total_assembly_cost, { numeric: true, numFmt: "0.00", align: "center" });

        setValue("A20", "INSPECTION");
        setValue("B20", "");
        setValue("C20", "");
        setValue("D20", molding.inspection, { numeric: true, numFmt: "0.00", align: "center" });

        // TOTAL CONVERSION COST
        setValue("A21", "TOTAL CONVERSION COST", { bold: true, fill: GRAY });
        setValue("B21", "", { fill: GRAY });
        setValue("C21", "", { fill: GRAY });
        setValue("D21", molding.conversion_cost, { bold: true, fill: GRAY, numeric: true, numFmt: "0.00", align: "center" });

        // SUB TOTAL A
        setValue("A22", "SUB TOTAL A", { bold: true, fill: GRAY });
        setValue("B22", "RS.", { bold: true, fill: GRAY });
        setValue("C22", "", { fill: GRAY });
        setValue("D22", molding.subtotal_a, { bold: true, fill: GRAY, numeric: true, numFmt: "0.00", align: "center" });

        // MARGINS
        const marginRows = [
            [23, "ICC", "icc_on_rm", "icc_on_rm_cost"],
            [24, "REJ. ON SUB TOTAL A", "rej_on_subtotal", "rej_on_subtotal_cost"],
            [25, "O/HEAD ON SUB TOTAL A", "oh_on_subtotal", "oh_on_subtotal_cost"],
            [26, "PROFIT ON SUB TOTAL A", "profit_on_subtotal", "profit_on_subtotal_cost"],
            [27, "PACKING", "packaging_on_subtotal", "packaging_on_subtotal_cost"],
            [28, "FORWARDING", "transport_on_subtotal", "transport_on_subtotal_cost"]
        ];

        marginRows.forEach(([row, label, percentField, costField]) => {
            setValue(`A${row}`, label);
            const percentage = Number(molding[percentField]);
            setValue(`B${row}`, Number.isFinite(percentage) ? percentage / 100 : "", { numeric: true, numFmt: "0%", align: "center" });
            setValue(`C${row}`, "", { align: "center" });
            setValue(`D${row}`, molding[costField], { numeric: true, numFmt: "0.00", align: "center" });
        });

        // SUB TOTAL B
        setValue("A29", "SUB TOTAL B", { bold: true, fill: YELLOW });
        setValue("B29", "RS.", { bold: true, fill: YELLOW });
        setValue("C29", "", { fill: YELLOW });
        setValue("D29", molding.subtotal_b, { bold: true, fill: YELLOW, numeric: true, numFmt: "0.00", align: "center" });

        // PART COST
        setValue("A30", "PART COST / PC", { bold: true, fill: YELLOW });
        setValue("B30", "RS.", { bold: true, fill: YELLOW });
        setValue("C30", "", { fill: YELLOW });
        setValue("D30", molding.part_cost, { bold: true, fill: YELLOW, numeric: true, numFmt: "0.00", align: "center" });

        // SALES COST
        worksheet.mergeCells("A31:C31");
        setValue("A31", "SALES COST", { fill: LIGHT_ORANGE });
        setValue("D31", molding.customer_sales_cost, { fill: LIGHT_ORANGE, numeric: true, numFmt: "0.00", align: "center" });

        // MFG WITHOUT PROFIT
        const mfgWithoutProfit = Number(molding.sales_profit_loss || 0);
        worksheet.mergeCells("A32:C32");
        setValue("A32", "MFG W/O PROFIT", { bold: true });
        setValue("D32", mfgWithoutProfit, { bold: true, numeric: true, numFmt: "0.00", align: "center" });

        // MFG WITH PROFIT
        const mfgWithProfit = Number(molding.sales_profit_loss || 0) + Number(molding.subtotal_b || 0);
        worksheet.mergeCells("A33:C33");
        setValue("A33", "MFG WITH PROFIT", { bold: true });
        setValue("D33", mfgWithProfit, { bold: true, numeric: true, numFmt: "0.00", align: "center" });

        // QTY
        worksheet.mergeCells("A34:C34");
        setValue("A34", "QTY", { bold: true, fill: YELLOW });
        setValue("D34", Math.floor(Number(molding.monthly_quantity || 0)), { bold: true, fill: YELLOW, numeric: true, numFmt: "#,##0", align: "center" });

        const extraProfit = Number(molding.sales_profit_loss || 0) * (molding.monthly_quantity || 0);
        worksheet.mergeCells("A35:C35");
        setValue("A35", "EXTRA PROFIT", { bold: true });
        setValue("D35", extraProfit, { bold: true, numeric: true, numFmt: "#,##0", align: "center", });

        // TOTAL MFG PROFIT
        const totalMfgProfit = mfgWithProfit * Number(molding.monthly_quantity || 0);
        worksheet.mergeCells("A36:C36");
        setValue("A36", "TOTAL MFG PROFIT", { bold: true });
        setValue("D36", totalMfgProfit, { bold: true, numeric: true, numFmt: "#,##0", align: "center", });

        // ADDITIONAL TRANSACTION INFORMATION
        // setValue("A38", "CUSTOMER", { bold: true });
        // setValue("D38", customerName);
        // setValue("A39", "PRODUCTION UNIT", { bold: true });
        // setValue("D39", productionUnit);
        // setValue("A40", "BILLING UNIT", { bold: true });
        // setValue("D40", billingUnit);

        // PAGE SETTINGS
        worksheet.pageSetup = {
            paperSize: worksheet.PAPERSIZE_A4,
            orientation: "portrait",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 1,
            margins: {
                left: 0.2,
                right: 0.2,
                top: 0.3,
                bottom: 0.3,
                header: 0,
                footer: 0
            }
        };

        // DOWNLOAD
        const filename = `${molding.transaction_id}_Costing.xlsx`;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Molding Excel download error:", error);
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate molding Excel",
                error: error.message
            });
        }
    }
};

export const getCustomerWiseMonthlyReport = async (req, res) => {
    try {
        const financialYear = String(req.query.financialYear || "").trim();
        const month = Number(req.query.month);

        if (!financialYear || !Number.isInteger(month) || month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: "financialYear and a valid month (1-12) are required.",
            });
        }
        const currentUser = getCurrentUserName(req);
        const adminOrVP = isAdminOrVP(req);

        if (!adminOrVP && !currentUser) {
            return res.status(401).json({
                success: false,
                message: "Unable to identify the logged-in user",
            });
        }

        // Monthly amounts/rates come from molding_monthly_report.
        const [rows] = await zbcDB.query(`
            SELECT
                m.id AS molding_id,
                m.transaction_id,
                m.status,
                m.customer_name AS customer_id,
                m.production_unit AS production_unit_id,
                m.billing_unit AS billing_unit_id,
                m.sub_department AS sub_department_id,
                m.sub_category AS sub_category_id,
                m.part_no,
                m.part_name,
                m.fg_code,
                mm.financial_year,
                mm.month,
                mm.month_name,
                mm.subtotal_a,
                mm.part_cost,
                mm.customer_sales_cost,
                mm.monthly_quantity
            FROM molding_table m
            INNER JOIN molding_monthly_report mm
                ON mm.molding_id = m.id
                AND mm.transaction_id = m.transaction_id
            WHERE mm.financial_year = ?
                AND mm.month = ?
                ${adminOrVP
                ? ""
                : "AND LOWER(TRIM(m.created_by)) = LOWER(TRIM(?))"}
            ORDER BY m.customer_name, m.sub_category, m.part_no
        `,
            adminOrVP
                ? [financialYear, month]
                : [financialYear, month, currentUser]
        );
        if (!rows.length) {
            return res.json({ success: true, data: [] });
        }
        const uniqueIds = (field) =>
            [...new Set(rows.map((row) => row[field]).filter((value) => value !== null && value !== undefined && value !== ""))];
        const customerIds = uniqueIds("customer_id");
        const productionUnitIds = uniqueIds("production_unit_id");
        const billingUnitIds = uniqueIds("billing_unit_id");
        const subDepartmentIds = uniqueIds("sub_department_id");
        const subCategoryIds = uniqueIds("sub_category_id");
        const [
            [customers],
            [productionUnits],
            [billingUnits],
            [subDepartments],
            [subCategories],
        ] = await Promise.all([
            customerIds.length
                ? adminDB.query("SELECT id, customer_name AS label FROM customer_master WHERE id IN (?)", [customerIds])
                : Promise.resolve([[]]),
            productionUnitIds.length
                ? adminDB.query("SELECT id, unit AS label FROM unit_master WHERE id IN (?)", [productionUnitIds])
                : Promise.resolve([[]]),
            billingUnitIds.length
                ? adminDB.query("SELECT id, unit AS label FROM unit_master WHERE id IN (?)", [billingUnitIds])
                : Promise.resolve([[]]),
            subDepartmentIds.length
                ? adminDB.query("SELECT id, sub_department_name AS label FROM sub_department_master WHERE id IN (?)", [subDepartmentIds])
                : Promise.resolve([[]]),
            subCategoryIds.length
                ? adminDB.query("SELECT id, sub_category_name AS label FROM sub_category_master WHERE id IN (?)", [subCategoryIds])
                : Promise.resolve([[]]),
        ]);

        const makeMap = (items) => new Map(items.map((item) => [String(item.id), item.label]));
        const customerMap = makeMap(customers);
        const productionUnitMap = makeMap(productionUnits);
        const billingUnitMap = makeMap(billingUnits);
        const subDepartmentMap = makeMap(subDepartments);
        const subCategoryMap = makeMap(subCategories);
        const resolveLabel = (map, value) => map.get(String(value)) || String(value ?? "");
        return res.json({
            success: true,
            data: rows.map((row) => ({
                molding_id: row.molding_id,
                transaction_id: row.transaction_id,
                status: row.status,
                financial_year: row.financial_year,
                month: Number(row.month),
                month_name: row.month_name,
                customer_name: resolveLabel(customerMap, row.customer_id),
                customer_id: row.customer_id,
                production_unit: resolveLabel(productionUnitMap, row.production_unit_id),
                production_unit_id: row.production_unit_id,
                billing_unit: resolveLabel(billingUnitMap, row.billing_unit_id),
                billing_unit_id: row.billing_unit_id,
                sub_department: resolveLabel(subDepartmentMap, row.sub_department_id),
                sub_category: resolveLabel(subCategoryMap, row.sub_category_id),
                sub_category_id: row.sub_category_id,
                part_no: row.part_no || "",
                part_name: row.part_name || "",
                fg_code: row.fg_code || "",
                subtotal_a: row.subtotal_a === null ? null : Number(row.subtotal_a),
                part_cost: row.part_cost === null ? null : Number(row.part_cost),
                customer_sales_cost: row.customer_sales_cost === null ? null : Number(row.customer_sales_cost),
                monthly_quantity: row.monthly_quantity === null ? 0 : Number(row.monthly_quantity),
            })),
        });
    } catch (error) {
        console.error("Customer wise monthly report error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load Customer Wise Monthly Report.",
            error: error.message,
        });
    }
};