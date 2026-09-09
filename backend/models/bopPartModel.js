import zbcDB from "../config/zbcDB.js";
import adminDB from "../config/adminDB.js";

/*
============================================================
BOP PART MODEL
------------------------------------------------------------
Stores the permanent BOP configuration against a Part No.

Relationship:

    Part No.
       ↓
    BOP Component(s)

BOP master data remains in ADMIN database.
Part-BOP mapping is stored in zbc_costing database.
============================================================
*/

const BopPart = {
    /*
    ========================================================
    GET BOP CONFIGURATION FOR ONE PART
    ========================================================
    */
    getByPartNo: async (partNo) => {
        const [rows] = await zbcDB.query(
            `
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

                supplier_id,
                supplier_name,

                commodity,
                assembly_qty,

                created_by,
                created_at,
                updated_by,
                updated_at

            FROM bop_part_details

            WHERE part_no = ?

            ORDER BY id ASC
            `,
            [partNo],
        );

        return rows;
    },

    /*
    ========================================================
    GET ALL PART-BOP CONFIGURATIONS
    ========================================================
    */
    getAll: async () => {
        const [rows] = await zbcDB.query(
            `
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

                supplier_id,
                supplier_name,

                commodity,
                assembly_qty,

                created_by,
                created_at,
                updated_by,
                updated_at

            FROM bop_part_details

            ORDER BY part_no ASC, id ASC
            `,
        );

        return rows;
    },

    /*
    ========================================================
    SAVE / REPLACE COMPLETE BOP CONFIGURATION
    FOR ONE PART
    ========================================================

    Example:

    Part No: ABC123

    BOP 1
    BOP 2
    BOP 3

    Saving again for ABC123 replaces the previous
    configuration with the new configuration.
    ========================================================
    */
    saveForPart: async ({
        partNo,
        bops = [],
        createdBy = null,
        updatedBy = null,
    }) => {
        const connection = await zbcDB.getConnection();

        try {
            /*
            ------------------------------------------------
            START TRANSACTION
            ------------------------------------------------
            */
            await connection.beginTransaction();

            /*
            ------------------------------------------------
            VALIDATE PART FROM ADMIN DATABASE
            ------------------------------------------------
            */
            const [partRows] = await adminDB.query(
                `
                SELECT
                    id,
                    part_no,
                    part_name,
                    fg_code

                FROM part_master

                WHERE TRIM(part_no) = TRIM(?)

                LIMIT 1
                `,
                [String(partNo).trim()],
            );

            if (partRows.length === 0) {
                throw new Error(
                    `Part No. '${partNo}' was not found in Part Master.`,
                );
            }

            const part = partRows[0];

            /*
            ------------------------------------------------
            DELETE EXISTING CONFIGURATION
            ------------------------------------------------

            This is inside the transaction.

            If anything fails later, rollback will restore
            the previous configuration.
            ------------------------------------------------
            */
            await connection.query(
                `
                DELETE FROM bop_part_details
                WHERE part_no = ?
                `,
                [String(part.part_no).trim()],
            );

            /*
            ------------------------------------------------
            NO BOP CONFIGURATION
            ------------------------------------------------

            Empty array means this part has no BOP.
            ------------------------------------------------
            */
            if (!Array.isArray(bops) || bops.length === 0) {
                await connection.commit();

                return {
                    partNo: part.part_no,
                    partId: part.id,
                    count: 0,
                };
            }

            /*
            ------------------------------------------------
            VALIDATE DUPLICATE BOP + SUPPLIER COMBINATIONS
            ------------------------------------------------
            */
            const duplicateKeys = new Set();

            for (
                let index = 0;
                index < bops.length;
                index += 1
            ) {
                const bop = bops[index];

                const bopId = Number(
                    bop.bopId ??
                    bop.bop_id ??
                    0,
                );

                const supplierId = Number(
                    bop.supplierId ??
                    bop.supplier_id ??
                    0,
                );

                const assemblyQty = Number(
                    bop.assemblyQty ??
                    bop.bopAssemblyQty ??
                    bop.bop_assembly_qty ??
                    0,
                );

                /*
                ------------------------------------------------
                BOP REQUIRED
                ------------------------------------------------
                */
                if (!bopId || bopId <= 0) {
                    throw new Error(
                        `BOP FG Code is required in row ${index + 1
                        }.`,
                    );
                }

                /*
                ------------------------------------------------
                SUPPLIER REQUIRED
                ------------------------------------------------
                */
                if (!supplierId || supplierId <= 0) {
                    throw new Error(
                        `Supplier is required in row ${index + 1
                        }.`,
                    );
                }

                /*
                ------------------------------------------------
                ASSEMBLY QTY VALIDATION
                ------------------------------------------------
                */
                if (
                    Number.isNaN(assemblyQty) ||
                    !Number.isFinite(assemblyQty) ||
                    assemblyQty < 0
                ) {
                    throw new Error(
                        `Assembly Qty must be a valid non-negative number in row ${index + 1
                        }.`,
                    );
                }

                /*
                ------------------------------------------------
                DUPLICATE CHECK
                ------------------------------------------------
                */
                const duplicateKey =
                    `${bopId}-${supplierId}`;

                if (
                    duplicateKeys.has(
                        duplicateKey,
                    )
                ) {
                    throw new Error(
                        `Duplicate BOP/Supplier combination found in row ${index + 1
                        }.`,
                    );
                }

                duplicateKeys.add(
                    duplicateKey,
                );
            }

            /*
            ====================================================
            PROCESS EACH BOP
            ====================================================
            */
            for (
                let index = 0;
                index < bops.length;
                index += 1
            ) {
                const bop = bops[index];

                const bopId = Number(
                    bop.bopId ??
                    bop.bop_id ??
                    0,
                );

                const supplierId = Number(
                    bop.supplierId ??
                    bop.supplier_id ??
                    0,
                );

                const assemblyQty = Number(
                    bop.assemblyQty ??
                    bop.bopAssemblyQty ??
                    bop.bop_assembly_qty ??
                    0,
                );

                /*
                =================================================
                GET BOP MASTER DATA
                =================================================
                */
                const [bopRows] =
                    await adminDB.query(
                        `
                        SELECT
                            id,
                            bop_part_name,
                            bop_part_no,
                            bop_erp_code,
                            commodity,
                            supplier_id

                        FROM bop_master

                        WHERE id = ?

                        LIMIT 1
                        `,
                        [bopId],
                    );

                if (bopRows.length === 0) {
                    throw new Error(
                        `BOP master ID '${bopId}' was not found in row ${index + 1
                        }.`,
                    );
                }

                const bopMaster =
                    bopRows[0];

                /*
                =================================================
                VALIDATE SUPPLIER BELONGS TO BOP
                =================================================
                */

                const allowedSupplierIds =
                    String(
                        bopMaster.supplier_id ||
                        "",
                    )
                        .split(",")
                        .map((id) =>
                            id.trim(),
                        )
                        .filter(Boolean);

                if (
                    !allowedSupplierIds.includes(
                        String(supplierId),
                    )
                ) {
                    throw new Error(
                        `Supplier '${supplierId}' is not assigned to BOP '${bopMaster.bop_erp_code}'.`,
                    );
                }

                /*
                =================================================
                GET SUPPLIER NAME
                =================================================
                */
                const [supplierRows] =
                    await adminDB.query(
                        `
                        SELECT
                            id,
                            supplier_name

                        FROM supplier_master

                        WHERE id = ?

                        LIMIT 1
                        `,
                        [supplierId],
                    );

                if (
                    supplierRows.length === 0
                ) {
                    throw new Error(
                        `Supplier ID '${supplierId}' was not found in row ${index + 1
                        }.`,
                    );
                }

                const supplierName =
                    supplierRows[0]
                        .supplier_name || "";

                /*
                =================================================
                INSERT BOP CONFIGURATION
                =================================================
                */
                await connection.query(
                    `
                    INSERT INTO bop_part_details (

                        part_no,
                        part_id,
                        part_name,
                        fg_code,

                        bop_id,
                        bop_fg_code,
                        bop_part_no,
                        bop_part_name,

                        supplier_id,
                        supplier_name,

                        commodity,
                        assembly_qty,

                        created_by,
                        updated_by

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
                        ?
                    )
                    `,
                    [
                        /*
                        -----------------------------
                        PART DATA
                        -----------------------------
                        */
                        part.part_no,
                        part.id,
                        part.part_name ||
                        null,
                        part.fg_code ||
                        null,

                        /*
                        -----------------------------
                        BOP MASTER DATA
                        -----------------------------
                        */
                        bopMaster.id,
                        bopMaster.bop_erp_code ||
                        null,
                        bopMaster.bop_part_no ||
                        null,
                        bopMaster.bop_part_name ||
                        null,

                        /*
                        -----------------------------
                        SUPPLIER
                        -----------------------------
                        */
                        supplierId,
                        supplierName,

                        /*
                        -----------------------------
                        OTHER
                        -----------------------------
                        */
                        bopMaster.commodity ||
                        null,

                        assemblyQty,

                        /*
                        -----------------------------
                        AUDIT
                        -----------------------------
                        */
                        createdBy,
                        updatedBy,
                    ],
                );
            }

            /*
            ====================================================
            COMMIT
            ====================================================
            */
            await connection.commit();

            return {
                partNo: part.part_no,
                partId: part.id,
                count: bops.length,
            };
        } catch (error) {
            /*
            ====================================================
            ROLLBACK
            ====================================================
            */
            await connection.rollback();

            throw error;
        } finally {
            /*
            ====================================================
            RELEASE CONNECTION
            ====================================================
            */
            connection.release();
        }
    },

    /*
    ========================================================
    DELETE ALL BOP CONFIGURATION FOR ONE PART
    ========================================================
    */
    deleteForPart: async (partNo) => {
        const [result] = await zbcDB.query(
            `
            DELETE FROM bop_part_details
            WHERE part_no = ?
            `,
            [String(partNo).trim()],
        );

        return result.affectedRows;
    },
};

export default BopPart;