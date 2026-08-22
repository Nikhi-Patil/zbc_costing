import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/api";
import "../../assets/css/Molding.css";
import * as XLSX from "xlsx";

const Molding = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/molding`);

      const result = await response.json();

      if (result.success) {
        setTransactions(result.data);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Error fetching molding transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = () => {
    navigate("/molding/costing-wizard");
  };

  const handleOpenTransaction = (transactionId) => {
    navigate(`/molding/costing-wizard/${transactionId}`);
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/molding/export`);

      const result = await response.json();

      if (!result.success) {
        alert(result.message || "Failed to export molding data.");
        return;
      }

      const { moldingData, bopData } = result;

      if (!moldingData || moldingData.length === 0) {
        alert("No molding transactions available to export.");
        return;
      }

      // ============================================
      // MOLDING DATA
      // ============================================

      const moldingWorksheet = XLSX.utils.json_to_sheet(moldingData);

      // ============================================
      // BOP DATA
      // ============================================

      const bopWorksheet = XLSX.utils.json_to_sheet(bopData || []);

      // ============================================
      // CREATE WORKBOOK
      // ============================================

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, moldingWorksheet, "Molding Data");

      XLSX.utils.book_append_sheet(workbook, bopWorksheet, "BOP Data");

      // ============================================
      // DOWNLOAD
      // ============================================

      const date = new Date().toISOString().slice(0, 10);

      XLSX.writeFile(workbook, `Molding_All_Data_${date}.xlsx`);
    } catch (error) {
      console.error("Error exporting molding data:", error);

      alert("Failed to export molding data.");
    }
  };

  return (
    <div className="molding-page">
      <div className="molding-header">
        <div>
          <h2>Molding</h2>
          <p>Manage molding costing transactions</p>
        </div>
        <div className="molding-actions">
          <button
            type="button"
            className="export-excel-btn"
            onClick={handleExportExcel}
          >
            <span>📊</span>
            Export Excel
          </button>

          <button
            type="button"
            className="add-transaction-btn"
            onClick={handleAddTransaction}
          >
            <span>+</span>
            Add New Transaction
          </button>
        </div>
      </div>

      <div className="molding-table-card">
        <div className="table-header">
          <h3>Transactions</h3>
          <span>{transactions.length} Transactions</span>
        </div>

        <div className="table-wrapper">
          <table className="molding-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Customer Name</th>
                <th>Production Unit</th>
                <th>Sub Department</th>
                <th>Subcategory</th>
                <th>Part No</th>
                <th>Part Cost</th>
                <th>Sell Cost</th>
                <th>Profit/Loss</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const profitLoss =
                    Number(transaction.customer_sales_cost || 0) -
                    Number(transaction.part_cost || 0);

                  return (
                    <tr key={transaction.transaction_id}>
                      <td className="transaction-id">
                        {transaction.transaction_id}
                      </td>

                      <td>{transaction.customer_name}</td>

                      <td>{transaction.production_unit}</td>

                      <td>{transaction.sub_department}</td>

                      <td>{transaction.sub_category}</td>

                      <td>{transaction.part_no}</td>

                      <td>
                        ₹
                        {Number(transaction.part_cost || 0).toLocaleString(
                          "en-IN",
                        )}
                      </td>

                      <td>
                        ₹
                        {Number(
                          transaction.customer_sales_cost || 0,
                        ).toLocaleString("en-IN")}
                      </td>

                      <td>
                        <span className={profitLoss >= 0 ? "profit" : "loss"}>
                          {profitLoss >= 0 ? "+" : "-"}₹
                          {Math.abs(profitLoss).toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status ${String(
                            transaction.status || "",
                          ).toLowerCase()}`}
                        >
                          {transaction.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="open-btn"
                          onClick={() =>
                            handleOpenTransaction(transaction.transaction_id)
                          }
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Molding;
