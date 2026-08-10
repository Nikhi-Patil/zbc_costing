function WizardButtons({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
}) {
  return (
    <div className="card mt-3" style={{background:"#b0cbcb"}}>
      <div className="card-body">

        <div className="d-flex justify-content-between align-items-center">

          {/* Previous Button */}
          <div>
            {currentStep > 1 && (
              <button
                className="btn btn-secondary"
                onClick={onPrevious}
                 title="Previous"
                 style={{padding: "2px",borderRadius: "18px"}}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
            )}
          </div>

          {/* Right Side Buttons */}
          <div className="d-flex gap-2">

            {/* Middle Steps */}
            {currentStep < totalSteps && (
              <>
                {/* <button
                  className="btn btn-outline-primary"
                  onClick={onSaveDraft}
                >
                  <i className="fas fa-save me-2"></i>
                  Save Draft
                </button> */}

                <button
                  className="btn btn-success"
                  onClick={onNext}
                  title="Next"
                  style={{padding: "2px",borderRadius: "18px"}}
                >
                      <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}

            {/* Last Step */}
            {currentStep === totalSteps && (
              <>
                {/* <button
                  className="btn btn-outline-primary"
                  onClick={onSaveDraft}
                >
                  <i className="fas fa-save me-2"></i>
                  Save Draft
                </button>      padding: 1px;*/}

                <button
                  className="btn btn-success"
                  onClick={onSubmit}
                  style={{padding: "1px"}}
                >
                  <i className="fas fa-check me-2"></i>
                  Submit
                </button>
              </>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default WizardButtons;