import { getMoldingDashboardTransactions } from "../models/dashboardModel.js";

const getUserRole = (req) => String(req.session?.user?.designation || req.user?.designation || "").trim().toLowerCase();

const getCurrentUserName = (req) => req.session?.user?.user_name || req.user?.user_name || req.user?.username || null;

const isAdminOrVP = (req) => ["super admin", "admin", "vp", "vice president"].includes(getUserRole(req));

export const getDashboardTransactions = async (req, res) => {
    try {
        const userName = getCurrentUserName(req);
        const isAdmin = isAdminOrVP(req);

        // A non-admin user must have an authenticated username.
        if (!isAdmin && !userName) {
            return res.status(401).json({
                success: false,
                message: "User session not found. Please log in again.",
            });
        }

        const {
            financialYear,
            fromMonth,
            toMonth,
            prodUnit,
            billingUnit,
            customer,
            status,
        } = req.query;

        // Validate month filters if provided.
        const validMonth = (value) => value === undefined || value === "" || (
            Number.isInteger(Number(value)) &&
            Number(value) >= 1 &&
            Number(value) <= 12
        );

        if (!validMonth(fromMonth) || !validMonth(toMonth)) {
            return res.status(400).json({
                success: false,
                message: "Invalid month filter.",
            });
        }

        const result = await getMoldingDashboardTransactions({
            financialYear,
            fromMonth,
            toMonth,
            productionUnit: prodUnit,
            billingUnit,
            customerName: customer,
            status,
            userName,
            isAdmin,
        });

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            totalTransactions: result.totalTransactions,
            data: result.rows,
        });

    } catch (error) {
        console.error("Molding Dashboard API Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch molding dashboard data.",
            error: error.message,
        });
    }
};