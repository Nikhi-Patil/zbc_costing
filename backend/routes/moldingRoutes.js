import express from "express";

import {
    saveDraft,
    finalSubmit,
    getMoldingTransactions,
    getMoldingTransactionById,
    exportMoldingData,
    getAllMoldingData,
    bulkCreateMoldingController,
    calculateMoldingBulkController,
} from "../controllers/moldingController.js";

const router = express.Router();

// GET /api/molding
router.get("/", getMoldingTransactions);

// GET /api/molding/all
router.get("/all", getAllMoldingData);

// GET /api/molding/export
router.get("/export", exportMoldingData);

// POST /api/molding/bulk
router.post("/bulk", bulkCreateMoldingController);

router.post("/bulk/calculate", calculateMoldingBulkController);

// GET /api/molding/:transactionId
router.get("/:transactionId", getMoldingTransactionById);

// POST /api/molding/draft
router.post("/draft", saveDraft);

// POST /api/molding/submit
router.post("/submit", finalSubmit);

export default router;