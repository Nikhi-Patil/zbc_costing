import adminDB from "../config/adminDB.js";

const Part
 = {

    getParts: async () => {

        const [rows] = await adminDB.query(`
            SELECT
                    p.id,
                    p.part_name,
                    p.part_no,
                    p.fg_code,
                    p.im_code,
                    p.inter_code,
                    p.sub_department_id,
                    d.department_name,
                    sd.sub_department_name,
                    u.unit,
                    p.created_by,
                    p.created_at,
                    p.updated_by,
                    p.updated_at
                FROM part_master p
                LEFT JOIN sub_department_master sd
                    ON p.sub_department_id = sd.id
                LEFT JOIN department_master d
                    ON sd.department_id = d.id
                LEFT JOIN unit_master u
                    ON sd.unit_id = u.id
                ORDER BY p.id DESC
        `);

        return rows;
    }

};
export default Part
;