import mysql from "mysql2/promise";


const zbcDB = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "zbc_costing",
    waitForConnections: true,
    connectionLimit: 10
});

export default zbcDB ;