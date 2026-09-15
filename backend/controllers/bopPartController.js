import BopPart from "../models/bopPartModel.js";

/*
============================================================
GET ALL BOP PART CONFIGURATIONS
============================================================
*/
export const getAllBopPartConfigurations = async (
    req,
    res,
) => {
    try {
        const rows =
            await BopPart.getAll();

        return res.json({
            success: true,
            data: rows,
        });
    } catch (error) {
        console.error(
            "GET ALL PART BOPS ERROR:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch BOP part configurations",
            error: error.message,
        });
    }
};


/*
============================================================
GET BOP CONFIGURATION FOR ONE PART
============================================================

GET /api/part-bops/:partNo
============================================================
*/
export const getBopPartConfiguration = async (
    req,
    res,
) => {
    try {
        const { partNo } =
            req.params;

        /*
        ----------------------------------------------------
        VALIDATE PART NO
        ----------------------------------------------------
        */
        if (
            !partNo ||
            !String(partNo).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Part No. is required",
            });
        }

        /*
        ----------------------------------------------------
        FETCH BOP CONFIGURATION
        ----------------------------------------------------
        */
        const rows =
            await BopPart.getByPartNo(
                String(partNo).trim(),
            );

        return res.json({
            success: true,
            partNo:
                String(partNo).trim(),
            data: rows,
        });

    } catch (error) {
        console.error(
            "GET PART BOPS ERROR:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch BOP details for part",
            error: error.message,
        });
    }
};


/*
============================================================
CREATE / SAVE BOP CONFIGURATION
============================================================

POST /api/part-bops

Request:

{
    "partNo": "ABC123",
    "bops": [
        {
            "bopId": 1,
            "supplierId": 5,
            "assemblyQty": 2
        }
    ]
}

============================================================
*/
export const saveBopPartConfiguration = async (
    req,
    res,
) => {
    try {
        const {
            partNo,
            bops,
            createdBy = null,
            updatedBy = null,
        } = req.body || {};

        /*
        ----------------------------------------------------
        VALIDATE PART NO
        ----------------------------------------------------
        */
        if (
            !partNo ||
            !String(partNo).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Part No. is required",
            });
        }

        /*
        ----------------------------------------------------
        VALIDATE BOPS
        ----------------------------------------------------
        */
        if (
            bops !== undefined &&
            !Array.isArray(bops)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "BOP details must be an array",
            });
        }

        /*
        ----------------------------------------------------
        SAVE CONFIGURATION
        ----------------------------------------------------
        */
        const result =
            await BopPart.saveForPart({
                partNo:
                    String(partNo).trim(),

                bops:
                    Array.isArray(bops)
                        ? bops
                        : [],

                createdBy,
                updatedBy,
            });

        /*
        ----------------------------------------------------
        SUCCESS RESPONSE
        ----------------------------------------------------
        */
        return res.status(201).json({
            success: true,

            message:
                result.count > 0
                    ? `BOP configuration saved successfully for Part No. ${result.partNo}`
                    : `BOP configuration cleared for Part No. ${result.partNo}`,

            data: result,
        });

    } catch (error) {
        console.error(
            "SAVE PART BOPS ERROR:",
            error,
        );

        /*
        ----------------------------------------------------
        VALIDATION ERRORS
        ----------------------------------------------------
        */
        const status =
            /not found|required|assigned|duplicate|must be/i.test(
                error.message || "",
            )
                ? 400
                : 500;

        return res.status(status).json({
            success: false,

            message:
                error.message ||
                "Failed to save BOP configuration",
        });
    }
};


/*
============================================================
UPDATE BOP CONFIGURATION
============================================================

PUT /api/part-bops/:partNo

This performs a complete replacement of the BOP
configuration for the selected Part No.

IMPORTANT:
The model preserves existing:

    financial_year
    bop_month
    bop_rate
    bop_cost

for matching BOP + Supplier mappings.

============================================================
*/
export const updateBopPartConfiguration = async (
    req,
    res,
) => {
    try {

        /*
        ----------------------------------------------------
        PART NO FROM URL
        ----------------------------------------------------
        */
        const routePartNo =
            String(
                req.params.partNo || "",
            ).trim();


        /*
        ----------------------------------------------------
        PART NO FROM BODY
        ----------------------------------------------------
        */
        const bodyPartNo =
            String(
                req.body?.partNo ||
                routePartNo,
            ).trim();


        /*
        ----------------------------------------------------
        VALIDATE URL PART NO
        ----------------------------------------------------
        */
        if (!routePartNo) {
            return res.status(400).json({
                success: false,
                message:
                    "Part No. is required",
            });
        }


        /*
        ----------------------------------------------------
        MAKE SURE BODY AND URL MATCH
        ----------------------------------------------------
        */
        if (
            bodyPartNo &&
            bodyPartNo.toLowerCase() !==
            routePartNo.toLowerCase()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Part No. in URL and request body do not match",
            });
        }


        /*
        ----------------------------------------------------
        BOPS MUST BE ARRAY
        ----------------------------------------------------
        */
        const bops =
            req.body?.bops;

        if (!Array.isArray(bops)) {
            return res.status(400).json({
                success: false,
                message:
                    "BOP details must be an array",
            });
        }


        /*
        ----------------------------------------------------
        UPDATE CONFIGURATION
        ----------------------------------------------------
        */
        const result =
            await BopPart.saveForPart({
                partNo:
                    routePartNo,

                bops,

                createdBy:
                    req.body?.createdBy ??
                    null,

                updatedBy:
                    req.body?.updatedBy ??
                    null,
            });


        /*
        ----------------------------------------------------
        SUCCESS RESPONSE
        ----------------------------------------------------
        */
        return res.json({
            success: true,

            message:
                result.count > 0
                    ? `BOP configuration updated successfully for Part No. ${result.partNo}`
                    : `BOP configuration cleared for Part No. ${result.partNo}`,

            data: result,
        });

    } catch (error) {
        console.error(
            "UPDATE PART BOPS ERROR:",
            error,
        );

        /*
        ----------------------------------------------------
        VALIDATION ERRORS
        ----------------------------------------------------
        */
        const status =
            /not found|required|assigned|duplicate|must be/i.test(
                error.message || "",
            )
                ? 400
                : 500;

        return res.status(status).json({
            success: false,

            message:
                error.message ||
                "Failed to update BOP configuration",
        });
    }
};


/*
============================================================
DELETE BOP CONFIGURATION
============================================================

DELETE /api/part-bops/:partNo

Deletes all BOP rows for the selected Part No.

============================================================
*/
export const deleteBopPartConfiguration = async (
    req,
    res,
) => {
    try {

        const { partNo } =
            req.params;


        /*
        ----------------------------------------------------
        VALIDATE PART NO
        ----------------------------------------------------
        */
        if (
            !partNo ||
            !String(partNo).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Part No. is required",
            });
        }


        /*
        ----------------------------------------------------
        DELETE CONFIGURATION
        ----------------------------------------------------
        */
        const affectedRows =
            await BopPart.deleteForPart(
                String(partNo).trim(),
            );


        /*
        ----------------------------------------------------
        SUCCESS RESPONSE
        ----------------------------------------------------
        */
        return res.json({
            success: true,

            message:
                affectedRows > 0
                    ? `BOP configuration deleted for Part No. ${String(
                        partNo,
                    ).trim()}`
                    : "No BOP configuration found for this Part No.",

            affectedRows,
        });

    } catch (error) {
        console.error(
            "DELETE PART BOPS ERROR:",
            error,
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to delete BOP configuration",

            error:
                error.message,
        });
    }
};