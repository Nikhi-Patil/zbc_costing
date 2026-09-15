import express from "express";

import {
    saveDraft,
    finalSubmit,
    getMoldingTransactions,
    getMoldingTransactionById,
    exportMoldingData,
    getAllMoldingData
} from "../controllers/moldingController.js";

const router = express.Router();


// ============================================================
// NORMAL MOLDING TRANSACTIONS
// GET /api/molding
// ============================================================
router.get("/", getMoldingTransactions);


// ============================================================
// ALL RAW MOLDING TABLE DATA
// GET /api/molding/all
// ============================================================
router.get("/all", getAllMoldingData);


// ============================================================
// EXPORT MOLDING DATA
// GET /api/molding/export
// ============================================================
router.get("/export", exportMoldingData);


// ============================================================
// SINGLE TRANSACTION
// GET /api/molding/:transactionId
// ============================================================
router.get("/:transactionId", getMoldingTransactionById);


// ============================================================
// SAVE DRAFT
// POST /api/molding/draft
// ============================================================
router.post("/draft", saveDraft);


// ============================================================
// FINAL SUBMIT
// POST /api/molding/submit
// ============================================================
router.post("/submit", finalSubmit);


export default router;