import { useCallback } from "react";
import MoldingDashboard from "./VPDashboard";
import API_BASE_URL from "../config/api";

function MoldingDashboardPage() {
  const fetchDashboardTransactions = useCallback(async () => {
    const response = await fetch(
      `${API_BASE_URL}/molding-dashboard/transactions`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch molding dashboard data");
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return {
      transactions: result.data,
      totalTransactions: result.totalTransactions,
    };
  }, []);

  return <MoldingDashboard fetchTransactions={fetchDashboardTransactions} />;
}

export default MoldingDashboardPage;
