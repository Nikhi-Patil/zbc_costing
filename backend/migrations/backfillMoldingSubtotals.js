import zbcDB from "../config/zbcDB.js";

const backfillMoldingSubtotals = async () => {
    const connection = await zbcDB.getConnection();

    try {
        await connection.beginTransaction();

        console.log("==========================================");
        console.log("MOLDING SUBTOTAL BACKFILL STARTED");
        console.log("==========================================");

        // --------------------------------------------------
        // 1. Count records that need subtotal_a
        // --------------------------------------------------
        const [[subtotalACount]] = await connection.query(`
            SELECT COUNT(*) AS count
            FROM molding_table
            WHERE subtotal_a IS NULL
        `);

        console.log(
            `Records needing subtotal_a: ${subtotalACount.count}`
        );

        // --------------------------------------------------
        // 2. Count records that need subtotal_b
        // --------------------------------------------------
        const [[subtotalBCount]] = await connection.query(`
            SELECT COUNT(*) AS count
            FROM molding_table
            WHERE subtotal_b IS NULL
        `);

        console.log(
            `Records needing subtotal_b: ${subtotalBCount.count}`
        );

        // --------------------------------------------------
        // 3. BACKFILL SUBTOTAL A
        //
        // Current frontend logic:
        //
        // finalRmCost = totalRmCost + totalBopCost
        //
        // subtotalA = finalRmCost + conversionCost
        //
        // We already store final_rm_cost and conversion_cost.
        // --------------------------------------------------
        const [subtotalAResult] = await connection.query(`
            UPDATE molding_table
            SET subtotal_a = ROUND(
                COALESCE(final_rm_cost, 0)
                +
                COALESCE(conversion_cost, 0),
                2
            )
            WHERE subtotal_a IS NULL
        `);

        console.log(
            `subtotal_a updated: ${subtotalAResult.affectedRows}`
        );

        // --------------------------------------------------
        // 4. BACKFILL SUBTOTAL B
        //
        // Current frontend logic:
        //
        // ICC
        // + Rejection
        // + O/H
        // + Profit
        // + Packaging
        // + Transport
        //
        // All percentages are applied on subtotal_a
        // except ICC, which is applied on final_rm_cost.
        // --------------------------------------------------
        const [subtotalBResult] = await connection.query(`
            UPDATE molding_table
            SET subtotal_b = ROUND(
                
                (
                    COALESCE(final_rm_cost, 0)
                    *
                    COALESCE(icc_on_rm, 0)
                    / 100
                )

                +

                (
                    COALESCE(subtotal_a, 0)
                    *
                    COALESCE(rej_on_subtotal, 0)
                    / 100
                )

                +

                (
                    COALESCE(subtotal_a, 0)
                    *
                    COALESCE(oh_on_subtotal, 0)
                    / 100
                )

                +

                (
                    COALESCE(subtotal_a, 0)
                    *
                    COALESCE(profit_on_subtotal, 0)
                    / 100
                )

                +

                (
                    COALESCE(subtotal_a, 0)
                    *
                    COALESCE(packaging_on_subtotal, 0)
                    / 100
                )

                +

                (
                    COALESCE(subtotal_a, 0)
                    *
                    COALESCE(transport_on_subtotal, 0)
                    / 100
                ),

                2
            )
            WHERE subtotal_b IS NULL
        `);

        console.log(
            `subtotal_b updated: ${subtotalBResult.affectedRows}`
        );

        // --------------------------------------------------
        // 5. Verify remaining NULL records
        // --------------------------------------------------
        const [[remaining]] = await connection.query(`
            SELECT
                COUNT(*) AS total_remaining
            FROM molding_table
            WHERE subtotal_a IS NULL
               OR subtotal_b IS NULL
        `);

        console.log(
            `Remaining records with NULL subtotal: ${remaining.total_remaining}`
        );

        // --------------------------------------------------
        // 6. Commit
        // --------------------------------------------------
        await connection.commit();

        console.log("==========================================");
        console.log("MOLDING SUBTOTAL BACKFILL COMPLETED");
        console.log("==========================================");

        console.log({
            subtotalAUpdated: subtotalAResult.affectedRows,
            subtotalBUpdated: subtotalBResult.affectedRows,
            remainingNull: remaining.total_remaining,
        });

    } catch (error) {
        await connection.rollback();

        console.error("==========================================");
        console.error("MOLDING SUBTOTAL BACKFILL FAILED");
        console.error("ROLLING BACK CHANGES");
        console.error("==========================================");

        console.error(error);

        throw error;
    } finally {
        connection.release();
    }
};

backfillMoldingSubtotals()
    .then(() => {
        console.log("Migration finished.");
        process.exit(0);
    })
    .catch(() => {
        console.error("Migration failed.");
        process.exit(1);
    });