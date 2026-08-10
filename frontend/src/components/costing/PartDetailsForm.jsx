import React from "react";

function PartDetailsForm({
  formData,
  handleInputChange,
  handleBopChange,
  bopList,
  addBop,
  deleteBop,
}) {
  const [transactionid, settransactionid] = React.useState("ML15943");

  return (
    <>
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h5 className="mb-0" ><b style={{fontSize:"14px"}}>Part Details</b></h5>
          <div className="ms-auto d-flex align-items-center">
            <span className="fw-bold me-2">Transaction ID :</span>

            <span className="badge bg-primary fs-6 px-3 py-2">
              {transactionid}
            </span>
          </div>
        </div>

        <div className="card-body">
          {/* Row 1 */}

          <div
            className="row g-2 mt-1"
            style={{ paddingLeft: "10px", paddingRight: "10px" }}
          >
            <div className="col-md-3">
              <label className="form-label">
                <b> Financial Year </b>
              </label>
              <select
                className="form-select"
                name="financialYear"
                value={formData.financialYear}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Month </b>
              </label>
              <select
                className="form-select"
                name="month"
                value={formData.month}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Effective Date </b>
              </label>
              <input
                type="date"
                className={"form-control"}
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label ">
                <b>Customer Name </b>
              </label>
              <select
                className="form-select"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}

          <div
            className="row g-2 mt-1"
            style={{ paddingLeft: "10px", paddingRight: "10px" }}
          >
            <div className="col-md-3">
              <label className="form-label">
                <b> Production Unit </b>
              </label>
              <select
                className="form-select"
                name="productionUnit"
                value={formData.productionUnit}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Billing Unit </b>
              </label>
              <select
                className="form-select"
                name="billingUnit"
                value={formData.billingUnit}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Sub Department </b>
              </label>
              <select
                className="form-select"
                name="subDepartment"
                value={formData.subDepartment}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Sub Category </b>
              </label>
              <select
                className="form-select"
                name="subCategory"
                value={formData.subCategory}
                onChange={handleInputChange}
              >
                <option value="">Select</option>
              </select>
            </div>
          </div>

          {/* Row 3 */}

          <div
            className="row g-2 mt-1"
            style={{ paddingLeft: "10px", paddingRight: "10px" }}
          >
            <div className="col-md-3">
              <label className="form-label">
                <b> Part No </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="partNo"
                value={formData.partNo}
                onChange={handleInputChange}
                placeholder="Part No"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Part Name </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="partName"
                value={formData.partName}
                onChange={handleInputChange}
                placeholder="Part Name"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> FG Code </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="fgcode"
                value={formData.fgcode}
                onChange={handleInputChange}
                placeholder="FG00001"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Production IM code </b>
              </label>
              <input
                type="text"
                className={"form-control"}
                name="imcode"
                value={formData.imcode}
                onChange={handleInputChange}
                placeholder="IM00001"
              />
            </div>
          </div>
          {/* Row 4 */}

          <div
            className="row g-2 mt-1 "
            style={{ paddingLeft: "10px", paddingRight: "10px" }}
          >
            <div className="col-md-3">
              <label className="form-label">
                <b> Gross Wt. </b>
              </label>
              <input
                type="number"
                className={"form-control"}
                name="grossWeight"
                value={formData.grossWeight}
                onChange={handleInputChange}
                placeholder="Gross Wt"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Net Wt. </b>
              </label>
              <input
                type="number"
                className={"form-control"}
                name="netWeight"
                value={formData.netWeight}
                onChange={handleInputChange}
                placeholder="Net Wt"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                <b> Loading Wt. </b>
              </label>
              <input
                type="number"
                className={"form-control"}
                name="loadingWeight"
                value={formData.loadingWeight}
                onChange={handleInputChange}
                placeholder="Loading Wt"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label ">
                <b>BOP YES/NO</b>
              </label>
              <select
                className="form-select"
                name="hasBop"
                value={formData.hasBop}
                onChange={handleBopChange}
              >
                <option value="">Select</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {formData.hasBop === "Yes" && (
        <div className="card mt-4">
          <div className="bop-header">
            <h4 className="bop-title">BOP Details</h4>

            <button
              type="button"
              className="btn btn-success add-bop-btn"
              onClick={addBop}
            >
              <i className="fas fa-plus me-2"></i>
              Add
            </button>
          </div>

          {bopList.map((bop, index) => (
            <div className="card mt-3 shadow-sm" key={bop.id}>
              <div className="bop-card-header">
                <h5 className="bop-card-title">BOP : {index + 1}</h5>
                <div>
                  <button
                    type="button"
                    className="btn btn-danger delete-bop-btn"
                    onClick={() => deleteBop(bop.id)}
                  >
                    <i className="fas fa-trash me-2"></i>
                    delete
                  </button>
                  &nbsp;
                  <button
                    type="button"
                    className="btn btn-info delete-bop-btn"
                    onClick={() => deleteBop(bop.id)}
                  >
                    <i className="fas fa-pencil me-2"></i>
                    edit
                  </button>
                </div>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default PartDetailsForm;
