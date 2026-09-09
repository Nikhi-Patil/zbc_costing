import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../assets/css/SalesMonthly.css";
import { months, generateFinancialYears } from "../../utils/costingUtils";
import TomSelect from "tom-select";
import "tom-select/dist/css/tom-select.css";
import API_BASE_URL from "../../config/api";

const financialYearOptions = generateFinancialYears(2026);

const defaultFinancialYear =
  financialYearOptions.find((item) => item.selected)?.value ||
  financialYearOptions[0]?.value ||
  "";

const extractArray = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (!response || typeof response !== "object") {
    return [];
  }
  const keys = [
    "data",
    "parts",
    "units",
    "entries",
    "records",
    "items",
    "salesMonthly",
  ];
  for (const key of keys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }
  return [];
};

const getPartNo = (part) => {
  return part?.part_no ?? "";
};

const getPartName = (part) => {
  return part?.part_name ?? "";
};

const getUnitName = (unit) => {
  if (typeof unit === "string") {
    return unit;
  }

  return unit?.unit ?? "";
};

const createEmptyForm = (financialYear) => ({
  partNo: "",
  partName: "",
  unit: "",
  month: "",
  financialYear,
  qty: "",
  sellRate: "",
});

const SalesMonthlyEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const [parts, setParts] = useState([]);
  const [units, setUnits] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(
    createEmptyForm(defaultFinancialYear),
  );

  const [errors, setErrors] = useState({});
  const [editingEntry, setEditingEntry] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const partSelectRef = useRef(null);
  const partTomSelectRef = useRef(null);

  /* TOAST */
  const showToast = (message, type = "success") => {
    setToast({
      show: true,
      message,
      type,
    });

    window.setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 3000);
  };

  /* FIND PART */
  const findPart = (partNo) => {
    return parts.find(
      (part) =>
        String(getPartNo(part)).trim().toLowerCase() ===
        String(partNo).trim().toLowerCase(),
    );
  };

  /* LOAD PART MASTER */
  const fetchParts = async () => {
    setPartsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/parts`);

      if (!response.ok) {
        throw new Error(
          `Unable to load Part Master. Status: ${response.status}`,
        );
      }

      const result = await response.json();

      const data = extractArray(result)
        .map((part) => ({
          ...part,
          partNo: String(getPartNo(part)).trim(),
          partName: getPartName(part),
        }))
        .filter((part) => part.partNo);

      setParts(data);
    } catch (error) {
      console.error("Part Master error:", error);

      setParts([]);

      showToast("Unable to load Part Master.", "error");
    } finally {
      setPartsLoading(false);
    }
  };

  /* LOAD UNIT MASTER */
  const fetchUnits = async () => {
    setUnitsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/units`);

      if (!response.ok) {
        throw new Error(
          `Unable to load Unit Master. Status: ${response.status}`,
        );
      }

      const result = await response.json();

      const data = extractArray(result).filter((unit) => getUnitName(unit));

      setUnits(data);
    } catch (error) {
      console.error("Unit Master error:", error);

      setUnits([]);

      showToast("Unable to load Unit Master.", "error");
    } finally {
      setUnitsLoading(false);
    }
  };

  /* LOAD EXISTING ENTRY */
  const fetchExistingEntry = async () => {
    if (!editId) {
      return;
    }

    setLoadingEntry(true);

    try {
      const response = await fetch(`${API_BASE_URL}/sales-monthly/${editId}`);

      if (!response.ok) {
        throw new Error(`Unable to load entry. Status: ${response.status}`);
      }

      const result = await response.json();

      const entry = result?.data ?? result?.entry ?? result;

      const entryPartNo = entry?.partNo ?? entry?.part_no ?? "";

      const part = findPart(entryPartNo);

      setEditingEntry({
        ...entry,
        id: entry?.id ?? entry?._id ?? null,
      });

      setFormData({
        partNo: entryPartNo,
        partName:
          entry?.partName ?? entry?.part_name ?? getPartName(part) ?? "",
        unit: entry?.unit ?? "",
        month:
          entry?.month !== null && entry?.month !== undefined
            ? String(entry.month)
            : "",
        financialYear:
          entry?.financialYear ?? entry?.financial_year ?? defaultFinancialYear,
        qty:
          entry?.qty !== null && entry?.qty !== undefined
            ? String(entry.qty)
            : "",
        sellRate:
          entry?.sell_rate !== null && entry?.sell_rate !== undefined
            ? String(entry.sell_rate)
            : "",
      });
    } catch (error) {
      console.error("Existing entry error:", error);

      showToast(error.message || "Unable to load existing entry.", "error");
    } finally {
      setLoadingEntry(false);
    }
  };

  /* INITIAL LOAD */
  useEffect(() => {
    fetchParts();
    fetchUnits();
  }, []);

  /* LOAD EDIT ENTRY AFTER PARTS LOAD */
  useEffect(() => {
    if (editId && parts.length > 0 && !editingEntry) {
      fetchExistingEntry();
    }
  }, [editId, parts, editingEntry]);

  /* TOM SELECT */
  useEffect(() => {
    if (!partSelectRef.current || partsLoading) {
      return;
    }

    const select = partSelectRef.current;

    if (partTomSelectRef.current) {
      partTomSelectRef.current.destroy();
      partTomSelectRef.current = null;
    }

    select.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "Select Part No.";

    select.appendChild(defaultOption);

    parts.forEach((part) => {
      const partNo = String(getPartNo(part)).trim();

      if (!partNo) return;

      const option = document.createElement("option");

      option.value = partNo;
      option.textContent = partNo;

      select.appendChild(option);
    });

    partTomSelectRef.current = new TomSelect(select, {
      placeholder: "Search or select Part No.",

      allowEmptyOption: true,

      create: false,

      maxOptions: 1000,

      searchField: ["text"],

      sortField: {
        field: "text",
        direction: "asc",
      },

      closeAfterSelect: true,

      onChange: (value) => {
        if (!value) {
          setFormData((previous) => ({
            ...previous,
            partNo: "",
            partName: "",
          }));

          return;
        }

        const selectedPart = parts.find(
          (part) =>
            String(getPartNo(part)).trim().toLowerCase() ===
            String(value).trim().toLowerCase(),
        );

        if (!selectedPart) {
          return;
        }

        setFormData((previous) => ({
          ...previous,
          partNo: getPartNo(selectedPart),
          partName: getPartName(selectedPart),
        }));

        setErrors((previous) => ({
          ...previous,
          partNo: "",
        }));
      },
    });

    return () => {
      if (partTomSelectRef.current) {
        partTomSelectRef.current.destroy();
        partTomSelectRef.current = null;
      }
    };
  }, [parts, partsLoading]);

  /* SET TOM SELECT VALUE IN EDIT MODE */
  useEffect(() => {
    if (!partTomSelectRef.current || !formData.partNo) {
      return;
    }

    const part = findPart(formData.partNo);

    if (!part) return;

    partTomSelectRef.current.setValue(String(getPartNo(part)).trim(), true);
  }, [formData.partNo, parts]);

  /* FORM CHANGE */
  const handleFormChange = (field, value) => {
    if (field === "qty" || field === "sellRate") {
      if (value !== "" && !/^\d*(\.\d{0,2})?$/.test(value)) {
        return;
      }
    }

    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
      general: "",
    }));
  };

  /* VALIDATION */
  const validateForm = () => {
    const newErrors = {};
    if (!formData.partNo) {
      newErrors.partNo = "Please select a valid Part No.";
    }
    if (!formData.unit) {
      newErrors.unit = "Unit is required.";
    }
    if (!formData.month) {
      newErrors.month = "Month is required.";
    }
    if (!formData.financialYear) {
      newErrors.financialYear = "Financial Year is required.";
    }
    if (formData.qty === "" && formData.sellRate === "") {
      newErrors.general = "Enter Qty or Sell Rate.";
    }
    if (formData.qty !== "" && Number(formData.qty) < 0) {
      newErrors.qty = "Qty cannot be negative.";
    }
    if (formData.sellRate !== "" && Number(formData.sellRate) < 0) {
      newErrors.sellRate = "Sell Rate cannot be negative.";
    }
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* SAVE */
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const part = findPart(formData.partNo);

    if (!part) {
      setErrors({
        partNo: "Selected Part No. does not exist in Part Master.",
      });

      return;
    }

    setSaving(true);

    try {
      const existingId = editingEntry?.id ?? editingEntry?._id ?? null;

      const isEditing = Boolean(existingId);

      const payload = {
        partNo: formData.partNo,

        partName: getPartName(part) || formData.partName || "",

        /*
         * Unit is intentionally taken
         * from Unit Master selection.
         */
        unit: formData.unit,

        financialYear: formData.financialYear,

        month: Number(formData.month),

        qty: formData.qty === "" ? null : Number(formData.qty),

        sellRate: formData.sellRate === "" ? null : Number(formData.sellRate),
      };

      const url = isEditing
        ? `${API_BASE_URL}/sales-monthly/${existingId}`
        : `${API_BASE_URL}/sales-monthly`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Unable to save Sales Monthly entry.",
        );
      }

      showToast(
        isEditing
          ? "Sales Monthly entry updated successfully."
          : "Sales Monthly entry saved successfully.",
        "success",
      );

      window.setTimeout(() => {
        navigate("/sales-monthly");
      }, 700);
    } catch (error) {
      console.error("Save error:", error);

      showToast(
        error.message || "Unable to save Sales Monthly entry.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  /* CANCEL */
  const handleCancel = () => {
    navigate("/sales-monthly");
  };

  /* RENDER */
  return (
    <div className="sales-monthly-page">
      {/* TOAST */}
      {toast.show && (
        <div className={`sales-toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() =>
              setToast({
                show: false,
                message: "",
                type: "success",
              })
            }
          >
            ×
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="sales-monthly-header">
        <div className="sales-monthly-title">
          <h2>
            {editingEntry
              ? "Edit Monthly Sales Entry"
              : "Add Monthly Sales Entry"}
          </h2>
          <p>Enter monthly Qty and Sell Rate for a Part Master item.</p>
        </div>
        {editingEntry && (
          <div className="editing-badge">Editing Existing Entry</div>
        )}
      </div>

      {/* FORM CARD */}
      <div className="sales-entry-card">
        {loadingEntry ? (
          <div className="entry-loading">
            <div className="loading-spinner" />
            <h4>Loading entry...</h4>
          </div>
        ) : (
          <>
            <div className="sales-entry-form">
              {/* PART NO */}
              <div className="entry-form-group">
                <label>
                  Part No.
                  <span>*</span>
                </label>
                <select ref={partSelectRef} disabled={partsLoading || saving} />
                {partsLoading && (
                  <small className="field-loading">
                    Loading Part Master...
                  </small>
                )}
                {!partsLoading && parts.length === 0 && (
                  <small className="field-error">
                    No Part Master records found.
                  </small>
                )}
                {errors.partNo && (
                  <div className="field-error">{errors.partNo}</div>
                )}
              </div>

              {/* PART NAME */}
              <div className="entry-form-group">
                <label>Part Name</label>
                <input
                  type="text"
                  value={formData.partName}
                  readOnly
                  placeholder="Part Name"
                />
              </div>

              {/* UNIT */}
              <div className="entry-form-group">
                <label>
                  Unit
                  <span>*</span>
                </label>
                <select
                  value={formData.unit}
                  disabled={unitsLoading || saving}
                  onChange={(e) => handleFormChange("unit", e.target.value)}
                  className={errors.unit ? "input-error" : ""}
                >
                  <option value="">
                    {unitsLoading ? "Loading Units..." : "Select Unit"}
                  </option>
                  {units.map((unit) => {
                    const unitName = getUnitName(unit);
                    if (!unitName) {
                      return null;
                    }
                    const unitId = unit?.id ?? unit?._id ?? unitName;
                    return (
                      <option key={unitId} value={unitName}>
                        {unitName}
                      </option>
                    );
                  })}
                </select>
                {errors.unit && (
                  <div className="field-error">{errors.unit}</div>
                )}
              </div>

              {/* MONTH */}
              <div className="entry-form-group">
                <label>
                  Month
                  <span>*</span>
                </label>
                <select
                  value={formData.month}
                  disabled={saving}
                  onChange={(e) => handleFormChange("month", e.target.value)}
                  className={errors.month ? "input-error" : ""}
                >
                  <option value="">Select Month</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <div className="field-error">{errors.month}</div>
                )}
              </div>

              {/* FINANCIAL YEAR */}
              <div className="entry-form-group">
                <label>
                  Financial Year
                  <span>*</span>
                </label>
                <select
                  value={formData.financialYear}
                  disabled={saving}
                  onChange={(e) =>
                    handleFormChange("financialYear", e.target.value)
                  }
                  className={errors.financialYear ? "input-error" : ""}
                >
                  {financialYearOptions.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
                {errors.financialYear && (
                  <div className="field-error">{errors.financialYear}</div>
                )}
              </div>

              {/* QTY */}
              <div className="entry-form-group">
                <label>Qty</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.qty}
                  disabled={saving}
                  placeholder="Enter Qty"
                  onChange={(e) => handleFormChange("qty", e.target.value)}
                  className={errors.qty ? "input-error" : ""}
                />

                {errors.qty && <div className="field-error">{errors.qty}</div>}
              </div>

              {/* SELL RATE */}
              <div className="entry-form-group">
                <label>Sell Rate</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.sellRate}
                  disabled={saving}
                  placeholder="Enter Sell Rate"
                  onChange={(e) => handleFormChange("sellRate", e.target.value)}
                  className={errors.sellRate ? "input-error" : ""}
                />
                {errors.sellRate && (
                  <div className="field-error">{errors.sellRate}</div>
                )}
              </div>
            </div>

            {/* GENERAL ERROR */}
            {errors.general && (
              <div className="general-error">{errors.general}</div>
            )}

            {/* FOOTER */}
            <div className="sales-entry-footer">
              <div className="form-help">
                * Required fields. Enter at least Qty or Sell Rate.
              </div>
              <div className="entry-form-actions">
                <button
                  type="button"
                  className="btn-form-cancel"
                  disabled={saving}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-form-save"
                  disabled={saving || partsLoading}
                  onClick={handleSave}
                >
                  {saving
                    ? "Saving..."
                    : editingEntry
                      ? "Update Entry"
                      : "Save Entry"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesMonthlyEntry;
