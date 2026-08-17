import adminDb from "../config/adminDb.js";

const SubDepartment = {

    getSubDepartments: async (unitId) => {

        let query = `
            SELECT
                s.id,
                p.unit,
                d.department_name,
                s.sub_department_name,
                s.created_by,
                s.updated_by
            FROM sub_department_master s

            LEFT JOIN unit_master p
                ON s.unit_id = p.id

            LEFT JOIN department_master d
                ON s.department_id = d.id
        `;

        const params = [];

        if (unitId) {

            query += `
                WHERE s.unit_id = ?
                AND d.department_name = 'Production'
            `;

            params.push(unitId);
        }

        query += `
            ORDER BY s.id DESC
        `;

        const [rows] = await adminDb.query(
            query,
            params
        );

        return rows;
    }

};

export default SubDepartment;