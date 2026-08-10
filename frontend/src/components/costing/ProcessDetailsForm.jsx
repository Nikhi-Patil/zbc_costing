import React from 'react'

function ProcessDetailsForm(formData, handleInputChange) {
    return (
        <>
        <div className="card">
        <div className="card-header d-flex align-items-center">
          <h5 className="mb-0" ><b style={{fontSize:"14px"}}>Process Details </b></h5>
        </div>

        <div className="card-body">
          {/* Row 1 */}

          <div
            className="row g-2 mt-1"
            style={{ paddingLeft: "10px", paddingRight: "10px" }}
          >
            <div className="col-md-3">
              <label className="form-label">
                <b>Type of Proccess </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="processType"
                value={formData.processType}
                onChange={handleInputChange}
                placeholder='Type of Process'
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Machine Tonnage </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="machineTonnage"
                value={formData.machineTonnage}
                onChange={handleInputChange}
                placeholder='Machine Tonnage'
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Total Cavity </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="cavity"
                value={formData.cavity}
                onChange={handleInputChange}
                placeholder='Total Cavity'
              />
            </div>

            <div className="col-md-3">
              <label className="form-label ">
                <b>Running Cavity </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="runningcavity"
                value={formData.runningcavity}
                onChange={handleInputChange}
                placeholder='Running Cavity'
              />
            </div>
          </div>

          {/* Row 2 */}

          <div
            className="row g-2 mt-1"
            style={{ paddingLeft: "10px", paddingRight: "10px" }}
          >
            <div className="col-md-3">
              <label className="form-label">
                <b> Cycle Time(min) </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="cycleTime"
                value={formData.cycleTime}
                onChange={handleInputChange}
                placeholder='Cycle Cavity'
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Platten Size </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="PlattenSize"
                value={formData.PlattenSize}
                onChange={handleInputChange}
                placeholder='Platten Size'
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Tool Size </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="toolSize"
                value={formData.toolSize}
                onChange={handleInputChange}
                placeholder='Tool Size'
              />
            </div>

          </div>
        </div>
      </div>
        </>
    )
}

export default ProcessDetailsForm
