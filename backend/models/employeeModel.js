import adminDB from "../config/adminDB.js";

const Employee
 = {

    getEmployees: async () => {

        const [rows] = await adminDB.query(`
           SELECT
                    e.id,
                    e.employee_name,
                    e.user_name,
                    e.email,
                    e.location,
                    e.contact_no,
                    e.designation_id,
                    e.level,
                    e.status,
                    e.created_by,
                    e.created_at,
                    e.updated_by,
                    e.updated_at,
                    d.designation AS designation_name
                FROM employee_master e
                LEFT JOIN designation_master d ON e.designation_id = d.id
                ORDER BY e.id DESC
        `);

        return rows;
    }

};

export default Employee
;