import adminDB from "../config/adminDB.js";

// HELPERS
const isActive = (status) => {
  return String(status || "")
    .trim()
    .toLowerCase() === "active";
};

const getIdList = (value) => {
  return String(value || "")
    .split(",")
    .map((item) =>
      Number(item.trim())
    )
    .filter(
      (item) =>
        Number.isInteger(item) &&
        item > 0
    );
};

// VERIFY EMPLOYEE
export const verifyEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }
    const cleanEmail = String(email).trim();

    // Employee
    const [rows] = await adminDB.query(`
        SELECT
          id,
          user_name,
          email,
          password,
          unit,
          sub_department,
          status
        FROM employee_master
        WHERE LOWER(TRIM(email)) = LOWER(?)
        LIMIT 1        `,
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }
    const employee = rows[0];

    // Password
    if (String(employee.password) !== String(password)) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // Employee active
    if (!isActive(employee.status)) {
      return res.status(403).json({
        success: false,
        message: "Employee account is inactive",
      });
    }

    // Employee units
    const unitIds = getIdList(employee.unit);

    if (unitIds.length === 0) {
      return res.status(403).json({
        success: false,
        message: "No unit is assigned to this employee",
      });
    }

    const placeholders = unitIds
      .map(() => "?")
      .join(",");
    const [unitRows] =
      await adminDB.query(`
        SELECT
          id,
          unit
        FROM unit_master
        WHERE id IN (${placeholders})
        ORDER BY id ASC `,
        unitIds
      );

    if (unitRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Employee units were not found",
      });
    }

    // Success
    return res.json({
      success: true,
      message: "Credentials verified successfully",
      email: employee.email,
      user_name: employee.user_name,
      employee_id: employee.id,
      units: unitRows,
    });

  } catch (error) {
    console.error("Verify employee error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while verifying employee",
      error: error.message,
    });
  }
};

// GET EMPLOYEE SUB DEPARTMENTS
export const getEmployeeSubDepartments =
  async (req, res) => {
    try {
      const { email, unit } = req.body;
      if (!email || !unit) {
        return res.status(400).json({
          success: false,
          message: "Email and Unit are required",
        });
      }

      const selectedUnit = Number(unit);
      if (!Number.isInteger(selectedUnit) || selectedUnit <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid Unit",
        });
      }

      // Employee
      const [employeeRows] =
        await adminDB.query(`
          SELECT
            id,
            user_name,
            email,
            unit,
            department,
            sub_department,
            status
          FROM employee_master
          WHERE LOWER(TRIM(email)) = LOWER(?)
          LIMIT 1 `,
          [String(email).trim()]
        );

      if (employeeRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
      const employee = employeeRows[0];

      // Active
      if (!isActive(employee.status)) {
        return res.status(403).json({
          success: false,
          message: "Employee account is inactive",
        });
      }

      // Employee unit
      const employeeUnitIds = getIdList(employee.unit);
      if (!employeeUnitIds.includes(selectedUnit)) {
        return res.status(403).json({
          success: false,
          message: "Selected Unit is not assigned to this employee",
        });
      }

      // ZBC access
      const misModuleId = Number(req.misModule?.id);

      if (!Number.isInteger(misModuleId) || misModuleId <= 0) {
        return res.status(403).json({
          success: false,
          message: "ZBC module access is not available",
        });

      }

      // USER ACCESS
      const [accessRows] =
        await adminDB.query(`
          SELECT
            id,
            employee_id,
            sub_department_ids,
            module_ids
          FROM user_access
          WHERE employee_id = ?
            AND FIND_IN_SET(
              ?,
              REPLACE(module_ids, ' ', '')
            ) > 0
          LIMIT 1`,
          [employee.id, misModuleId]
        );

      if (accessRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "This employee does not have ZBC access",
        });
      }
      const userAccess = accessRows[0];

      // Employee sub departments
      const employeeSubDepartmentIds = getIdList(employee.sub_department);
      if (employeeSubDepartmentIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: "No sub-department is assigned to this employee",
        });

      }

      // User access sub departments
      const accessSubDepartmentIds = getIdList(userAccess.sub_department_ids);

      if (accessSubDepartmentIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: "No sub-department access is assigned to this employee",
        });
      }

      // Common sub departments
      const allowedSubDepartmentIds = employeeSubDepartmentIds.filter(
        (id) => accessSubDepartmentIds.includes(id)
      );

      if (allowedSubDepartmentIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: "No authorized sub-department is assigned to this employee",
        });
      }

      // Sub department master
      const placeholders = allowedSubDepartmentIds
        .map(() => "?")
        .join(",");

      const [subDepartmentRows] = await adminDB.query(`
        SELECT
          id,
          unit_id,
          sub_department_name
        FROM sub_department_master
        WHERE id IN (${placeholders})
          AND unit_id = ?
          AND sub_department_name IS NOT NULL
          AND TRIM(sub_department_name) <> ''
        ORDER BY id ASC `,
        [...allowedSubDepartmentIds, selectedUnit]
      );

      if (subDepartmentRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No authorized sub-department found for selected Unit",
        });
      }

      // Success
      return res.json({
        success: true,
        employee_id: employee.id,
        unit: selectedUnit,
        data: subDepartmentRows.map(
          (row) => ({
            id: row.id,
            name: row.sub_department_name,
            unit_id: row.unit_id,
          })
        ),
      });

    } catch (error) {
      console.error(
        "Get employee sub departments error:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Server error while loading sub-departments",
        error:
          error.message,
      });
    }
  };

// FINAL LOGIN
export const loginUser = async (
  req,
  res
) => {
  try {
    const {
      email,
      password,
      unit,
      sub_department,
    } = req.body;

    // Required
    if (
      !email ||
      !password ||
      !unit ||
      !sub_department
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email, Password, Unit and Sub Department are required",
      });
    }
    const selectedUnit = Number(unit);
    const selectedSubDepartment = Number(sub_department);
    if (
      !Number.isInteger(selectedUnit) ||
      selectedUnit <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Unit",
      });
    }
    if (!Number.isInteger(selectedSubDepartment) || selectedSubDepartment <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Sub Department",
      });
    }

    // ZBC module
    const misModuleId =
      Number(req.misModule?.id);
    if (!Number.isInteger(misModuleId) || misModuleId <= 0) {
      return res.status(403).json({
        success: false,
        message: "ZBC module access is not available",
      });
    }

    // Employee
    const [employeeRows] =
      await adminDB.query(`
        SELECT
          id,
          user_name,
          email,
          password,
          unit,
          sub_department,
          status
        FROM employee_master
        WHERE LOWER(TRIM(email)) = LOWER(?)
        LIMIT 1 `,
        [String(email).trim()]
      );
    if (employeeRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }
    const employee = employeeRows[0];

    // Password
    if (String(employee.password) !== String(password)) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // Active
    if (!isActive(employee.status)) {
      return res.status(403).json({
        success: false,
        message: "Employee account is inactive",
      });
    }

    // USER ACCESS
    const [accessRows] =
      await adminDB.query(`
        SELECT
          id,
          employee_id,
          sub_department_ids,
          module_ids
        FROM user_access
        WHERE employee_id = ?
          AND FIND_IN_SET(
            ?,
            REPLACE(module_ids, ' ', '')
          ) > 0
        LIMIT 1 `,
        [employee.id, misModuleId]
      );
    if (accessRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "This employee does not have ZBC access",
      });
    }
    const userAccess = accessRows[0];

    // Employee Unit
    const employeeUnitIds = getIdList(employee.unit);
    if (!employeeUnitIds.includes(selectedUnit)) {
      return res.status(403).json({
        success: false,
        message: "Selected Unit is not assigned to this employee",
      });
    }

    // Employee Sub Department
    const employeeSubDepartmentIds = getIdList(employee.sub_department);
    if (!employeeSubDepartmentIds.includes(selectedSubDepartment)) {
      return res.status(403).json({
        success: false,
        message: "Selected Sub Department is not assigned to this employee",
      });
    }

    // User Access Sub Department
    const accessSubDepartmentIds = getIdList(userAccess.sub_department_ids);
    if (!accessSubDepartmentIds.includes(selectedSubDepartment)) {
      return res.status(403).json({
        success: false,
        message: "Selected Sub Department is not authorized for this employee",
      });
    }

    // Verify Sub Department + Unit
    const [subDepartmentRows,] = await adminDB.query(`
      SELECT
        id,
        unit_id,
        sub_department_name
      FROM sub_department_master
      WHERE id = ?
        AND unit_id = ?
        AND sub_department_name IS NOT NULL
        AND TRIM(sub_department_name) <> ''
      LIMIT 1 `,
      [selectedSubDepartment, selectedUnit,]
    );

    if (subDepartmentRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Selected Sub Department does not belong to selected Unit",
      });
    }
    const subDepartment = subDepartmentRows[0];

    // Unit Master
    const [unitRows] = await adminDB.query(`
        SELECT
          id,
          unit
        FROM unit_master
        WHERE id = ?
        LIMIT 1 `,
      [selectedUnit]
    );

    if (unitRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Selected Unit was not found",
      });
    }
    const unitName =
      unitRows[0].unit;

    // LOGIN SUCCESS
    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: employee.id,
        user_name: employee.user_name,
        email: employee.email,
        unit: selectedUnit,
        unit_name: unitName,
        department: employee.department,
        sub_department: selectedSubDepartment,
        sub_department_name: subDepartment.sub_department_name,
        status: employee.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};