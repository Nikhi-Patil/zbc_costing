import express from "express";

import {
    saveCostingEntry,
    getAllCostingEntries,
    getSingleCostingEntry,
    editCostingEntry,
    removeCostingEntry
} from "../controllers/costingEntryController.js";


const router = express.Router();


// CREATE
router.post(
    "/",
    saveCostingEntry
);


// GET ALL
router.get(
    "/",
    getAllCostingEntries
);


// GET ONE
router.get(
    "/:entryId",
    getSingleCostingEntry
);


// UPDATE
router.put(
    "/:entryId",
    editCostingEntry
);


// DELETE
router.delete(
    "/:entryId",
    removeCostingEntry
);


export default router;