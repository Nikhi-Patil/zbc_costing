import express from "express";

import {
    getAllBops,
    getAllCompounds,
    getAllCustomers,
    getAllEmployees,
    getAllParts,
    getAllSubCategories,
    getAllSubDepartments,
    getAllUnits,
    getAllMachines,
    getCompoundByImCode,
} from "../controllers/masterController.js";

import {
    getCompoundMonthlyReport,
    createCompoundMonthlyRate,
    getBopMonthlyReport,
    createBopMonthlyRate,
    getCompoundRateForCosting,
    getBopRateForCosting,
} from "../controllers/monthlyReports.js";



const router = express.Router();

router.get("/bops", getAllBops);
router.get("/compounds", getAllCompounds);
router.get("/customers", getAllCustomers);
router.get("/employees", getAllEmployees);
router.get("/parts", getAllParts);
router.get("/subcategories", getAllSubCategories);
router.get("/subdepartments", getAllSubDepartments);
router.get("/units", getAllUnits);
router.get("/machines", getAllMachines);
router.get("/monthly-compound-rate", getCompoundMonthlyReport);
router.post("/monthly-compound-rate", createCompoundMonthlyRate);
router.get("/monthly-bop-rate", getBopMonthlyReport);
router.post("/monthly-bop-rate", createBopMonthlyRate);
router.get("/compound-rate-for-costing", getCompoundRateForCosting);
router.get("/bop-rate-for-costing", getBopRateForCosting);
router.get( "/compound-by-im-code", getCompoundByImCode);

export default router;