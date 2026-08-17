import adminDb from "../config/adminDb.js";

const SubCategory = {

    getSubCategories: async (category) => {

        let query = `
            SELECT
                id,
                supplier_name,
                location,email,
                contact_no,
                created_by,
                created_at,
                updated_by,
                updated_at
            FROM sub_category_master
        `;

        const params = [];

        if (category) {
            query += `
                WHERE category = ?
            `;

            params.push(category);
        }

        query += `
            ORDER BY id DESC
        `;

        const [rows] = await adminDb.query(query, params);

        return rows;
    }

};

export default SubCategory;