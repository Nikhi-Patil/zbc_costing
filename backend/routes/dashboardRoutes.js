import express from "express";
import { getDashboardTransactions } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/transactions", getDashboardTransactions);

export default router;