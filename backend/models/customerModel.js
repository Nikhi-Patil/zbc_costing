import adminDB from "../config/adminDB.js";

const Customer
    = {

    getCustomers: async () => {

        const [rows] = await adminDB.query(`
           SELECT
                c.id,
                c.customer_name,
                c.sub_customer,
                c.geo_type,
                c.zone,
                c.updated_by,
                c.updated_at,
                c.created_by,
                c.created_at
            FROM customer_master c
            ORDER BY c.id DESC;
        `);

        return rows;
    }

};
export default Customer
    ;