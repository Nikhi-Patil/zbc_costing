import React, { useEffect, useRef, useState } from "react";
import TomSelect from "tom-select";
import { months, generateFinancialYears } from "../../utils/costingUtils";

import API_BASE_URL from "../../config/api";

/* BOP MANAGEMENT TABLE */

const BopTable = ({
  bopList = [],
  updateBop,
  deleteBop,
  addBop,
  mode = "management",
  financialYear = "",
}) => {
  const isRM = mode === "rm";
  const financialYears = generateFinancialYears();
  const selectedFinancialYear =
    financialYears.find(
      (fy) => String(fy.value) === String(financialYear || ""),
    )?.label ||
    financialYear ||
    "";
  /* BOP MASTER */
  const [bops, setBops] = useState([]);
  const bopFgRefs = useRef({});
  const tomSelectInstances = useRef({});

  /* LOAD BOP MASTER */
  useEffect(() => {
    const fetchBops = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bops`);
        if (!response.ok) {
          throw new Error("Failed to fetch BOP master");
        }
        const result = await response.json();
        const data = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.bops)
              ? result.bops
              : [];

        setBops(data);
      } catch (error) {
        console.error("Error fetching BOP master:", error);
      }
    };
    fetchBops();
  }, []);

  /* GET SUPPLIER OPTIONS */
  const getSupplierOptions = (selectedBop) => {
    if (!selectedBop) {
      return [];
    }
    const supplierIds = String(selectedBop.supplier_id || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const supplierNames = String(selectedBop.supplier_name || "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    return supplierIds.map((id, index) => ({
      id,
      supplier_name: supplierNames[index] || `Supplier ${id}`,
    }));
  };

  /* FIND BOP MASTER */
  const findBopMaster = (row) => {
    /* FIRST TRY BOP ID */
    let selectedBop = bops.find(
      (item) => String(item.id) === String(row.bopId || ""),
    );

    /* FALLBACK TO FG CODE */
    if (!selectedBop && row.bopFgCode) {
      selectedBop = bops.find(
        (item) =>
          String(item.bop_erp_code || "")
            .trim()
            .toLowerCase() ===
          String(row.bopFgCode || "")
            .trim()
            .toLowerCase(),
      );
    }
    return selectedBop;
  };

  /* BOP FG CODE CHANGE */
  const handleBopFgCodeChange = (bop, selectedId) => {
    const selectedBop = bops.find(
      (item) => String(item.id) === String(selectedId),
    );

    /* NOTHING SELECTED */
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
    /* SUPPLIERS */
    const suppliers = getSupplierOptions(selectedBop);

    /* UPDATE ROW */
    updateBop(bop.id, "bopId", selectedBop.id);
    updateBop(bop.id, "bopFgCode", selectedBop.bop_erp_code || "");
    updateBop(bop.id, "bopPartNo", selectedBop.bop_part_no || "");
    updateBop(bop.id, "bopPartName", selectedBop.bop_part_name || "");
    updateBop(bop.id, "commodity", selectedBop.commodity || "");
    updateBop(bop.id, "suppliers", suppliers);

    /* CLEAR PREVIOUS SUPPLIER */
    updateBop(bop.id, "supplierId", "");
  };

  /* INITIALIZE TOM SELECT */
  useEffect(() => {
    if (isRM || !bops.length || !bopList?.length) {
      return;
    }

    const timer = setTimeout(() => {
      bopList.forEach((bop) => {
        const element = bopFgRefs.current[bop.id];

        if (!element) {
          return;
        }

        if (element.tomselect) {
          return;
        }

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
          dropdownParent: "body",
        });
        tomSelectInstances.current[bop.id] = tom;
        tom.on("change", (selectedId) => {
          handleBopFgCodeChange(bop, selectedId);
        });
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
            if (tom.wrapper) {
              tom.wrapper.classList.add("field-filled");
            }
          }
        }
      });
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, [bops, bopList, isRM]);

  /* CLEANUP TOM SELECT */
  useEffect(() => {
    return () => {
      Object.values(tomSelectInstances.current).forEach((instance) => {
        try {
          instance.destroy();
        } catch {
          // Ignore cleanup errors
        }
      });
      tomSelectInstances.current = {};
    };
  }, []);

  /* RENDER*/
  return (
    <div className={`card mt-4 ${isRM ? "bop-rm-card" : ""}`}>
      {/* HEADER */}
      <div className="bop-header">
        <div>
          <h4 className="bop-title">BOP Details</h4>
        </div>

        {!isRM && (
          <button
            type="button"
            className="btn btn-success add-bop-btn"
            onClick={addBop}
          >
            <i className="fas fa-plus me-2"></i>
            Add
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="card-body">
        <div className="table-responsive">
          <table className="table bop-table part-bop-table">
            <thead>
              <tr>
                <th>Sr. No</th>
                <th>BOP FG Code</th>
                <th>BOP Part No</th>
                <th>Part Name</th>
                <th>Supplier Name</th>
                <th>Commodity</th>
                <th>Assembly Qty</th>
                {isRM && (
                  <>
                    <th>Month</th>
                    <th>BOP Rate</th>
                    <th>BOP Cost</th>
                  </>
                )}
                {!isRM && <th>Action</th>}
              </tr>
            </thead>

            <tbody>
              {bopList.length === 0 ? (
                <tr>
                  <td
                    colSpan={isRM ? 10 : 8}
                    className="text-center text-muted"
                  >
                    No BOP added
                  </td>
                </tr>
              ) : (
                bopList.map((bop, index) => {
                  const selectedBop = findBopMaster(bop);
                  const supplierOptions = bop.suppliers?.length
                    ? bop.suppliers
                    : getSupplierOptions(selectedBop);
                  const bopFgCode =
                    bop.bopFgCode ?? bop.bop_erp_code ?? bop.bopErpCode ?? "";
                  const bopPartNo = bop.bopPartNo ?? bop.bop_part_no ?? "";
                  const bopPartName =
                    bop.bopPartName ?? bop.bop_part_name ?? "";
                  const selectedSupplierId =
                    bop.supplierId ?? bop.supplier_id ?? "";
                  const selectedSupplier = supplierOptions.find(
                    (supplier) =>
                      String(supplier.id) === String(selectedSupplierId),
                  );
                  const supplierName =
                    bop.supplierName ??
                    bop.supplier_name ??
                    selectedSupplier?.supplier_name ??
                    "";
                  const commodity = bop.commodity ?? "";
                  const assemblyQty =
                    bop.bopAssemblyQty ??
                    bop.assembly_qty ??
                    bop.assemblyQty ??
                    "";
                  const bopMonth =
                    bop.bopmonth ?? bop.bopMonth ?? bop.month ?? "";
                  const bopRate = bop.bopRate ?? bop.bop_rate ?? "";
                  const bopCost = bop.bopCost ?? bop.bop_cost ?? "0.00";

                  return (
                    <tr key={bop.id ?? index}>
                      <td className="text-center">{index + 1}</td>

                      <td>
                        {isRM ? (
                          <input
                            type="text"
                            className={`form-control ${
                              bopFgCode ? "field-filled" : ""
                            }`}
                            value={bopFgCode}
                            readOnly
                          />
                        ) : (
                          <select
                            ref={(element) => {
                              if (element) {
                                bopFgRefs.current[bop.id] = element;
                              }
                            }}
                            defaultValue=""
                            className={`form-control ${
                              bopFgCode ? "field-filled" : ""
                            }`}
                          >
                            <option value="">Select BOP FG Code</option>
                            {bops.map((fgCode) => (
                              <option key={fgCode.id} value={fgCode.id}>
                                {fgCode.bop_erp_code}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td>
                        <input
                          type="text"
                          className={`form-control ${
                            bopPartNo ? "field-filled" : ""
                          }`}
                          value={bopPartNo}
                          readOnly
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          className={`form-control ${
                            bopPartName ? "field-filled" : ""
                          }`}
                          value={bopPartName}
                          readOnly
                        />
                      </td>

                      <td>
                        {isRM ? (
                          <input
                            type="text"
                            className={`form-control ${
                              supplierName ? "field-filled" : ""
                            }`}
                            value={supplierName}
                            readOnly
                          />
                        ) : (
                          <select
                            className={`form-control ${
                              bop.supplierId ? "field-filled" : ""
                            }`}
                            value={bop.supplierId || ""}
                            disabled={!bop.bopId}
                            onChange={(event) =>
                              updateBop(
                                bop.id,
                                "supplierId",
                                event.target.value,
                              )
                            }
                          >
                            <option value="">Select Supplier</option>
                            {supplierOptions.map((supplier) => (
                              <option key={supplier.id} value={supplier.id}>
                                {supplier.supplier_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td>
                        <input
                          type="text"
                          className={`form-control ${
                            commodity ? "field-filled" : ""
                          }`}
                          value={commodity}
                          readOnly
                          tabIndex={-1}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          className={`form-control ${
                            assemblyQty !== "" &&
                            assemblyQty !== null &&
                            Number(assemblyQty) !== 0
                              ? "field-filled"
                              : ""
                          }`}
                          value={assemblyQty}
                          readOnly={isRM}
                          min="0"
                          step="0.01"
                          onChange={
                            isRM
                              ? undefined
                              : (event) =>
                                  updateBop(
                                    bop.id,
                                    "bopAssemblyQty",
                                    event.target.value,
                                  )
                          }
                        />
                      </td>

                      {isRM && (
                        <>
                          <td>
                            <select
                              className={`form-control ${
                                bopMonth ? "field-filled" : ""
                              }`}
                              value={bopMonth || ""}
                              onChange={(event) =>
                                updateBop(
                                  bop.id,
                                  "bopmonth",
                                  event.target.value,
                                )
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

                          <td>
                            <input
                              type="text"
                              className={`form-control ${
                                bopRate !== "" && bopRate !== null
                                  ? "field-filled"
                                  : ""
                              }`}
                              value={
                                bopRate === "" || bopRate === null
                                  ? ""
                                  : Number(bopRate).toFixed(2)
                              }
                              readOnly
                              placeholder="Not Found"
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              className={`form-control ${
                                bopCost !== "" &&
                                bopCost !== null &&
                                Number(bopCost) !== 0
                                  ? "field-filled"
                                  : ""
                              }`}
                              value={Number(bopCost || 0).toFixed(2)}
                              readOnly
                            />
                          </td>
                        </>
                      )}

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

export default BopTable;
