import {
    createCostingEntry,
    getCostingEntries,
    getCostingEntryById,
    updateCostingEntry,
    deleteCostingEntry
} from "../models/costingEntryModel.js";


/**
 * CREATE COSTING ENTRY
 */
export const saveCostingEntry = async (req, res) => {

    try {

        const { formData } = req.body;

        if (!formData) {

            return res.status(400).json({
                success: false,
                message: "Form data is required"
            });

        }

        // Basic required-field validation
        const requiredFields = [
            "financialYear",
            "month",
            "effectiveDate",

            "customerName",
            "productionUnit",
            "billingUnit",
            "subDepartment",
            "subCategory",

            "partNo",
            "netWeight",
            "grossWeight",
            "hasBop",
            "compMonth",

            "processType",
            "machineTonnage",
            "totalCavity",
            "runningCavity",
            "cycleTime",
            "PlattenSize",
            "toolSize",

            "monthlyQuantity"
        ];

        const missingFields = requiredFields.filter(
            field =>
                formData[field] === undefined ||
                formData[field] === null ||
                formData[field] === ""
        );

        if (missingFields.length > 0) {

            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
                fields: missingFields
            });

        }


        // Validate cavity relationship
        if (
            Number(formData.runningCavity) >
            Number(formData.totalCavity)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Running cavity cannot be greater than total cavity"
            });

        }


        // Validate numeric values
        const numericFields = [
            "netWeight",
            "grossWeight",
            "totalCavity",
            "runningCavity",
            "cycleTime",
            "monthlyQuantity"
        ];

        for (const field of numericFields) {

            const value = Number(formData[field]);

            if (
                Number.isNaN(value) ||
                value < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        `${field} must be a valid non-negative number`
                });

            }

        }


        // Integer validation
        const integerFields = [
            "totalCavity",
            "runningCavity",
            "monthlyQuantity"
        ];

        for (const field of integerFields) {

            if (
                !Number.isInteger(
                    Number(formData[field])
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        `${field} must be an integer`
                });

            }

        }


        const result =
            await createCostingEntry(formData);


        return res.status(201).json({

            success: true,

            message:
                "Costing entry saved successfully",

            entryId: result.entryId,

            id: result.id

        });

    } catch (error) {

        console.error(
            "Error saving costing entry:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to save costing entry",

            error: error.message

        });

    }

};


/**
 * GET ALL COSTING ENTRIES
 */
export const getAllCostingEntries = async (
    req,
    res
) => {

    try {

        const entries =
            await getCostingEntries();

        return res.json({

            success: true,

            data: entries

        });

    } catch (error) {

        console.error(
            "Error fetching costing entries:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch costing entries",

            error: error.message

        });

    }

};


/**
 * GET SINGLE COSTING ENTRY
 */
export const getSingleCostingEntry = async (
    req,
    res
) => {

    try {

        const { entryId } = req.params;

        if (!entryId) {

            return res.status(400).json({

                success: false,

                message:
                    "Entry ID is required"

            });

        }


        const entry =
            await getCostingEntryById(entryId);


        if (!entry) {

            return res.status(404).json({

                success: false,

                message:
                    "Costing entry not found"

            });

        }


        return res.json({

            success: true,

            data: entry

        });

    } catch (error) {

        console.error(
            "Error fetching costing entry:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch costing entry",

            error: error.message

        });

    }

};


/**
 * UPDATE COSTING ENTRY
 */
export const editCostingEntry = async (
    req,
    res
) => {

    try {

        const { entryId } = req.params;
        const { formData } = req.body;


        if (!entryId) {

            return res.status(400).json({

                success: false,

                message:
                    "Entry ID is required"

            });

        }


        if (!formData) {

            return res.status(400).json({

                success: false,

                message:
                    "Form data is required"

            });

        }


        if (
            Number(formData.runningCavity) >
            Number(formData.totalCavity)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Running cavity cannot be greater than total cavity"

            });

        }


        await updateCostingEntry(
            entryId,
            formData
        );


        return res.json({

            success: true,

            message:
                "Costing entry updated successfully",

            entryId

        });

    } catch (error) {

        console.error(
            "Error updating costing entry:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to update costing entry",

            error: error.message

        });

    }

};


/**
 * DELETE COSTING ENTRY
 */
export const removeCostingEntry = async (
    req,
    res
) => {

    try {

        const { entryId } = req.params;


        if (!entryId) {

            return res.status(400).json({

                success: false,

                message:
                    "Entry ID is required"

            });

        }


        await deleteCostingEntry(entryId);


        return res.json({

            success: true,

            message:
                "Costing entry deleted successfully",

            entryId

        });

    } catch (error) {

        console.error(
            "Error deleting costing entry:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to delete costing entry",

            error: error.message

        });

    }

};