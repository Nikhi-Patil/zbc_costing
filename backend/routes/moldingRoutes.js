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
    updateCurrentMoldingMargins,
    downloadMoldingExcel
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

router.get("/:transactionId/download-excel", downloadMoldingExcel);

// GET /api/molding/:transactionId
router.get("/:transactionId", getMoldingTransactionById);

// POST /api/molding/draft
router.post("/draft", saveDraft);

// POST /api/molding/submit
router.post("/submit", finalSubmit);
router.post("/update-current-margin", updateCurrentMoldingMargins);


export default router;