import { useEffect, useRef, useState } from "react";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";
import TomSelect from "tom-select";

function PartDetailsForm({
  formData,
  transactionId,
  handleInputChange,
  handlePartSelect,
  bopList,
}) {
  const financialYears = generateFinancialYears();

  const [units, setUnits] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [parts, setParts] = useState([]);
  const [bopMasters, setBopMasters] = useState([]);

  const partNoRef = useRef(null);

  // ============================================================
  // FETCH BOP MASTER
  // Used to restore supplier names after page refresh
  // ============================================================
  useEffect(() => {
    const fetchBopMasters = async () => {
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

        setBopMasters(data);
      } catch (error) {
        console.error("Error fetching BOP master:", error);
        setBopMasters([]);
      }
    };

    fetchBopMasters();
  }, []);

  // ============================================================
  // FETCH PARTS
  // ============================================================
  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/parts`);

        if (!response.ok) {
          throw new Error("Failed to fetch parts");
        }

        const data = await response.json();

        setParts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching parts:", error);
        setParts([]);
      }
    };

    fetchParts();
  }, []);

  // ============================================================
  // FETCH SUB CATEGORIES
  // ============================================================
  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/subcategories?category=Molding`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch subcategories");
        }

        const data = await response.json();

        setSubCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        setSubCategories([]);
      }
    };

    fetchSubCategories();
  }, []);

  // ============================================================
  // FETCH CUSTOMERS
  // ============================================================
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/customers`);

        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }

        const data = await response.json();

        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomers([]);
      }
    };

    fetchCustomers();
  }, []);

  // ============================================================
  // FETCH UNITS
  // ============================================================
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/units`);

        if (!response.ok) {
          throw new Error("Failed to fetch units");
        }

        const data = await response.json();

        setUnits(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching units:", error);
        setUnits([]);
      }
    };

    fetchUnits();
  }, []);

  // ============================================================
  // FETCH SUB DEPARTMENTS
  // ============================================================
  useEffect(() => {
    if (!formData.productionUnit) {
      setSubDepartments([]);
      return;
    }

    const fetchSubDepartments = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/subdepartments?unitId=${formData.productionUnit}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sub departments");
        }

        const data = await response.json();

        setSubDepartments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching sub departments:", error);
        setSubDepartments([]);
      }
    };

    fetchSubDepartments();
  }, [formData.productionUnit]);

  // ============================================================
  // INITIALIZE TOM SELECT FOR PART NO
  // ============================================================
  useEffect(() => {
    if (!partNoRef.current || parts.length === 0) {
      return;
    }

    if (partNoRef.current.tomselect) {
      return;
    }

    const tomSelect = new TomSelect(partNoRef.current, {
      create: false,
      sortField: {
        field: "text",
        direction: "asc",
      },
      placeholder: "Search Part No...",
      allowEmptyOption: true,
    });

    // Existing transaction part
    if (formData.partNo) {
      const selectedPart = parts.find(
        (part) =>
          String(part.part_no).trim() === String(formData.partNo).trim(),
      );

      if (selectedPart) {
        tomSelect.setValue(selectedPart.part_no, true);
      }
    }

    return () => {
      tomSelect.destroy();
    };
  }, [parts]);

  // ============================================================
  // SYNC PART NO WITH REACT
  // ============================================================
  useEffect(() => {
    if (!partNoRef.current) {
      return;
    }

    const tomSelect = partNoRef.current.tomselect;

    if (!tomSelect) {
      return;
    }

    const value = formData.partNo || "";

    if (value) {
      const selectedPart = parts.find(
        (part) => String(part.part_no).trim() === String(value).trim(),
      );

      if (selectedPart) {
        tomSelect.setValue(selectedPart.part_no, true);
      }
    } else {
      tomSelect.clear(true);
    }

    const wrapper = tomSelect.wrapper;

    if (value) {
      wrapper.classList.add("field-filled");
    } else {
      wrapper.classList.remove("field-filled");
    }
  }, [formData.partNo, parts]);

  // SYNC SUB CATEGORY NAME
  useEffect(() => {
    if (!formData.subCategory || subCategories.length === 0) {
      return;
    }

    const selectedSubCategory = subCategories.find(
      (subCategory) => String(subCategory.id) === String(formData.subCategory),
    );
    const selectedName = selectedSubCategory?.sub_category_name || "";
    if (selectedName && formData.subCategoryName !== selectedName) {
      handleInputChange({
        target: {
          name: "subCategoryName",
          value: selectedName,
        },
      });
    }
  }, [
    subCategories,
    formData.subCategory,
    formData.subCategoryName,
    handleInputChange,
  ]);
  
  // PART SELECT
  const handlePartNoChange = (event) => {
    const selectedPart = parts.find(
      (part) => String(part.part_no) === String(event.target.value),
    );
    handlePartSelect(selectedPart || null);
  };

  return (
    <>
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h5 className="mb-0">
            <b style={{ fontSize: "14px" }}>Part Details</b>
          </h5>

          <span className="transaction-id-header">
            Transaction ID: <b>{transactionId || "Not Saved"}</b>
          </span>
        </div>

        <div className="card-body">
          {/* ROW 1 */}
          <div className="row g-2 mt-1 form-row">
            <div className="col-md-3">
              <label className="form-label">
                <b>Financial Year</b>
              </label>

              <select
                className={`form-control ${
                  formData.financialYear ? "field-filled" : ""
                }`}
                name="financialYear"
                value={formData.financialYear}
                onChange={handleInputChange}
              >
                <option value="">Select</option>

                {financialYears.map((fy) => (
                  <option key={fy.value} value={fy.value}>
                    {fy.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>Month</b>
              </label>

              <select
                className={`form-control ${
                  formData.month ? "field-filled" : ""
                }`}
                name="month"
                value={formData.month}
                onChange={handleInputChange}
              >
                <option value="">Select</option>

                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>Effective Date</b>
              </label>

              <input
                type="date"
                className={`form-control ${
                  formData.effectiveDate ? "field-filled" : ""
                }`}
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>Customer Name</b>
              </label>

              <select
                className={`form-control ${
                  formData.customerName ? "field-filled" : ""
                }`}
                name="customerName"
                value={formData.customerName || ""}
                onChange={handleInputChange}
              >
                <option value="">Select</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.sub_customer}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ROW 2 */}
          <div className="row g-2 mt-1 form-row">
            <div className="col-md-3">
              <label className="form-label">
                <b>Production Unit</b>
              </label>
              <select
                className={`form-control ${
                  formData.productionUnit ? "field-filled" : ""
                }`}
                name="productionUnit"
                value={formData.productionUnit}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>Billing Unit</b>
              </label>
              <select
                className={`form-control ${
                  formData.billingUnit ? "field-filled" : ""
                }`}
                name="billingUnit"
                value={formData.billingUnit}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>Sub Department</b>
              </label>
              <select
                className={`form-control ${
                  formData.subDepartment ? "field-filled" : ""
                }`}
                name="subDepartment"
                value={formData.subDepartment}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                {subDepartments.map((subDepartment) => (
                  <option key={subDepartment.id} value={subDepartment.id}>
                    {subDepartment.sub_department_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>Sub Category</b>
              </label>
              <select
                className={`form-control ${
                  formData.subCategory ? "field-filled" : ""
                }`}
                name="subCategory"
                value={formData.subCategory}
                onChange={(e) => {
                  const selectedSubCategory = subCategories.find(
                    (subCategory) =>
                      String(subCategory.id) === String(e.target.value),
                  );
                  handleInputChange(e);
                  handleInputChange({
                    target: {
                      name: "subCategoryName",
                      value: selectedSubCategory?.sub_category_name || "",
                    },
                  });
                }}
              >
                <option value="">Select</option>
                {subCategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.sub_category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ROW 3 */}
          <div className="row g-2 mt-1 form-row">
            <div className="col-md-3">
              <label className="form-label">
                <b>Part No</b>
              </label>
              <select
                ref={partNoRef}
                value={formData.partNo || ""}
                onChange={handlePartNoChange}
              >
                <option value="">Select Part No</option>
                {parts.map((part) => (
                  <option key={part.id} value={part.part_no}>
                    {part.part_no}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>Part Name</b>
              </label>
              <input
                type="text"
                className={`form-control ${
                  formData.partName ? "field-filled" : ""
                }`}
                name="partName"
                value={formData.partName}
                readOnly
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>FG Code</b>
              </label>
              <input
                type="text"
                className={`form-control ${
                  formData.fgcode ? "field-filled" : ""
                }`}
                name="fgcode"
                value={formData.fgcode}
                readOnly
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>Production IM code</b>
              </label>
              <input
                type="text"
                className={`form-control ${
                  formData.imcode ? "field-filled" : ""
                }`}
                name="imcode"
                value={formData.imcode}
                onChange={handleInputChange}
                placeholder="IM00001"
              />
            </div>
          </div>

          {/* ROW 4 */}
          <div className="row g-2 mt-1 form-row">
            <div className="col-md-3">
              <label className="form-label">
                <b>Net Wt.</b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.netWeight ? "field-filled" : ""
                }`}
                name="netWeight"
                value={formData.netWeight}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>Gross Wt.</b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.grossWeight ? "field-filled" : ""
                }`}
                name="grossWeight"
                value={formData.grossWeight}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>Loading Wt. %</b>
              </label>
              <input
                type="text"
                className={`form-control ${
                  formData.loadingper ? "field-filled" : ""
                }`}
                name="loadingper"
                value={formData.loadingper}
                readOnly
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b>BOP YES/NO</b>
              </label>
              <input
                type="text"
                className={`form-control ${
                  formData.hasBop ? "field-filled" : ""
                }`}
                value={formData.hasBop || "No"}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOP CONFIGURATION */}
      {formData.partNo && (
        <div className="card mt-4">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="mb-0">
              <b style={{ fontSize: "14px" }}>BOP Details</b>
            </h5>

            {bopList?.length > 0 && (
              <span className="text-success">BOP configuration loaded</span>
            )}
          </div>

          <div className="card-body">
            {!bopList || bopList.length === 0 ? (
              <div className="text-center text-muted py-3">
                No BOP configuration found for this Part No.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table bop-table part-bop-table">
                  <thead>
                    <tr>
                      <th>Sr. No.</th>
                      <th>BOP FG Code</th>
                      <th>BOP Part No.</th>
                      <th>Part Name</th>
                      <th>Supplier Name</th>
                      <th>Commodity</th>
                      <th>Assembly Qty</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bopList.map((bop, index) => {
                      const bopMaster = bopMasters.find(
                        (master) =>
                          String(master.id) ===
                            String(bop.bopId ?? bop.bop_id) ||
                          String(master.bop_erp_code || "")
                            .trim()
                            .toLowerCase() ===
                            String(
                              bop.bopFgCode ??
                                bop.bop_fg_code ??
                                bop.bopErpCode ??
                                "",
                            )
                              .trim()
                              .toLowerCase(),
                      );

                      const supplierId =
                        bop.supplierId ?? bop.supplier_id ?? "";

                      const supplierIds = String(bopMaster?.supplier_id ?? "")
                        .split(",")
                        .map((id) => id.trim())
                        .filter(Boolean);

                      const supplierNames = String(
                        bopMaster?.supplier_name ?? "",
                      )
                        .split(",")
                        .map((name) => name.trim())
                        .filter(Boolean);

                      const supplierIndex = supplierIds.findIndex(
                        (id) => String(id) === String(supplierId),
                      );

                      const restoredSupplierName =
                        bop.supplierName ??
                        bop.supplier_name ??
                        (supplierIndex >= 0
                          ? supplierNames[supplierIndex]
                          : "");

                      return (
                        <tr key={bop.id ?? `bop-${index}`}>
                          <td className="text-center">{index + 1}</td>

                          <td>
                            <input
                              type="text"
                              className={`form-control ${
                                bop.bopFgCode ? "field-filled" : ""
                              }`}
                              value={
                                bop.bopFgCode ??
                                bop.bop_fg_code ??
                                bop.bopErpCode ??
                                ""
                              }
                              readOnly
                              tabIndex={-1}
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              className={`form-control ${
                                bop.bopPartNo ? "field-filled" : ""
                              }`}
                              value={bop.bopPartNo ?? bop.bop_part_no ?? ""}
                              readOnly
                              tabIndex={-1}
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              className={`form-control ${
                                bop.bopPartName ? "field-filled" : ""
                              }`}
                              value={bop.bopPartName ?? bop.bop_part_name ?? ""}
                              readOnly
                              tabIndex={-1}
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              className={`form-control ${
                                restoredSupplierName ? "field-filled" : ""
                              }`}
                              value={restoredSupplierName}
                              readOnly
                              tabIndex={-1}
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              className={`form-control ${
                                bop.commodity ? "field-filled" : ""
                              }`}
                              value={bop.commodity ?? ""}
                              readOnly
                              tabIndex={-1}
                            />
                          </td>

                          <td>
                            <input
                              type="text"
                              className={`form-control ${
                                (bop.bopAssemblyQty ??
                                bop.assemblyQty ??
                                bop.assembly_qty)
                                  ? "field-filled"
                                  : ""
                              }`}
                              value={
                                bop.bopAssemblyQty ??
                                bop.assemblyQty ??
                                bop.assembly_qty ??
                                ""
                              }
                              readOnly
                              tabIndex={-1}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot>
                    <tr>
                      <td colSpan="6" className="text-end fw-bold">
                        Total Assembly Qty
                      </td>
                      <td className="fw-bold">
                        {bopList
                          .reduce(
                            (total, bop) =>
                              total +
                              (Number(
                                bop.bopAssemblyQty ??
                                  bop.assemblyQty ??
                                  bop.assembly_qty ??
                                  0,
                              ) || 0),
                            0,
                          )
                          .toFixed(1)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default PartDetailsForm;
