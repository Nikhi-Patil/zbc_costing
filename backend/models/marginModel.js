import adminDB from "../config/adminDB.js";

const Margin = {
    getMargins: async () => {
        const [rows] = await adminDB.query(`
            SELECT
                id,
                margin_type,
                percentage
            FROM margin_master
            ORDER BY id ASC
        `);
        return rows;
    }
};

export default Margin;