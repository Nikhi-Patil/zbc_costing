import express from "express";
import cors from "cors";

import moldingRoutes from "./routes/moldingRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", masterRoutes);
app.use("/api/molding", moldingRoutes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});