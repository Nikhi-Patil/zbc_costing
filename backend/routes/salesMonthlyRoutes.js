
import express from "express";

import {
  getSalesMonthlyReport,
  getSalesMonthlyById,
  checkSalesMonthly,
  createSalesMonthly,
  bulkCreateSalesMonthly,
  updateSalesMonthly,
  deleteSalesMonthly,
} from "../controllers/salesMonthlyController.js";


const router = express.Router();


/* ============================================================
   GET MONTHLY REPORT
============================================================ */

router.get(
  "/",
  getSalesMonthlyReport
);


/* ============================================================
   CHECK EXISTING RECORD

   IMPORTANT:
   Must come BEFORE /:id
============================================================ */

router.get(
  "/check",
  checkSalesMonthly
);


/* ============================================================
   GET ONE RECORD
============================================================ */

router.get(
  "/:id",
  getSalesMonthlyById
);


/* ============================================================
   CREATE
============================================================ */

router.post(
  "/",
  createSalesMonthly
);

router.post(
  "/bulk",
  bulkCreateSalesMonthly
);


/* ============================================================
   UPDATE
============================================================ */

router.put(
  "/:id",
  updateSalesMonthly
);


/* ============================================================
   DELETE
============================================================ */

router.delete(
  "/:id",
  deleteSalesMonthly
);


export default router;

