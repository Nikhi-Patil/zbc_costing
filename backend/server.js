import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";

import moldingRoutes from "./routes/moldingRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";
import costingEntryRoutes from "./routes/costingEntryRoutes.js";
import bopPartRoutes from "./routes/bopPartRoutes.js";
import salesMonthlyRoutes from "./routes/salesMonthlyRoutes.js";
import moldingMonthlyRoutes from "./routes/moldingMonthlyRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

/* PROXY (must be set before session so secure cookies work behind Apache/Passenger) */
app.set("trust proxy", 1);

/* MIDDLEWARE */
app.use(
    cors({
        origin: ["http://localhost:5173", "https://costing.jayashreeapp.com"],
        credentials: true,
    })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
    session({
        name: "zbc.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 8 * 60 * 60 * 1000,
        },
    })
);

/* HEALTH CHECK */
app.get("/api/health-check", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Node.js server is running",
        timestamp: new Date().toISOString(),
    });
});

/* ROUTES */
app.use("/api", masterRoutes);
app.use("/api/molding", moldingRoutes);
app.use("/api/costing-entries", costingEntryRoutes);
app.use("/api/part-bops", bopPartRoutes);
app.use("/api/sales-monthly", salesMonthlyRoutes);
app.use("/api", moldingMonthlyRoutes);
app.use("/api/auth", authRoutes);

/* 404 FOR UNKNOWN API ROUTES */
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

/* GLOBAL ERROR HANDLER (keep last) */
app.use((err, req, res, next) => {
    console.error("[UNHANDLED ERROR]", req.method, req.originalUrl, err);

    if (res.headersSent) return next(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

/* START */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});