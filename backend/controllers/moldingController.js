import { createDraft, updateDraft, submitFinal } from "../models/moldingModel.js";
import zbcDB from "../config/zbcDB.js";
import adminDB from "../config/adminDB.js";

export const saveDraft = async (req, res) => {
    try {
        const { formData, bops, transactionId } = req.body;
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
        console.error("Error saving draft:", error);
        res.status(500).json({
            message: "Failed to save draft",
            error: error.message
        });
    }
};

export const finalSubmit = async (req, res) => {
    try {
        const { transactionId } = req.body;
        if (!transactionId) {
            return res.status(400).json({
                message: "Transaction ID is required"
            });
        }
        const result =
            await submitFinal(transactionId);
        res.status(200).json({
            message: "Costing submitted successfully",
            ...result
        });
    } catch (error) {
        console.error(
            "Error submitting costing:",
            error
        );
        res.status(500).json({
            message: "Failed to submit costing",
            error: error.message
        });
    }
};

export const getMoldingTransactions = async (req, res) => {
    try {

        // 1. GET TRANSACTION DATA FROM ZBC DB
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
            ORDER BY id DESC
        `);

        // No transactions
        if (moldingRows.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // 2. CUSTOMER IDs
        const customerIds = [
            ...new Set(
                moldingRows
                    .map(row => row.customer_name)
                    .filter(Boolean)
            )
        ];
        const [customers] = customerIds.length ? await adminDB.query(`
                SELECT
                    id,
                    customer_name
                FROM customer_master
                WHERE id IN (?)
                `,
            [customerIds]
        ) : [[]];
        const customerMap = new Map(customers.map(row => [
            String(row.id),
            row.customer_name
        ]));

        // 3. PRODUCTION UNIT IDs
        const productionUnitIds = [
            ...new Set(
                moldingRows
                    .map(row => row.production_unit)
                    .filter(Boolean)
            )
        ];
        const [productionUnits] = productionUnitIds.length ? await adminDB.query(`
                SELECT
                    id,
                    unit
                FROM unit_master
                WHERE id IN (?)
                `,
            [productionUnitIds]
        ) : [[]];
        const productionUnitMap = new Map(productionUnits.map(row => [
            String(row.id),
            row.unit
        ]));

        // 4. BILLING UNIT IDs
        const billingUnitIds = [
            ...new Set(
                moldingRows
                    .map(row => row.billing_unit)
                    .filter(Boolean)
            )
        ];
        const [billingUnits] = billingUnitIds.length ? await adminDB.query(`
                SELECT
                    id,
                    unit
                FROM unit_master
                WHERE id IN (?)
                `,
            [billingUnitIds]
        ) : [[]];
        const billingUnitMap = new Map(billingUnits.map(row => [
            String(row.id),
            row.unit
        ]));

        // 6. SUB CATEGORY IDs
        const subCategoryIds = [
            ...new Set(
                moldingRows
                    .map(row => row.sub_category)
                    .filter(Boolean)
            )
        ];

        const [subCategories] = subCategoryIds.length ? await adminDB.query(`
                SELECT
                    id,
                    sub_category_name
                FROM sub_category_master
                WHERE id IN (?)
                `,
            [subCategoryIds]
        ) : [[]];

        const subCategoryMap = new Map(subCategories.map(row => [
            String(row.id),
            row.sub_category_name
        ]));

        // ============================================================
        // 7. COMBINE DATA
        // ============================================================
        const transactions = moldingRows.map(row => {
            const customerName =
                customerMap.get(String(row.customer_name)) ||
                row.customer_name ||
                "";

            const productionUnit =
                productionUnitMap.get(String(row.production_unit)) ||
                row.production_unit ||
                "";

            const billingUnit =
                billingUnitMap.get(String(row.billing_unit)) ||
                row.billing_unit ||
                "";



            const subCategory =
                subCategoryMap.get(String(row.sub_category)) ||
                row.sub_category ||
                "";

            return {
                // ====================================================
                // TRANSACTION
                // ====================================================
                transaction_id: row.transaction_id,

                // ====================================================
                // MASTER DATA - DISPLAY NAMES
                // ====================================================
                customer_name: customerName,

                production_unit: productionUnit,

                billing_unit: billingUnit,

                sub_category: subCategory,
                

                // ====================================================
                // ORIGINAL IDs
                // Useful if frontend needs them later
                // ====================================================
                customer_id: row.customer_name,

                production_unit_id: row.production_unit,

                billing_unit_id: row.billing_unit,

                sub_category_id: row.sub_category,
                

                // ====================================================
                // MOLDING DATA
                // ====================================================
                part_no: row.part_no || "",

                part_cost: row.part_cost ?? 0,

                customer_sales_cost:
                    row.customer_sales_cost ?? 0,

                monthly_quantity:
                    row.monthly_quantity ?? 0,

                subtotal_a: row.subtotal_a ?? 0,

                status: row.status || ""
            };
        });

        // ============================================================
        // 8. RESPONSE
        // ============================================================
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

export const getMoldingTransactionById = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const [rows] = await zbcDB.query(`
            SELECT *
            FROM molding_table
            WHERE transaction_id = ?
            LIMIT 1
            `,
            [transactionId]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }
        const molding = rows[0];
        const [bops] = await zbcDB.query(`
            SELECT
                id,
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
            FROM molding_bop_table
            WHERE molding_id = ?
            ORDER BY id ASC
            `,
            [molding.id]
        );
        res.json({
            success: true,
            data: {
                ...molding,
                bops
            }
        });
    } catch (error) {
        console.error("Error fetching transaction:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transaction",
            error: error.message
        });
    }
};

export const exportMoldingData = async (req, res) => {
    try {
        // ============================================
        // 1. GET ALL MOLDING DATA
        // ============================================

        const [moldingRows] = await zbcDB.query(`
            SELECT *
            FROM molding_table
            ORDER BY id DESC
        `);

        // ============================================
        // 2. GET ALL BOP DATA
        // ============================================

        const [bopRows] = await zbcDB.query(`
            SELECT
                b.id,
                b.molding_id,
                m.transaction_id,
                b.bop_part_no,
                b.bop_part_name,
                b.commodity,
                b.supplier_id,
                b.bop_assembly_qty,
                b.bop_fg_code,
                b.bop_month,
                b.bop_rate,
                b.bop_cost
            FROM molding_bop_table b
            LEFT JOIN molding_table m
                ON m.id = b.molding_id
            ORDER BY b.id ASC
        `);

        // ============================================
        // 3. GET CUSTOMER MASTER DATA
        // ============================================

        const customerIds = [
            ...new Set(
                moldingRows
                    .map(row => row.customer_name)
                    .filter(Boolean)
            )
        ];

        const [customers] = customerIds.length
            ? await adminDB.query(`
                SELECT
                    id,
                    customer_name
                FROM customer_master
                WHERE id IN (?)
            `, [customerIds])
            : [[]];

        const customerMap = new Map(
            customers.map(row => [
                String(row.id),
                row.customer_name
            ])
        );

        // ============================================
        // 4. GET PRODUCTION UNIT DATA
        // ============================================

        const productionUnitIds = [
            ...new Set(
                moldingRows
                    .map(row => row.production_unit)
                    .filter(Boolean)
            )
        ];

        const [productionUnits] = productionUnitIds.length
            ? await adminDB.query(`
                SELECT
                    id,
                    unit
                FROM unit_master
                WHERE id IN (?)
            `, [productionUnitIds])
            : [[]];

        const productionUnitMap = new Map(
            productionUnits.map(row => [
                String(row.id),
                row.unit
            ])
        );


        // ============================================
        // 4. GET PRODUCTION UNIT DATA
        // ============================================

        const billingUnitIds = [
            ...new Set(
                moldingRows
                    .map(row => row.billing_unit)
                    .filter(Boolean)
            )
        ];

        const [billingUnits] = billingUnitIds.length
            ? await adminDB.query(`
                SELECT
                    id,
                    unit
                FROM unit_master
                WHERE id IN (?)
            `, [billingUnitIds])
            : [[]];

        const billingUnitMap = new Map(
            billingUnits.map(row => [
                String(row.id),
                row.unit
            ])
        );


        // ============================================
        // 5. GET SUB DEPARTMENT DATA
        // ============================================

        const subDepartmentIds = [
            ...new Set(
                moldingRows
                    .map(row => row.sub_department)
                    .filter(Boolean)
            )
        ];

        const [subDepartments] = subDepartmentIds.length
            ? await adminDB.query(`
                SELECT
                    id,
                    sub_department_name
                FROM sub_department_master
                WHERE id IN (?)
            `, [subDepartmentIds])
            : [[]];

        const subDepartmentMap = new Map(
            subDepartments.map(row => [
                String(row.id),
                row.sub_department_name
            ])
        );

        // ============================================
        // 6. GET SUB CATEGORY DATA
        // ============================================

        const subCategoryIds = [
            ...new Set(
                moldingRows
                    .map(row => row.sub_category)
                    .filter(Boolean)
            )
        ];

        const [subCategories] = subCategoryIds.length
            ? await adminDB.query(`
                SELECT
                    id,
                    sub_category_name
                FROM sub_category_master
                WHERE id IN (?)
            `, [subCategoryIds])
            : [[]];

        const subCategoryMap = new Map(
            subCategories.map(row => [
                String(row.id),
                row.sub_category_name
            ])
        );

        // ============================================
        // 7. REPLACE IDs WITH NAMES
        // ============================================

        const moldingData = moldingRows.map(row => ({
            ...row,

            customer_name:
                customerMap.get(String(row.customer_name)) ||
                row.customer_name ||
                "",

            production_unit:
                productionUnitMap.get(String(row.production_unit)) ||
                row.production_unit ||
                "",

            billing_unit:
                billingUnitMap.get(String(row.billing_unit)) ||
                row.billing_unit ||
                "",

            sub_department:
                subDepartmentMap.get(String(row.sub_department)) ||
                row.sub_department ||
                "",

            sub_category:
                subCategoryMap.get(String(row.sub_category)) ||
                row.sub_category ||
                ""
        }));

        // ============================================
        // 8. RETURN DATA
        // ============================================

        res.json({
            success: true,

            moldingData,

            bopData: bopRows
        });

    } catch (error) {

        console.error(
            "Error exporting molding data:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to export molding data",
            error: error.message
        });
    }
};