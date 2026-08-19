import { useEffect, useState } from "react";
import Select from "react-select";
import BopTable from "./BopTable";

function RMDetailsForm({
  formData,
  transactionId,
  handleInputChange,
  handleCompoundChange,
  handlePolymerChange,
  bopList,
  updateBop,
}) {
  const [compounds, setCompounds] = useState([]);

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
  useEffect(() => {
    const fetchCompounds = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/compounds");

        if (!response.ok) {
          throw new Error("Failed to fetch compounds");
        }

        const data = await response.json();
        setCompounds(data);
      } catch (error) {
        console.error("Error fetching compounds:", error);
      }
    };

    fetchCompounds();
  }, []);
  const polymers = [...new Set(compounds.map((compound) => compound.polymer))];
  const filteredCompounds = compounds.filter(
    (compound) => compound.polymer === formData.polymerName,
  );
  const compoundOptions = filteredCompounds.map((compound) => ({
    value: compound.compound_code,
    label: compound.compound_code,
    data: compound,
  }));
  const selectedCompound =
    compoundOptions.find((option) => option.value === formData.compoundCode) ||
    null;
  const totalBopCost = bopList.reduce(
    (total, bop) => total + (Number(bop.bopCost) || 0),
    0,
  );
  const finalRmCost = (Number(formData.totalRmCost) || 0) + totalBopCost;

  const fetchCompoundRate = async () => {
    const {
      compoundCode,
      polymerName,
      imCode,
      productionUnit,
      financialYear,
      compMonth,
    } = formData;

    console.log("COMPOUND RATE LOOKUP:", {
      compoundCode,
      polymerName,
      imCode,
      productionUnit,
      financialYear,
      compMonth,
    });

    if (
      !compoundCode ||
      !polymerName ||
      !imCode ||
      !productionUnit ||
      !financialYear ||
      !compMonth
    ) {
      console.log("Missing compound lookup value");
      return;
    }

    try {
      const params = new URLSearchParams({
        compoundCode: String(compoundCode),
        polymerName: String(polymerName),
        imCode: String(imCode),
        unitId: String(productionUnit),
        financial_year: String(financialYear),
        month: String(compMonth),
      });

      const url = `http://localhost:5000/api/compound-rate-for-costing?${params.toString()}`;

      console.log("COMPOUND RATE URL:", url);

      const response = await fetch(url);

      const result = await response.json();

      console.log("COMPOUND RATE RESPONSE:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch compound rate");
      }

      if (!result.found) {
        console.log("No matching compound monthly rate found");

        handleInputChange({
          target: {
            name: "compoundRate",
            value: "",
          },
        });

        return;
      }

      handleInputChange({
        target: {
          name: "compoundRate",
          value: result.rate,
        },
      });
    } catch (error) {
      console.error("COMPOUND RATE ERROR:", error);

      handleInputChange({
        target: {
          name: "compoundRate",
          value: "",
        },
      });
    }
  };

  useEffect(() => {
    fetchCompoundRate();
  }, [
    formData.compoundCode,
    formData.polymerName,
    formData.imCode,
    formData.productionUnit,
    formData.financialYear,
    formData.compMonth,
  ]);

  return (
    <>
      {/* Raw Material Details */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <b style={{ fontSize: "14px" }}>Raw Material Details</b>
          </h5>

          <span className="transaction-id-header">
            Transaction ID: <b>{transactionId || "Not Saved"}</b>
          </span>
        </div>

        <div className="card-body">
          {/* Row 1 */}
          <div className="row g-3 mt-1">
            {/* Polymer */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Polymer Name</b>
              </label>

              <input
                type="text"
                className={`form-control ${
                  formData.polymerName ? "field-filled" : ""
                }`}
                value={formData.polymerName || ""}
                readOnly
                placeholder="Auto"
              />
            </div>
            {/* Compound */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Compound Code</b>
              </label>

              <input
                type="text"
                className={`form-control ${
                  formData.compoundCode ? "field-filled" : ""
                }`}
                value={formData.compoundCode || ""}
                readOnly
                placeholder="Auto"
              />
            </div>
            {/* IM Code */}
            <div className="col-md-2">
              <label className="form-label">
                <b>IM Code</b>
              </label>

              <input
                type="text"
                className={`form-control ${
                  formData.imCode ? "field-filled" : ""
                }`}
                value={formData.imCode || ""}
                readOnly
                placeholder="Auto"
              />
            </div>
            {/* Month */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Month</b>
              </label>

              <select
                className={`form-control ${
                  formData.compMonth ? "field-filled" : ""
                }`}
                name="compMonth"
                value={formData.compMonth || ""}
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
            {/* Compound Rate */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Compound Rate</b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.compoundRate ? "field-filled" : ""
                }`}
                name="compoundRate"
                value={formData.compoundRate || ""}
                readOnly
                placeholder="Auto"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="row g-2 mt-1">
            {/* Loading Weight */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Loading Wt (Grm)</b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.grossWeight ? "field-filled" : ""
                }`}
                value={formData.grossWeight || ""}
                readOnly
              />
            </div>
            {/* Net Weight */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Net Wt (Grm)</b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.netWeight ? "field-filled" : ""
                }`}
                value={formData.netWeight || ""}
                readOnly
              />
            </div>
            {/* Loading % */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Loading %</b>
              </label>
              <input
                type="text"
                className={`form-control ${
                  formData.loadingper ? "field-filled" : ""
                }`}
                value={formData.loadingper || ""}
                readOnly
              />
            </div>
            {/* Total RM Cost */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Total RM Cost</b>
              </label>
              <input
                type="text"
                className="form-control cost-highlight"
                value={formData.totalRmCost || ""}
                readOnly
              />
            </div>
            {/* Total BOP Cost */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Total BOP Cost</b>
              </label>
              <input
                type="text"
                className="form-control cost-highlight"
                value={totalBopCost.toFixed(2)}
                readOnly
              />
            </div>
            {/* Final RM Cost */}
            <div className="col-md-2">
              <label className="form-label">
                <b>Final RM Cost</b>
              </label>
              <input
                type="text"
                className="form-control conversion-highlight"
                value={finalRmCost.toFixed(2)}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
      {/* BOP Table */}
      {formData.hasBop === "Yes" && (
        <BopTable mode="rm" bopList={bopList} updateBop={updateBop} />
      )}
    </>
  );
}

export default RMDetailsForm;
