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
    },

    // compoundModel.js
    getCompoundByImCode: async (imCode) => {
        const [rows] = await adminDB.query(
            `
                SELECT
                id,
                polymer,
                compound_code,
                im_code
                FROM compound_master
                WHERE im_code = ?
                LIMIT 1
                `,
            [imCode]
        );

        return rows[0] || null;
    }


};
export default Compound
    ;

