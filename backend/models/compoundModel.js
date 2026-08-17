import adminDB from "../config/adminDB.js";

const Compound
 = {

    getCompounds: async () => {

        const [rows] = await adminDB.query(`
            SELECT
                id,polymer,im_code,compound_code,updated_by,updated_at,created_at,created_by
            FROM compound_master
            ORDER BY id DESC
        `);

        return rows;
    }

};
export default Compound
;