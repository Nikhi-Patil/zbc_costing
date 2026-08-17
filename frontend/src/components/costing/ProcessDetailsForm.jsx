import { useState, useEffect } from "react";

function ProcessDetailsForm({
  formData,
  transactionId,
  handleInputChange,
  handleMachineChange,
  handleTonnageChange,
  totalAssemblyQty,
}) {
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/machines");

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

  return (
    <>
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

          <div className="row g-2 mt-1 process-row " >
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
          </div>

          {/* Row 2 */}

          <div className="row g-2 mt-1 process-row" >
            <div className="col-md-2">
              <label className="form-label">
                <b>Shift Time Efficiency</b>
              </label>

              <select
                className={`form-control ${
                  formData.shiftTimeEfficiency ? "field-filled" : ""
                }`}
                name="shiftTimeEfficiency"
                value={formData.shiftTimeEfficiency}
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
          </div>

          {/* Row 3 */}
          <div className="row g-2 mt-1 process-row" >
            <div className="col-md-1">
              <label className="form-label">
                <b> Post Curing </b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.postCuring ? "field-filled" : ""
                }`}
                name="postCuring"
                value={formData.postCuring}
                onChange={handleInputChange}
              />
            </div>

            <div className="col-md-1">
              <label className="form-label">
                <b> Finishing </b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.finishing ? "field-filled" : ""
                }`}
                name="finishing"
                value={formData.finishing}
                onChange={handleInputChange}
              />
            </div>

            <div className="col-md-1">
              <label className="form-label">
                <b> Inspection </b>
              </label>
              <input
                type="number"
                className={`form-control ${
                  formData.inspection ? "field-filled" : ""
                }`}
                name="inspection"
                value={formData.inspection}
                onChange={handleInputChange}
              />
            </div>

            {formData.hasBop === "Yes" && (
              <>
                {/* Assembly Qty */}
                <div className="col-md-1">
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

                {/* Assembly Per Cost */}
                <div className="col-md-1">
                  <label className="form-label">
                    <b>Assembly Per Cost</b>
                  </label>

                  <input
                    type="number"
                    className={`form-control ${
                      formData.assemblyPerCost ? "field-filled" : ""
                    }`}
                    name="assemblyPerCost"
                    value={formData.assemblyPerCost}
                    onChange={handleInputChange}
                    placeholder="Assembly Per Cost"
                  />
                </div>

                {/* Total Assembly Cost */}
                <div className="col-md-1">
                  <label className="form-label">
                    <b>Total Assembly Cost</b>
                  </label>

                  <input
                    type="text"
                    className={`form-control ${
                      formData.totalAssemblyCost ? "field-filled" : ""
                    }`}
                    name="totalAssemblyCost"
                    value={formData.totalAssemblyCost}
                    readOnly
                  />
                </div>
              </>
            )}

            <div className="col-md-1">
              <label className="form-label">
                <b> Process Cost/Part - B </b>
              </label>

              <input
                type="text"
                className="form-control cost-highlight"
                name="processCostB"
                value={formData.processCostB}
                readOnly
              />
            </div>

            <div className="col-md-1">
              <label className="form-label">
                <b> Total Conversion Cost </b>
              </label>
              <input
                type="text"
                className="form-control conversion-highlight"
                name="conversionCost"
                value={formData.conversionCost}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProcessDetailsForm;
