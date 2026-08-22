import adminDB from "../config/adminDB.js";

const Bop
 = {

    getBops: async () => {

        const [rows] = await adminDB.query(`
            SELECT
                 p.id,
                    p.bop_part_name,
                    p.bop_part_no,
                    p.commodity,
                    p.umo,
                    p.supplier_id,
                    p.part_id,
                    GROUP_CONCAT(DISTINCT d.supplier_name ORDER BY d.supplier_name SEPARATOR ', ') AS supplier_name,
                    sd.part_no,
                    sd.fg_code,
                    p.bop_erp_code,
                    p.created_by,
                    p.created_at,
                    p.updated_by,
                    p.updated_at
                FROM bop_master p
                LEFT JOIN supplier_master d ON FIND_IN_SET(d.id, p.supplier_id)
                LEFT JOIN part_master sd ON p.part_id = sd.id
                GROUP BY p.id
                ORDER BY p.id DESC
        `);

        return rows;
    }

};
export default Bop
;