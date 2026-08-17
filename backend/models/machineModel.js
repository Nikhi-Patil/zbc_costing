import adminDB from "../config/adminDB.js";


const Machine
 = {

    getMachines: async () => {

        const [rows] = await adminDB.query(`
           SELECT id,shift_rate,machine_list,molding_process,updated_by,created_by
                FROM molding_machine_master
                ORDER BY id DESC
                    
        `);

        return rows;
    }

};

export default Machine
;