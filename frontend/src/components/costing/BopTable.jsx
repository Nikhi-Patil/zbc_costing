import React, { useState, useEffect } from "react";

const BopTable = ({ bopList, updateBop, deleteBop, addBop, mode = "part" }) => {
  const [bops, setBops] = useState([]);

  useEffect(() => {
    const fetchBops = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/bops");

        if (!response.ok) {
          throw new Error("Failed to fetch bops");
        }

        const data = await response.json();

        setBops(data);
      } catch (error) {
        console.error("Error fetching bops:", error);
      }
    };

    fetchBops();
  }, []);
  const isRM = mode === "rm";

  return (
    <div className="card mt-4">
      <div className="bop-header">
        <h4 className="bop-title">BOP Details</h4>

        {!isRM && (
          <button
            type="button"
            className="btn btn-success add-bop-btn"
            onClick={addBop}
          >
            {" "}
            <i className="fas fa-plus me-2"></i> Add{" "}
          </button>
        )}
      </div>

      <div className="card-body">
        <div className="table-responsive">
          <table
            className={`table bop-table ${
              isRM ? "rm-bop-table" : "part-bop-table"
            }`}
          >
            <thead>
              <tr>
                <th>Sr. No</th>
                <th>BOP FG Code</th>
                <th>BOP Part No</th>
                <th>Part Name</th>
                <th>Supplier Name</th>
                <th>Commodity</th>
                <th>Assembly Qty</th>

                {/* Only RM Details */}
                {isRM && (
                  <>
                    <th>Month</th>
                    <th>BOP Rate</th>
                    <th>BOP Cost</th>
                  </>
                )}

                {/* Only Part Details */}
                {!isRM && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {bopList.length === 0 ? (
                <tr>
                  <td colSpan={isRM ? 9 : 8} className="text-center text-muted">
                    No BOP added
                  </td>
                </tr>
              ) : (
                bopList.map((bop, index) => (
                  <tr key={bop.id}>
                    <td className="text-center">{index + 1}</td>

                    {/* BOP FG Code */}
                    <td>
                      <select
                        className={`form-control ${
                          bop.bopFgCode ? "field-filled" : ""
                        }`}
                        value={bop.bopFgCode || ""}
                        disabled={isRM}
                        onChange={(e) => {
                          const selectedId = e.target.value;

                          const selectedBop = bops.find(
                            (item) => String(item.id) === String(selectedId),
                          );

                          if (!selectedBop) {
                            updateBop(bop.id, "bopFgCode", "");
                            updateBop(bop.id, "bopPartNo", "");
                            updateBop(bop.id, "bopPartName", "");
                            updateBop(bop.id, "suppliers", []);
                            updateBop(bop.id, "supplierId", "");
                            return;
                          }

                          // Convert comma-separated supplier IDs
                          const supplierIds = String(
                            selectedBop.supplier_id || "",
                          )
                            .split(",")
                            .map((id) => id.trim())
                            .filter(Boolean);

                          // Convert comma-separated supplier names
                          const supplierNames = String(
                            selectedBop.supplier_name || "",
                          )
                            .split(",")
                            .map((name) => name.trim())
                            .filter(Boolean);

                          // Combine IDs + names
                          const suppliers = supplierIds.map((id, index) => ({
                            id,
                            supplier_name: supplierNames[index] || "",
                          }));

                          updateBop(bop.id, "bopFgCode", selectedId);

                          updateBop(
                            bop.id,
                            "bopPartNo",
                            selectedBop.bop_part_no || "",
                          );

                          updateBop(
                            bop.id,
                            "bopPartName",
                            selectedBop.bop_part_name || "",
                          );

                          updateBop(bop.id, "suppliers", suppliers);

                          // Clear previously selected supplier
                          updateBop(bop.id, "supplierId", "");
                        }}
                      >
                        <option value="">Select</option>

                        {bops.map((fgCode) => (
                          <option key={fgCode.id} value={fgCode.id}>
                            {fgCode.bop_erp_code}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* BOP Part No */}
                    <td>
                      <input
                        type="text"
                        className={`form-control ${
                          bop.bopPartNo ? "field-filled" : ""
                        }`}
                        value={bop.bopPartNo || ""}
                        readOnly
                      />
                    </td>

                    {/* Part Name */}
                    <td>
                      <input
                        type="text"
                        className={`form-control ${
                          bop.bopPartName ? "field-filled" : ""
                        }`}
                        value={bop.bopPartName || ""}
                        readOnly
                      />
                    </td>

                    {/* Supplier */}
                    <td>
                      <select
                        className={`form-control ${
                          bop.supplierId ? "field-filled" : ""
                        }`}
                        value={bop.supplierId || ""}
                        disabled={isRM}
                        onChange={(e) =>
                          updateBop(bop.id, "supplierId", e.target.value)
                        }
                      >
                        <option value="">Select Supplier</option>

                        {(bop.suppliers || []).map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.supplier_name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Commodity */}
                    <td>
                      <input
                        type="text"
                        className={`form-control ${
                          bop.commodity ? "field-filled" : ""
                        }`}
                        value={bop.commodity || ""}
                        onChange={(e) =>
                          updateBop(bop.id, "commodity", e.target.value)
                        }
                        placeholder="Commodity"
                      />
                    </td>

                    {/* Assembly Quantity */}
                    <td>
                      <input
                        type="number"
                        className={`form-control ${
                          bop.bopAssemblyQty ? "field-filled" : ""
                        }`}
                        value={bop.bopAssemblyQty || ""}
                        onChange={(e) =>
                          updateBop(bop.id, "bopAssemblyQty", e.target.value)
                        }
                        placeholder="Assembly Qty"
                      />
                    </td>

                    {/* RM ONLY */}
                    {isRM && (
                      <>
                        {/* Month */}
                        <td>
                          <select
                            className={`form-control ${
                              bop.bopmonth ? "field-filled" : ""
                            }`}
                            value={bop.bopmonth || ""}
                            onChange={(e) =>
                              updateBop(bop.id, "bopmonth", e.target.value)
                            }
                          >
                            <option value="">Select Month</option>
                            <option value="January">January</option>
                            <option value="February">February</option>
                            <option value="March">March</option>
                            <option value="April">April</option>
                            <option value="May">May</option>
                            <option value="June">June</option>
                            <option value="July">July</option>
                            <option value="August">August</option>
                            <option value="September">September</option>
                            <option value="October">October</option>
                            <option value="November">November</option>
                            <option value="December">December</option>
                          </select>
                        </td>

                        {/* Rate */}
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className={`form-control ${
                              bop.bopRate ? "field-filled" : ""
                            }`}
                            value={bop.bopRate || ""}
                            onChange={(e) =>
                              updateBop(bop.id, "bopRate", e.target.value)
                            }
                            placeholder="Bop Rate"
                          />
                        </td>

                        {/* Cost */}
                        <td>
                          <input
                            type="text"
                            className={`form-control ${
                              bop.bopCost ? "field-filled" : ""
                            }`}
                            value={bop.bopCost || ""}
                            readOnly
                          />
                        </td>
                      </>
                    )}

                    {/* PART DETAILS ONLY */}
                    {!isRM && (
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteBop(bop.id)}
                          title="Delete BOP"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BopTable;
