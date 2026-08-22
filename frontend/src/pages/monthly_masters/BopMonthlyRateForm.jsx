import React, { useEffect, useState } from "react";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";

const BopMonthlyRateForm = ({ onClose, onSaved }) => {
  const [bops, setBops] = useState([]);
  const [loading, setLoading] = useState(false);
  const financialYears = generateFinancialYears();
  const currentFY =
    financialYears.find((fy) => fy.selected)?.value ||
    financialYears[0]?.value ||
    "";
  const [formData, setFormData] = useState({
    bopId: "",
    partNo: "",
    fgCode: "",
    bopPartName: "",
    bopPartNo: "",
    bopErpCode: "",
    supplierId: "",
    financialYear: currentFY,
    month: "",
    qty: "",
    rate: "",
  });

  useEffect(() => {
    fetchBops();
  }, []);

  const fetchBops = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bops`);
      if (!response.ok) {
        throw new Error("Failed to fetch BOPs");
      }
      const result = await response.json();
      setBops(result.data || result);
    } catch (error) {
      console.error("Error fetching BOPs:", error);
    }
  };

  /* =====================================================
   BOP ERP CODE CHANGE
===================================================== */

  const handleBopErpCodeChange = (e) => {
    const bopErpCode = e.target.value;

    const selectedBop = bops.find(
      (bop) =>
        String(bop.bop_erp_code || "")
          .trim()
          .toLowerCase() ===
        String(bopErpCode || "")
          .trim()
          .toLowerCase(),
    );

    // ===================================================
    // NO VALID BOP FOUND
    // ===================================================

    if (!selectedBop) {
      setFormData((prev) => ({
        ...prev,
        bopId: "",
        partNo: "",
        fgCode: "",
        bopPartName: "",
        bopPartNo: "",
        bopErpCode: bopErpCode,
        supplierId: "",
      }));

      return;
    }

    // ===================================================
    // VALID BOP FOUND
    // ===================================================

    setFormData((prev) => ({
      ...prev,

      bopId: selectedBop.id,

      partNo: selectedBop.part_no || "",

      fgCode: selectedBop.fg_code || "",

      bopPartName: selectedBop.bop_part_name || "",

      bopPartNo: selectedBop.bop_part_no || "",

      bopErpCode: selectedBop.bop_erp_code || "",

      supplierId: "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bopId) {
      alert("Please select BOP");
      return;
    }
    if (!formData.supplierId || Number(formData.supplierId) <= 0) {
      alert("Please select Supplier");
      return;
    }
    if (!formData.financialYear) {
      alert("Please select Financial Year");
      return;
    }
    if (!formData.month) {
      alert("Please select Month");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        ...formData,
        financial_year: formData.financialYear,
      };
      delete payload.financialYear;
      const response = await fetch(`${API_BASE_URL}/monthly-bop-rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save BOP monthly rate");
      }
      alert("BOP monthly rate saved successfully");
      onSaved?.();
      onClose?.();
    } catch (error) {
      console.error("Save error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  const selectedBop = bops.find(
    (bop) => String(bop.id) === String(formData.bopId),
  );
  return (
    <div className="card mt-4">
      <div className="bop-monthly-header">
        <h5 className="mb-0">
          <b>Add BOP Monthly Rate</b>
        </h5>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={onClose}
          title="Close"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* BOP */}
            <div className="col-md-2">
              <label className="form-label">
                <b>BOP ERP Code</b>
              </label>

              <input
                type="text"
                className={`form-control ${
                  formData.bopId ? "field-filled" : ""
                }`}
                list="bop-erp-code-list"
                value={formData.bopErpCode}
                onChange={handleBopErpCodeChange}
                placeholder="Search BOP ERP Code"
                autoComplete="off"
              />

              <datalist id="bop-erp-code-list">
                {bops.map((bop) => (
                  <option key={bop.id} value={bop.bop_erp_code} />
                ))}
              </datalist>
            </div>
            {/* Part No */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Part No</b>
              </label>

              <input
                type="text"
                className={`form-control ${
                  formData.partNo ? "field-filled" : ""
                }`}
                value={formData.partNo}
                readOnly
              />
            </div>
            {/* FG Code */}
            <div className="col-md-2">
              <label className="form-label">
                <b>FG Code</b>
              </label>

              <input
                type="text"
                className={`form-control ${
                  formData.fgCode ? "field-filled" : ""
                }`}
                value={formData.fgCode}
                readOnly
              />
            </div>
            {/* BOP Part Name */}
            <div className="col-md-2">
              <label className="form-label">
                <b>BOP Part Name</b>
              </label>

              <input
                type="text"
                className={`form-control ${
                  formData.bopPartName ? "field-filled" : ""
                }`}
                value={formData.bopPartName}
                readOnly
              />
            </div>
            {/* BOP Part No */}
            <div className="col-md-2">
              <label className="form-label">
                <b>BOP Part No</b>
              </label>

              <input
                type="text"
                className={`form-control ${
                  formData.bopPartNo ? "field-filled" : ""
                }`}
                value={formData.bopPartNo}
                readOnly
              />
            </div>
            {/* Supplier */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Supplier Name</b>
              </label>
              <select
                className={`form-control ${
                  formData.supplierId ? "field-filled" : ""
                }`}
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                disabled={!formData.bopId}
              >
                <option value="">Select Supplier</option>
                {(
                  bops.find((bop) => String(bop.id) === String(formData.bopId))
                    ?.supplier_id || ""
                )
                  .split(",")
                  .map((id, index) => {
                    const selectedBop = bops.find(
                      (bop) => String(bop.id) === String(formData.bopId),
                    );
                    const supplierNames = String(
                      selectedBop?.supplier_name || "",
                    )
                      .split(",")
                      .map((name) => name.trim());
                    return (
                      <option key={id.trim()} value={id.trim()}>
                        {supplierNames[index] || `Supplier ${id.trim()}`}
                      </option>
                    );
                  })}
              </select>
            </div>
            {/* Year */}
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
                <option value="">Select Financial Year</option>

                {financialYears.map((fy) => (
                  <option key={fy.value} value={fy.value}>
                    {fy.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Month */}
            <div className="col-md-2">
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
                <option value="">Select Month</option>

                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Qty */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Qty</b>
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control ${formData.qty ? "field-filled" : ""}`}
                name="qty"
                value={formData.qty}
                onChange={handleInputChange}
                placeholder="Enter Qty"
              />
            </div>
            {/* Rate */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Rate</b>
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control ${
                  formData.rate ? "field-filled" : ""
                }`}
                name="rate"
                value={formData.rate}
                onChange={handleInputChange}
                placeholder="Enter Rate"
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BopMonthlyRateForm;
