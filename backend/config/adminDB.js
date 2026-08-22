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


// const adminDB = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: "",
//   database: process.env.DB_NAME,
//   port: Number(process.env.DB_PORT || 3306),

//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// export default adminDB;