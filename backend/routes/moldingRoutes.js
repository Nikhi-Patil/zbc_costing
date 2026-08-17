import express from "express";

import {
    getMoldingTransactions,
    getMoldingTransactionById,
    saveDraft,
    finalSubmit
} from "../controllers/moldingController.js";


const router = express.Router();

router.get("/", getMoldingTransactions);

router.get("/:transactionId", getMoldingTransactionById);

router.post("/draft", saveDraft);

router.post("/submit", finalSubmit);

export default router;