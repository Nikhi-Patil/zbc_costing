import React, { useRef, useState } from "react";
import API_BASE_URL from "../../config/api";

function BottomLineForm({
  formData,
  transactionId,
  handleInputChange,
  finalRmCost,
  subtotalA,
  subtotalB,
  totalPartCost,
}) {
  const [editingRow, setEditingRow] = useState(null);
  const inputRefs = useRef({});

  const customerSalesCost = Number(formData.customerSalesCost) || 0;

  const buyingCost = Number(formData.buyingCost) || 0;

  const salesProfitLoss = customerSalesCost - totalPartCost;

  const buyingProfitLoss = customerSalesCost - buyingCost;

  const bottomLineData = [
    {
      id: 1,
      parameter: "ICC on RM",
      field: "iccOnRm",
      costField: "iccOnRmCost",
      appliedCost: Number(finalRmCost) || 0,
      defaultValue: "1.00",
    },
    {
      id: 2,
      parameter: "Rej on Subtotal",
      field: "rejOnSubtotal",
      costField: "rejOnSubtotalCost",
      appliedCost: subtotalA,
      defaultValue: "3.00",
    },
    {
      id: 3,
      parameter: "O/H on Subtotal",
      field: "ohOnSubtotal",
      costField: "ohOnSubtotalCost",
      appliedCost: subtotalA,
      defaultValue: "10.00",
    },
    {
      id: 4,
      parameter: "Profit on Subtotal",
      field: "profitOnSubtotal",
      costField: "profitOnSubtotalCost",
      appliedCost: subtotalA,
      defaultValue: "10.00",
    },
    {
      id: 5,
      parameter: "Packaging on Subtotal",
      field: "packagingOnSubtotal",
      costField: "packagingOnSubtotalCost",
      appliedCost: subtotalA,
      defaultValue: "2.00",
    },
    {
      id: 6,
      parameter: "Transport on Subtotal",
      field: "transportOnSubtotal",
      costField: "transportOnSubtotalCost",
      appliedCost: subtotalA,
      defaultValue: "2.00",
    },
  ];

  const handleEdit = (id) => {
    setEditingRow(id);

    setTimeout(() => {
      const input = inputRefs.current[id];

      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  };

  const handleSave = () => {
    setEditingRow(null);
  };

  return (
    <div className="bottom-line-container">
      {/* Header */}
      <div className="bottom-line-header">
        <div>
          <b>Transaction ID-</b>
          <span>{transactionId || "Not Saved"}</span>
        </div>

        <div>
          <b>Part No-</b>
          <span>{formData.partNo || "183034B1003-A Jcb Base Seal Assy"}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bottom-line-table-wrapper">
        <table className="bottom-line-table">
          <thead>
            <tr>
              <th className="sr-column">Sr. No.</th>

              <th className="parameter-column">Parameter</th>

              <th className="percentage-column">Applied on Cost</th>

              <th className="percentage-column">Percentage</th>

              <th className="percentage-column">Cost</th>

              <th className="action-column">Action</th>
            </tr>
          </thead>

          <tbody>
            {bottomLineData.map((item) => {
              const isEditing = editingRow === item.id;

              const percentage =
                formData[item.field] !== undefined &&
                formData[item.field] !== ""
                  ? Number(formData[item.field])
                  : Number(item.defaultValue);

              const cost = (item.appliedCost * percentage) / 100;

              return (
                <tr key={item.id}>
                  <td className="text-center">{item.id}</td>

                  <td>{item.parameter}</td>

                  <td className="text-end">
                    ₹
                    {item.appliedCost.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className="percentage-cell">
                    <div className="percentage-input">
                      <input
                        ref={(el) => {
                          inputRefs.current[item.id] = el;
                        }}
                        type="number"
                        step="0.01"
                        name={item.field}
                        value={percentage}
                        readOnly={!isEditing}
                        onChange={handleInputChange}
                        className={
                          isEditing
                            ? "bottom-percentage-input editing"
                            : "bottom-percentage-input"
                        }
                      />

                      <span>%</span>
                    </div>
                  </td>

                  <td className="text-end">
                    ₹
                    {cost.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className="action-cell">
                    {!isEditing ? (
                      <button
                        type="button"
                        className="bottom-edit-btn"
                        onClick={() => handleEdit(item.id)}
                      >
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="bottom-edit-btn"
                        onClick={handleSave}
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* Cost Summary */}
        <div className="bottom-line-summary">
          {/* Subtotal A */}
          <div className="summary-field ">
            <label>
              <b>Subtotal A</b>
            </label>

            <input
              type="text"
              className="form-control cost-highlight"
              value={subtotalA.toFixed(2)}
              readOnly
            />
          </div>

          {/* Subtotal B */}
          <div className="summary-field ">
            <label>
              <b>Subtotal B</b>
            </label>

            <input
              type="text"
              className="form-control cost-highlight"
              value={subtotalB.toFixed(2)}
              readOnly
            />
          </div>

          {/* Total Part Cost */}
          <div className="summary-field ">
            <label>
              <b>Total Part Cost</b>
            </label>

            <input
              type="text"
              className="form-control conversion-highlight"
              value={totalPartCost.toFixed(2)}
              readOnly
            />
          </div>
        </div>
        <div className="bottom-line-profit-summary">
          {/* Customer Sales Cost */}
          <div className="summary-field">
            <label>
              <b>Customer Sales Cost</b>
            </label>

            <input
              type="number"
              step="0.01"
              name="customerSalesCost"
              value={formData.customerSalesCost || ""}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Enter Sales Cost"
            />
          </div>

          {/* Profit / Loss */}
          <div className="summary-field">
            <label>
              <b>Profit / Loss</b>
            </label>

            <input
              type="text"
              value={salesProfitLoss.toFixed(2)}
              readOnly
              className="form-control conversion-highlight"
            />
          </div>

          {/* Buying Cost */}
          <div className="summary-field">
            <label>
              <b>Buying Cost</b>
            </label>

            <input
              type="number"
              step="0.01"
              name="buyingCost"
              value={formData.buyingCost || ""}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Enter Buying Cost"
            />
          </div>

          {/* Profit / Loss on Buying */}
          <div className="summary-field">
            <label>
              <b>Profit / Loss on Buying</b>
            </label>

            <input
              type="text"
              value={buyingProfitLoss.toFixed(2)}
              readOnly
              className="form-control conversion-highlight"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BottomLineForm;
