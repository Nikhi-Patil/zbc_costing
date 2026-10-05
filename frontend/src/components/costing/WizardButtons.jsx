import { ChevronLeft, ChevronRight, Check } from "lucide-react";

function WizardButtons({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
  readOnly = false,
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
                  padding: "2px 8px",
                  borderRadius: "18px",
                }}
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
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
                  padding: "2px 8px",
                  borderRadius: "18px",
                }}
              >
                <ChevronRight size={18} strokeWidth={2.5} />{" "}
              </button>
            )}

            {currentStep === totalSteps && !readOnly && (
              <button
                type="button"
                className="btn btn-success"
                onClick={onSubmit}
                style={{
                  padding: "2px 3px",
                  borderRadius: "6px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  whiteSpace: "nowrap",
                  minWidth: "65px",
                }}
              >
                <Check size={15} strokeWidth={2.5} />
                <span>Submit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WizardButtons;
