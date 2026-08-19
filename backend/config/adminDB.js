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

// const adminDB = mysql.createPool({
//     host: "127.0.0.1",
//     user: "jayashreeadmin_jayashreeadmin",
//     password: "pyuP5-S]$]Aci1~K",
//     database: "jayashreeadmin_jayashreeadmin",
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });

export default adminDB;