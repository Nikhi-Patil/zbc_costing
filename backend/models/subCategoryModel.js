import adminDb from "../config/adminDB.js";

const SubCategory = {
    getSubCategories: async (
        unitId,
        subDepartmentId
    ) => {
        const query = `
            SELECT
                sc.id,
                sc.unit_id,
                sc.department_id,
                sc.sub_department_id,
                sc.category_id,
                sc.sub_category_name,
                sc.created_by,
                sc.created_at,
                sc.updated_by,
                sc.updated_at
            FROM sub_category_master sc
            WHERE sc.unit_id = ?
              AND sc.sub_department_id = ?
            ORDER BY sc.sub_category_name ASC
        `;
        const params = [
            unitId,
            subDepartmentId
        ];
        const [rows] =
            await adminDb.query(
                query,
                params
            );
        return rows;
    }
};
export default SubCategory;