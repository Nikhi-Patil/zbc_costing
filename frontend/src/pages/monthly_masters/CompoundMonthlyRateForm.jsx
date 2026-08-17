import React, { useEffect, useState } from "react";

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const CompoundMonthlyRateForm = ({ onClose, onSaved }) => {
  const [compounds, setCompounds] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    polymer: "",
    compoundId: "",
    compoundCode: "",
    imCode: "",
    year: new Date().getFullYear(),
    month: "",
    qty: "",
    rate: "",
  });

  useEffect(() => {
    fetchCompounds();
  }, []);

  const fetchCompounds = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/compounds");

      if (!response.ok) {
        throw new Error("Failed to fetch compounds");
      }

      const result = await response.json();

      setCompounds(result.data || result);
    } catch (error) {
      console.error("Error fetching compounds:", error);
    }
  };

  // Unique polymer names
  const polymers = [
    ...new Set(compounds.map((compound) => compound.polymer).filter(Boolean)),
  ];

  // Compounds belonging to selected polymer
  const filteredCompounds = compounds.filter(
    (compound) => compound.polymer === formData.polymer,
  );

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

  const handleCompoundChange = (e) => {
    const compoundId = e.target.value;

    const selectedCompound = filteredCompounds.find(
      (compound) => String(compound.id) === String(compoundId),
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
      compoundCode: selectedCompound.compound_code || "",
      imCode: selectedCompound.im_code || "",
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

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/monthly-compound-rate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to save monthly compound rate",
        );
      }

      alert("Compound monthly rate saved successfully");

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
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <b>Add Compound Monthly Rate</b>
        </h5>

        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={onClose}
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
                  formData.polymer ? "field-filled" : ""
                }`}
                value={formData.polymer}
                onChange={handlePolymerChange}
              >
                <option value="">Select Polymer</option>

                {polymers.map((polymer) => (
                  <option key={polymer} value={polymer}>
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
                  formData.compoundId ? "field-filled" : ""
                }`}
                value={formData.compoundId}
                onChange={handleCompoundChange}
                disabled={!formData.polymer}
              >
                <option value="">Select Compound</option>

                {filteredCompounds.map((compound) => (
                  <option key={compound.id} value={compound.id}>
                    {compound.compound_code}
                  </option>
                ))}
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
                  formData.imCode ? "field-filled" : ""
                }`}
                value={formData.imCode}
                readOnly
                placeholder="Auto Filled"
              />
            </div>

            {/* Year */}
            <div className="col-md-3">
              <label className="form-label">
                <b>Year</b>
              </label>

              <select
                className={`form-control ${
                  formData.year ? "field-filled" : ""
                }`}
                name="year"
                value={formData.year}
                onChange={handleInputChange}
              >
                <option value="">Select Year</option>

                {Array.from(
                  { length: 5 },
                  (_, index) => new Date().getFullYear() - 2 + index,
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
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
            <div className="col-md-3">
              <label className="form-label">
                <b>Qty</b>
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control ${
                  formData.qty !== "" ? "field-filled" : ""
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
                  formData.rate !== "" ? "field-filled" : ""
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
