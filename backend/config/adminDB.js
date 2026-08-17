import mysql from "mysql2/promise";


const adminDB = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "admin",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default adminDB;