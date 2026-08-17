import adminDb from "../config/adminDb.js";

const SubCategory = {

    getSubCategories: async () => {

        const [rows] = await adminDb.query(`
            SELECT
                id,
                sub_category_name,
                created_by,
                created_at,
                updated_by,
                updated_at
            FROM sub_category_master
            ORDER BY id DESC
        `);

        return rows;
    }

};

export default SubCategory;