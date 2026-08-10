import React from "react";

function RMDetailsForm({ formData, handleInputChange,  addBopRate,bopList}) {
  return (
    <>
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0"><b style={{fontSize:"14px"}}>Raw Material Details</b></h5>
      </div>

      <div className="card-body">
            {/* Row 1 */}
        <div className="row g-3 mt-1">

          <div className="col-md-2">
              <label className="form-label"><b>Polymer Name</b></label>
              <select
                className="form-select"
                name="polymerName"
                value={formData.polymerName}
                onChange={handleInputChange}>
                <option value="">Select</option>
              </select>
          </div>

          <div className="col-md-2">
                <label className="form-label"><b>Compound Code</b></label>
              <select
                  className="form-select"
                  name="compoundCode"
                  value={formData.compoundCode}
                  onChange={handleInputChange}>
                  <option value="">Select</option>
                </select>
          </div>

          <div className="col-md-2">
                <label className="form-label"><b>IM Code</b></label>
                <input
                  type="text"
                  className="form-control"
                  name="imCode"
                  value={formData.imCode}
                  onChange={handleInputChange}/>
          </div>

        </div>
          {/* Row 2 */}
        <div className=" row g-2 mt-1">

          <div className="col-md-2">
              <label className="form-label"><b>Month</b></label>
              <select
                  className="form-select"
                  name="compMonth"
                  value={formData.compMonth}
                  onChange={handleInputChange}>
                <option value="">Select</option>
              </select>
          </div>

          <div className="col-md-2">
              <label className="form-label"><b>Compound Rate</b></label>
              <input
                type="text"
                className="form-control"
                name="compoundRate"
                value={formData.compoundRate}
                onChange={handleInputChange}/>
          </div>

          <div className="col-md-2">
              <label className="form-label"><b>Loading Wt (Grm)</b></label>
              <input
                type="text"
                className="form-control"
                name="loadingWeight"
                value={formData.loadingWeight}
                onChange={handleInputChange}/>
          </div>

          <div className="col-md-2">
              <label className="form-label"><b>Net Wt (Grm)</b></label>
              <input
                type="text"
                className="form-control"
                name="netWeight"
                value={formData.netWeight}
                onChange={handleInputChange}/>
          </div>

          <div className="col-md-2">
              <label className="form-label"> <b>Loading % </b></label>
              <input
                type="number"
                className="form-control"
                name="loadingper"
                value={formData.loadingper}
                onChange={handleInputChange}/>
          </div>

        </div>
        
      </div>
    </div>

    {formData.hasBop === "Yes" && (
        <div className="card mt-4">
          <div className="bop-header">
            <h4 className="bop-title">BOP Details</h4>
          </div>

          {bopList.map((bop, index) => (
            <div className="card mt-3 shadow-sm" key={bop.id}>
              <div className="bop-card-header">
                <h5 className="bop-card-title">BOP : {index + 1}</h5>
              </div>

              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      <b>BOP Part No</b>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="bopPartNo"
                      value={bop.bopPartNo}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBops((prev) =>
                          prev.map((item) =>
                            item.id === bop.id
                              ? {
                                  ...item,
                                  bopPartNo: value,
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <b>Part Name</b>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="bopPartName"
                      value={bop.bopPartName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBops((prev) =>
                          prev.map((item) =>
                            item.id === bop.id
                              ? {
                                  ...item,
                                  bopPartName: value,
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <b>Commodity</b>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="commodity"
                      value={bop.commodity}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBops((prev) =>
                          prev.map((item) =>
                            item.id === bop.id
                              ? {
                                  ...item,
                                  commodity: value,
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <b>Supplier Name</b>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="supplierName"
                      value={bop.supplierName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBops((prev) =>
                          prev.map((item) =>
                            item.id === bop.id
                              ? {
                                  ...item,
                                  supplierName: value,
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <b>Assembly Quantity</b>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="bopAssemblyQty"
                      value={bop.bopAssemblyQty}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBops((prev) =>
                          prev.map((item) =>
                            item.id === bop.id
                              ? {
                                  ...item,
                                  bopAssemblyQty: value,
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <b>BOP FG Code</b>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="bopFgCode"
                      value={bop.bopFgCode}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBops((prev) =>
                          prev.map((item) =>
                            item.id === bop.id
                              ? {
                                  ...item,
                                  bopFgCode: value,
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <b>Month</b>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="bopmonth"
                      value={bop.bopmonth}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBops((prev) =>
                          prev.map((item) =>
                            item.id === bop.id
                              ? {
                                  ...item,
                                  bopmonth: value,
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <b>Bop Rate</b>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="bopRate"
                      value={bop.bopRate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBops((prev) =>
                          prev.map((item) =>
                            item.id === bop.id
                              ? {
                                  ...item,
                                  bopRate: value,
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
  );
}

export default RMDetailsForm;
