import express from "express";
import {
  verifyEmployee,
  getEmployeeSubDepartments,
  loginUser,
} from "../controllers/authController.js";
import {
  requirezbcMasters,
} from "../middleware/zbcMasterAccess.js";

const router = express.Router();

// VERIFY EMAIL + PASSWORD
router.post("/verify", requirezbcMasters(["employee_master", "unit_master"]), verifyEmployee);

// GET EMPLOYEE SUB DEPARTMENTS
router.post("/employee-sub-departments", requirezbcMasters(["employee_master", "sub_department_master"]), getEmployeeSubDepartments);

// FINAL LOGIN
router.post("/login", requirezbcMasters([ "employee_master", "sub_department_master","unit_master"]), loginUser);

export default router;