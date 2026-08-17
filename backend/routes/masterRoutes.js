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
} from "../controllers/masterController.js";

import {
    getCompoundMonthlyReport,
    createCompoundMonthlyRate,
} from "../controllers/monthlyCompound.js";

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

router.get(
    "/monthly-compound-rate",
    getCompoundMonthlyReport
);

router.post(
    "/monthly-compound-rate",
    createCompoundMonthlyRate
);

export default router;