import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import "../../assets/css/components/Stepper.css";

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
          {/* Previous */}
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                className="wizard-btn-secondary"
                onClick={onPrevious}
                title="Previous"
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
                className="wizard-btn-success"
                onClick={onNext}
                title="Next"
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            )}

            {currentStep === totalSteps && !readOnly && (
              <button
                type="button"
                className="wizard-btn-submit"
                onClick={onSubmit}
                
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
