import Bop from "../models/bopModel.js";
import Compound from "../models/compoundModel.js";
import Customer from "../models/customerModel.js";
import Employee from "../models/employeeModel.js";
import Part from "../models/partModel.js";
import SubCategory from "../models/subCategoryModel.js";
import SubDepartment from "../models/subDepartmentModel.js";
import Suppliers from "../models/supplierModel.js";
import Unit from "../models/unitModel.js";
import Machine from "../models/machineModel.js";


// Unit Controller
export const getAllUnits = async (req, res) => {
    try {
        const units = await Unit.getUnits();

        res.json(units);

    } catch (err) {

        console.error("Error fetching units:", err);

        res.status(500).json({
            message: "Failed to fetch units",
            error: err.message
        });
    }
};
// Bop Controller
export const getAllBops = async (req, res) => {
    try {
        const bops = await Bop.getBops();

        res.json(bops);

    } catch (err) {

        console.error("Error fetching bops:", err);

        res.status(500).json({
            message: "Failed to fetch bops",
            error: err.message
        });
    }
};
// Compound Controller
export const getAllCompounds = async (req, res) => {
    try {
        const compounds = await Compound.getCompounds();

        res.json(compounds);

    } catch (err) {

        console.error("Error fetching compounds:", err);

        res.status(500).json({
            message: "Failed to fetch compounds",
            error: err.message
        });
    }
};
// Customer Controller
export const getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.getCustomers();

        res.json(customers);

    } catch (err) {

        console.error("Error fetching customers:", err);

        res.status(500).json({
            message: "Failed to fetch customers",
            error: err.message
        });
    }
};
// Employee Controller
export const getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.getEmployees();

        res.json(employees);

    } catch (err) {

        console.error("Error fetching employees:", err);

        res.status(500).json({
            message: "Failed to fetch employees",
            error: err.message
        });
    }
};
// part Controller
export const getAllParts = async (req, res) => {
    try {
        const parts = await Part.getParts();

        res.json(parts);

    } catch (err) {

        console.error("Error fetching parts:", err);

        res.status(500).json({
            message: "Failed to fetch parts",
            error: err.message
        });
    }
};
// Sub Category Controller
export const getAllSubCategories = async (req, res) => {

    try {

        const { category } = req.query;

        const subCategories =
            await SubCategory.getSubCategories(category);

        res.json(subCategories);

    } catch (err) {

        console.error("Error fetching subcategories:", err);

        res.status(500).json({
            message: "Failed to fetch subcategories",
            error: err.message
        });
    }
};
// Sub DepartMent Controller
export const getAllSubDepartments = async (req, res) => {

    try {

        const { unitId } = req.query;

        const subDepartments =
            await SubDepartment.getSubDepartments(unitId);

        res.json(subDepartments);

    } catch (err) {

        console.error(
            "Error fetching subdepartments:",
            err
        );

        res.status(500).json({
            message: "Failed to fetch subdepartments",
            error: err.message
        });
    }
};
// Molding Machine Controller
export const getAllMachines = async (req, res) => {
    try {
        const machines = await Machine.getMachines();

        res.json(machines);

    } catch (err) {

        console.error("Error fetching machines:", err);

        res.status(500).json({
            message: "Failed to fetch machines",
            error: err.message
        });
    }
};

// Compound by IM Code Controller
export const getCompoundByImCode = async (req, res) => {
  try {
    const { imCode } = req.query;

    if (!imCode) {
      return res.status(400).json({
        success: false,
        message: "IM Code is required",
      });
    }

    const compound =
      await Compound.getCompoundByImCode(imCode);

    if (!compound) {
      return res.json({
        success: true,
        found: false,
        data: null,
      });
    }

    return res.json({
      success: true,
      found: true,
      data: compound,
    });
  } catch (error) {
    console.error(
      "Error fetching compound by IM Code:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch compound by IM Code",
      error: error.message,
    });
  }
};