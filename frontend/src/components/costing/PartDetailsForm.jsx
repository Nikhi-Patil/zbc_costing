import { useEffect, useState } from "react";
import BopTable from "./BopTable";
import {months,generateFinancialYears,} from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";

function PartDetailsForm({
  formData,
  transactionId,
  handleInputChange,
  handlePartSelect,
  handleBopChange,
  bopList,
  addBop,
  deleteBop,
  updateBop,
}) {
  const financialYears = generateFinancialYears();
  const [units, setUnits] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [parts, setParts] = useState([]);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/parts`);

        if (!response.ok) {
          throw new Error("Failed to fetch parts");
        }

        const data = await response.json();

        setParts(data);
      } catch (error) {
        console.error("Error fetching parts:", error);
      }
    };

    fetchParts();
  }, []);

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

        setSubCategories(data);
      } catch (error) {
        console.error("Error fetching subcategories:", error);

        setSubCategories([]);
      }
    };

    fetchSubCategories();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/customers`);

        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }

        const data = await response.json();

        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/units`);

        if (!response.ok) {
          throw new Error("Failed to fetch units");
        }

        const data = await response.json();

        setUnits(data);
      } catch (error) {
        console.error("Error fetching units:", error);
      }
    };

    fetchUnits();
  }, []);

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

        setSubDepartments(data);
      } catch (error) {
        console.error("Error fetching sub departments:", error);

        setSubDepartments([]);
      }
    };

    fetchSubDepartments();
  }, [formData.productionUnit]);



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
          {/* Row 1 */}

          <div className="row g-2 mt-1 form-row">
            <div className="col-md-3">
              <label className="form-label">
                <b> Financial Year </b>
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
                <b> Month </b>
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
                <b> Effective Date </b>
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
              <label className="form-label ">
                <b>Customer Name </b>
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

          {/* Row 2 */}

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
                <b> Billing Unit </b>
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
                <b> Sub Department </b>
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
                onChange={handleInputChange}
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

          {/* Row 3 */}

          <div className="row g-2 mt-1 form-row">
            <div className="col-md-3">
              <label className="form-label">
                <b>Part No</b>
              </label>

              <select
                className={`form-control ${
                  formData.partNo ? "field-filled" : ""
                }`}
                name="partNo"
                value={formData.partNo}
                onChange={(e) =>
                  handlePartSelect(
                    parts.find(
                      (part) => String(part.part_no) === String(e.target.value),
                    ) || null,
                  )
                }
              >
                <option value="">Select</option>
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
                <b> Production IM code </b>
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
          {/* Row 4 */}

          <div className="row g-2 mt-1 form-row">
            <div className="col-md-3">
              <label className="form-label">
                <b> Gross Wt. </b>
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
                <b> Net Wt. </b>
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
                <b> Loading Wt. % </b>
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
              <label className="form-label ">
                <b>BOP YES/NO</b>
              </label>
              <select
                className={`form-control ${
                  formData.hasBop ? "field-filled" : ""
                }`}
                name="hasBop"
                value={formData.hasBop}
                onChange={handleBopChange}
              >
                <option value="">Select</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {formData.hasBop === "Yes" && (
        <BopTable
          mode="part"
          bopList={bopList}
          updateBop={updateBop}
          deleteBop={deleteBop}
          addBop={addBop}
        />
      )}
    </>
  );
}

export default PartDetailsForm;
