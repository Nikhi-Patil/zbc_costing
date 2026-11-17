// import React, { useCallback } from "react";
// import MoldingDashboard from "../vp/VPDashboard";
// import API_BASE_URL from "../config/api";
// import "./../assets/css/MoldingDashboard.css";

// function Dashboard() {
//   const fetchUserTransactions = useCallback(async () => {
//     const response = await fetch(
//       `${API_BASE_URL}/molding-dashboard/transactions`,
//       {
//         method: "GET",
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       },
//     );

//     if (!response.ok) {
//       throw new Error("Failed to fetch user dashboard data");
//     }

//     const result = await response.json();

//     if (!result.success) {
//       throw new Error(result.message || "Unable to load dashboard");
//     }

//     return {
//       transactions: Array.isArray(result.data) ? result.data : [],
//       totalTransactions: Number(result.totalTransactions) || 0,
//     };
//   }, []);

//   return <MoldingDashboard fetchTransactions={fetchUserTransactions} />;
// }

// export default Dashboard;



import React from "react";
import "./../assets/css/MoldingDashboard.css";

function Dashboard() {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-icon"></div>
        <h1>Coming Soon!</h1>

      </div>
    </div>
  );
}

export default Dashboard;
