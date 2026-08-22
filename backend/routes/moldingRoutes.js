import express from "express";

import {
    saveDraft,
    finalSubmit,
    getMoldingTransactions,
    getMoldingTransactionById,
    exportMoldingData
} from "../controllers/moldingController.js";


const router = express.Router();

router.get("/", getMoldingTransactions);

router.get("/export", exportMoldingData);

router.get("/:transactionId", getMoldingTransactionById);

router.post("/draft", saveDraft);

router.post("/submit", finalSubmit);



export default router;