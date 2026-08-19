import React, { useEffect, useState } from "react";
import {months,generateFinancialYears,} from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";

const CompoundMonthlyRateForm = ({ onClose, onSaved }) => {
  const [compounds, setCompounds] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  const financialYears = generateFinancialYears();

  const currentFY =
    financialYears.find((fy) => fy.selected)?.value ||
    financialYears[0]?.value ||
    "";

  const [formData, setFormData] = useState({
    polymer: "",
    compoundId: "",
    compoundCode: "",
    imCode: "",
    unitId: "",
    financialYear: currentFY,
    month: "",
    qty: "",
    rate: "",
  });

  /* --------------------------------------------------
     Fetch Compounds + Units
     -------------------------------------------------- */
  useEffect(() => {
    fetchCompounds();
    fetchUnits();
  }, []);

  const fetchCompounds = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/compounds`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch compounds");
      }

      const result = await response.json();

      setCompounds(result.data || result);
    } catch (error) {
      console.error("Error fetching compounds:", error);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/units`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch units");
      }

      const result = await response.json();

      setUnits(result.data || result);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  /* --------------------------------------------------
     Polymer List
     -------------------------------------------------- */
  const polymers = [
    ...new Set(
      compounds
        .map((compound) => compound.polymer)
        .filter(Boolean)
    ),
  ];

  /* --------------------------------------------------
     Filter Compounds by Polymer
     -------------------------------------------------- */
  const filteredCompounds = compounds.filter(
    (compound) =>
      compound.polymer === formData.polymer
  );

  /* --------------------------------------------------
     Polymer Change
     -------------------------------------------------- */
  const handlePolymerChange = (e) => {
    const value = e.target.value;

    setFormData((prev) => ({
      ...prev,
      polymer: value,
      compoundId: "",
      compoundCode: "",
      imCode: "",
    }));
  };

  /* --------------------------------------------------
     Compound Change
     -------------------------------------------------- */
  const handleCompoundChange = (e) => {
    const compoundId = e.target.value;

    const selectedCompound =
      filteredCompounds.find(
        (compound) =>
          String(compound.id) ===
          String(compoundId)
      );

    if (!selectedCompound) {
      setFormData((prev) => ({
        ...prev,
        compoundId: "",
        compoundCode: "",
        imCode: "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      compoundId: selectedCompound.id,
      compoundCode:
        selectedCompound.compound_code || "",
      imCode:
        selectedCompound.im_code || "",
    }));
  };

  /* --------------------------------------------------
     Normal Input Change
     -------------------------------------------------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* --------------------------------------------------
     Submit
     -------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    /* Validation */

    if (!formData.polymer) {
      alert("Please select Polymer");
      return;
    }

    if (!formData.compoundId) {
      alert("Please select Compound");
      return;
    }

    if (!formData.unitId) {
      alert("Please select Unit");
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

    if (formData.qty === "") {
      alert("Please enter Qty");
      return;
    }

    if (formData.rate === "") {
      alert("Please enter Rate");
      return;
    }

    try {
      setLoading(true);

      /*
        Frontend uses:
        financialYear

        Backend / MySQL uses:
        financial_year
      */
      const payload = {
        compoundId: formData.compoundId,
        compoundCode: formData.compoundCode,
        polymer: formData.polymer,
        imCode: formData.imCode,
        unitId: formData.unitId,
        financial_year: formData.financialYear,
        month: Number(formData.month),
        qty: Number(formData.qty),
        rate: Number(formData.rate),
      };

      const response = await fetch(
        `${API_BASE_URL}/monthly-compound-rate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to save monthly compound rate"
        );
      }

      alert(
        "Compound monthly rate saved successfully"
      );

      onSaved?.();
      onClose?.();
    } catch (error) {
      console.error("Save error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-4">
      {/* Header */}
      <div className="bop-monthly-header">
        <h5 className="mb-0">
          <b>Add Compound Monthly Rate</b>
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

            {/* Polymer */}
            <div className="col-md-3">
              <label className="form-label">
                <b>Polymer Name</b>
              </label>

              <select
                className={`form-control ${
                  formData.polymer
                    ? "field-filled"
                    : ""
                }`}
                value={formData.polymer}
                onChange={handlePolymerChange}
              >
                <option value="">
                  Select Polymer
                </option>

                {polymers.map((polymer) => (
                  <option
                    key={polymer}
                    value={polymer}
                  >
                    {polymer}
                  </option>
                ))}
              </select>
            </div>

            {/* Compound Code */}
            <div className="col-md-3">
              <label className="form-label">
                <b>Compound Code</b>
              </label>

              <select
                className={`form-control ${
                  formData.compoundId
                    ? "field-filled"
                    : ""
                }`}
                value={formData.compoundId}
                onChange={handleCompoundChange}
                disabled={!formData.polymer}
              >
                <option value="">
                  Select Compound
                </option>

                {filteredCompounds.map(
                  (compound) => (
                    <option
                      key={compound.id}
                      value={compound.id}
                    >
                      {compound.compound_code}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* IM Code */}
            <div className="col-md-3">
              <label className="form-label">
                <b>IM Code</b>
              </label>

              <input
                type="text"
                className={`form-control ${
                  formData.imCode
                    ? "field-filled"
                    : ""
                }`}
                value={formData.imCode}
                readOnly
                placeholder="Auto Filled"
              />
            </div>

            {/* Unit */}
            <div className="col-md-3">
              <label className="form-label">
                <b>Unit</b>
              </label>

              <select
                className={`form-control ${
                  formData.unitId
                    ? "field-filled"
                    : ""
                }`}
                name="unitId"
                value={formData.unitId}
                onChange={handleInputChange}
              >
                <option value="">
                  Select Unit
                </option>

                {units.map((unit) => (
                  <option
                    key={unit.id}
                    value={unit.id}
                  >
                    {unit.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Financial Year */}
            <div className="col-md-3">
              <label className="form-label">
                <b>Financial Year</b>
              </label>

              <select
                className={`form-control ${
                  formData.financialYear
                    ? "field-filled"
                    : ""
                }`}
                name="financialYear"
                value={formData.financialYear}
                onChange={handleInputChange}
              >
                <option value="">
                  Select Financial Year
                </option>

                {financialYears.map((fy) => (
                  <option
                    key={fy.value}
                    value={fy.value}
                  >
                    {fy.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="col-md-3">
              <label className="form-label">
                <b>Month</b>
              </label>

              <select
                className={`form-control ${
                  formData.month
                    ? "field-filled"
                    : ""
                }`}
                name="month"
                value={formData.month}
                onChange={handleInputChange}
              >
                <option value="">
                  Select Month
                </option>

                {months.map((month) => (
                  <option
                    key={month.value}
                    value={month.value}
                  >
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Qty */}
            <div className="col-md-3">
              <label className="form-label">
                <b>Qty</b>
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control ${
                  formData.qty !== ""
                    ? "field-filled"
                    : ""
                }`}
                name="qty"
                value={formData.qty}
                onChange={handleInputChange}
                placeholder="Enter Qty"
              />
            </div>

            {/* Rate */}
            <div className="col-md-3">
              <label className="form-label">
                <b>Rate</b>
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control ${
                  formData.rate !== ""
                    ? "field-filled"
                    : ""
                }`}
                name="rate"
                value={formData.rate}
                onChange={handleInputChange}
                placeholder="Enter Rate"
              />
            </div>
          </div>

          {/* Buttons */}
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

export default CompoundMonthlyRateForm;