import adminDB from "../config/adminDB.js";

// ============================================================
// ZBC MASTER ACCESS
// ============================================================

export const requirezbcMasters = (
  requiredTables = []
) => {

  return async (req, res, next) => {

    try {

      // --------------------------------------------------------
      // Validate configuration
      // --------------------------------------------------------

      if (
        !Array.isArray(requiredTables) ||
        requiredTables.length === 0
      ) {

        return res.status(500).json({
          success: false,
          message:
            "ZBC master access configuration is missing",
        });

      }


      // --------------------------------------------------------
      // STEP 1
      // Find active ZBC module
      // --------------------------------------------------------

      const [moduleRows] =
        await adminDB.query(
          `
          SELECT
            id,
            module_name,
            master_access,
            status
          FROM module_master
          WHERE LOWER(TRIM(module_name)) = 'zbc'
            AND status = 1
          ORDER BY id ASC
          LIMIT 1
          `
        );


      if (moduleRows.length === 0) {

        return res.status(403).json({
          success: false,
          message:
            "ZBC module is not active",
        });

      }


      const moduleData =
        moduleRows[0];


      // --------------------------------------------------------
      // STEP 2
      // Read master access
      // --------------------------------------------------------

      const allowedMasterIds =
        String(
          moduleData.master_access || ""
        )
          .split(",")
          .map((value) =>
            value.trim()
          )
          .filter(
            (value) => value !== ""
          )
          .map((value) =>
            Number(value)
          )
          .filter(
            (value) =>
              Number.isInteger(value) &&
              value > 0
          );


      if (
        allowedMasterIds.length === 0
      ) {

        return res.status(403).json({
          success: false,
          message:
            "No masters are assigned to ZBC module",
        });

      }


      // --------------------------------------------------------
      // STEP 3
      // Check required tables
      // --------------------------------------------------------

      for (
        const tableName of requiredTables
      ) {

        const placeholders =
          allowedMasterIds
            .map(() => "?")
            .join(",");


        const [masterRows] =
          await adminDB.query(
            `
            SELECT
              id,
              master_name,
              table_name,
              status
            FROM master_master
            WHERE id IN (${placeholders})
              AND table_name = ?
              AND status = 1
            LIMIT 1
            `,
            [
              ...allowedMasterIds,
              tableName,
            ]
          );


        if (
          masterRows.length === 0
        ) {

          return res.status(403).json({
            success: false,
            message:
              `${tableName} is not assigned to ZBC module`,
          });

        }

      }


      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      req.misModule = {

        id:
          moduleData.id,

        name:
          moduleData.module_name,

        master_access:
          allowedMasterIds,

      };


      next();

    } catch (error) {

      console.error(
        "ZBC Master Access Error:",
        error
      );


      return res.status(500).json({
        success: false,
        message:
          "Unable to verify ZBC master access",
        error:
          error.message,
      });

    }

  };

};

