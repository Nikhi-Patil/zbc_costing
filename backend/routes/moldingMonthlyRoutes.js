import express from "express";
import {
    saveMoldingMonthlyReport,
    getMoldingMonthlyReport,
    getMoldingMonthlyReportByMolding,
    deleteMoldingMonthlyReport,
    saveMoldingMonthlyReportBulk,
} from "../controllers/moldingMonthlyController.js";

const router = express.Router();

// Save / Update monthly report
router.post("/molding-monthly-report", saveMoldingMonthlyReport);

// Get monthly report with filters
router.get("/molding-monthly-report", getMoldingMonthlyReport);

// Get all months for one molding
router.get("/molding-monthly-report/molding/:moldingId", getMoldingMonthlyReportByMolding);

// Delete one monthly report
router.delete("/molding-monthly-report/:id", deleteMoldingMonthlyReport);

router.post("/molding-monthly-report/bulk", saveMoldingMonthlyReportBulk);

export default router;