import { useState, useEffect } from "react";
import API_BASE_URL from "../../config/api";

function ProcessDetailsForm({
  formData,
  transactionId,
  readOnly = false,
  handleInputChange,
  handleMachineChange,
  handleTonnageChange,
  totalAssemblyQty,
}) {
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/machines`);

        if (!response.ok) {
          throw new Error("Failed to fetch molding machines");
        }
        const data = await response.json();
        setMachines(data);
      } catch (error) {
        console.error("Error fetching molding machines:", error);
      }
    };

    fetchMachines();
  }, []);

  const processTypes = [
    ...new Set(
      machines.map((machine) => machine.molding_process).filter(Boolean),
    ),
  ];

  const filteredMachines = machines.filter(
    (machine) => machine.molding_process === formData.processType,
  );

  const isMtrb =
    String(formData.subCategoryName || "")
      .trim()
      .toUpperCase() === "MTRB";

  const processRows = [
    {
      label: "Post Curing",
      field: "postCuring",
      rate: "postCuringRate",
      measure: "netWeight",
    },
    ...(isMtrb
      ? [
          {
            label: "Shot Blasting",
            field: "shotBlasting",
            rate: "shotBlastingRate",
            measure: "bopWeight",
          },
          {
            label: "Vapour Degreasing",
            field: "vapourDegreasing",
            rate: "vapourDegreasingRate",
            measure: "bopWeight",
          },
          {
            label: "Chromating",
            field: "chromating",
            rate: "chromatingRate",
            measure: "bopWeight",
          },
          {
            label: "Phospating",
            field: "phospating",
            rate: "phospatingRate",
            measure: "bopWeight",
          },
          {
            label: "Adhesive",
            field: "adhesive",
            rate: "adhesiveRate",
            measure: "bopArea",
          },
          {
            label: "Painting",
            field: "painting",
            rate: "paintingRate",
            measure: "paintArea",
          },
          {
            label: "Plating",
            field: "plating",
            rate: "platingRate",
            measure: "finishedPartWeight",
          },
          {
            label: "Cylindrical Grinding",
            field: "cylindricalGrinding",
            rate: "cylindricalGrindingRate",
            measure: "metalPartArea",
          },
        ]
      : []),
  ];

  const getRequiredValue = (fieldName) => {
    const savedCost = formData[fieldName];
    const inferred =
      savedCost !== "" &&
      savedCost !== null &&
      savedCost !== undefined &&
      Number.isFinite(Number(savedCost)) &&
      Number(savedCost) !== 0
        ? "Yes"
        : "No";
    return formData[`${fieldName}Required`] ?? inferred;
  };

  const handleOptionalProcessChange = (fieldName, value) => {
    handleInputChange({
      target: { name: `${fieldName}Required`, value },
    });

    // Clear the calculated cost when a process is switched off.
    if (value === "No") {
      handleInputChange({ target: { name: fieldName, value: "0" } });
    }
  };

  const selectedBopWeightProcess = [
    "shotBlasting",
    "vapourDegreasing",
    "chromating",
    "phospating",
  ].find((field) => getRequiredValue(field) === "Yes");

  const renderMeasurement = (name, label, unit = "") => (
    <div
      className="process-table-input"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        minWidth: 0,
      }}
    >
      <label
        htmlFor={`process-measure-${name}`}
        className="small text-muted mb-0"
        style={{ flex: "0 0 42%", whiteSpace: "normal" }}
      >
        {label}:
      </label>

      <div
        className="input-group input-group-sm"
        style={{ flex: "1 1 0", minWidth: 0 }}
      >
        <input
          id={`process-measure-${name}`}
          type="number"
          min="0"
          step="0.01"
          className="form-control"
          name={name}
          value={formData[name] ?? ""}
          onChange={handleInputChange}
          readOnly={readOnly}
          placeholder="Enter value"
        />
        {unit && <span className="input-group-text">{unit}</span>}
      </div>
    </div>
  );

  const renderProcessMeasurement = (row) => {
    if (getRequiredValue(row.field) !== "Yes") {
      return (
        <div
          style={{
            textAlign: "center",
            width: "100%",
          }}
        >
          <span className="text-muted">—</span>
        </div>
      );
    }
    if (row.measure === "netWeight") {
      return (
        <div
          className="process-table-input"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            minWidth: 0,
          }}
        >
          <label
            className="small text-muted mb-0"
            style={{
              flex: "0 0 42%",
              whiteSpace: "normal",
            }}
          >
            Net Weight (gm) :
          </label>

          <div
            className="input-group input-group-sm"
            style={{ flex: "1 1 0", minWidth: 0 }}
          >
            <input
              type="text"
              className="form-control process-cost-readonly"
              value={formData.netWeight ?? ""}
              readOnly
              aria-label="Net Weight"
            />

            <span className="input-group-text">gm</span>
          </div>
        </div>
      );
    }

    if (row.measure === "bopWeight") {
      const isEditable = row.field === selectedBopWeightProcess;

      return (
        <div
          className="process-table-input"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            minWidth: 0,
          }}
        >
          <label
            className="small text-muted mb-0"
            style={{
              flex: "0 0 42%",
              whiteSpace: "normal",
            }}
          >
            BOP Weight (Kg) :
          </label>

          <div
            className="input-group input-group-sm"
            style={{ flex: "1 1 0", minWidth: 0 }}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              className="form-control"
              style={{ minWidth: 0 }}
              name="bopWeight"
              value={formData.bopWeight ?? ""}
              onChange={isEditable ? handleInputChange : undefined}
              readOnly={!isEditable || readOnly}
              placeholder="Enter value"
            />

            <span className="input-group-text">Kg</span>
          </div>
        </div>
      );
    }

    if (row.measure === "bopArea")
      return renderMeasurement("bopArea", "BOP Area (sq. cm)", "sq. cm");
    if (row.measure === "paintArea") {
      return (
        <div
          className="process-table-input-group"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            width: "100%",
          }}
        >
          {renderMeasurement("paintArea", "Area of Paint (sq. cm)", "sq. cm")}
          {renderMeasurement("paintPerLit", "Paint Rate Per Ltr", "Ltr")}
        </div>
      );
    }
    if (row.measure === "finishedPartWeight")
      return renderMeasurement(
        "finishedPartWeight",
        "Finished Part Weight (gm)",
        "gm",
      );
    if (row.measure === "metalPartArea")
      return renderMeasurement(
        "metalPartArea",
        "Area of Metal Part (sq. cm)",
        "sq. cm",
      );
    return <span className="text-muted">—</span>;
  };

  return (
    <fieldset
      disabled={readOnly}
      style={{
        border: "none",
        padding: 0,
        margin: 0,
        minWidth: 0,
      }}
    >
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h5 className="mb-0">
            <b style={{ fontSize: "14px" }}>Process Details </b>
          </h5>
          <span className="transaction-id-header">
            Transaction ID: <b>{transactionId || "Not Saved"}</b>
          </span>
        </div>

        <div className="card-body">
          {/* Row 1 */}
          <div className="row g-2 mt-1 process-row ">
            <div className="col-md-2">
              <label className="form-label">
                <b>Process Type</b>
              </label>

              <select
                className={`form-control ${
                  formData.processType ? "field-filled" : ""
                }`}
                name="processType"
                value={formData.processType}
                onChange={(e) => handleMachineChange(e.target.value)}
              >
                <option value="">Select</option>

                {processTypes.map((process) => (
                  <option key={process} value={process}>
                    {process}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">
                <b>Machine Tonnage</b>
              </label>

              <select
                className={`form-control ${
                  formData.machineTonnage ? "field-filled" : ""
                }`}
                name="machineTonnage"
                value={formData.machineTonnage}
                onChange={(e) => {
                  const selectedMachine = filteredMachines.find(
                    (machine) => machine.machine_list === e.target.value,
                  );

                  if (selectedMachine) {
                    handleTonnageChange(selectedMachine);
                  }
                }}
                disabled={!formData.processType}
              >
                <option value="">Select</option>

                {filteredMachines.map((machine) => (
                  <option key={machine.id} value={machine.machine_list}>
                    {machine.machine_list}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">
                <b> Shift Rate </b>
              </label>
              <input
                type="text"
                className={`form-control ${
                  formData.shiftRate ? "field-filled" : ""
                }`}
                name="shiftRate"
                value={formData.shiftRate}
                readOnly
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">
                <b> Total Cavity </b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.totalCavity ? "field-filled" : ""
                }`}
                name="totalCavity"
                value={formData.totalCavity}
                onChange={handleInputChange}
                placeholder="Total Cavity"
              />
            </div>

            <div className="col-md-2">
              <label className="form-label ">
                <b>Running Cavity </b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.runningCavity ? "field-filled" : ""
                }`}
                name="runningCavity"
                value={formData.runningCavity}
                onChange={handleInputChange}
                placeholder="Running Cavity"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="row g-2 mt-1 process-row">
            <div className="col-md-2">
              <label className="form-label">
                <b> Cycle Time(min) </b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.cycleTime ? "field-filled" : ""
                }`}
                name="cycleTime"
                value={formData.cycleTime}
                onChange={handleInputChange}
                placeholder="Cycle Time"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">
                <b>Shift Time Efficiency</b>
              </label>

              <select
                className={`form-control ${
                  formData.shiftTimeEfficiency ? "field-filled" : ""
                }`}
                name="shiftTimeEfficiency"
                value={
                  formData.shiftTimeEfficiency === "" ||
                  formData.shiftTimeEfficiency == null
                    ? ""
                    : String(Number(formData.shiftTimeEfficiency))
                }
                onChange={handleInputChange}
              >
                <option value="">Select</option>
                <option value="85">85%</option>
                <option value="90">90%</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">
                <b>Total Production per Shift</b>
              </label>

              <input
                type="text"
                className={`form-control ${
                  formData.totalProductionPerShift ? "field-filled" : ""
                }`}
                name="totalProductionPerShift"
                value={formData.totalProductionPerShift}
                readOnly
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">
                <b> Platten Size </b>
              </label>
              <input
                type="text"
                className={`form-control ${
                  formData.PlattenSize ? "field-filled" : ""
                }`}
                name="PlattenSize"
                value={formData.PlattenSize}
                onChange={handleInputChange}
                placeholder="Platten Size"
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">
                <b> Tool Size </b>
              </label>
              <input
                type="text"
                className={`form-control ${
                  formData.toolSize ? "field-filled" : ""
                }`}
                name="toolSize"
                value={formData.toolSize}
                onChange={handleInputChange}
                placeholder="Tool Size"
              />
            </div>
          </div>

          {/* Process cost table */}
          <div className="process-cost-table-section mt-3">
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle process-cost-table">
                <thead>
                  <tr>
                    <th
                      style={{
                        width: "22%",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      Process
                    </th>
                    <th
                      style={{
                        width: "10%",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      Required
                    </th>
                    <th
                      style={{
                        width: "13%",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      Rate
                    </th>
                    <th
                      style={{
                        width: "35%",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      Measurement Input
                    </th>
                    <th
                      style={{
                        width: "20%",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      Calculated Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Finishing", field: "finishing" },
                    { label: "Inspection", field: "inspection" },
                  ].map((row) => {
                    const requiredValue = getRequiredValue(row.field);
                    const cost = Number(formData[row.field]) || 0;

                    return (
                      <tr key={row.field}>
                        <td>
                          <div className="fw-semibold">{row.label}</div>
                        </td>
                        <td>
                          <div
                            className="process-required-toggle"
                            role="group"
                            aria-label={`${row.label} required`}
                          >
                            {["Yes", "No"].map((option) => (
                              <label
                                className={`process-required-option ${requiredValue === option ? "active" : ""}`}
                                key={option}
                              >
                                <input
                                  type="radio"
                                  name={`${row.field}Required`}
                                  value={option}
                                  checked={requiredValue === option}
                                  onChange={() =>
                                    handleOptionalProcessChange(
                                      row.field,
                                      option,
                                    )
                                  }
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ textAlign: "center", width: "100%" }}>
                            <span className="text-muted">—</span>
                          </div>
                        </td>
                        <td>
                          {requiredValue === "Yes" ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-control form-control-sm"
                              name={row.field}
                              value={formData[row.field] ?? ""}
                              onChange={handleInputChange}
                              placeholder={`Enter ${row.label} cost`}
                            />
                          ) : (
                            <div style={{ textAlign: "center", width: "100%" }}>
                              <span className="text-muted">—</span>
                            </div>
                          )}
                        </td>
                        <td>
                          {requiredValue === "No" ? (
                            <div style={{ textAlign: "center", width: "100%" }}>
                              <span className="text-muted">—</span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              className="form-control form-control-sm process-cost-readonly"
                              value={cost.toFixed(2)}
                              readOnly
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {processRows.map((row) => {
                    const requiredValue = getRequiredValue(row.field);
                    const rate = Number(formData[row.rate]) || 0;
                    const cost = Number(formData[row.field]) || 0;
                    return (
                      <tr key={row.field}>
                        <td>
                          <div className="fw-semibold">{row.label}</div>
                          <div className="small text-muted">{row.formula}</div>
                        </td>
                        <td>
                          <div
                            className="process-required-toggle"
                            role="group"
                            aria-label={`${row.label} required`}
                          >
                            {["Yes", "No"].map((option) => (
                              <label
                                className={`process-required-option ${requiredValue === option ? "active" : ""}`}
                                key={option}
                              >
                                <input
                                  type="radio"
                                  name={`${row.field}Required`}
                                  value={option}
                                  checked={requiredValue === option}
                                  onChange={() =>
                                    handleOptionalProcessChange(
                                      row.field,
                                      option,
                                    )
                                  }
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td>
                          {requiredValue === "No" ? (
                            <div style={{ textAlign: "center", width: "100%" }}>
                              <span className="text-muted">—</span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              className="form-control form-control-sm process-rate-readonly"
                              value={rate.toFixed(4)}
                              readOnly
                              aria-label={`${row.label} margin master rate`}
                            />
                          )}
                        </td>
                        <td>{renderProcessMeasurement(row)}</td>
                        <td>
                          {requiredValue === "No" ? (
                            <div style={{ textAlign: "center", width: "100%" }}>
                              <span className="text-muted">—</span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              className="form-control form-control-sm process-cost-readonly"
                              value={cost.toFixed(2)}
                              readOnly
                              aria-label={`${row.label} calculated cost`}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 5 - Assembly */}
          {formData.hasBop === "Yes" && (
            <div className="row g-2 mt-1 process-row">
              <div className="col-md-2">
                <label className="form-label">
                  <b>Assembly Qty</b>
                </label>
                <input
                  type="text"
                  className={`form-control ${
                    totalAssemblyQty ? "field-filled" : ""
                  }`}
                  name="totalAssemblyQty"
                  value={totalAssemblyQty}
                  readOnly
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">
                  <b>Assembly Per Cost</b>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={`form-control ${
                    formData.assemblyPerCost ? "field-filled" : ""
                  }`}
                  name="assemblyPerCost"
                  value={formData.assemblyPerCost ?? ""}
                  onChange={handleInputChange}
                  placeholder="Assembly Per Cost"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">
                  <b>Total Assembly Cost</b>
                </label>
                <input
                  type="text"
                  className="form-control cost-highlight"
                  name="totalAssemblyCost"
                  value={formData.totalAssemblyCost ?? ""}
                  readOnly
                />
              </div>
            </div>
          )}

          {/* Row 6 - Conversion Cost */}
          <div className="row g-2 mt-1 process-row">
            <div className="col-md-2">
              <label className="form-label ">
                <b>Process Cost/Part - A </b>
              </label>

              <input
                type="text"
                className="form-control cost-highlight"
                name="processCostA"
                value={formData.processCostA}
                readOnly
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">
                <b>Process Cost/Part - B</b>
              </label>
              <input
                type="text"
                className="form-control cost-highlight"
                name="processCostB"
                value={formData.processCostB ?? ""}
                readOnly
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">
                <b>Total Conversion Cost</b>
              </label>
              <input
                type="text"
                className="form-control conversion-highlight"
                name="conversionCost"
                value={formData.conversionCost ?? ""}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  );
}

export default ProcessDetailsForm;
