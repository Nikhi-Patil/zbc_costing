function WizardButtons({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
  
}) {
  return (
    <div className="wizard-buttons-wrapper">
      <div className="wizard-buttons-card">
        <div className="wizard-buttons-body">

          {/* Previous */}
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onPrevious}
                title="Previous"
                style={{
                  padding: "2px",
                  borderRadius: "18px",
                }}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
            )}
          </div>

          {/* Next / Submit */}
          <div className="d-flex gap-2">

            {currentStep < totalSteps && (
              <button
                type="button"
                className="btn btn-success"
                onClick={onNext}
                title="Next"
                style={{
                  padding: "2px",
                  borderRadius: "18px",
                }}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            )}

            {currentStep === totalSteps && (
              <button
                type="button"
                className="btn btn-success"
                onClick={onSubmit}
                style={{ padding: "1px" }}
              >
                <i className="fas fa-check me-2"></i>
                Submit
              </button>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default WizardButtons;