import adminDB from "../config/adminDB.js";

const Unit
 = {

    getUnits: async () => {

        const [rows] = await adminDB.query(`
            SELECT id,unit,address,location,created_by,created_at,updated_by,updated_at
            FROM unit_master
            ORDER BY id DESC
        `);

        return rows;
    }

};

export default Unit
;