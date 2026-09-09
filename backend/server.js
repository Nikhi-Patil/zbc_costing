import express from "express";
import cors from "cors";

import moldingRoutes from "./routes/moldingRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";
import costingEntryRoutes
    from "./routes/costingEntryRoutes.js";
import bopPartRoutes from "./routes/bopPartRoutes.js";
import salesMonthlyRoutes from "./routes/salesMonthlyRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", masterRoutes);
app.use("/api/molding", moldingRoutes);
app.use("/api/costing-entries", costingEntryRoutes);
app.use("/api/part-bops", bopPartRoutes);
app.use(
    "/api/sales-monthly",
    salesMonthlyRoutes
);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});