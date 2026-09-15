import { useEffect, useState } from "react";
import Select from "react-select";
import BopTable from "./BopTable";
import { months } from "../../utils/costingUtils";
import API_BASE_URL from "../../config/api";

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
  const [bopRowsWithRates, setBopRowsWithRates] = useState([]);
  const [bopRateLoading, setBopRateLoading] = useState(false);

  useEffect(() => {
    const fetchCompounds = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/compounds`);

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
  const filteredCompounds = compounds.filter(
    (compound) => compound.polymer === formData.polymerName,
  );
  const compoundOptions = filteredCompounds.map((compound) => ({
    value: compound.compound_code,
    label: compound.compound_code,
    data: compound,
  }));
  // BOP rows are now fetched by CostingWizard when the Part No. changes.
  // Here we only attach the applicable monthly BOP rate and calculate cost.
  // The BOP master/configuration itself is not edited from this form.
  useEffect(() => {
    let cancelled = false;

    const loadBopRates = async () => {
      if (!Array.isArray(bopList) || bopList.length === 0) {
        setBopRowsWithRates([]);
        return;
      }

      const financialYear = formData.financialYear;

      // Keep the fetched rows visible even when the monthly inputs are not
      // ready yet. Rate/cost will remain blank/zero until they are available.
      if (!financialYear) {
        setBopRowsWithRates(
          bopList.map((bop) => ({
            ...bop,
            bopmonth: bop.bopmonth || "",
            bopRate: "",
            bopCost: "0.00",
          })),
        );
        return;
      }

      setBopRateLoading(true);

      try {
        const rows = await Promise.all(
          bopList.map(async (bop) => {
            const bopId = bop.bopId ?? bop.bop_id ?? "";
            const bopErpCode =
              bop.bopFgCode ?? bop.bop_erp_code ?? bop.bopErpCode ?? "";
            const supplierId = bop.supplierId ?? bop.supplier_id;
            const month = bop.bopmonth || "";
            const qty =
              Number(
                bop.bopAssemblyQty ?? bop.assembly_qty ?? bop.assemblyQty,
              ) || 0;

            if (!bopErpCode || !supplierId || !month) {
              return {
                ...bop,
                bopmonth: month || "",
                bopRate: "",
                bopCost: "0.00",
              };
            }

            try {
              const params = new URLSearchParams({
                bopErpCode: String(bopErpCode).trim(),
                supplierId: String(supplierId),
                financial_year: String(financialYear),
                month: String(month),
              });

              const response = await fetch(
                `${API_BASE_URL}/bop-rate-for-costing?${params.toString()}`,
              );
              const result = await response.json();

              if (!response.ok || !result.success || !result.found) {
                return {
                  ...bop,
                  bopmonth: month,
                  bopRate: "",
                  bopCost: "0.00",
                };
              }

              const rate = Number(result.rate) || 0;

              return {
                ...bop,
                bopmonth: month,
                bopRate: rate,
                bopCost: (qty * rate).toFixed(2),
              };
            } catch (error) {
              console.error("BOP RATE ERROR:", error);
              return {
                ...bop,
                bopmonth: month,
                bopRate: "",
                bopCost: "0.00",
              };
            }
          }),
        );

        if (!cancelled) {
          setBopRowsWithRates(rows);
        }
      } finally {
        if (!cancelled) {
          setBopRateLoading(false);
        }
      }
    };

    loadBopRates();

    return () => {
      cancelled = true;
    };
  }, [bopList, formData.financialYear, formData.compMonth]);

  const totalBopCost = bopRowsWithRates.reduce(
    (total, bop) => total + (Number(bop.bopCost) || 0),
    0,
  );
  const finalRmCost = (Number(formData.totalRmCost) || 0) + totalBopCost;

  const handleRmBopUpdate = async (id, field, value) => {
    if (typeof updateBop === "function") {
      await updateBop(id, field, value);
    }

    if (field !== "bopmonth") return;

    const currentRow = bopRowsWithRates.find((bop) => bop.id === id);
    if (!currentRow) return;

    const bopErpCode =
      currentRow.bopFgCode ??
      currentRow.bop_erp_code ??
      currentRow.bopErpCode ??
      "";
    const supplierId = currentRow.supplierId ?? currentRow.supplier_id ?? "";
    const qty =
      Number(
        currentRow.bopAssemblyQty ??
          currentRow.assembly_qty ??
          currentRow.assemblyQty,
      ) || 0;

    let newRate = "";
    let newCost = "0.00";

    if (bopErpCode && supplierId && formData.financialYear && value) {
      try {
        const params = new URLSearchParams({
          bopErpCode: String(bopErpCode).trim(),
          supplierId: String(supplierId),
          financial_year: String(formData.financialYear),
          month: String(value),
        });

        const response = await fetch(
          `${API_BASE_URL}/bop-rate-for-costing?${params.toString()}`,
        );
        const result = await response.json();

        if (response.ok && result.success && result.found) {
          newRate = Number(result.rate) || 0;
          newCost = (qty * newRate).toFixed(2);
        }
      } catch (error) {
        console.error("RM BOP RATE ERROR:", error);
      }
    }

    setBopRowsWithRates((prev) =>
      prev.map((bop) =>
        bop.id === id
          ? {
              ...bop,
              bopmonth: value,
              bopRate: newRate,
              bopCost: newCost,
            }
          : bop,
      ),
    );
  };

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

      const url = `${API_BASE_URL}/compound-rate-for-costing?${params.toString()}`;

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
        <BopTable
          mode="rm"
          bopList={bopRowsWithRates}
          updateBop={handleRmBopUpdate}
        />
      )}

      {formData.hasBop === "Yes" && bopRateLoading && (
        <div style={{ marginTop: "6px", fontSize: "12px" }}>
          Loading monthly BOP rates...
        </div>
      )}
    </>
  );
}

export default RMDetailsForm;
