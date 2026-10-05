import express from "express";
import cors from "cors";

import moldingRoutes from "./routes/moldingRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";
import costingEntryRoutes from "./routes/costingEntryRoutes.js";
import bopPartRoutes from "./routes/bopPartRoutes.js";
import salesMonthlyRoutes from "./routes/salesMonthlyRoutes.js";
import moldingMonthlyRoutes from "./routes/moldingMonthlyRoutes.js";
import authRoutes from "./routes/authRoutes.js";


const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({
    limit: "50mb",
    extended: true
}));

app.use("/api", masterRoutes);
app.use("/api/molding", moldingRoutes);
app.use("/api/costing-entries", costingEntryRoutes);
app.use("/api/part-bops", bopPartRoutes);
app.use("/api/sales-monthly", salesMonthlyRoutes);
app.use("/api", moldingMonthlyRoutes);
app.use( "/api/auth", authRoutes );

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});