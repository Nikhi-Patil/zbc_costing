import React, { useState, useRef, useEffect } from "react";
import { months } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";
import TomSelect from "tom-select";

const BopTable = ({ bopList, updateBop, deleteBop, addBop, mode = "part" }) => {
  const [bops, setBops] = useState([]);
  const bopFgRefs = useRef({});

  useEffect(() => {
    const fetchBops = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bops`);

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

  // BOP FG CODE CHANGE
  const handleBopFgCodeChange = (bop, selectedId) => {
    // FIND SELECTED BOP MASTER
    const selectedBop = bops.find(
      (item) => String(item.id) === String(selectedId),
    );
    // NOTHING SELECTED
    if (!selectedBop) {
      updateBop(bop.id, "bopId", "");
      updateBop(bop.id, "bopFgCode", "");
      updateBop(bop.id, "bopPartNo", "");
      updateBop(bop.id, "bopPartName", "");
      updateBop(bop.id, "commodity", "");
      updateBop(bop.id, "suppliers", []);
      updateBop(bop.id, "supplierId", "");
      return;
    }
    // SUPPLIER IDS
    const supplierIds = String(selectedBop.supplier_id || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    // SUPPLIER NAMES
    const supplierNames = String(selectedBop.supplier_name || "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    // CREATE SUPPLIER OPTIONS
    const suppliers = supplierIds.map((id, index) => ({
      id,
      supplier_name: supplierNames[index] || `Supplier ${id}`,
    }));
    // UPDATE BOP
    updateBop(bop.id, "bopId", selectedBop.id);
    updateBop(bop.id, "bopFgCode", selectedBop.bop_erp_code || "");
    updateBop(bop.id, "bopPartNo", selectedBop.bop_part_no || "");
    updateBop(bop.id, "bopPartName", selectedBop.bop_part_name || "");
    // IMPORTANT
    updateBop(bop.id, "commodity", selectedBop.commodity || "");
    updateBop(bop.id, "suppliers", suppliers);
    // Clear previous supplier
    updateBop(bop.id, "supplierId", "");
  };

  // INITIALIZE TOM SELECT FOR BOP FG CODE
  useEffect(() => {
    if (!bops.length || !bopList?.length) {
      return;
    }

    const timer = setTimeout(() => {
      bopList.forEach((bop) => {
        // Get the actual select element
        const element = bopFgRefs.current[bop.id];

        if (!element) {
          console.log("BOP FG select not found:", bop.id);
          return;
        }

        // Already initialized
        if (element.tomselect) {
          return;
        }

        console.log("Initializing Tom Select:", bop.id);

        // =================================================
        // CREATE TOM SELECT
        // =================================================

        const tom = new TomSelect(element, {
          create: false,

          searchField: ["text"],

          openOnFocus: true,

          maxOptions: 1000,

          sortField: {
            field: "text",
            direction: "asc",
          },

          placeholder: "Search BOP FG Code...",

          allowEmptyOption: true,

          // IMPORTANT
          dropdownParent: "body",
        });

        // =================================================
        // WHEN USER SELECTS BOP FG CODE
        // =================================================

        tom.on("change", (selectedId) => {
          handleBopFgCodeChange(bop, selectedId);
        });

        // =================================================
        // RESTORE EXISTING BOP FG CODE
        // =================================================

        if (bop.bopFgCode) {
          const selectedBop = bops.find(
            (item) =>
              String(item.bop_erp_code || "")
                .trim()
                .toLowerCase() ===
              String(bop.bopFgCode || "")
                .trim()
                .toLowerCase(),
          );

          if (selectedBop) {
            tom.setValue(String(selectedBop.id), true);

            tom.wrapper.classList.add("field-filled");
          }
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [bops, bopList]);

  // =====================================================
  // RESTORE BOP MASTER DATA IN RM DETAILS
  // =====================================================

  useEffect(() => {
    if (!isRM || !bopList?.length || !bops?.length) {
      return;
    }

    bopList.forEach((bop) => {
      // First try BOP master ID
      let bopMaster = bops.find(
        (item) => String(item.id) === String(bop.bopId),
      );

      // Fallback for old transactions
      // which don't have bopId saved
      if (!bopMaster && bop.bopFgCode) {
        bopMaster = bops.find(
          (item) =>
            String(item.bop_erp_code || "")
              .trim()
              .toLowerCase() ===
            String(bop.bopFgCode || "")
              .trim()
              .toLowerCase(),
        );
      }

      if (!bopMaster) {
        console.warn("BOP master not found:", bop.bopFgCode, bop.bopId);
        return;
      }

      // =================================================
      // RESTORE BOP MASTER ID
      // =================================================

      if (String(bop.bopId || "") !== String(bopMaster.id)) {
        updateBop(bop.id, "bopId", bopMaster.id);
      }

      // =================================================
      // RESTORE COMMODITY
      // =================================================

      if (bop.commodity !== bopMaster.commodity) {
        updateBop(bop.id, "commodity", bopMaster.commodity || "");
      }

      // =================================================
      // SUPPLIER IDS
      // =================================================

      const supplierIds = String(bopMaster.supplier_id || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      // =================================================
      // SUPPLIER NAMES
      // =================================================

      const supplierNames = String(bopMaster.supplier_name || "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);

      // =================================================
      // CREATE SUPPLIER OPTIONS
      // =================================================

      const suppliers = supplierIds.map((id, index) => ({
        id,
        supplier_name: supplierNames[index] || `Supplier ${id}`,
      }));

      // =================================================
      // RESTORE SUPPLIERS
      // =================================================

      if (JSON.stringify(bop.suppliers || []) !== JSON.stringify(suppliers)) {
        updateBop(bop.id, "suppliers", suppliers);
      }
    });
  }, [isRM, bopList, bops]);

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
                        ref={(element) => {
                          if (element) {
                            bopFgRefs.current[bop.id] = element;
                          }
                        }}
                        defaultValue=""
                        disabled={isRM}
                      >
                        <option value="">Select BOP FG Code</option>

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
                      {(() => {
                        const selectedBop =
                          bops.find(
                            (item) => String(item.id) === String(bop.bopId),
                          ) ||
                          bops.find(
                            (item) =>
                              String(item.bop_erp_code || "")
                                .trim()
                                .toLowerCase() ===
                              String(bop.bopFgCode || "")
                                .trim()
                                .toLowerCase(),
                          );
                        const supplierIds = String(
                          selectedBop?.supplier_id || "",
                        )
                          .split(",")
                          .map((id) => id.trim())
                          .filter(Boolean);

                        const supplierNames = String(
                          selectedBop?.supplier_name || "",
                        )
                          .split(",")
                          .map((name) => name.trim())
                          .filter(Boolean);

                        const supplierOptions = supplierIds.map(
                          (id, index) => ({
                            id,
                            supplier_name:
                              supplierNames[index] || `Supplier ${id}`,
                          }),
                        );

                        return (
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

                            {supplierOptions.map((supplier) => (
                              <option key={supplier.id} value={supplier.id}>
                                {supplier.supplier_name}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </td>

                    {/* Commodity */}
                    <td>
                      <input
                        type="text"
                        className={`form-control ${
                          bop.commodity ? "field-filled" : ""
                        }`}
                        value={bop.commodity || ""}
                        readOnly
                        tabIndex={-1}
                        placeholder="Commodity"
                      />
                    </td>

                    {/* Assembly Quantity */}
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className={`form-control ${
                          bop.bopAssemblyQty ? "field-filled" : ""
                        }`}
                        value={bop.bopAssemblyQty || ""}
                        readOnly={isRM}
                        onChange={(e) =>
                          updateBop(bop.id, "bopAssemblyQty", e.target.value)
                        }
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

                            {months.map((month) => (
                              <option key={month.value} value={month.value}>
                                {month.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Rate */}
                        <td>
                          <input
                            type="text"
                            className={`form-control ${
                              bop.bopRate ? "field-filled" : ""
                            }`}
                            value={bop.bopRate || "Auto"}
                            readOnly
                          />
                        </td>

                        {/* Cost */}
                        <td>
                          <input
                            type="text"
                            className={`form-control ${
                              bop.bopCost ? "field-filled" : ""
                            }`}
                            value={bop.bopCost || "0.00"}
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
