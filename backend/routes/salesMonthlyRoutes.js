
import express from "express";

import {
  getSalesMonthlyReport,
  getPreviousMonthSales,
  getSalesMonthlyById,
  checkSalesMonthly,
  createSalesMonthly,
  bulkCreateSalesMonthly,
  updateSalesMonthly,
  deleteSalesMonthly,
} from "../controllers/salesMonthlyController.js";

const router = express.Router();

/* GET MONTHLY REPORT */
router.get("/", getSalesMonthlyReport);


/* CHECK EXISTING RECORD */
router.get("/check", checkSalesMonthly);

router.get("/previous", getPreviousMonthSales);

/* GET ONE RECORD */
router.get("/:id", getSalesMonthlyById);

/* CREATE */
router.post("/", createSalesMonthly);

router.post("/bulk", bulkCreateSalesMonthly);

/* UPDATE */
router.put("/:id", updateSalesMonthly);

/* DELETE */
router.delete("/:id", deleteSalesMonthly);

export default router;